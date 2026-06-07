import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';
import {
    Habilidades,
    UsuariosHabilidades,
    ProyectosInstitucion,
    Instituciones,
} from '../models/index.js';

/**
 * Ejecuta una función async con reintentos y backoff exponencial.
 * Diseñado para errores transitorios de APIs externas (503, 429).
 *
 * Tiempos de espera: intento 1 → 1s, intento 2 → 2s, intento 3 → 4s.
 *
 * @param {Function} fn - Función async a ejecutar
 * @param {number} maxAttempts - Número máximo de intentos (default: 3)
 * @param {number} baseDelayMs - Delay base en ms para el backoff (default: 1000)
 */
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            // Solo reintenta en errores transitorios de disponibilidad
            const isTransient =
                error?.message?.includes('503') ||
                error?.message?.includes('Service Unavailable') ||
                error?.message?.includes('429') ||
                error?.message?.includes('Too Many Requests');

            if (!isTransient || attempt === maxAttempts) throw error;

            const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s
            console.warn(`Gemini no disponible (intento ${attempt}/${maxAttempts}). Reintentando en ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Instancia de Gemini dedicada al motor de recomendaciones.
// Se separa del cliente del chatbot para tener su propia systemInstruction
// sin afectar la configuración existente en chatbotController.js.
const genAI = new GoogleGenerativeAI(config.google.ai.apiKey);
const recomendacionModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2, // Baja temperatura: respuestas más deterministas y consistentes para JSON
    },
    systemInstruction: {
        parts: [{
            text: `Eres un motor de recomendación de proyectos de Servicio Social Estudiantil (SSE).
Recibes las habilidades de un estudiante y una lista de proyectos disponibles.
Tu tarea es recomendar los 3 proyectos más adecuados.

CRITERIOS DE ANÁLISIS:
1. Coincidencia semántica: evalúa si las habilidades del estudiante son relevantes para el contexto y descripción de cada proyecto.
2. Transferibilidad: considera si las habilidades pueden aplicarse aunque no sean mencionadas textualmente en el proyecto.
3. Potencial de aporte: evalúa cuánto puede contribuir el estudiante al proyecto.

REGLAS ESTRICTAS:
- Responde ÚNICAMENTE con JSON puro y válido. Sin texto, sin markdown, sin bloques de código, sin explicaciones fuera del JSON.
- Recomienda exactamente 3 proyectos. Si hay menos de 3 disponibles, devuelve los que existan.
- Los proyecto_id deben ser exactamente los IDs recibidos en el input; nunca inventes IDs.
- La justificacion debe estar en español, en segunda persona (tú), ser motivadora y tener máximo 1 oración breve.
- porcentaje_compatibilidad es un número entero entre 0 y 100.
- habilidades_aplicables: lista de strings con las habilidades del estudiante que aplican al proyecto (máximo 4).

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "recomendaciones": [
    {
      "proyecto_id": 1,
      "nombre": "Nombre del proyecto",
      "institucion": "Nombre de la institución",
      "modalidad": "Presencial",
      "habilidades_aplicables": ["Comunicación", "Trabajo en equipo"],
      "porcentaje_compatibilidad": 82,
      "justificacion": "Tu perfil encaja muy bien con los objetivos de este proyecto. Podrás aportar valor desde el primer día."
    }
  ]
}`
        }]
    }
});

/**
 * Recomienda los 3 proyectos más compatibles con las habilidades de un estudiante.
 * Usa Gemini para hacer el análisis semántico entre habilidades y proyectos.
 *
 * @route POST /api/recomendar-proyectos
 */
export async function recomendarProyectos(request, reply) {
    const { usuario_id } = request.body;

    if (!usuario_id) {
        return reply.status(400).send({ error: 'El campo usuario_id es obligatorio' });
    }

    try {
        // ── PASO 1: Habilidades del estudiante ────────────────────────────────
        const usuarioHabilidades = await UsuariosHabilidades.findAll({
            where: { usuario_id },
            include: [{ model: Habilidades, as: 'habilidad', attributes: ['id', 'descripcion'] }]
        });

        if (!usuarioHabilidades.length) {
            return reply.status(200).send({
                recomendaciones: [],
                mensaje: 'El estudiante no tiene habilidades registradas'
            });
        }

        const habilidades_estudiante = usuarioHabilidades.map(uh => ({
            habilidad_id: uh.habilidad_id,
            descripcion: uh.habilidad.descripcion
        }));

        // ── PASO 2: Proyectos disponibles ─────────────────────────────────────
        // Se incluyen las Habilidades requeridas del proyecto (via ProyectosInstitucionesHabilidades)
        // para que Gemini pueda hacer un análisis más preciso.
        const proyectosDB = await ProyectosInstitucion.findAll({
            where: { estado: 'Aprobado', disponibilidad: true },
            include: [
                {
                    model: Instituciones,
                    as: 'institucion',
                    attributes: ['nombre']
                },
                {
                    // Habilidades requeridas por el proyecto — enriquece el análisis de Gemini
                    model: Habilidades,
                    through: { attributes: [] }, // Oculta los campos de la tabla pivot
                    attributes: ['id', 'descripcion']
                }
            ],
            limit: 25,
            order: [['created_at', 'DESC']]
        });

        if (!proyectosDB.length) {
            return reply.status(200).send({
                recomendaciones: [],
                mensaje: 'No hay proyectos disponibles actualmente'
            });
        }

        // Formatea los proyectos en un payload limpio para enviar a Gemini
        const proyectos = proyectosDB.map(p => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion,
            modalidad: p.modalidad,
            institucion: p.institucion?.nombre ?? 'No especificada',
            // Si el proyecto tiene habilidades requeridas registradas, se incluyen
            habilidades_requeridas: p.Habilidades?.map(h => h.descripcion) ?? []
        }));

        // ── PASO 3: Llamada a Gemini ──────────────────────────────────────────
        // El payload se envía como JSON en el mensaje del usuario.
        // La systemInstruction ya le indica al modelo el formato de respuesta esperado.
        const prompt = JSON.stringify({ habilidades_estudiante, proyectos });

        let geminiResponse;
        try {
            // withRetry reintenta hasta 3 veces si Gemini responde 503/429
            const result = await withRetry(() => recomendacionModel.generateContent(prompt));
            geminiResponse = result.response.text();
        } catch (geminiError) {
            console.error('Error al llamar a Gemini tras reintentos:', geminiError);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: geminiError?.message ?? String(geminiError)
            });
        }

        // ── PASO 4: Parsear y validar la respuesta ────────────────────────────
        // Gemini a veces envuelve la respuesta en bloques markdown (```json ... ```)
        // aunque se le instruya no hacerlo. Se limpian antes de parsear.
        const cleanedResponse = geminiResponse
            .replace(/^```(?:json)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim();

        let parsed;
        try {
            parsed = JSON.parse(cleanedResponse);

            // Si Gemini devolvió un array en lugar del objeto esperado, normalizarlo.
            // Además remapea "id" → "proyecto_id" por si el modelo ignoró el nombre del campo.
            if (Array.isArray(parsed)) {
                parsed = {
                    recomendaciones: parsed.map(item => ({
                        ...item,
                        proyecto_id: item.proyecto_id ?? item.id
                    }))
                };
            }
        } catch (parseError) {
            console.error('Respuesta de Gemini no es JSON válido:', cleanedResponse);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: `Gemini no devolvió JSON válido: ${cleanedResponse?.slice(0, 200)}`
            });
        }

        // Normaliza proyecto_id en caso de que el objeto también traiga "id" en lugar de "proyecto_id"
        parsed.recomendaciones = (parsed.recomendaciones ?? []).map(r => ({
            ...r,
            proyecto_id: r.proyecto_id ?? r.id
        }));

        // Filtra recomendaciones con proyecto_id que no existan en la lista original.
        // Se usan Number() en ambos lados porque Gemini a veces devuelve IDs como strings
        // y Set.has() usa igualdad estricta, entonces has("29") falla si el Set tiene 29.
        const idsValidos = new Set(proyectosDB.map(p => Number(p.id)));
        parsed.recomendaciones = parsed.recomendaciones.filter(r =>
            idsValidos.has(Number(r.proyecto_id))
        );

        return reply.status(200).send(parsed);

    } catch (error) {
        console.error('Error al consultar datos para recomendaciones:', error);
        return reply.status(500).send({
            error: 'Error al consultar datos',
            details: error?.message ?? String(error)
        });
    }
}
