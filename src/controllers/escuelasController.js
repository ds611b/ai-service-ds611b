import { Escuelas } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

export async function getEscuelas(request, reply) {
  try {
    const escuelas = await Escuelas.findAll();
    reply.send(escuelas);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las escuelas', 
      'GET_ESCUELAS_ERROR', 
      error
    ));
  }
}

export async function getEscuelaById(request, reply) {
  const { id } = request.params;
  try {
    const escuela = await Escuelas.findByPk(id);
    if (!escuela) {
      return reply.status(404).send(createErrorResponse(
        'Escuela no encontrada', 
        'ESCUELA_NOT_FOUND'
      ));
    }
    reply.send(escuela);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la escuela', 
      'GET_ESCUELA_ERROR', 
      error
    ));
  }
}

export async function createEscuela(request, reply) {
  const { nombre } = request.body;
  try {
    const nuevaEscuela = await Escuelas.create({ nombre });
    reply.status(201).send(nuevaEscuela);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al crear la escuela', 
      'CREATE_ESCUELA_ERROR', 
      error
    ));
  }
}

export async function updateEscuela(request, reply) {
  const { id } = request.params;
  const { nombre } = request.body;
  try {
    const escuela = await Escuelas.findByPk(id);
    if (!escuela) {
      return reply.status(404).send(createErrorResponse(
        'Escuela no encontrada', 
        'ESCUELA_NOT_FOUND'
      ));
    }
    await escuela.update({ nombre });
    reply.send(escuela);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al actualizar la escuela', 
      'UPDATE_ESCUELA_ERROR', 
      error
    ));
  }
}

export async function deleteEscuela(request, reply) {
  const { id } = request.params;
  try {
    const escuela = await Escuelas.findByPk(id);
    if (!escuela) {
      return reply.status(404).send(createErrorResponse(
        'Escuela no encontrada', 
        'ESCUELA_NOT_FOUND'
      ));
    }
    await escuela.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar la escuela', 
      'DELETE_ESCUELA_ERROR', 
      error
    ));
  }
}