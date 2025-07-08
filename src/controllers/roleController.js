import { Roles } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas los roles.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getRoles(request, reply) {
  try {
    const roles = await Roles.findAll();
    reply.send(roles);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al obtener los roles', 'GET_ROLES_ERROR', error));
  }
}

/**
 * Obtiene un rol por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getRoleById(request, reply) {
  const { id } = request.params;
  try {
    const role = await Roles.findByPk(id);
    if (role) {
      reply.send(role);
    } else {
      reply.status(404).send(createErrorResponse('Rol no encontrado', 'ROLE_NOT_FOUND'));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al obtener el rol', 'GET_ROLE_ERROR', error));
  }
}

/**
 * Crea un nuevo rol.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createRole(request, reply) {
  const { nombre, descripcion } = request.body;
  try {
    const newRole = await Roles.create({ nombre, descripcion });
    reply.status(201).send(newRole);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al crear el rol', 'CREATE_ROLE_ERROR', error));
  }
}

/**
 * Actualiza un rol.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateRole(request, reply) {
  const { id } = request.params;
  const { nombre, descripcion } = request.body;
  try {
    const role = await Roles.findByPk(id);
    if (role) {
      role.nombre = nombre;
      role.descripcion = descripcion;
      await role.save();
      reply.send(role);
    } else {
      reply.status(404).send(createErrorResponse('Rol no encontrado', 'ROLE_NOT_FOUND'));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al actualizar el rol', 'UPDATE_ROLE_ERROR', error));
  }
}

/**
 * Elimina un rol por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteRole(request, reply) {
  const { id } = request.params;
  try {
    const role = await Roles.findByPk(id);
    if (role) {
      await role.destroy();
      reply.status(204).send();
    } else {
      reply.status(404).send(createErrorResponse('Rol no encontrado', 'ROLE_NOT_FOUND'));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al eliminar el rol', 'DELETE_ROLE_ERROR', error));
  }
}
