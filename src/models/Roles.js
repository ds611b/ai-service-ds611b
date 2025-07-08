import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Roles = sequelize.define('Roles', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'Roles',
  timestamps: false
});

export default Roles;
