import { EncargadoInstitucion } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todos los encargados de institución
 */
export async function getEncargadosInstitucion(request, reply) {
  try {
    const encargados = await EncargadoInstitucion.findAll({
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });
    reply.send(encargados);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener el listado de encargados de institución',
      'GET_ENCARGADOS_ERROR',
      error
    ));
  }
}

/**
 * Obtiene un encargado de institución específico por ID
 */
export async function getEncargadoInstitucionById(request, reply) {
  const { id } = request.params;
  try {
    const encargado = await EncargadoInstitucion.findByPk(id);

    if (!encargado) {
      return reply.status(404).send(createErrorResponse(
        'Encargado de institución no encontrado',
        'ENCARGADO_NOT_FOUND'
      ));
    }
    reply.send(encargado);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la información del encargado de institución',
      'GET_ENCARGADO_ERROR',
      error
    ));
  }
}

/**
 * Crea un nuevo encargado de institución
 */
export async function createEncargadoInstitucion(request, reply) {
  const { nombres, apellidos, correo, telefono } = request.body;
  
  try {
    const nuevoEncargado = await EncargadoInstitucion.create({
      nombres,
      apellidos,
      correo,
      telefono
    });

    reply.status(201).send(nuevoEncargado);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'El correo electrónico ya está registrado',
        'DUPLICATE_EMAIL',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear el encargado de institución',
        'CREATE_ENCARGADO_ERROR',
        error
      ));
    }
  }
}

/**
 * Actualiza un encargado de institución existente
 */
export async function updateEncargadoInstitucion(request, reply) {
  const { id } = request.params;
  const { nombres, apellidos, correo, telefono } = request.body;

  try {
    const encargado = await EncargadoInstitucion.findByPk(id);
    if (!encargado) {
      return reply.status(404).send(createErrorResponse(
        'Encargado de institución no encontrado',
        'ENCARGADO_NOT_FOUND'
      ));
    }

    await encargado.update({
      nombres: nombres || encargado.nombres,
      apellidos: apellidos || encargado.apellidos,
      correo: correo || encargado.correo,
      telefono: telefono || encargado.telefono
    });

    reply.send(encargado);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'No se puede actualizar: El correo electrónico ya está registrado',
        'DUPLICATE_EMAIL',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar el encargado de institución',
        'UPDATE_ENCARGADO_ERROR',
        error
      ));
    }
  }
}

/**
 * Elimina un encargado de institución
 */
export async function deleteEncargadoInstitucion(request, reply) {
  const { id } = request.params;
  
  try {
    const encargado = await EncargadoInstitucion.findByPk(id);
    if (!encargado) {
      return reply.status(404).send(createErrorResponse(
        'Encargado de institución no encontrado',
        'ENCARGADO_NOT_FOUND'
      ));
    }

    await encargado.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar el encargado de institución',
      'DELETE_ENCARGADO_ERROR',
      error
    ));
  }
}

export default {
  getEncargadosInstitucion,
  getEncargadoInstitucionById,
  createEncargadoInstitucion,
  updateEncargadoInstitucion,
  deleteEncargadoInstitucion
};