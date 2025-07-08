import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const ProyectosInstitucionesHabilidades = sequelize.define('ProyectosInstitucionesHabilidades', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  habilidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'ProyectosInstitucionesHabilidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_proyecto_habilidad',
      fields: ['proyecto_id', 'habilidad_id']
    }
  ]
});

export default ProyectosInstitucionesHabilidades;