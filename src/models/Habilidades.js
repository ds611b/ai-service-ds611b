import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Habilidades = sequelize.define('Habilidades', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  descripcion: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'Habilidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_habilidades_descripcion',
      fields: ['descripcion']
    }
  ]
});

export default Habilidades;