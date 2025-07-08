import homeController from "../controllers/homeController.js";


async function homeRoutes(fastify, options) {
  fastify.get('/', {
    schema: {
      description: 'Endpoint de inicio',
      tags: ['Home'],
      response: {
        200: {
          description: 'Respuesta exitosa',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, homeController.home);

  fastify.get('/saludo', {
    schema: {
      description: 'Endpoint de saludo',
      tags: ['Home'],
      response: {
        200: {
          description: 'Respuesta exitosa',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, homeController.saludo);
}

export default homeRoutes;