import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const BitacoraItems = sequelize.define('BitacoraItems', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  detalle_actividades: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  total_horas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  punch_in: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Equivalent to CURRENT_TIMESTAMP
    allowNull: false,
  },
  punch_out: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Equivalent to CURRENT_TIMESTAMP
    allowNull: false,
  },
}, {
  tableName: 'BitacoraItems',
  timestamps: false, // No created_at/updated_at since not in your SQL definition
  // You might want to add paranoid: true for soft deletes if needed
});

export default BitacoraItems;