import { CoordinadoresCarrera, Carreras, Escuelas } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todos los coordinadores con información de su carrera asociada
 */
export async function getCoordinadores(request, reply) {
  try {
    const coordinadores = await CoordinadoresCarrera.findAll({
      include: [{
        model: Carreras,
        as: 'Carrera',
        attributes: ['id', 'nombre'],
        include: [{
          model: Escuelas,
          as: 'Escuela',
          attributes: ['id', 'nombre']
        }]
      }],
      order: [['apellidos', 'ASC'], ['nombres', 'ASC']]
    });
    reply.send(coordinadores);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener el listado de coordinadores',
      'GET_COORDINADORES_ERROR',
      error
    ));
  }
}

/**
 * Obtiene un coordinador específico por ID con su carrera y escuela
 */
export async function getCoordinadorById(request, reply) {
  const { id } = request.params;
  try {
    const coordinador = await CoordinadoresCarrera.findByPk(id, {
      include: [{
        model: Carreras,
        as: 'Carrera',
        attributes: ['id', 'nombre'],
        include: [{
          model: Escuelas,
          as: 'Escuela',
          attributes: ['id', 'nombre']
        }]
      }]
    });

    if (!coordinador) {
      return reply.status(404).send(createErrorResponse(
        'Coordinador no encontrado',
        'COORDINADOR_NOT_FOUND'
      ));
    }
    reply.send(coordinador);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la información del coordinador',
      'GET_COORDINADOR_ERROR',
      error
    ));
  }
}

/**
 * Crea un nuevo coordinador
 */
export async function createCoordinador(request, reply) {
  const { nombres, apellidos, correo_institucional, telefono, id_carrera } = request.body;
  
  try {
    // Validar que la carrera exista
    const carrera = await Carreras.findByPk(id_carrera);
    if (!carrera) {
      return reply.status(400).send(createErrorResponse(
        'La carrera especificada no existe',
        'CARRERA_NOT_FOUND'
      ));
    }

    // Validar email único
    const existeEmail = await CoordinadoresCarrera.findOne({ where: { correo_institucional } });
    if (existeEmail) {
      return reply.status(409).send(createErrorResponse(
        'El correo institucional ya está registrado',
        'DUPLICATE_EMAIL'
      ));
    }

    const nuevoCoordinador = await CoordinadoresCarrera.create({
      nombres,
      apellidos,
      correo_institucional,
      telefono,
      id_carrera
    });

    // Obtener el coordinador recién creado con relaciones
    const coordinadorCreado = await CoordinadoresCarrera.findByPk(nuevoCoordinador.id, {
      include: [{
        model: Carreras,
        as: 'Carrera',
        include: [{
          model: Escuelas,
          as: 'Escuela'
        }]
      }]
    });

    reply.status(201).send(coordinadorCreado);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al crear el coordinador',
      'CREATE_COORDINADOR_ERROR',
      error
    ));
  }
}

/**
 * Actualiza un coordinador existente
 */
export async function updateCoordinador(request, reply) {
  const { id } = request.params;
  const { nombres, apellidos, correo_institucional, telefono, id_carrera } = request.body;

  try {
    const coordinador = await CoordinadoresCarrera.findByPk(id);
    if (!coordinador) {
      return reply.status(404).send(createErrorResponse(
        'Coordinador no encontrado',
        'COORDINADOR_NOT_FOUND'
      ));
    }

    // Validar carrera si se está actualizando
    if (id_carrera) {
      const carrera = await Carreras.findByPk(id_carrera);
      if (!carrera) {
        return reply.status(400).send(createErrorResponse(
          'La carrera especificada no existe',
          'CARRERA_NOT_FOUND'
        ));
      }
    }

    // Validar email único si se está actualizando
    if (correo_institucional && correo_institucional !== coordinador.correo_institucional) {
      const existeEmail = await CoordinadoresCarrera.findOne({ 
        where: { correo_institucional } 
      });
      if (existeEmail) {
        return reply.status(409).send(createErrorResponse(
          'El correo institucional ya está registrado',
          'DUPLICATE_EMAIL'
        ));
      }
    }

    await coordinador.update({
      nombres: nombres || coordinador.nombres,
      apellidos: apellidos || coordinador.apellidos,
      correo_institucional: correo_institucional || coordinador.correo_institucional,
      telefono: telefono || coordinador.telefono,
      id_carrera: id_carrera || coordinador.id_carrera
    });

    // Obtener coordinador actualizado con relaciones
    const coordinadorActualizado = await CoordinadoresCarrera.findByPk(id, {
      include: [{
        model: Carreras,
        as: 'Carrera',
        include: [{
          model: Escuelas,
          as: 'Escuela'
        }]
      }]
    });

    reply.send(coordinadorActualizado);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al actualizar el coordinador',
      'UPDATE_COORDINADOR_ERROR',
      error
    ));
  }
}

/**
 * Elimina un coordinador
 */
export async function deleteCoordinador(request, reply) {
  const { id } = request.params;
  
  try {
    const coordinador = await CoordinadoresCarrera.findByPk(id);
    if (!coordinador) {
      return reply.status(404).send(createErrorResponse(
        'Coordinador no encontrado',
        'COORDINADOR_NOT_FOUND'
      ));
    }

    await coordinador.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar el coordinador',
      'DELETE_COORDINADOR_ERROR',
      error
    ));
  }
}

export default {
  getCoordinadores,
  getCoordinadorById,
  createCoordinador,
  updateCoordinador,
  deleteCoordinador
};