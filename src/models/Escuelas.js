import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Escuelas = sequelize.define('Escuelas', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
}, {
  tableName: 'Escuelas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_escuelas_nombre',
      fields: ['nombre']
    }
  ]
});

export default Escuelas;