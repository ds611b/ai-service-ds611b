import { recomendarProyectos } from '../controllers/recomendacionController.js';

/**
 * recomendacionRoutes — Endpoints del motor de recomendación de proyectos con IA.
 * Se registra en app.js con el prefijo '/api', por lo que el endpoint final es:
 *   POST /api/recomendar-proyectos
 */
async function recomendacionRoutes(fastify, options) {
    fastify.post('/recomendar-proyectos', {
        schema: {
            description: 'Recomienda los 3 proyectos más compatibles con las habilidades del estudiante usando IA',
            tags: ['Recomendaciones'],
            body: {
                type: 'object',
                required: ['usuario_id'],
                properties: {
                    usuario_id: {
                        type: 'integer',
                        description: 'ID del usuario estudiante',
                        minimum: 1
                    }
                }
            },
            response: {
                200: {
                    description: 'Lista de proyectos recomendados',
                    type: 'object',
                    properties: {
                        recomendaciones: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    proyecto_id:              { type: 'integer' },
                                    nombre:                   { type: 'string' },
                                    institucion:              { type: 'string' },
                                    modalidad:                { type: 'string' },
                                    habilidades_aplicables:   { type: 'array', items: { type: 'string' } },
                                    porcentaje_compatibilidad:{ type: 'integer' },
                                    justificacion:            { type: 'string' }
                                }
                            }
                        },
                        mensaje: { type: 'string' }
                    }
                },
                400: { $ref: 'ErrorResponse' },
                500: { $ref: 'ErrorResponse' }
            }
        }
    }, recomendarProyectos);
}

export default recomendacionRoutes;
