import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import config from '../config/config.js';
import { cache, TTL } from '../services/CacheService.js';
import {
    Habilidades,
    UsuariosHabilidades,
    ProyectosInstitucion,
    Instituciones,
} from '../models/index.js';

/**
 * Ejecuta una función async con reintentos y backoff exponencial.
 * Solo reintenta errores transitorios (503, y 429 con delay sugerido corto).
 * El 429 por quota diaria tiene delay de 25s+ y NO se reintenta.
 */
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const retryDelayMatch = error?.message?.match(/retry in (\d+(\.\d+)?)s/i);
            const suggestedDelaySecs = retryDelayMatch ? parseFloat(retryDelayMatch[1]) : 0;

            const isTransient =
                (error?.message?.includes('503') || error?.message?.includes('Service Unavailable')) ||
                (error?.message?.includes('429') && suggestedDelaySecs < 10);

            if (!isTransient || attempt === maxAttempts) throw error;

            const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
            console.warn(`Gemini no disponible (intento ${attempt}/${maxAttempts}). Reintentando en ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Instancia de Gemini dedicada al motor de recomendaciones.
const genAI = new GoogleGenerativeAI(config.google.ai.apiKey);
const recomendacionModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.2,
        // Modo JSON nativo: garantiza que la respuesta sea JSON válido con la estructura exacta.
        // Elimina la necesidad de limpiar markdown o parsear formatos inesperados.
        responseMimeType: 'application/json',
        responseSchema: {
            type: 'object',
            properties: {
                recomendaciones: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            proyecto_id:               { type: 'integer' },
                            nombre:                    { type: 'string' },
                            institucion:               { type: 'string' },
                            modalidad:                 { type: 'string' },
                            habilidades_aplicables:    { type: 'array', items: { type: 'string' } },
                            porcentaje_compatibilidad: { type: 'integer' },
                            justificacion:             { type: 'string' }
                        },
                        required: ['proyecto_id', 'nombre', 'institucion', 'modalidad',
                                   'habilidades_aplicables', 'porcentaje_compatibilidad', 'justificacion']
                    }
                }
            },
            required: ['recomendaciones']
        }
    },
    systemInstruction: {
        parts: [{
            text: `Eres un motor de recomendación de proyectos de Servicio Social Estudiantil (SSE).
Los proyectos que recibes ya fueron pre-seleccionados porque coinciden con las habilidades del estudiante.
Tu tarea es elegir los 3 más adecuados basándote en análisis semántico de descripcion, actividad_principal y modalidad.

CRITERIOS DE ANÁLISIS:
1. Relevancia semántica: ¿el entorno del proyecto aprovecha las habilidades del estudiante?
2. Actividad principal: ¿es compatible con el perfil del estudiante?
3. Modalidad: considérala como factor de accesibilidad.

REGLAS:
- Recomienda exactamente 3 proyectos. Si hay menos de 3 disponibles, devuelve los que existan.
- Los proyecto_id deben ser exactamente los IDs recibidos en el input; nunca inventes IDs.
- justificacion: en español, segunda persona (tú), motivadora, máximo 1 oración breve.
- porcentaje_compatibilidad: número entero entre 0 y 100.
- habilidades_aplicables: máximo 3 habilidades del estudiante que más aplican al proyecto.`
        }]
    }
});

// ── HISTORIAL DE RECOMENDACIONES ─────────────────────────────────────────────
// Guarda en cache los proyecto_id ya recomendados para no repetirlos en la próxima
// llamada a Gemini. TTL de 7 días para que persista entre sesiones del estudiante.
// Se mantienen máximo 6 IDs (las últimas 2 rondas de 3 recomendaciones).

function getHistorialRecomendados(usuarioId) {
    return cache.get(`recomendacion_historial:${usuarioId}`) ?? [];
}

function actualizarHistorial(usuarioId, nuevosIds) {
    const actual = getHistorialRecomendados(usuarioId);
    // FIFO: agrega al final, mantiene solo los últimos 6 (2 rondas × 3)
    const actualizado = [...actual, ...nuevosIds].slice(-6);
    cache.set(`recomendacion_historial:${usuarioId}`, actualizado, TTL.RECOMENDACION_HISTORIAL);
}

// Reset parcial: elimina los 3 más antiguos para abrir espacio cuando no hay proyectos nuevos.
// Si quedan ≤3 en historial, limpia todo para evitar quedarse sin opciones.
function resetParcialHistorial(usuarioId) {
    const actual = getHistorialRecomendados(usuarioId);
    if (actual.length <= 3) {
        cache.delete(`recomendacion_historial:${usuarioId}`);
        return [];
    }
    const reducido = actual.slice(3);
    cache.set(`recomendacion_historial:${usuarioId}`, reducido, TTL.RECOMENDACION_HISTORIAL);
    return reducido;
}

// ── QUERY PRE-FILTRADA ────────────────────────────────────────────────────────
// INNER JOIN con Habilidades: solo devuelve proyectos que tengan al menos 1 habilidad
// en común con el estudiante. El ranking semántico fino lo hace Gemini sobre estos 10.

async function consultarProyectosCompatibles(habilidadIds, excluirIds) {
    return ProyectosInstitucion.findAll({
        where: {
            estado: 'Aprobado',
            disponibilidad: true,
            ...(excluirIds.length && { id: { [Op.notIn]: excluirIds } })
        },
        include: [
            {
                model: Instituciones,
                as: 'institucion',
                attributes: ['nombre']
            },
            {
                // INNER JOIN: filtra proyectos cuyas habilidades requeridas
                // coincidan con al menos una habilidad del estudiante.
                // required: true hace el JOIN obligatorio (excluye proyectos sin match).
                model: Habilidades,
                through: { attributes: [] },
                attributes: [],
                where: { id: { [Op.in]: habilidadIds } },
                required: true
            }
        ],
        attributes: ['id', 'nombre', 'descripcion', 'actividad_principal', 'modalidad'],
        distinct: true, // Evita duplicados cuando un proyecto coincide con múltiples habilidades
        limit: 10,
        subQuery: false
    });
}

/**
 * Recomienda los 3 proyectos más compatibles con las habilidades de un estudiante.
 *
 * Flujo:
 *  1. Cache hit → respuesta inmediata (24h TTL)
 *  2. Cache miss → pre-filtro SQL por habilidades + exclusión de historial
 *  3. Si quedan <3 proyectos → reset parcial del historial → reintento
 *  4. Llamada a Gemini con payload reducido (sin habilidades_requeridas de proyectos)
 *  5. Guardar resultado en cache + actualizar historial
 *
 * @route POST /api/recomendar-proyectos
 */
export async function recomendarProyectos(request, reply) {
    const { usuario_id, _debug = false } = request.body;

    if (!usuario_id) {
        return reply.status(400).send({ error: 'El campo usuario_id es obligatorio' });
    }

    // ── CACHE: Resultado guardado por 24 horas ────────────────────────────────
    const cacheKey = `recomendacion_resultado:${usuario_id}`;
    const cached = cache.get(cacheKey);
    if (cached && !_debug) {
        return reply.status(200).send(cached);
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

        const habilidadIds = usuarioHabilidades.map(uh => uh.habilidad_id);
        // Solo nombres para Gemini (sin IDs — el pre-filtro SQL ya usó los IDs)
        const habilidadesNombres = usuarioHabilidades.map(uh => uh.habilidad.descripcion);

        // ── PASO 2: Proyectos pre-filtrados por habilidad, excluyendo historial ─
        let excluirIds = getHistorialRecomendados(usuario_id);
        let proyectosDB = await consultarProyectosCompatibles(habilidadIds, excluirIds);

        // Si quedan menos de 3 opciones, el historial está muy lleno:
        // se hace un reset parcial (elimina los 3 más antiguos) y se reintenta.
        if (proyectosDB.length < 3 && excluirIds.length > 0) {
            excluirIds = resetParcialHistorial(usuario_id);
            proyectosDB = await consultarProyectosCompatibles(habilidadIds, excluirIds);
        }

        if (!proyectosDB.length) {
            return reply.status(200).send({
                recomendaciones: [],
                mensaje: 'No hay proyectos disponibles que coincidan con tus habilidades'
            });
        }

        // ── PASO 3: Payload para Gemini (reducido) ────────────────────────────
        // Se omiten las habilidades_requeridas de los proyectos: el pre-filtro SQL
        // ya garantizó la coincidencia. Gemini analiza descripcion + actividad_principal.
        const proyectos = proyectosDB.map(p => ({
            id: p.id,
            nombre: p.nombre,
            descripcion: p.descripcion?.slice(0, 200),
            actividad_principal: p.actividad_principal,
            modalidad: p.modalidad,
            institucion: p.institucion?.nombre ?? 'No especificada'
        }));

        // El prompt explica la tarea además del dato, porque con responseSchema
        // Gemini puede devolver el array vacío si recibe solo datos sin instrucción.
        const prompt = `Recomienda los 3 proyectos más adecuados para el estudiante basándote en sus habilidades y en la descripcion y actividad_principal de cada proyecto. Rellena todos los campos del esquema.

${JSON.stringify({ habilidades_estudiante: habilidadesNombres, proyectos })}`;

        // ── PASO 4: Llamada a Gemini ──────────────────────────────────────────
        let geminiResponse;
        try {
            const result = await withRetry(() => recomendacionModel.generateContent(prompt));
            geminiResponse = result.response.text();
        } catch (geminiError) {
            console.error('Error al llamar a Gemini tras reintentos:', geminiError);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: geminiError?.message ?? String(geminiError)
            });
        }

        // ── PASO 5: Parsear respuesta ─────────────────────────────────────────
        // Con responseMimeType + responseSchema, Gemini garantiza JSON válido
        // con la estructura exacta. No se necesita limpieza de markdown ni normalización.
        let parsed;
        try {
            parsed = JSON.parse(geminiResponse);
        } catch {
            console.error('Respuesta de Gemini no es JSON válido:', geminiResponse);
            return reply.status(500).send({
                error: 'Error al procesar recomendaciones',
                details: `Gemini no devolvió JSON válido: ${geminiResponse?.slice(0, 200)}`
            });
        }

        // Filtro de seguridad: descarta IDs que Gemini haya inventado
        const idsValidos = new Set(proyectosDB.map(p => Number(p.id)));
        parsed.recomendaciones = (parsed.recomendaciones ?? []).filter(r =>
            idsValidos.has(Number(r.proyecto_id))
        );

        // ── PASO 6: Guardar cache (24h) y actualizar historial ────────────────
        const respuesta = { ...parsed };
        cache.set(cacheKey, respuesta, TTL.RECOMENDACION);

        const idsRecomendados = parsed.recomendaciones.map(r => Number(r.proyecto_id));
        actualizarHistorial(usuario_id, idsRecomendados);

        if (_debug) {
            respuesta._debug = {
                ids_excluidos_por_historial: excluirIds,
                proyectos_enviados_a_gemini: proyectos.map(p => ({ id: p.id, nombre: p.nombre })),
                gemini_raw: geminiResponse.slice(0, 500)
            };
        }

        return reply.status(200).send(respuesta);

    } catch (error) {
        console.error('Error al consultar datos para recomendaciones:', error);
        return reply.status(500).send({
            error: 'Error al consultar datos',
            details: error?.message ?? String(error)
        });
    }
}
