import { extraerHabilidades } from '../controllers/extraerHabilidadesController.js';

/**
 * Ruta del extractor de habilidades con IA.
 * @param {import('fastify').FastifyInstance} fastify
 */
async function extraerHabilidadesRoutes(fastify) {
  fastify.post('/extraer-habilidades', {
    schema: {
      description: 'Extrae habilidades de un texto libre con IA, crea las nuevas en el catálogo (sin duplicar) y devuelve la lista con sus IDs.',
      tags: ['Habilidades'],
      body: {
        type: 'object',
        required: ['texto'],
        properties: {
          texto: { type: 'string', description: 'Texto libre del que extraer habilidades' },
          crear: { type: 'boolean', description: 'true: crea las nuevas en el catálogo. false: solo recomienda (devuelve nombres en "nuevas").', default: true }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            existentes: {
              type: 'array',
              description: 'Habilidades con id (ya en catálogo, o recién creadas si crear=true)',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  descripcion: { type: 'string' }
                }
              }
            },
            nuevas: {
              type: 'array',
              description: 'Nombres de habilidades que aún no existen (solo si crear=false)',
              items: { type: 'string' }
            },
            creadas: { type: 'integer' },
            mensaje: { type: 'string' }
          }
        }
      }
    }
  }, extraerHabilidades);
}

export default extraerHabilidadesRoutes;
