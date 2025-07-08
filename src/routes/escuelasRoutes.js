import { 
  getEscuelas, 
  getEscuelaById, 
  createEscuela, 
  updateEscuela, 
  deleteEscuela 
} from '../controllers/escuelasController.js';

async function escuelasRoutes(fastify, options) {
  // GET /escuelas
  fastify.get('/escuelas', {
    schema: {
      description: 'Obtiene todas las escuelas académicas',
      tags: ['Escuelas'],
      response: {
        200: {
          description: 'Lista de escuelas obtenida exitosamente',
          type: 'array',
          items: { $ref: 'Escuelas' }
        },
        500: {
          description: 'Error al obtener las escuelas',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getEscuelas);

  // GET /escuelas/:id
  fastify.get('/escuelas/:id', {
    schema: {
      description: 'Obtiene una escuela por ID',
      tags: ['Escuelas'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la escuela' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Escuela encontrada',
          $ref: 'Escuelas'
        },
        404: {
          description: 'Escuela no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la escuela',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getEscuelaById);

  // POST /escuelas
  fastify.post('/escuelas', {
    schema: {
      description: 'Crea una nueva escuela académica',
      tags: ['Escuelas'],
      body: {
        $ref: 'EscuelaValidation'
      },
      response: {
        201: {
          description: 'Escuela creada exitosamente',
          $ref: 'Escuelas'
        },
        500: {
          description: 'Error al crear la escuela',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createEscuela);

  // PUT /escuelas/:id
  fastify.put('/escuelas/:id', {
    schema: {
      description: 'Actualiza una escuela existente',
      tags: ['Escuelas'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la escuela a actualizar' }
        },
        required: ['id']
      },
      body: {
        $ref: 'EscuelaValidation'
      },
      response: {
        200: {
          description: 'Escuela actualizada exitosamente',
          $ref: 'Escuelas'
        },
        404: {
          description: 'Escuela no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la escuela',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateEscuela);

  // DELETE /escuelas/:id
  fastify.delete('/escuelas/:id', {
    schema: {
      description: 'Elimina una escuela por ID',
      tags: ['Escuelas'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la escuela a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Escuela eliminada exitosamente',
          type: 'null'
        },
        404: {
          description: 'Escuela no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la escuela',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteEscuela);
}

export default escuelasRoutes;