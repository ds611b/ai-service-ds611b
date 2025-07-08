import {
  getContactosEmergencia,
  getContactoEmergenciaById,
  createContactoEmergencia,
  updateContactoEmergencia,
  deleteContactoEmergencia
} from '../controllers/contactoEmergenciaController.js';

async function contactoEmergenciaRoutes(fastify) {
  // GET: Obtener todos los contactos de emergencia
  fastify.get('/contactos-emergencia', {
    schema: {
      description: 'Obtiene todos los contactos de emergencia',
      tags: ['Contactos Emergencia'],
      response: {
        200: {
          description: 'Lista de contactos obtenida exitosamente',
          type: 'array',
          items: { $ref: 'ContactoEmergencia' }
        },
        500: {
          description: 'Error al obtener los contactos',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getContactosEmergencia);

  // GET: Obtener un contacto por ID
  fastify.get('/contactos-emergencia/:id', {
    schema: {
      description: 'Obtiene un contacto de emergencia por ID',
      tags: ['Contactos Emergencia'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del contacto a obtener' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Contacto obtenido exitosamente',
          $ref: 'ContactoEmergencia'
        },
        404: {
          description: 'Contacto no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener el contacto',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getContactoEmergenciaById);

  // POST: Crear un nuevo contacto
  fastify.post('/contactos-emergencia', {
    schema: {
      description: 'Crea un nuevo contacto de emergencia',
      tags: ['Contactos Emergencia'],
      body: { $ref: 'ContactoEmergenciaValidation' },
      response: {
        201: {
          description: 'Contacto creado exitosamente',
          $ref: 'ContactoEmergencia'
        },
        400: {
          description: 'El perfil de usuario no existe',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Contacto duplicado para este usuario',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear el contacto',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createContactoEmergencia);

  // PUT: Actualizar un contacto existente
  fastify.put('/contactos-emergencia/:id', {
    schema: {
      description: 'Actualiza un contacto de emergencia por ID',
      tags: ['Contactos Emergencia'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del contacto a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'ContactoEmergenciaValidation' },
      response: {
        200: {
          description: 'Contacto actualizado exitosamente',
          $ref: 'ContactoEmergencia'
        },
        400: {
          description: 'El perfil de usuario no existe',
          $ref: 'ErrorResponse'
        },
        404: {
          description: 'Contacto no encontrado',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Contacto duplicado para este usuario',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar el contacto',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateContactoEmergencia);

  // DELETE: Eliminar un contacto
  fastify.delete('/contactos-emergencia/:id', {
    schema: {
      description: 'Elimina un contacto de emergencia por ID',
      tags: ['Contactos Emergencia'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID del contacto a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Contacto eliminado exitosamente',
          type: 'null'
        },
        404: {
          description: 'Contacto no encontrado',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar el contacto',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteContactoEmergencia);
}

export default contactoEmergenciaRoutes;