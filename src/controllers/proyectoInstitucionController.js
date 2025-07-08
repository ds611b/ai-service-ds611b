import { ProyectosInstitucion, Instituciones } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todos los proyectos de instituciones.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getProyectosInstitucion(request, reply) {
  try {
    const proyectos = await ProyectosInstitucion.findAll({
      include: { model: Instituciones, as: 'institucion' }
    });
    reply.send(proyectos);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener los proyectos de instituciones',
      'GET_PROYECTOS_INSTITUCION_ERROR',
      error
    ));
  }
}

/**
 * Obtiene un proyecto de institución por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getProyectoInstitucionById(request, reply) {
  const { id } = request.params;
  try {
    const proyecto = await ProyectosInstitucion.findByPk(id, {
      include: {
        model: Instituciones,
        as: 'institucion'
      },
    });
    if (!proyecto) {
      return reply.status(404).send(createErrorResponse(
        'Proyecto de institución no encontrado',
        'PROYECTO_INSTITUCION_NOT_FOUND'
      ));
    }
    reply.send(proyecto);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al obtener el proyecto de institución', 'GET_PROYECTO_INSTITUCION_ERROR', error));
  }
}

/**
 * Crea un nuevo proyecto por Institución.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createProyectoInstitucion(request, reply) {
  const { institucion_id, nombre, descripcion, fecha_inicio, fecha_fin, modalidad, direccion, disponibilidad } = request.body;
  try {
    const nuevoProyecto = await ProyectosInstitucion.create({
      institucion_id,
      nombre,
      descripcion,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      modalidad,
      direccion,
      disponibilidad
    });
    const proyectoActualizado = await ProyectosInstitucion.findByPk(nuevoProyecto.id, {
      include: {
        model: Instituciones,
        as: 'institucion'
      },
    });
    reply.status(201).send(proyectoActualizado);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al crear el proyecto de institución',
      'CREATE_PROYECTO_INSTITUCION_ERROR',
      error
    ));
  }
}

/**
 * Actualiza un proyecto de institución existente.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateProyectoInstitucion(request, reply) {
  const { id } = request.params;
  const { institucion_id, nombre, descripcion, fecha_inicio, fecha_fin, modalidad, direccion, disponibilidad, estado } = request.body;
  try {
    const proyecto = await ProyectosInstitucion.findByPk(id);
    if (!proyecto) {
      return reply.status(404).send(createErrorResponse('Proyecto de institución no encontrado', 'PROYECTO_INSTITUCION_NOT_FOUND'));
    }
    await proyecto.update({
      institucion_id,
      nombre,
      descripcion,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      modalidad,
      direccion,
      disponibilidad,
      estado
    });
    const proyectoActualizado = await ProyectosInstitucion.findByPk(id, {
      include: {
        model: Instituciones,
        as: 'institucion',
      }
    });
    reply.send(proyectoActualizado);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al actualizar el proyecto de institución', 'UPDATE_PROYECTO_INSTITUCION_ERROR', error));
  }
}

/**
 * Elimina un proyecto de institución por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteProyectoInstitucion(request, reply) {
  const { id } = request.params;
  try {
    const proyecto = await ProyectosInstitucion.findByPk(id, {
      include: {
        model: Instituciones,
        as: 'institucion'
      },
    });
    if (!proyecto) {
      return reply.status(404).send(createErrorResponse('Proyecto de institución no encontrado', 'PROYECTO_INSTITUCION_NOT_FOUND'));
    }
    await proyecto.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse('Error al eliminar el proyecto de institución', 'DELETE_PROYECTO_INSTITUCION_ERROR', error));
  }
}
/**
 * Obtiene todos los proyectos de institución filtrados por estado.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
/**
 * Obtiene todos los proyectos de institución filtrados por estado y disponibilidad.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getProyectoInstitucionByEstado(request, reply) {
  const { estado, disponibilidad } = request.params;

  try {
    const whereClause = { estado };

    if (disponibilidad) {
      whereClause.disponibilidad = disponibilidad === 'true' ? true : false;
    }

    const proyectos = await ProyectosInstitucion.findAll({
      where: whereClause,
      include: {
        model: Instituciones,
        as: 'institucion'
      }
    });

    if (!proyectos || proyectos.length === 0) {
      return reply.status(404).send(createErrorResponse(
        'No se encontraron proyectos con los criterios especificados',
        'PROYECTOS_INSTITUCION_NOT_FOUND'
      ));
    }

    reply.send(proyectos);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener proyectos por estado/disponibilidad',
      'GET_PROYECTOS_INSTITUCION_ERROR',
      error
    ));
  }
}