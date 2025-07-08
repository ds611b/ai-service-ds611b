import {
  getProyectosInstitucion,
  getProyectoInstitucionById,
  createProyectoInstitucion,
  updateProyectoInstitucion,
  deleteProyectoInstitucion,
  getProyectoInstitucionByEstado,
} from '../controllers/proyectoInstitucionController.js';

/**
 * Define las rutas para los proyectos de instituciones.
 * @param {import('fastify').FastifyInstance} fastify - La instancia de Fastify.
 * @param {Object} options - Opciones de registro.
 */
async function proyectoInstitucionRoutes(fastify, options) {
  // Obtener todos los proyectos de instituciones
  fastify.get('/proyectos-institucion', {
    schema: {
      description: 'Obtiene una lista de todos los proyectos de instituciones disponibles.',
      tags: ['Proyectos de Instituciones'],
      response: {
        200: {
          description: 'Lista de proyectos de instituciones obtenida exitosamente.',
          type: 'array',
          items: { $ref: 'ProyectosInstitucion' },
        },
        500: {
          description: 'Error al obtener los proyectos de instituciones.',
          $ref: 'ErrorResponse',
        },
      },
    },
  }, getProyectosInstitucion);

  // Obtener un proyecto de institución por ID
  fastify.get('/proyectos-institucion/:id', {
    schema: {
      description: 'Obtiene un proyecto de institución específico basado en su ID.',
      tags: ['Proyectos de Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID único del proyecto de institución.' },
        },
        required: ['id'],
      },
      response: {
        200: {
          description: 'Detalles del proyecto de institución obtenidos exitosamente.',
          $ref: 'ProyectosInstitucion',
        },
        404: {
          description: 'Proyecto de institución no encontrado.',
          $ref: 'ErrorResponse',
        },
        500: {
          description: 'Error al obtener el proyecto de institución.',
          $ref: 'ErrorResponse',
        },
      },
    },
  }, getProyectoInstitucionById);

  // Crear un nuevo proyecto de institución
  fastify.post('/proyectos-institucion', {
    schema: {
      description: 'Crea un nuevo proyecto de institución en el sistema.',
      tags: ['Proyectos de Instituciones'],
      body: {
        $ref: 'ProyectoInstitucionValidation',
      },
      response: {
        201: {
          description: 'Proyecto de institución creado exitosamente.',
          $ref: 'ProyectosInstitucion',
        },
        500: {
          description: 'Error al crear el proyecto de institución.',
          $ref: 'ErrorResponse',
        },
      },
    },
  }, createProyectoInstitucion);

  // Actualizar un proyecto de institución existente
  fastify.put('/proyectos-institucion/:id', {
    schema: {
      description: 'Actualiza los detalles de un proyecto de institución existente.',
      tags: ['Proyectos de Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID único del proyecto de institución.' },
        },
        required: ['id'],
      },
      body: {
        $ref: 'ProyectoInstitucionValidation',
      },
      response: {
        200: {
          description: 'Proyecto de institución actualizado exitosamente.',
          $ref: 'ProyectosInstitucion',
        },
        404: {
          description: 'Proyecto de institución no encontrado.',
          $ref: 'ErrorResponse',
        },
        500: {
          description: 'Error al actualizar el proyecto de institución.',
          $ref: 'ErrorResponse',
        },
      },
    },
  }, updateProyectoInstitucion);

  // Eliminar un proyecto de institución
  fastify.delete('/proyectos-institucion/:id', {
    schema: {
      description: 'Elimina un proyecto de institución basado en su ID.',
      tags: ['Proyectos de Instituciones'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID único del proyecto de institución.' },
        },
        required: ['id'],
      },
      response: {
        204: {
          description: 'Proyecto de institución eliminado exitosamente.',
          type: 'null',
        },
        404: {
          description: 'Proyecto de institución no encontrado.',
          $ref: 'ErrorResponse',
        },
        500: {
          description: 'Error al eliminar el proyecto de institución.',
          $ref: 'ErrorResponse',
        },
      },
    },
  }, deleteProyectoInstitucion);
  
  fastify.get('/proyectos-institucion/estado/:estado/:disponibilidad', {
    schema: {
      description: 'Obtiene proyectos de institución filtrados por estado y disponibilidad',
      tags: ['Proyectos de Instituciones'],
      params: {
        type: 'object',
        properties: {
          estado: {
            type: 'string',
            description: 'Estado del proyecto (ej: Pendiente, Rechazado, Aprobado)',
            enum: ['Pendiente', 'Rechazado', 'Aprobado']
          },
          disponibilidad: {
            type: 'string',
            description: 'Disponibilidad del proyecto (ej: true, false)',
            enum: ['true', 'false']
          }
        },
        required: ['estado', 'disponibilidad']
      },
      response: {
        200: {
          description: 'Proyectos filtrados obtenidos exitosamente',
          type: 'array',
          items: { $ref: 'ProyectosInstitucion' }
        },
        404: {
          $ref: 'ErrorResponse',
          description: 'No se encontraron proyectos con los filtros especificados'
        },
        500: {
          $ref: 'ErrorResponse',
          description: 'Error al filtrar proyectos'
        }
      }
    }
  }, getProyectoInstitucionByEstado);

}
export default proyectoInstitucionRoutes;