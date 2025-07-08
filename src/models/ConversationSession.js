import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ConversationSession = sequelize.define('ConversationSession', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  conversationId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
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
