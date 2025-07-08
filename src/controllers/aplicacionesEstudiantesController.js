import { AplicacionesEstudiantes, ProyectosInstitucion, Usuarios, Instituciones } from '../models/index.js';
import { createErrorResponse } from '../utils/errorResponse.js';

/**
 * Obtiene todas las aplicaciones de estudiantes.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getAplicacionesEstudiantes(request, reply) {
  try {
    const aplicaciones = await AplicacionesEstudiantes.findAll({
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto'
        },
        {
          model: Usuarios,
          as: 'estudiante',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'email']
        }
      ]
    });
    reply.send(aplicaciones);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las aplicaciones de estudiantes',
      'GET_APLICACIONES_ERROR',
      error
    ));
  }
}

/**
 * Obtiene una aplicación por estudiante por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function getAplicacionEstudianteById(request, reply) {
  const { id } = request.params;
  try {
    const aplicacion = await AplicacionesEstudiantes.findByPk(id, {
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto',
          include: [
            {
              model: Instituciones,
              as: 'institucion'
            }
          ]
        },
        {
          model: Usuarios,
          as: 'estudiante',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'email']
        }
      ],
    });
    if (aplicacion) {
      reply.send(aplicacion);
    } else {
      reply.status(404).send(createErrorResponse(
        'Aplicación no encontrada',
        'APLICACION_NOT_FOUND'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener la aplicación de estudiante',
      'GET_APLICACION_ERROR',
      error
    ));
  }
}

/**
 * Obtiene todas las aplicaciones de un estudiante específico
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export async function getAplicacionesByEstudiante(request, reply) {
  const { estudianteId } = request.params;

  try {
    const aplicaciones = await AplicacionesEstudiantes.findAll({
      where: { estudiante_id: estudianteId },
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto',
          include: [  
            {
              model: Instituciones,
              as: 'institucion'
            }
          ]
        },
        {
          model: Usuarios,
          as: 'estudiante',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'email']
        }
      ],
      attributes: {
        exclude: ['created_at', 'updated_at']
      }
    });

    const proyectos = aplicaciones.map(app => ({
      ...app.proyecto.get({ plain: true })

    }));


    // Estructura la respuesta similar a tu ejemplo
    const response = aplicaciones.map(app => ({
      id: app.id,
      proyecto_id: app.proyecto_id,
      estado: app.estado,
      proyecto: {
        ...app.proyecto.get({ plain: true }),  // Todas las propiedades del proyecto
        institucion: app.proyecto.institucion ? app.proyecto.institucion.get({ plain: true }) : null
      },
      estudiante: app.estudiante.get({ plain: true }),
      created_at: app.created_at,
      updated_at: app.updated_at
    }));

    
    reply.send(response);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las aplicaciones del estudiante',
      'GET_STUDENT_APPLICATIONS_ERROR',
      error
    ));
  }
}

/**
 * Obtiene todas las aplicaciones para un proyecto específico
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export async function getAplicacionesByProyecto(request, reply) {
  const { proyectoId } = request.params;

  try {
    const aplicaciones = await AplicacionesEstudiantes.findAll({
      where: { proyecto_id: proyectoId },
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto',
          include: [  
            {
              model: Instituciones,
              as: 'institucion'
            }
          ]
        },
        {
          model: Usuarios,
          as: 'estudiante',
          attributes: ['id', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    if (aplicaciones.length === 0) {
      reply.status(404).send(createErrorResponse(
        'No se encontraron aplicaciones para este proyecto',
        'PROJECT_APPLICATIONS_NOT_FOUND'
      ));
      return;
    }
    const estudiantes = aplicaciones.map(app => ({
      ...app.estudiante.get({ plain: true }),
      aplicacion_id: app.id,
      estado: app.estado
    }));


    const response = {
      proyecto: {
        ...aplicaciones[0].proyecto.get({ plain: true }), 
        institucion: aplicaciones[0].proyecto.institucion?.get({ plain: true }) || null 
      },
      estudiantes: estudiantes,
      created_at: aplicaciones[0].created_at,
      updated_at: aplicaciones[0].updated_at
    };

    reply.send(response);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al obtener las aplicaciones del proyecto',
      'GET_PROJECT_APPLICATIONS_ERROR',
      error
    ));
  }
}

/**
 * Crea una aplicación por estudiante.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function createAplicacionEstudiante(request, reply) {
  try {
    const aplicacionCreada = await AplicacionesEstudiantes.create(request.body);

    const aplicacionAsociaciones = await AplicacionesEstudiantes.findByPk(aplicacionCreada.id, {
      include: [
        {
          model: ProyectosInstitucion,
          as: 'proyecto'
        },
        {
          model: Usuarios,
          as: 'estudiante'
        }
      ],
    });
    if (aplicacionAsociaciones) {
      reply.status(201).send(aplicacionAsociaciones);
    } else {
      request.log.error(`Registro creado con ID ${aplicacionCreada.id} pero no encontrado con asociaciones.`);
      reply.status(500).send(createErrorResponse(
        'Error al recuperar el registro con sus relaciones después de crearlo',
        'NO_OBTENIDO_CREADO_ERROR'
      ));
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'El estudiante ya tiene una aplicación activa para este proyecto',
        'DUPLICATE_APLICACION_ESTUDIANTE',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al crear la aplicación de estudiante',
        'CREATE_APLICACION_ERROR',
        error
      ));
    }
  }
}

/**
 * Actualiza una aplicación de estudiante.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function updateAplicacionEstudiante(request, reply) {
  const { id } = request.params;
  try {
    const [updated] = await AplicacionesEstudiantes.update(request.body, {
      where: { id },
      validate: true
    });
    if (updated) {
      const aplicacion = await AplicacionesEstudiantes.findByPk(id, {
        include: [
          {
            model: ProyectosInstitucion,
            as: 'proyecto'
          },
          {
            model: Usuarios,
            as: 'estudiante'
          }
        ],
      });
      reply.send(aplicacion);
    } else {
      reply.status(404).send(createErrorResponse(
        'Aplicación no encontrada',
        'APLICACION_NOT_FOUND'
      ));
    }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.status(409).send(createErrorResponse(
        'No se puede actualizar: La nueva combinación de estudiante y proyecto ya existe',
        'DUPLICATE_APLICACION_ESTUDIANTE',
        error
      ));
    } else {
      request.log.error(error);
      reply.status(500).send(createErrorResponse(
        'Error al actualizar la aplicación de estudiante',
        'UPDATE_APLICACION_ERROR',
        error
      ));
    }
  }
}

/**
 * Elimina una aplicación por estudiante por ID.
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export async function deleteAplicacionEstudiante(request, reply) {
  const { id } = request.params;
  try {
    const deleted = await AplicacionesEstudiantes.destroy({ where: { id } });
    if (deleted) {
      reply.status(204).send();
    } else {
      reply.status(404).send(createErrorResponse(
        'Aplicación no encontrada',
        'APLICACION_NOT_FOUND'
      ));
    }
  } catch (error) {
    request.log.error(error);
    reply.status(500).send(createErrorResponse(
      'Error al eliminar la aplicación de estudiante',
      'DELETE_APLICACION_ERROR',
      error
    ));
  }
}
