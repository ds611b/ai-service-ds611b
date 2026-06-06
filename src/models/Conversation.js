import { DataTypes } from 'sequelize';
import sequelize from './db.js';

/**
 * Conversation — Modelo que representa un mensaje individual dentro de una conversación.
 *
 * Cada registro guarda un par pregunta-respuesta: lo que escribió el usuario
 * y lo que respondió el chatbot (IA). Esta tabla es la memoria persistida del chat.
 *
 * Se usa de dos formas:
 *  1. Para mostrar el historial al usuario cuando regresa a una conversación.
 *  2. Para construir el contexto que se envía a la IA, de modo que "recuerde"
 *     los mensajes anteriores y mantenga coherencia en la conversación.
 *
 * Relaciones:
 *  - Pertenece a una ConversationSession (a través de conversationId)
 */
const Conversation = sequelize.define('Conversation', {
  // ID único del mensaje, generado como UUID
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },

  // Vincula este mensaje con su sesión (ConversationSession.conversationId)
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Texto exacto del mensaje enviado por el usuario
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  // Texto de la respuesta generada por la IA (Gemini)
  botResponse: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'Conversation',
  timestamps: true,
  createdAt: 'timestamp', // El campo de fecha de creación se llama "timestamp" en la BD
  updatedAt: false         // No necesita campo de actualización ya que los mensajes no se editan
});

export default Conversation;
