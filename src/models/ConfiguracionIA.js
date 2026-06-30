import { DataTypes } from 'sequelize';
import sequelize from './db.js';

/**
 * Configuración global de las funciones de IA (tabla de una sola fila, id = 1).
 * En este servicio se usa solo para LECTURA: decidir si el chatbot y las
 * recomendaciones están activos. La escritura la hace el backend-admin
 * (Coordinador General). Ambos servicios comparten la misma BD.
 */
const ConfiguracionIA = sequelize.define('ConfiguracionIA', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  chatbot_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  recomendaciones_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  extraccion_habilidades_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  actualizado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ConfiguracionIA',
  timestamps: false
});

export default ConfiguracionIA;
