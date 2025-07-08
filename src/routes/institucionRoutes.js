import { getInstituciones, getInstitucionById, createInstitucion, updateInstitucion, deleteInstitucion } from '../controllers/institucionController.js';

/**
 * Define las rutas para las instituciones.
 * @param {import('fastify').FastifyInstance} fastify - La instancia de Fastify.
 * @param {Object} options - Opciones de registro.
 */
async function institucionRoutes(fastify, options) {
  // GET /instituciones
  fastify.get('/instituciones', {
    schema: {
      description: 'Obtiene todas las instituciones',
      tags: ['Instituciones'],
      response: {
        200: {
          description: 'Lista de instituciones obtenida exitosamente',
          type: 'array',
          items: { $ref: 'Instituciones' }
        },
        500: {
          description: 'Error al obtener las instituciones',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getInstituciones);

  // GET /instituciones/:id
  fastify.get('/instituciones/:id', {
    schema: {
      description: 'Obtiene una institución por ID',
      tags: ['Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la institución' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Institución encontrada',
          $ref: 'Instituciones'
        },
        404: {
          description: 'Institución no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la institución',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getInstitucionById);

  // POST /instituciones
  fastify.post('/instituciones', {
    schema: {
      description: 'Crea una nueva institución',
      tags: ['Instituciones'],
      body: {
        $ref: 'InstitucionValidation',
      },
      response: {
        201: {
          description: 'Institución creada exitosamente',
          $ref: 'Instituciones'
        },
        500: {
          description: 'Error al crear la institución',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createInstitucion);

  // PUT /instituciones/:id
  fastify.put('/instituciones/:id', {
    schema: {
      description: 'Actualiza una institución existente',
      tags: ['Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la institución a actualizar' }
        },
        required: ['id']
      },
      body: {
        $ref: 'InstitucionValidation',
      },
      response: {
        200: {
          description: 'Institución actualizada exitosamente',
          $ref: 'Instituciones'
        },
        404: {
          description: 'Institución no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la institución',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateInstitucion);

  // DELETE /instituciones/:id
  fastify.delete('/instituciones/:id', {
    schema: {
      description: 'Elimina una institución por ID',
      tags: ['Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la institución a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Institución eliminada exitosamente',
          type: 'null'
        },
        404: {
          description: 'Institución no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la institución',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteInstitucion);
}

export default institucionRoutes;