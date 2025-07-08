import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import Escuelas from './Escuelas.js';

const Carreras = sequelize.define('Carreras', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_escuela: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Escuelas,
      key: 'id'
    }
  },
}, {
  tableName: 'Carreras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Carreras;