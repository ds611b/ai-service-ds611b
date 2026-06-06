import { sendMessage, getConversationHistory, startConversation, deleteConversation } from '../controllers/chatbotController.js';

/**
 * chatbotRoutes — Define los endpoints HTTP del chatbot de IA.
 *
 * Todos los endpoints usan el prefijo /api (configurado en app.js), por lo que
 * las rutas reales son: /api/chatbot/start, /api/chatbot/message, etc.
 *
 * Flujo típico de uso:
 *  1. POST /api/chatbot/start       → Obtener un conversationId
 *  2. POST /api/chatbot/message     → Enviar mensajes usando ese conversationId
 *  3. GET  /api/chatbot/history/:id → Consultar el historial si se necesita
 *  4. DELETE /api/chatbot/conversations/:id → Limpiar la conversación al finalizar
 *
 * @param {FastifyInstance} fastify - Instancia de Fastify inyectada automáticamente
 * @param {Object} options - Opciones del plugin (no usadas aquí)
 */
async function chatbotRoutes(fastify, options) {

  /**
   * POST /api/chatbot/start
   * Inicia una nueva sesión de conversación con el chatbot.
   * Devuelve un `conversationId` que el cliente debe usar en los siguientes mensajes.
   */
  fastify.post('/chatbot/start', {
    schema: {
      description: 'Iniciar una nueva conversación con el chatbot',
      tags: ['Chatbot'],
      body: {
        type: 'object',
        properties: {
          usuarioId: {
            type: 'number',
            description: 'ID del usuario que inicia la conversación'
          }
        },
        required: ['usuarioId']
      },
      response: {
        201: {
          description: 'Conversación iniciada exitosamente',
          type: 'object',
          properties: {
            conversationId: { type: 'string' },    // ID único a guardar en el cliente
            welcomeMessage: { type: 'string' },    // Primer mensaje del bot
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                nombre: { type: 'string' }
              }
            },
            session: { $ref: 'ConversationSession' }
          }
        },
        404: { $ref: 'ErrorResponse' },
        500: { $ref: 'ErrorResponse' }
      }
    }
  }, startConversation);

  /**
   * POST /api/chatbot/message
   * Envía un mensaje al chatbot y recibe la respuesta generada por Gemini.
   * Requiere el `conversationId` obtenido en /chatbot/start para mantener contexto.
   */
  fastify.post('/chatbot/message', {
    schema: {
      description: 'Enviar mensaje al chatbot',
      tags: ['Chatbot'],
      body: {
        type: 'object',
        required: ['message', 'usuarioId', 'conversationId'],
        properties: {
          message: {
            type: 'string',
            description: 'Contenido del mensaje del usuario',
            minLength: 1
          },
          usuarioId: {
            type: 'integer',
            description: 'ID del usuario que envía el mensaje',
            minimum: 1
          },
          conversationId: {
            type: 'string',
            description: 'ID de la sesión de conversación (obtenido en /chatbot/start)',
            pattern: '^conv_[a-zA-Z0-9_]+$' // Valida el formato del conversationId
          }
        }
      },
      response: {
        201: {
          description: 'Mensaje procesado exitosamente',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                conversationId: { type: 'string' },
                userMessage: { type: 'string' },  // El mensaje que envió el usuario
                botResponse: { type: 'string' },  // La respuesta generada por la IA
                timestamp: { type: 'string', format: 'date-time' }
              }
            },
            // Contexto adicional retornado para debug/uso del cliente
            context: {
              type: 'object',
              properties: {
                escuela: { type: 'string' },
                carrera: { type: 'string' }
              }
            }
          }
        },
        400: { $ref: 'ErrorResponse' }, // Campos faltantes o mensaje vacío
        403: { $ref: 'ErrorResponse' }, // Usuario no es dueño de la conversación
        404: { $ref: 'ErrorResponse' }, // Usuario no encontrado
        500: { $ref: 'ErrorResponse' }  // Error al llamar a la IA o BD
      }
    }
  }, sendMessage);

  /**
   * GET /api/chatbot/history/:conversationId
   * Retorna el historial completo de mensajes de una conversación.
   * Útil para restaurar el chat si el usuario cierra y reabre la aplicación.
   */
  fastify.get('/chatbot/history/:conversationId', {
    schema: {
      description: 'Obtener el historial completo de una conversación',
      tags: ['Chatbot'],
      params: {
        type: 'object',
        properties: {
          conversationId: {
            type: 'string',
            description: 'ID de la conversación a consultar'
          }
        },
        required: ['conversationId']
      },
      response: {
        200: {
          description: 'Historial de conversación',
          type: 'object',
          properties: {
            id: { type: 'string' },
            conversationId: { type: 'string' },
            usuarioId: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            // Lista de todos los mensajes de la conversación en orden cronológico
            conversations: {
              type: 'array',
              items: { $ref: 'Conversation' }
            },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                primer_nombre: { type: 'string' },
                primer_apellido: { type: 'string' },
                PerfilUsuario: {
                  type: 'object',
                  properties: {
                    anio_academico: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        404: { $ref: 'ErrorResponse' },
        500: { $ref: 'ErrorResponse' }
      }
    }
  }, getConversationHistory);

  /**
   * DELETE /api/chatbot/conversations/:conversationId
   * Elimina una conversación completa (sesión + todos sus mensajes).
   * Solo el usuario dueño puede eliminar su propia conversación.
   */
  fastify.delete('/chatbot/conversations/:conversationId', {
    schema: {
      description: 'Eliminar una conversación completa',
      tags: ['Chatbot'],
      params: {
        type: 'object',
        properties: {
          conversationId: {
            type: 'string',
            description: 'ID de la conversación a eliminar'
          }
        },
        required: ['conversationId']
      },
      response: {
        204: {
          description: 'Conversación eliminada exitosamente',
          type: 'null' // 204 no retorna contenido
        },
        404: { $ref: 'ErrorResponse' },
        500: { $ref: 'ErrorResponse' }
      }
    }
  }, deleteConversation);
}

export default chatbotRoutes;
