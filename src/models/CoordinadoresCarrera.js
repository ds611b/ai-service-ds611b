import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import Carreras from './Carreras.js'; 

const CoordinadoresCarrera = sequelize.define('CoordinadoresCarrera', {
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
  correo_institucional: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  id_carrera: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Carreras,
      key: 'id'
    }
  },
}, {
  tableName: 'CoordinadoresCarrera',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default CoordinadoresCarrera;