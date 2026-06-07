import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';
import {
    Usuarios,
    Habilidades,
    UsuariosHabilidades,
    ProyectosInstitucion,
    Instituciones,
} from '../models/index.js';

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
- La justificacion debe estar en español, en segunda persona (tú), ser motivadora y tener máximo 2 oraciones.
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
            const result = await recomendacionModel.generateContent(prompt);
            geminiResponse = result.response.text();
        } catch (geminiError) {
            console.error('Error al llamar a Gemini:', geminiError);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: geminiError?.message ?? String(geminiError)
            });
        }

        // ── PASO 4: Parsear y validar la respuesta ────────────────────────────
        let parsed;
        try {
            parsed = JSON.parse(geminiResponse);
        } catch (parseError) {
            console.error('Respuesta de Gemini no es JSON válido:', geminiResponse);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: `Gemini no devolvió JSON válido: ${geminiResponse?.slice(0, 200)}`
            });
        }

        // Filtra recomendaciones con proyecto_id que no existan en la lista original
        // para evitar que Gemini invente IDs que no existen en la BD.
        const idsValidos = new Set(proyectosDB.map(p => p.id));
        parsed.recomendaciones = (parsed.recomendaciones ?? []).filter(r =>
            idsValidos.has(r.proyecto_id)
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
