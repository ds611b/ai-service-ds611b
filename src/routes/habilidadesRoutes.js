import {
  getHabilidades,
  getHabilidadById,
  createHabilidad,
  updateHabilidad,
  deleteHabilidad
} from '../controllers/habilidadesController.js';

async function habilidadesRoutes(fastify) {
  // GET: Obtener todas las habilidades
  fastify.get('/habilidades', {
    schema: {
      description: 'Obtiene todas las habilidades',
      tags: ['Habilidades'],
      response: {
        200: {
          description: 'Lista de habilidades obtenida exitosamente',
          type: 'array',
          items: { $ref: 'Habilidades' }
        },
        500: {
          description: 'Error al obtener las habilidades',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getHabilidades);

  // GET: Obtener una habilidad por ID
  fastify.get('/habilidades/:id', {
    schema: {
      description: 'Obtiene una habilidad por su ID',
      tags: ['Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la habilidad' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Habilidad obtenida exitosamente',
          $ref: 'Habilidades'
        },
        404: {
          description: 'Habilidad no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la habilidad',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getHabilidadById);

  // POST: Crear una nueva habilidad
  fastify.post('/habilidades', {
    schema: {
      description: 'Crea una nueva habilidad',
      tags: ['Habilidades'],
      body: { $ref: 'HabilidadesValidation' },
      response: {
        201: {
          description: 'Habilidad creada exitosamente',
          $ref: 'Habilidades'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse#'
        },
        500: {
          description: 'Error al crear la habilidad',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createHabilidad);

  // PUT: Actualizar una habilidad existente
  fastify.put('/habilidades/:id', {
    schema: {
      description: 'Actualiza una habilidad existente por ID',
      tags: ['Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la habilidad a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'HabilidadesValidation' },
      response: {
        200: {
          description: 'Habilidad actualizada exitosamente',
          $ref: 'Habilidades'
        },
        404: {
          description: 'Habilidad no encontrada',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la habilidad',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateHabilidad);

  // DELETE: Eliminar una habilidad
  fastify.delete('/habilidades/:id', {
    schema: {
      description: 'Elimina una habilidad por ID',
      tags: ['Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la habilidad a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Habilidad eliminada exitosamente',
          type: 'null'
        },
        404: {
          description: 'Habilidad no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la habilidad',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteHabilidad);
}

export default habilidadesRoutes;
