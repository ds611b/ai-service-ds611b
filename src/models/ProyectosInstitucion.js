import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ProyectosInstitucion = sequelize.define('ProyectosInstitucion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  institucion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_fin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  modalidad: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  disponibilidad: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente',
    allowNull: false,
  }
}, {
  tableName: 'ProyectosInstitucion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ProyectosInstitucion;
