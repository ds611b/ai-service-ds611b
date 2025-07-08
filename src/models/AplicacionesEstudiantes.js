import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const AplicacionesEstudiantes = sequelize.define('AplicacionesEstudiantes', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  estudiante_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente',
    allowNull: false,
  },
}, {
  tableName: 'AplicacionesEstudiantes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_aplicacion_estudiante_proyecto',
      fields: ['estudiante_id', 'proyecto_id']
    }
  ]
});

export default AplicacionesEstudiantes;