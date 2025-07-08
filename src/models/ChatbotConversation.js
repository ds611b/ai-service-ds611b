// models/ChatbotConversation.js
import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ChatbotConversation = sequelize.define('ChatbotConversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },
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