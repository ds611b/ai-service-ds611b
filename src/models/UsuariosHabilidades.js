import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const UsuariosHabilidades = sequelize.define('UsuariosHabilidades', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  habilidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'UsuariosHabilidades',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_usuario_habilidad',
      fields: ['usuario_id', 'habilidad_id']
    }
  ]
});

export default UsuariosHabilidades;