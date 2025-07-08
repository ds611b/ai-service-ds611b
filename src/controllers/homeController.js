/**
 * Controlador para la ruta raíz "/".
 *
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 * @returns {Promise<Object>} 
 */
const home = async (request, reply) => {
  return { message: '¡Hola Mundo Fastify!' };
};

/**
 * Controlador para la ruta "/saludo".
 *
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 * @returns {Promise<Object>} 
 */
const saludo = async (request, reply) => {
  return {
    message: 'Bienvenido a mi API escalable con arquitectura limpia'
  };
};

export default { home, saludo };
