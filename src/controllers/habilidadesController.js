import { Habilidades } from '../models/index.js'
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas las habilidades.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getHabilidades(request, reply) {
  try {
    const habilidades = await Habilidades.findAll();
    reply.send(habilidades);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las habilidades',
      'GET_HABILIDADES_ERROR',
      error
    ));
  }
}

/**
 * Obtiene una habilidad por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getHabilidadById(request, reply) {
  const { id } = request.params;
  try {
    const habilidad = await Habilidades.findByPk(id);
    if (habilidad) {
      reply.send(habilidad);
    } else {
      reply.status(404).send(createErrorResponse(
        'Habilidad no encontrada',
        'HABILIDAD_NOT_FOUND'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la habilidad',
      'GET_HABILIDAD_ERROR',
      error
    ));
  }
}

/**
 * Crea una habilidad.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createHabilidad(request, reply) {
  try {
    const habilidad = await Habilidades.create(request.body);
    reply.status(201).send(habilidad);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'Ya existe una habilidad con esta descripción',
        'DUPLICATE_HABILIDAD',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear la habilidad',
        'CREATE_HABILIDAD_ERROR',
        error
      ));
    }
  }
}

/**
 * Actualiza una habilidad.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateHabilidad(request, reply) {
  const { id } = request.params;
  try {
    const [updated] = await Habilidades.update(request.body, {
      where: { id },
      validate: true
    });
    if (updated) {
      const habilidad = await Habilidades.findByPk(id);
      reply.send(habilidad);
    } else {
      reply.status(404).send(createErrorResponse(
        'Habilidad no encontrada',
        'HABILIDAD_NOT_FOUND'
      ));
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'No se puede actualizar: Ya existe otra habilidad con esta descripción',
        'HABILIDAD_DUPLICADA',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar la habilidad',
        'UPDATE_HABILIDAD_ERROR',
        error
      ));
    }
  }
}

/**
 * Elimina una habilidad.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteHabilidad(request, reply) {
  const { id } = request.params;
  try {
    const deleted = await Habilidades.destroy({ where: { id } });
    if (deleted) {
      reply.status(204).send();
    } else {
      reply.status(404).send(createErrorResponse(
        'Habilidad no encontrada',
        'HABILIDAD_NOT_FOUND'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar la habilidad',
      'DELETE_HABILIDAD_ERROR',
      error
    ));
  }
}
