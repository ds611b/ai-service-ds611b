import {
  getUsuariosHabilidades,
  getUsuariosHabilidadById,
  getHabilidadesByUsuario,
  createUsuariosHabilidad,
  updateUsuariosHabilidad,
  deleteUsuariosHabilidad
} from '../controllers/usuariosHabilidadesController.js';

/**
 * Define las rutas para manejar las asignaciones de habilidades a usuarios.
 *
 * @param {import('fastify').FastifyInstance} fastify 
 */
async function usuariosHabilidadesRoutes(fastify) {
  /**
   * GET /usuarios-habilidades
   * Obtiene todas las asignaciones.
   */
  fastify.get('/usuarios-habilidades', {
    schema: {
      description: 'Obtiene todas las asignaciones de habilidades a usuarios',
      tags: ['Usuarios Habilidades'],
      response: {
        200: {
          description: 'Lista de asignaciones obtenida exitosamente',
          type: 'array',
          items: { $ref: 'UsuariosHabilidades' }
        },
        500: {
          description: 'Error al obtener las asignaciones',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getUsuariosHabilidades);

  /**
   * GET /usuarios-habilidades/:id
   * Obtiene una asignación por su ID.
   */
  fastify.get('/usuarios-habilidades/:id', {
    schema: {
      description: 'Obtiene una asignación de habilidad a usuario por ID',
      tags: ['Usuarios Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la asignación' }
        },
        required: ['id']
      },
      response: {
        200: {
          description: 'Asignación obtenida exitosamente',
          $ref: 'UsuariosHabilidades'
        },
        404: {
          description: 'Asignación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener la asignación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getUsuariosHabilidadById);

  /**
   * GET /usuarios-habilidades/usuario/:usuarioId/
   * Obtiene todas las habilidades de un usuario específico
   */
  fastify.get('/usuarios-habilidades/usuario/:usuarioId', {
    schema: {
      description: 'Obtiene todas las habilidades de un usuario específico',
      tags: ['Usuarios Habilidades'],
      params: {
        type: 'object',
        properties: {
          usuarioId: { type: 'number', description: 'ID del usuario' }
        },
        required: ['usuarioId']
      },
      response: {
        200: {
          description: 'Habilidades del usuario obtenidas exitosamente',
          type: 'object',
          properties: {
            usuario_id: { type: 'number' },
            habilidades: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  habilidad_id: { type: 'number' },
                  descripcion: { type: 'string' }
                }
              }
            }
          }
        },
        404: {
          description: 'No se encontraron habilidades para este usuario',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al obtener las habilidades del usuario',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, getHabilidadesByUsuario);


  /**
   * POST /usuarios-habilidades
   * Crea una nueva asignación.
   */
  fastify.post('/usuarios-habilidades', {
    schema: {
      description: 'Crea una nueva asignación de habilidad a usuario',
      tags: ['Usuarios Habilidades'],
      body: { $ref: 'UsuariosHabilidadesValidation' },
      response: {
        201: {
          description: 'Asignación creada exitosamente',
          $ref: 'UsuariosHabilidades'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al crear la asignación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, createUsuariosHabilidad);

  /**
   * PUT /usuarios-habilidades/:id
   * Actualiza una asignación existente.
   */
  fastify.put('/usuarios-habilidades/:id', {
    schema: {
      description: 'Actualiza una asignación de habilidad a usuario por ID',
      tags: ['Usuarios Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la asignación a actualizar' }
        },
        required: ['id']
      },
      body: { $ref: 'UsuariosHabilidadesValidation' },
      response: {
        200: {
          description: 'Asignación actualizada exitosamente',
          $ref: 'UsuariosHabilidades'
        },
        404: {
          description: 'Asignación no encontrada',
          $ref: 'ErrorResponse'
        },
        409: {
          description: 'Conflicto - Combinación duplicada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al actualizar la asignación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, updateUsuariosHabilidad);

  /**
   * DELETE /usuarios-habilidades/:id
   * Elimina una asignación por ID.
   */
  fastify.delete('/usuarios-habilidades/:id', {
    schema: {
      description: 'Elimina una asignación de habilidad a usuario por ID',
      tags: ['Usuarios Habilidades'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'ID de la asignación a eliminar' }
        },
        required: ['id']
      },
      response: {
        204: {
          description: 'Asignación eliminada exitosamente'
        },
        404: {
          description: 'Asignación no encontrada',
          $ref: 'ErrorResponse'
        },
        500: {
          description: 'Error al eliminar la asignación',
          $ref: 'ErrorResponse'
        }
      }
    }
  }, deleteUsuariosHabilidad);
}

export default usuariosHabilidadesRoutes;
