import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const EncargadoInstitucion = sequelize.define('EncargadoInstitucion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
}, {
  tableName: 'EncargadoInstitucion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default EncargadoInstitucion;