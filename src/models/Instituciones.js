import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Instituciones = sequelize.define('Instituciones', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    unique: true
  },
  fecha_fundacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nit: {
    type: DataTypes.STRING(25),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente',
    allowNull: false,
  }
}, {
  tableName: 'Instituciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Instituciones;
