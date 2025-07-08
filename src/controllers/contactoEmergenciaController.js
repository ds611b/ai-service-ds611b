import { ContactoEmergencia, PerfilUsuario } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

export async function getContactosEmergencia(request, reply) {
  try {
    const contactos = await ContactoEmergencia.findAll({
      include: [{
        model: PerfilUsuario,
        as: 'PerfilUsuario',
        attributes: ['id', 'usuario_id']
      }]
    });
    reply.send(contactos);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener contactos de emergencia',
      'GET_CONTACTOS_ERROR',
      error
    ));
  }
}

export async function getContactoEmergenciaById(request, reply) {
  try {
    const contacto = await ContactoEmergencia.findByPk(request.params.id, {
      include: [{
        model: PerfilUsuario,
        as: 'PerfilUsuario',
        attributes: ['id', 'usuario_id']
      }]
    });

    if (!contacto) {
      return reply.status(404).send(createErrorResponse(
        'Contacto de emergencia no encontrado',
        'CONTACTO_NOT_FOUND'
      ));
    }

    reply.send(contacto);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener contacto de emergencia',
      'GET_CONTACTO_ERROR',
      error
    ));
  }
}

export async function createContactoEmergencia(request, reply) {
  try {
    const contacto = await ContactoEmergencia.create(request.body);
    
    const contactoConRelaciones = await ContactoEmergencia.findByPk(contacto.id, {
      include: [{
        model: PerfilUsuario,
        as: 'PerfilUsuario',
        attributes: ['id', 'usuario_id']
      }]
    });

    reply.status(201).send(contactoConRelaciones);
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      reply.status(400).send(createErrorResponse(
        'El perfil de usuario especificado no existe',
        'PERFIL_NOT_FOUND',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear contacto de emergencia',
        'CREATE_CONTACTO_ERROR',
        error
      ));
    }
  }
}

export async function updateContactoEmergencia(request, reply) {
  try {
    const contacto = await ContactoEmergencia.findByPk(request.params.id);
    
    if (!contacto) {
      return reply.status(404).send(createErrorResponse(
        'Contacto de emergencia no encontrado',
        'CONTACTO_NOT_FOUND'
      ));
    }

    await contacto.update(request.body);
    
    const contactoActualizado = await ContactoEmergencia.findByPk(contacto.id, {
      include: [{
        model: PerfilUsuario,
        as: 'PerfilUsuario',
        attributes: ['id', 'usuario_id']
      }]
    });

    reply.send(contactoActualizado);
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      reply.status(400).send(createErrorResponse(
        'El perfil de usuario especificado no existe',
        'PERFIL_NOT_FOUND',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar contacto de emergencia',
        'UPDATE_CONTACTO_ERROR',
        error
      ));
    }
  }
}

export async function deleteContactoEmergencia(request, reply) {
  try {
    const contacto = await ContactoEmergencia.findByPk(request.params.id);
    
    if (!contacto) {
      return reply.status(404).send(createErrorResponse(
        'Contacto de emergencia no encontrado',
        'CONTACTO_NOT_FOUND'
      ));
    }

    await contacto.destroy();
    reply.status(204).send();
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar contacto de emergencia',
      'DELETE_CONTACTO_ERROR',
      error
    ));
  }
}