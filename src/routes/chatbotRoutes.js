import { sendMessage, getConversationHistory, startConversation, deleteConversation } from '../controllers/chatbotController.js';

async function chatbotRoutes(fastify, options) {
  // Iniciar nueva conversación
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
            conversationId: { type: 'string' },
            welcomeMessage: { type: 'string' },
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
          description: 'Contenido del mensaje',
          minLength: 1
        },
        usuarioId: { 
          type: 'integer',
          description: 'ID del usuario',
          minimum: 1
        },
        conversationId: {
          type: 'string',
          description: 'ID de la conversación',
          pattern: '^conv_[a-zA-Z0-9_]+$' // Ejemplo de patrón para validar formato
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
              userMessage: { type: 'string' },
              botResponse: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          },
          context: {
            type: 'object',
            properties: {
              escuela: { type: 'string' },
              carrera: { type: 'string' }
            }
          }
        }
      },
      400: { $ref: 'ErrorResponse' },
      403: { $ref: 'ErrorResponse' },
      404: { $ref: 'ErrorResponse' },
      500: { $ref: 'ErrorResponse' }
    }
  }
}, sendMessage);

  // Obtener historial
  fastify.get('/chatbot/history/:conversationId', {
    schema: {
      description: 'Obtener el historial completo de una conversación',
      tags: ['Chatbot'],
      params: {
        type: 'object',
        properties: {
          conversationId: { 
            type: 'string',
            description: 'ID de la conversación' 
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

  // Eliminar conversación
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
          type: 'null'
        },
        404: { $ref: 'ErrorResponse' },
        500: { $ref: 'ErrorResponse' }
      }
    }
  }, deleteConversation);
}

export default chatbotRoutes;