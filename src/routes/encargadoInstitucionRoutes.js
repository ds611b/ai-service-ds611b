import {
  getEncargadosInstitucion,
  getEncargadoInstitucionById,
  createEncargadoInstitucion,
  updateEncargadoInstitucion,
  deleteEncargadoInstitucion
} from '../controllers/encargadoInstitucionController.js';

async function encargadoInstitucionRoutes(fastify) {
  // GET: Obtener todos los encargados
  fastify.get('/encargados-institucion', {
    schema: {
      description: 'Obtiene todos los encargados de institución',
      tags: ['Encargados Institución'],
      response: {
        200: {
          description: 'Lista de encargados obtenida exitosamente',
          type: 'array',
          items: { $ref: 'EncargadoInstitucion' }
        },
        500: {
          description: 'Error al obtener los encargados',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getEncargadosInstitucion);

  // GET: Obtener un encargado por ID
  fastify.get('/encargados-institucion/:id', {
    schema: {
      description: 'Obtiene un encargado de institución por ID',
      tags: ['Encargados Institución'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del encargado a obtener' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Encargado obtenido exitosamente',
          $ref: 'EncargadoInstitucion'
        },
        404: {
          description: 'Encargado no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener el encargado',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getEncargadoInstitucionById);

  // POST: Crear un nuevo encargado
  fastify.post('/encargados-institucion', {
    schema: {
      description: 'Crea un nuevo encargado de institución',
      tags: ['Encargados Institución'],
      body: { $ref: 'EncargadoInstitucionValidation' },
      response: {
        201: {
          description: 'Encargado creado exitosamente',
          $ref: 'EncargadoInstitucion'
        },
        409: {
          description: 'El correo electrónico ya está registrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear el encargado',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createEncargadoInstitucion);

  // PUT: Actualizar un encargado existente
  fastify.put('/encargados-institucion/:id', {
    schema: {
      description: 'Actualiza un encargado de institución por ID',
      tags: ['Encargados Institución'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del encargado a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'EncargadoInstitucionValidation' },
      response: {
        200: {
          description: 'Encargado actualizado exitosamente',
          $ref: 'EncargadoInstitucion'
        },
        404: {
          description: 'Encargado no encontrado',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'El correo electrónico ya está registrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar el encargado',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateEncargadoInstitucion);

  // DELETE: Eliminar un encargado
  fastify.delete('/encargados-institucion/:id', {
    schema: {
      description: 'Elimina un encargado de institución por ID',
      tags: ['Encargados Institución'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del encargado a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Encargado eliminado exitosamente',
          type: 'null'
        },
        404: {
          description: 'Encargado no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar el encargado',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteEncargadoInstitucion);
}

export default encargadoInstitucionRoutes;