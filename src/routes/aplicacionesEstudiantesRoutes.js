import {
  getAplicacionesEstudiantes,
  getAplicacionEstudianteById,
  createAplicacionEstudiante,
  updateAplicacionEstudiante,
  deleteAplicacionEstudiante,
  getAplicacionesByEstudiante,
  getAplicacionesByProyecto
} from '../controllers/aplicacionesEstudiantesController.js';

async function aplicacionesEstudiantesRoutes(fastify) {
  // GET: Obtener todas las aplicaciones
  fastify.get('/aplicaciones-estudiantes', {
    schema: {
      description: 'Obtiene todas las aplicaciones de estudiantes',
      tags: ['Aplicaciones Estudiantes'],
      response: {
        200: {
          description: 'Lista de aplicaciones obtenida exitosamente',
          type: 'array',
          items: { $ref: 'AplicacionesEstudiantesID' }
        },
        500: {
          description: 'Error al obtener las aplicaciones',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getAplicacionesEstudiantes);

  // GET: Obtener una aplicación por ID
  fastify.get('/aplicaciones-estudiantes/:id', {
    schema: {
      description: 'Obtiene una aplicación de estudiante por ID',
      tags: ['Aplicaciones Estudiantes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la aplicación a obtener' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Aplicación obtenida exitosamente',
          $ref: 'AplicacionesEstudiantesID'
        },
        404: {
          description: 'Aplicación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la aplicación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getAplicacionEstudianteById);

  // Agrega estas rutas dentro de la función de rutas
fastify.get('/aplicaciones-estudiantes/estudiante/:estudianteId', {
  schema: {
    description: 'Obtiene todas las aplicaciones de un estudiante específico',
    tags: ['Aplicaciones Estudiantes'],
    params: {
      type: 'object',
      properties: {
        estudianteId: { type: 'number', description: 'ID del estudiante' }
      },
      required: ['estudianteId']
    },
    response: {
      200: {
        description: 'Aplicaciones del estudiante obtenidas exitosamente',
        type: 'array',
        items: { $ref: 'AplicacionesEstudiante' }
      },
      404: {
        description: 'No se encontraron aplicaciones para este estudiante',
        $ref: 'ErrorResponse'
      },
      500: {
        description: 'Error al obtener las aplicaciones',
        $ref: 'ErrorResponse'
      }
    }
  }
}, getAplicacionesByEstudiante);

fastify.get('/aplicaciones-estudiantes/proyecto/:proyectoId', {
  schema: {
    description: 'Obtiene todas las aplicaciones para un proyecto específico',
    tags: ['Aplicaciones Estudiantes'],
    params: {
      type: 'object',
      properties: {
        proyectoId: { type: 'number', description: 'ID del proyecto' }
      },
      required: ['proyectoId']
    },
    response: {
      200: {
        description: 'Aplicaciones del proyecto obtenidas exitosamente',
        type: 'object',
        $ref: 'AplicacionesEstudiante'
      },
      404: {
        description: 'No se encontraron aplicaciones para este proyecto',
        $ref: 'ErrorResponse'
      },
      500: {
        description: 'Error al obtener las aplicaciones',
        $ref: 'ErrorResponse'
      }
    }
  }
}, getAplicacionesByProyecto);

  // POST: Crear una nueva aplicación
  fastify.post('/aplicaciones-estudiantes', {
    schema: {
      description: 'Crea una nueva aplicación de estudiante',
      tags: ['Aplicaciones Estudiantes'],
      body: { $ref: 'AplicacionesEstudiantesValidation' },
      response: {
        201: {
          description: 'Aplicación creada exitosamente',
          $ref: 'AplicacionesEstudiantesID'
        },
        409: {
          description: 'El estudiante ya tiene una aplicación para este proyecto',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear la aplicación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createAplicacionEstudiante);

  // PUT: Actualizar una aplicación existente
  fastify.put('/aplicaciones-estudiantes/:id', {
    schema: {
      description: 'Actualiza una aplicación de estudiante por ID',
      tags: ['Aplicaciones Estudiantes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la aplicación a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'AplicacionesEstudiantesValidation' },
      response: {
        200: {
          description: 'Aplicación actualizada exitosamente',
          $ref: 'AplicacionesEstudiantesID'
        },
        404: {
          description: 'Aplicación no encontrada',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la aplicación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateAplicacionEstudiante);

  // DELETE: Eliminar una aplicación
  fastify.delete('/aplicaciones-estudiantes/:id', {
    schema: {
      description: 'Elimina una aplicación de estudiante por ID',
      tags: ['Aplicaciones Estudiantes'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la aplicación a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Aplicación eliminada exitosamente',
          type: 'null'
        },
        404: {
          description: 'Aplicación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la aplicación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteAplicacionEstudiante);
}

export default aplicacionesEstudiantesRoutes;
