import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import ProyectosInstitucion from './ProyectosInstitucion.js'; // Import the related model

const BitacoraProyecto = sequelize.define('BitacoraProyecto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY, // Sequelize equivalent for DATE
    allowNull: true,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('En Proceso', 'Aprobado', 'Rechazado'),
    defaultValue: 'En Proceso',
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_proyecto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ProyectosInstitucion,
      key: 'id'
    }
  },
}, {
  tableName: 'BitacoraProyecto',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});


export default BitacoraProyecto;