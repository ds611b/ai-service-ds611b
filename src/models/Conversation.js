
import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  conversationId: {
    type: DataTypes.STRING,
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
  tableName: 'Conversation',
  timestamps: true,
  createdAt: 'timestamp',
  updatedAt: false
});

export default Conversation;