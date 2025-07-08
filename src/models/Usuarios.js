import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Usuarios = sequelize.define('Usuarios', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  primer_nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  }, 
  segundo_nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  primer_apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  segundo_apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'Usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Usuarios;