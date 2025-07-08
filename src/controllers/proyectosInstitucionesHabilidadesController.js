import { ProyectosInstitucionesHabilidades, ProyectosInstitucion, Habilidades } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas las relaciones de habilidades por proyectos.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getProyectosInstitucionesHabilidades(request, reply) {
  try {
    const registros = await ProyectosInstitucionesHabilidades.findAll({
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto'
        },
        {
          model: Habilidades,
          as: 'habilidades'
        }
      ]
    });
    reply.send(registros);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las relaciones de habilidades',
      'GET_PROYECTOS_INSTITUCIONES_HABILIDADES_ERROR',
      error
    ));
  }
}

/**
 * Obtiene una relación de habilidades por proyecto by ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getProyectosInstitucionesHabilidadById(request, reply) {
  const { id } = request.params;
  try {
    const registro = await ProyectosInstitucionesHabilidades.findByPk(id, {
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto'
        },
        {
          model: Habilidades,
          as: 'habilidades'
        }
      ]
    });
    if (registro) {
      reply.send(registro);
    } else {
      reply.status(404).send(createErrorResponse(
        'Relación no encontrada',
        'RELACION_NOT_FOUND_ERROR'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la relación',
      'GET_PROYECTOS_INSTITUCIONES_HABILIDADES_ERROR',
      error
    ));
  }
}

/**
 * Crea una nueva relación habilidad por proyecto.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createProyectosInstitucionesHabilidad(request, reply) {
  try {
    const registroCreado = await ProyectosInstitucionesHabilidades.create(request.body);

    const registroConAsociaciones = await ProyectosInstitucionesHabilidades.findByPk(registroCreado.id, {
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto'
        },
        {
          model: Habilidades,
          as: 'habilidades'
        }
      ]
    });
    if (registroConAsociaciones) {
      reply.status(201).send(registroConAsociaciones);
    } else {
      request.log.error(`Registro creado con ID ${registroCreado.id} pero no encontrado con asociaciones.`);
      reply.status(500).send(createErrorResponse(
        'Error al recuperar el registro con sus relaciones después de crearlo',
        'NO_OBTENIDO_CREADO_ERROR'
      ));
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'La combinación proyecto-habilidad ya existe',
        'RELACION_DUPLICADA_ERROR',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear la relación',
        'CREATE_PROYECTOS_INSTITUCIONES_HABILIDADES_ERROR',
        error
      ));
    }
  }
}

/**
 * Actualiza relación habilidad por proyecto.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateProyectosInstitucionesHabilidad(request, reply) {
  const { id } = request.params;
  try {
    const [updated] = await ProyectosInstitucionesHabilidades.update(request.body, {
      where: { id },
      validate: true
    });

    if (updated) {
      const registro = await ProyectosInstitucionesHabilidades.findByPk(id, {
        include: [
          {
            model: ProyectosInstitucion,
            as: 'proyecto'
          },
          {
            model: Habilidades,
            as: 'habilidades'
          }
        ]
      });
      reply.send(registro);
    } else {
      reply.status(404).send(createErrorResponse(
        'Relación no encontrada',
        'RELACION_NOT_FOUND_ERROR'
      ));
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'No se puede actualizar: La nueva combinación proyecto-habilidad ya existe',
        'RELACION_DUPLICADA_ERROR',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar la relación',
        'UPDATE_PROYECTOS_INSTITUCIONES_HABILIDADES_ERROR',
        error
      ));
    }
  }
}

/**
 * Elimina la relación habilidad por proyecto.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteProyectosInstitucionesHabilidad(request, reply) {
  const { id } = request.params;
  try {
    const deleted = await ProyectosInstitucionesHabilidades.destroy({ where: { id } });
    if (deleted) {
      reply.status(204).send();
    } else {
      reply.status(404).send(createErrorResponse(
        'Relación no encontrada',
        'RELACION_NOT_FOUND_ERROR'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar la relación',
      'DELETE_PROYECTOS_INSTITUCIONES_HABILIDADES_ERROR',
      error
    ));
  }
}