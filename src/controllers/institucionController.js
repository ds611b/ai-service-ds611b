import { Instituciones } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas las instituciones.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getInstituciones(request, reply) {
  try {
    const instituciones = await Instituciones.findAll();
    reply.send(instituciones);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las instituciones', 
      'GET_INSTITUCIONES_ERROR', 
      error
    ));
  }
}

/**
 * Obtiene una institución por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getInstitucionById(request, reply) {
  const { id } = request.params;
  try {
    const institucion = await Instituciones.findByPk(id);
    if (!institucion) {
      return reply.status(404).send(createErrorResponse(
        'Institución no encontrada', 
        'INSTITUCION_NOT_FOUND'
      ));
    }
    reply.send(institucion);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al obtener la institución', 'GET_INSTITUCION_ERROR', error));
  }
}

/**
 * Crea una nueva institución.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createInstitucion(request, reply) {
  const { nombre, direccion, telefono, email, fecha_fundacion, nit } = request.body;
  try {
    const nuevaInstitucion = await Instituciones.create({
      nombre,
      direccion,
      telefono,
      email,
      fecha_fundacion: fecha_fundacion ? new Date(fecha_fundacion) : null,
      nit
    });
    reply.status(201).send(nuevaInstitucion);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al crear la institución', 'CREATE_INSTITUCION_ERROR', error));
  }
}

/**
 * Actualiza una institución existente.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateInstitucion(request, reply) {
  const { id } = request.params;
  const { nombre, direccion, telefono, email, fecha_fundacion, nit, estado } = request.body;
  try {
    const institucion = await Instituciones.findByPk(id);
    if (!institucion) {
      return reply.status(404).send(createErrorResponse('Institución no encontrada', 'INSTITUCION_NOT_FOUND'));
    }
    await institucion.update({
      nombre,
      direccion,
      telefono,
      email,
      fecha_fundacion: fecha_fundacion ? new Date(fecha_fundacion) : null,
      nit,
      estado
    });
    reply.send(institucion);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al actualizar la institución', 'UPDATE_INSTITUCION_ERROR', error));
  }
}

/**
 * Elimina una institución por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteInstitucion(request, reply) {
  const { id } = request.params;
  try {
    const institucion = await Instituciones.findByPk(id);
    if (!institucion) {
      return reply.status(404).send(createErrorResponse('Institución no encontrada', 'INSTITUCION_NOT_FOUND'));
    }
    await institucion.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al eliminar la institución', 'DELETE_INSTITUCION_ERROR', error));
  }
}
