import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

// Instancia de Pino
const logger = pino({
  level: 'info',
});

// Función para Sequelize
const sequelizeLogger = (msg) => {
  logger.info(`[SEQUELIZE] ${msg}`);
};

/**
 * Instancia de Sequelize para la conexión a la base de datos.
 * @type {Sequelize}
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql', // Usamos MySQL como dialecto
    logging: sequelizeLogger,   // Cambia a true para ver las consultas SQL
  }
);

export default sequelize;
