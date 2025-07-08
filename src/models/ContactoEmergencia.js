import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import PerfilUsuario from './PerfilUsuario.js'; 

const ContactoEmergencia = sequelize.define('ContactoEmergencia', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombres: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  apellidos: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(14),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  id_perfil_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: PerfilUsuario,
      key: 'id'
    }
  },
}, {
  tableName: 'ContactoEmergencia',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ContactoEmergencia;