import { DataTypes } from 'sequelize';
import sequelize from './db.js';

/**
 * ConversationSession — Modelo que representa una sesión de conversación con el chatbot.
 *
 * Una sesión agrupa todos los mensajes de una misma "sesión de chat" de un usuario.
 * Es el contenedor principal: cuando un usuario inicia el chatbot, se crea una sesión,
 * y todos los mensajes que envíe durante esa sesión quedan vinculados a ella
 * a través del campo `conversationId`.
 *
 * Relaciones:
 *  - Tiene muchos Conversation (mensajes individuales)
 *  - Pertenece a un Usuario (a través de usuarioId)
 */
const ConversationSession = sequelize.define('ConversationSession', {
  // ID único de la sesión, generado automáticamente como UUID
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },

  // Identificador compartido con los mensajes: vincula la sesión con sus Conversations
  // Ejemplo: "conv_1716900000000_a3f9xk2"
  conversationId: {
    type: DataTypes.STRING,
    unique: true,   // Solo puede existir una sesión por conversationId
    allowNull: false
  },

  // ID del usuario dueño de esta conversación (referencia a la tabla Usuarios)
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Momento en que el usuario inició la conversación
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // Momento en que terminó la conversación (null si sigue activa)
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ConversationSession',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ConversationSession;
