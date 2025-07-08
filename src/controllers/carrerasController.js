import { Carreras, Escuelas } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas las carreras con información de su escuela asociada
 */
export async function getCarreras(request, reply) {
  try {
    const carreras = await Carreras.findAll({
      include: [{
        model: Escuelas,
        as: 'Escuela',
        attributes: ['id', 'nombre']
      }],
      order: [['nombre', 'ASC']]
    });
    reply.send(carreras);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener el listado de carreras',
      'GET_CARRERAS_ERROR',
      error
    ));
  }
}

/**
 * Obtiene una carrera específica por ID con su escuela
 */
export async function getCarreraById(request, reply) {
  const { id } = request.params;
  try {
    const carrera = await Carreras.findByPk(id, {
      include: [{
        model: Escuelas,
        as: 'Escuela',
        attributes: ['id', 'nombre']
      }]
    });

    if (!carrera) {
      return reply.status(404).send(createErrorResponse(
        'Carrera no encontrada',
        'CARRERA_NOT_FOUND'
      ));
    }
    reply.send(carrera);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la información de la carrera',
      'GET_CARRERA_ERROR',
      error
    ));
  }
}

/**
 * Crea una nueva carrera
 */
export async function createCarrera(request, reply) {
  const { nombre, id_escuela } = request.body;
  
  try {
    // Verificar si la escuela existe
    const escuela = await Escuelas.findByPk(id_escuela);
    if (!escuela) {
      return reply.status(400).send(createErrorResponse(
        'La escuela especificada no existe',
        'ESCUELA_NOT_FOUND'
      ));
    }

    const nuevaCarrera = await Carreras.create({
      nombre,
      id_escuela,
    });

    // Obtener la carrera recién creada con la relación de escuela
    const carreraCreada = await Carreras.findByPk(nuevaCarrera.id, {
      include: [{
        model: Escuelas,
        as: 'Escuela',
        attributes: ['id', 'nombre']
      }]
    });

    reply.status(201).send(carreraCreada);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'Ya existe una carrera con este nombre en la escuela especificada',
        'DUPLICATE_CARRERA',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear la carrera',
        'CREATE_CARRERA_ERROR',
        error
      ));
    }
  }
}

/**
 * Actualiza una carrera existente
 */
export async function updateCarrera(request, reply) {
  const { id } = request.params;
  const { nombre, id_escuela } = request.body;

  try {
    const carrera = await Carreras.findByPk(id);
    if (!carrera) {
      return reply.status(404).send(createErrorResponse(
        'Carrera no encontrada',
        'CARRERA_NOT_FOUND'
      ));
    }

    // Verificar si la nueva escuela existe
    if (id_escuela) {
      const escuela = await Escuelas.findByPk(id_escuela);
      if (!escuela) {
        return reply.status(400).send(createErrorResponse(
          'La escuela especificada no existe',
          'ESCUELA_NOT_FOUND'
        ));
      }
    }

    await carrera.update({
      nombre: nombre || carrera.nombre,
      id_escuela: id_escuela || carrera.id_escuela
    });

    // Obtener la carrera actualizada con la relación de escuela
    const carreraActualizada = await Carreras.findByPk(id, {
      include: [{
        model: Escuelas,
        as: 'Escuela',
        attributes: ['id', 'nombre']
      }]
    });

    reply.send(carreraActualizada);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'No se puede actualizar: Ya existe una carrera con este nombre en la escuela especificada',
        'DUPLICATE_CARRERA',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar la carrera',
        'UPDATE_CARRERA_ERROR',
        error
      ));
    }
  }
}

/**
 * Elimina una carrera
 */
export async function deleteCarrera(request, reply) {
  const { id } = request.params;
  
  try {
    const carrera = await Carreras.findByPk(id);
    if (!carrera) {
      return reply.status(404).send(createErrorResponse(
        'Carrera no encontrada',
        'CARRERA_NOT_FOUND'
      ));
    }

    await carrera.destroy();
    reply.status(204).send();
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      reply.status(400).send(createErrorResponse(
        'No se puede eliminar: Existen registros asociados a esta carrera',
        'CARRERA_HAS_RELATIONS',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al eliminar la carrera',
        'DELETE_CARRERA_ERROR',
        error
      ));
    }
  }
}

export default {
  getCarreras,
  getCarreraById,
  createCarrera,
  updateCarrera,
  deleteCarrera
};