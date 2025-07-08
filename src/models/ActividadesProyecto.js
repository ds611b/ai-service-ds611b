import { DataTypes } from 'sequelize';
import sequelize from './db.js';
import ProyectosInstitucion from './ProyectosInstitucion.js'; // Import the related model

const ActividadesProyecto = sequelize.define('ActividadesProyecto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  actividad_a_realizar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  objetivo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  meta: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  duracion: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  id_proyecto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ProyectosInstitucion,
      key: 'id'
    }
  },
}, {
  tableName: 'ActividadesProyecto',
  timestamps: false 
});


export default ActividadesProyecto;