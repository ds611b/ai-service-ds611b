import { 
  getCoordinadores, 
  getCoordinadorById, 
  createCoordinador, 
  updateCoordinador, 
  deleteCoordinador 
} from '../controllers/coordinadorCarreraController.js';

async function coordinadoresCarreraRoutes(fastify, options) {
  // GET /coordinadores-carrera
  fastify.get('/coordinadores-carrera', {
    schema: {
      description: 'Obtiene todos los coordinadores con su carrera y escuela asociada',
      tags: ['Coordinadores'],
      response: {
        200: {
          description: 'Lista de coordinadores obtenida exitosamente',
          type: 'array',
          items: { $ref: 'CoordinadoresWithCarrera' }
        },
        500: {
          description: 'Error al obtener los coordinadores',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getCoordinadores);

  // GET /coordinadores-carrera/:id
  fastify.get('/coordinadores-carrera/:id', {
    schema: {
      description: 'Obtiene un coordinador por ID con su carrera y escuela asociada',
      tags: ['Coordinadores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del coordinador' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Coordinador encontrado',
          $ref: 'CoordinadoresWithCarrera'
        },
        404: {
          description: 'Coordinador no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener el coordinador',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getCoordinadorById);

  // POST /coordinadores-carrera
  fastify.post('/coordinadores-carrera', {
    schema: {
      description: 'Crea un nuevo coordinador asociado a una carrera',
      tags: ['Coordinadores'],
      body: {
        $ref: 'CoordinadorValidation'
      },
      response: {
        201: {
          description: 'Coordinador creado exitosamente',
          $ref: 'CoordinadoresWithCarrera'
        },
        400: {
          description: 'La carrera especificada no existe',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'El correo institucional ya está registrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear el coordinador',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createCoordinador);

  // PUT /coordinadores-carrera/:id
  fastify.put('/coordinadores-carrera/:id', {
    schema: {
      description: 'Actualiza un coordinador existente',
      tags: ['Coordinadores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del coordinador a actualizar' }
        },
        required: ['id']
      },
      body: {
        $ref: 'CoordinadorValidation'
      },
      response: {
        200: {
          description: 'Coordinador actualizado exitosamente',
          $ref: 'CoordinadoresWithCarrera'
        },
        400: {
          description: 'La carrera especificada no existe',
          $ref: 'ErrorResponse'
        },
        404: {
          description: 'Coordinador no encontrado',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'El correo institucional ya está registrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar el coordinador',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateCoordinador);

  // DELETE /coordinadores-carrera/:id
  fastify.delete('/coordinadores-carrera/:id', {
    schema: {
      description: 'Elimina un coordinador por ID',
      tags: ['Coordinadores'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del coordinador a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Coordinador eliminado exitosamente',
          type: 'null'
        },
        404: {
          description: 'Coordinador no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar el coordinador',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteCoordinador);
}

export default coordinadoresCarreraRoutes;