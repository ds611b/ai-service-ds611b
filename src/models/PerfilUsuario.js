import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const PerfilUsuario = sequelize.define('PerfilUsuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  anio_academico: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  carnet: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  id_carrera: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Carreras',
      key: 'id'
    }
  },
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  genero: {
    type: DataTypes.ENUM('Masculino', 'Femenino', 'Otro'),
    allowNull: true,
  },
  foto_perfil: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'PerfilUsuario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      name: 'uq_perfil_usuario',
      fields: ['usuario_id']
    }
  ]
});

export default PerfilUsuario;