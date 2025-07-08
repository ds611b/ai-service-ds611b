import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import BitacoraProyecto from './BitacoraProyecto.js';
import PerfilUsuario from './PerfilUsuario.js';

const DetalleBitacoraPerfilUsuario = sequelize.define('BitacoraPerfilUsuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_bitacora: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BitacoraProyecto,
      key: 'id'
    }
  },
  id_perfil_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PerfilUsuario,
      key: 'id'
    }
  },
}, {
  tableName: 'DetalleBitacoraPerfilUsuario',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});


export default DetalleBitacoraPerfilUsuario;