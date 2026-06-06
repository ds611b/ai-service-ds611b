// models/ChatbotConversation.js
import { DataTypes } from 'sequelize';
import sequelize from './db.js';

/**
 * ChatbotConversation — Modelo alternativo/legacy para almacenar mensajes del chatbot.
 *
 * NOTA: Este modelo no está siendo usado activamente en el flujo actual del chatbot.
 * La lógica vigente usa los modelos `ConversationSession` y `Conversation` en su lugar.
 * Este modelo tiene una estructura más simple: vincula directamente un estudiante
 * con sus mensajes sin el concepto de "sesión".
 *
 * Se conserva por compatibilidad o como referencia de una versión anterior.
 */
const ChatbotConversation = sequelize.define('ChatbotConversation', {
  // ID autoincremental del registro
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // ID que agrupa los mensajes de una misma conversación (similar a ConversationSession.conversationId)
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // ID del estudiante que tuvo esta conversación
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Texto del mensaje enviado por el usuario
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  // Texto de la respuesta generada por la IA
  botResponse: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'chatbot_conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ChatbotConversation;
