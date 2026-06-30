import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import config from '../config/config.js';
import { Habilidades } from '../models/index.js';
import { isExtraccionHabilidadesActivo } from '../services/configuracionIAService.js';

// Límites alineados con el modelo: Habilidades.descripcion es STRING(50) UNIQUE.
const MAX_LEN = 50;
const MAX_HABILIDADES = 30; // tope defensivo por petición

// Instancia de Gemini dedicada a la extracción de habilidades.
const genAI = new GoogleGenerativeAI(config.google.ai.apiKey);
const extractorModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 1024,
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        habilidades: { type: 'array', items: { type: 'string' } }
      },
      required: ['habilidades']
    }
  },
  systemInstruction: {
    parts: [{
      text: `Eres un extractor de habilidades para una plataforma de Servicio Social Estudiantil.
A partir del texto del usuario, identifica las habilidades (técnicas y blandas) que describe o implica.

REGLAS:
- Devuelve solo nombres de habilidades concisos y normalizados, en español (p.ej. "Trabajo en equipo", "JavaScript", "Atención al cliente").
- Cada nombre debe tener máximo 50 caracteres.
- Sin duplicados ni sinónimos repetidos; usa la forma canónica más común.
- No inventes habilidades que no estén razonablemente implícitas en el texto.
- Si el texto no describe ninguna habilidad, devuelve una lista vacía.`
    }]
  }
});

/** Normaliza para comparar: minúsculas, sin acentos, espacios colapsados. */
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Limpia un nombre de habilidad devuelto por la IA. */
function limpiarNombre(nombre) {
  return String(nombre).replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
}

/**
 * POST /api/extraer-habilidades
 * Body: { texto }
 * Extrae habilidades del texto con IA, descarta las que ya existen (dedupe),
 * crea las nuevas en el catálogo y devuelve la lista resultante con sus IDs
 * para que el frontend las añada a la selección del estudiante/proyecto.
 */
export async function extraerHabilidades(request, reply) {
  const { texto, crear = true } = request.body;

  if (!texto || !texto.trim()) {
    return reply.status(400).send({ error: 'El campo "texto" es obligatorio', code: 'TEXTO_REQUERIDO' });
  }

  // El Coordinador General puede desactivar esta función para toda la plataforma.
  if (!(await isExtraccionHabilidadesActivo())) {
    return reply.status(403).send({
      error: 'La extracción de habilidades con IA está desactivada actualmente',
      code: 'EXTRACCION_HABILIDADES_DESACTIVADO'
    });
  }

  try {
    // ── 1) Extracción con IA ──────────────────────────────────────────────
    let nombresIA;
    try {
      const result = await extractorModel.generateContent(texto.trim());
      const parsed = JSON.parse(result.response.text());
      nombresIA = Array.isArray(parsed?.habilidades) ? parsed.habilidades : [];
    } catch (iaError) {
      console.error('Error al extraer habilidades con Gemini:', iaError);
      return reply.status(502).send({
        error: 'No se pudieron extraer habilidades del texto',
        code: 'IA_ERROR',
        details: iaError?.message ?? String(iaError)
      });
    }

    // ── 2) Limpieza + dedupe dentro de la respuesta de la IA ──────────────
    const candidatos = new Map(); // claveNormalizada -> nombre limpio
    for (const n of nombresIA) {
      const nombre = limpiarNombre(n);
      if (!nombre) continue;
      const clave = normalizar(nombre);
      if (clave && !candidatos.has(clave)) candidatos.set(clave, nombre);
      if (candidatos.size >= MAX_HABILIDADES) break;
    }

    if (candidatos.size === 0) {
      return reply.status(200).send({
        existentes: [],
        nuevas: [],
        creadas: 0,
        mensaje: 'No se identificaron habilidades en el texto'
      });
    }

    // ── 3) Match contra el catálogo existente (case/acento-insensitive) ───
    const catalogo = await Habilidades.findAll({ attributes: ['id', 'descripcion'] });
    const mapaExistentes = new Map(catalogo.map(h => [normalizar(h.descripcion ?? ''), h]));

    // existentes: habilidades con id (ya en catálogo, o recién creadas si crear=true).
    // nuevas: nombres que aún NO están en el catálogo (solo cuando crear=false).
    const existentes = [];
    const nuevas = [];
    let creadas = 0;

    for (const [clave, nombre] of candidatos) {
      const enCatalogo = mapaExistentes.get(clave);
      if (enCatalogo) {
        existentes.push({ id: enCatalogo.id, descripcion: enCatalogo.descripcion });
        continue;
      }

      // No existe en el catálogo.
      if (!crear) {
        // Modo recomendación: se devuelve solo el nombre (se creará al guardar).
        nuevas.push(nombre);
        continue;
      }

      // Modo crear: insertar en el catálogo (find-or-create defensivo por el UNIQUE).
      try {
        const creada = await Habilidades.create({ descripcion: nombre });
        mapaExistentes.set(clave, creada);
        existentes.push({ id: creada.id, descripcion: creada.descripcion });
        creadas++;
      } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
          const recuperada = await Habilidades.findOne({ where: { descripcion: nombre } });
          if (recuperada) existentes.push({ id: recuperada.id, descripcion: recuperada.descripcion });
        } else {
          throw err;
        }
      }
    }

    return reply.status(200).send({ existentes, nuevas, creadas });
  } catch (error) {
    console.error('Error al procesar la extracción de habilidades:', error);
    return reply.status(500).send({
      error: 'Error al procesar la extracción de habilidades',
      code: 'EXTRAER_HABILIDADES_ERROR',
      details: error?.message ?? String(error)
    });
  }
}
