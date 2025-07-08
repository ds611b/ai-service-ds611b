import {
  getProyectosInstitucionesHabilidades,
  getProyectosInstitucionesHabilidadById,
  createProyectosInstitucionesHabilidad,
  updateProyectosInstitucionesHabilidad,
  deleteProyectosInstitucionesHabilidad
} from '../controllers/proyectosInstitucionesHabilidadesController.js';

async function proyectosInstitucionesHabilidadesRoutes(fastify) {
  // GET: Obtener todas las relaciones
  fastify.get('/proyectos-instituciones-habilidades', {
    schema: {
      description: 'Obtiene todas las relaciones de habilidades para proyectos de instituciones',
      tags: ['Proyectos Instituciones Habilidades'],
      response: {
        200: {
          description: 'Lista de relaciones obtenida exitosamente',
          type: 'array',
          items: { $ref: 'ProyectosInstitucionesHabilidades' }
        },
        500: {
          description: 'Error al obtener las relaciones',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getProyectosInstitucionesHabilidades);

  // GET by ID: Obtener una relación por ID
  fastify.get('/proyectos-instituciones-habilidades/:id', {
    schema: {
      description: 'Obtiene una relación de habilidad por ID',
      tags: ['Proyectos Instituciones Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la relación' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Relación obtenida exitosamente',
          $ref: 'ProyectosInstitucionesHabilidades'
        },
        404: {
          description: 'Relación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la relación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getProyectosInstitucionesHabilidadById);

  // POST: Crear una nueva relación
  fastify.post('/proyectos-instituciones-habilidades', {
    schema: {
      description: 'Crea una nueva relación de habilidad para un proyecto de institución',
      tags: ['Proyectos Instituciones Habilidades'],
      body: { $ref: 'ProyectosInstitucionesHabilidadesValidation' },
      response: {
        201: {
          description: 'Relación creada exitosamente',
          $ref: 'ProyectosInstitucionesHabilidades'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear la relación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createProyectosInstitucionesHabilidad);

  // PUT: Actualizar una relación existente
  fastify.put('/proyectos-instituciones-habilidades/:id', {
    schema: {
      description: 'Actualiza una relación de habilidad por ID',
      tags: ['Proyectos Instituciones Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la relación a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'ProyectosInstitucionesHabilidadesValidation' },
      response: {
        200: {
          description: 'Relación actualizada exitosamente',
          $ref: 'ProyectosInstitucionesHabilidades'
        },
        404: {
          description: 'Relación no encontrada',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la relación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateProyectosInstitucionesHabilidad);

  // DELETE: Eliminar una relación
  fastify.delete('/proyectos-instituciones-habilidades/:id', {
    schema: {
      description: 'Elimina una relación de habilidad por ID',
      tags: ['Proyectos Instituciones Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la relación a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Proyecto institución habilidad eliminado exitosamente.',
          type: 'null',
        },
        404: {
          description: 'Relación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la relación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteProyectosInstitucionesHabilidad);
}

export default proyectosInstitucionesHabilidadesRoutes;