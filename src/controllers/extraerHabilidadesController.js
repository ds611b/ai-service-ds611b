import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import config from '../config/config.js';
import { Habilidades } from '../models/index.js';
import { isExtraccionHabilidadesActivo } from '../services/configuracionIAService.js';

// Límites alineados con el modelo: Habilidades.descripcion es STRING(50) UNIQUE.
const MAX_LEN = 50;
const MAX_CANDIDATOS = 50; // tope defensivo de nombres a procesar por petición
const MAX_NUEVAS = 5;      // máximo de habilidades NUEVAS (las existentes no tienen límite)
const MIN_TOTAL = 5;       // mínimo de habilidades a devolver (existentes + nuevas)

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
      text: `Eres un extractor de HABILIDADES BLANDAS (competencias interpersonales y actitudinales) para una plataforma de Servicio Social Estudiantil.
Del texto del usuario, identifica habilidades blandas.

EJEMPLOS de habilidades blandas válidas: Comunicación, Trabajo en equipo, Liderazgo, Empatía, Responsabilidad, Adaptabilidad, Resolución de problemas, Pensamiento crítico, Organización, Proactividad, Escucha activa, Creatividad, Tolerancia, Puntualidad, Gestión del tiempo.

NO incluyas habilidades técnicas ni conocimientos específicos: nada de lenguajes de programación, software, herramientas, certificaciones, oficios o materias (p.ej. NO "JavaScript", "Excel", "Contabilidad", "Diseño gráfico", "Inglés").

Junto al texto del usuario recibirás un CATÁLOGO de habilidades blandas que ya existen en la base de datos.

REGLAS:
- Debes devolver un TOTAL de al menos ${MIN_TOTAL} habilidades. No es necesario crear habilidades nuevas: si el catálogo ya cubre ${MIN_TOTAL} o más habilidades relevantes, reutilízalas todas y no inventes ninguna.
- Prioriza SIEMPRE reutilizar habilidades del catálogo: si una habilidad del catálogo aplica (aunque sea de forma general) al texto, cópiala EXACTAMENTE con el mismo texto del catálogo (mismas mayúsculas, tildes y espacios) en vez de escribirla de nuevo con otras palabras.
- Solo propón una habilidad que no esté en el catálogo cuando sea claramente necesaria para cubrir algo importante del texto que ninguna del catálogo cubre, o cuando sea indispensable para llegar al mínimo de ${MIN_TOTAL}.
- Si el texto describe explícitamente menos de ${MIN_TOTAL} habilidades, completa la lista hasta el mínimo con otras habilidades blandas comunes y razonables para un servicio social (preferentemente tomadas del catálogo), aunque no estén mencionadas de forma literal.
- Cada nombre debe tener máximo 50 caracteres.
- Sin duplicados ni sinónimos repetidos.
- Nunca devuelvas una lista vacía: siempre entrega al menos ${MIN_TOTAL} habilidades.`
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
    // ── 1) Extracción con IA (se pasa el catálogo para favorecer reutilización) ─
    const catalogoPrevio = await Habilidades.findAll({ attributes: ['id', 'descripcion'] });
    const catalogoTexto = catalogoPrevio.map(h => h.descripcion).join(', ');

    const promptTexto = `CATÁLOGO de habilidades blandas existentes:\n${catalogoTexto || '(vacío, no hay habilidades registradas aún)'}\n\nTEXTO del proyecto:\n${texto.trim()}`;

    let nombresIA;
    try {
      const result = await extractorModel.generateContent(promptTexto);
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
      if (candidatos.size >= MAX_CANDIDATOS) break;
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
    const mapaExistentes = new Map(catalogoPrevio.map(h => [normalizar(h.descripcion ?? ''), h]));

    // existentes: habilidades con id (ya en catálogo, o recién creadas si crear=true) — SIN límite.
    // nuevas: nombres que aún NO están en el catálogo — máximo MAX_NUEVAS (las demás se descartan).
    const existentes = [];
    const nuevas = [];
    let creadas = 0;
    let nuevasContador = 0; // cuenta habilidades nuevas ya consideradas (para el tope de 5)

    for (const [clave, nombre] of candidatos) {
      const enCatalogo = mapaExistentes.get(clave);
      if (enCatalogo) {
        // Existente: se incluye sin límite.
        existentes.push({ id: enCatalogo.id, descripcion: enCatalogo.descripcion });
        continue;
      }

      // Es nueva: aplica el tope de MAX_NUEVAS (las que sobren se ignoran).
      if (nuevasContador >= MAX_NUEVAS) continue;
      nuevasContador++;

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
