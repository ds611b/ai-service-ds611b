import { 
  getCarreras, 
  getCarreraById, 
  createCarrera, 
  updateCarrera, 
  deleteCarrera 
} from '../controllers/carrerasController.js';

async function carrerasRoutes(fastify, options) {
  // GET /carreras
  fastify.get('/carreras', {
    schema: {
      description: 'Obtiene todas las carreras con su escuela asociada',
      tags: ['Carreras'],
      response: {
        200: {
          description: 'Lista de carreras obtenida exitosamente',
          type: 'array',
          items: { $ref: 'CarrerasWithEscuela' }
        },
        500: {
          description: 'Error al obtener las carreras',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getCarreras);

  // GET /carreras/:id
  fastify.get('/carreras/:id', {
    schema: {
      description: 'Obtiene una carrera por ID con su escuela asociada',
      tags: ['Carreras'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la carrera' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Carrera encontrada',
          $ref: 'CarrerasWithEscuela'
        },
        404: {
          description: 'Carrera no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la carrera',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getCarreraById);

  // POST /carreras
  fastify.post('/carreras', {
    schema: {
      description: 'Crea una nueva carrera asociada a una escuela',
      tags: ['Carreras'],
      body: {
        $ref: 'CarreraValidation'
      },
      response: {
        201: {
          description: 'Carrera creada exitosamente',
          $ref: 'CarrerasWithEscuela'
        },
        400: {
          description: 'La escuela especificada no existe',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Ya existe una carrera con este nombre en la escuela',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear la carrera',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createCarrera);

  // PUT /carreras/:id
  fastify.put('/carreras/:id', {
    schema: {
      description: 'Actualiza una carrera existente',
      tags: ['Carreras'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la carrera a actualizar' }
        },
        required: ['id']
      },
      body: {
        $ref: 'CarreraValidation'
      },
      response: {
        200: {
          description: 'Carrera actualizada exitosamente',
          $ref: 'CarrerasWithEscuela'
        },
        400: {
          description: 'La escuela especificada no existe',
          $ref: 'ErrorResponse'
        },
        404: {
          description: 'Carrera no encontrada',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Ya existe una carrera con este nombre en la escuela',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la carrera',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateCarrera);

  // DELETE /carreras/:id
  fastify.delete('/carreras/:id', {
    schema: {
      description: 'Elimina una carrera por ID',
      tags: ['Carreras'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la carrera a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Carrera eliminada exitosamente',
          type: 'null'
        },
        400: {
          description: 'No se puede eliminar: Existen registros asociados',
          $ref: 'ErrorResponse'
        },
        404: {
          description: 'Carrera no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la carrera',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteCarrera);
}

export default carrerasRoutes;