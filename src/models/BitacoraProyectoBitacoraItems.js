import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import BitacoraProyecto from './BitacoraProyecto.js';
import BitacoraItems from './BitacoraItems.js';

const DetalleBitacoraProyectoBitacoraItems = sequelize.define('BitacoraProyectoBitacoraItems', {
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
  id_bitacora_item: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: BitacoraItems,
      key: 'id'
    }
  },
}, {
  tableName: 'DetalleBitacoraProyectoBitacoraItems',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['id_bitacora', 'id_bitacora_item'] 
    }
  ]
});

export default DetalleBitacoraProyectoBitacoraItems;