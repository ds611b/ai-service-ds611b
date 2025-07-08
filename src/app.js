import Fastify from 'fastify';
import config from './config/config.js';
import homeRoutes from './routes/homeRoutes.js';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import staticFiles from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from '@fastify/cors';
/**
 * Rutas de ADMIN
 */
import roleRoutes from './routes/roleRoutes.js';
import institucionRoutes from './routes/institucionRoutes.js';
import proyectoInstitucionRoutes from './routes/proyectoInstitucionRoutes.js';
import aplicacionesEstudiantesRoutes from './routes/aplicacionesEstudiantesRoutes.js';
import habilidadesRoutes from './routes/habilidadesRoutes.js';
import usuariosHabilidadesRoutes from './routes/usuariosHabilidadesRoutes.js';
import proyectosInstitucionesHabilidadesRoutes from './routes/proyectosInstitucionesHabilidadesRoutes.js';
import perfilUsuarioRoutes from './routes/perfilUsuarioRoutes.js';
import escuelasRoutes from './routes/escuelasRoutes.js';
import carrerasRoutes from './routes/carrerasRoutes.js';
import coordinadoresCarreraRoutes from './routes/coordinadoresCarreraRoutes.js';
import contactoEmergenciaRoutes from './routes/contactoEmergenciaRoutes.js';
import encargadoInstitucionRoutes from './routes/encargadoInstitucionRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import { getPerfilUsuarioById } from './controllers/perfilUsuarioController.js';


/**
 * Configuración para usar __dirname con ES modules.
 * Convierte la URL del archivo en una ruta de archivo y obtiene el directorio.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Inicializa una instancia de Fastify con opciones de configuración.
 * @type {FastifyInstance}
 */
const fastify = Fastify({ logger: true });

// Obtenemos las configuraciones desde el config.js
const { port, host, docsPath } = config;

/**
 * Se permiten todos los origenes en el CORS
 */
await fastify.register(cors, {
  origin: '*', // Permite todos los orígenes. Cámbialo por un dominio específico en producción.
});

/**
 * Configuración de OpenAPI 3.0 (antes Swagger).
 * Define la información básica de la API y las especificaciones.
 */
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'boilerplate-ds611b',
      description: 'API Documentation',
      version: '1.0.0'
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Encuentra más información aquí'
    },
    components: {}
  }
});

/**
 * Definiciones de esquemas con ejemplos para la documentación y serialización.
 */
fastify.addSchema({
  $id: 'Roles',
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    nombre: { type: 'string', example: 'Admin' },
    descripcion: { type: 'string', example: 'Administrador del sistema' }
  }
});

fastify.addSchema({
  $id: 'ErrorResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'ERR_ROLE_NOT_FOUND' },
        message: { type: 'string', example: 'Rol no encontrado' },
        details: { type: 'string', example: null }
      }
    }
  }
});

fastify.addSchema({
  $id: 'Instituciones',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    nombre: { type: 'string', example: 'Institución Ejemplo' },
    direccion: { type: 'string', example: 'Av. Siempre Viva 123' },
    telefono: { type: 'string', example: '555-1234' },
    email: { type: 'string', example: 'contacto@institucion.com' },
    fecha_fundacion: { type: 'string', format: 'date', example: '2000-01-01' },
    nit: { type: 'string', example: '1234567890' },
    estado: { type: 'string', example: 'Pendiente', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
    created_at: { type: 'string', example: '2023-01-01T12:00:00Z' },
    updated_at: { type: 'string', example: '2023-01-02T12:00:00Z' }
  }
});

fastify.addSchema({
  $id: 'ProyectosInstitucion',
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    institucion_id: { type: 'integer', example: 1 },
    nombre: { type: 'string', example: 'Proyecto de Modernización' },
    descripcion: { type: 'string', example: 'Implementación de nuevas tecnologías en la institución.' },
    fecha_inicio: { type: 'string', format: 'date', example: '2024-01-15' },
    fecha_fin: { type: 'string', format: 'date', example: '2024-12-31' },
    modalidad: { type: 'string', example: 'Presencial' },
    direccion: { type: 'string', example: 'Calle Principal #123' },
    disponibilidad: { type: 'boolean', example: true },
    estado: { type: 'string', example: 'Pendiente', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
    institucion: { $ref: 'Instituciones' },
    created_at: { type: 'string', example: '2024-03-30T10:00:00Z' },
    updated_at: { type: 'string', example: '2024-03-30T10:30:00Z' }
  }
});

fastify.addSchema({
  $id: 'AplicacionesEstudiantes',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    estudiante_id: { type: 'number', example: 123 },
    proyecto_id: { type: 'number', example: 456 },
    estado: { type: 'string', example: 'Pendiente', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
    created_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
    updated_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
  }
});

fastify.addSchema({
  $id: 'Usuario',
  type: 'object',
  properties: {
    primer_nombre: { type: 'string', maxLength: 100, example: 'Juan' },
    segundo_nombre: { type: 'string', maxLength: 100, example: 'Jose' },
    primer_apellido: { type: 'string', maxLength: 100, example: 'Pérez' },
    segundo_apellido: { type: 'string', maxLength: 100, example: 'Santos' },
    email: { type: 'string', maxLength: 150, format: 'email', example: 'juan.perez@example.com' },
    //password_hash: { type: 'string', maxLength: 255, example: '$2b$10$EIXaN/Z8g1234567890abcdefg' },
    rol_id: { type: 'integer', example: 2 }
  },
  required: ['primer_nombre', 'primer_apellido', 'email', 'password_hash', 'rol_id']
});

fastify.addSchema({
  $id: 'Estudiante',
  type: 'object',
  properties: {
    id: { type: 'number', example: 123 },
    primer_nombre: { type: 'string', maxLength: 100, example: 'Juan' },
    segundo_nombre: { type: 'string', maxLength: 100, example: 'Jose' },
    primer_apellido: { type: 'string', maxLength: 100, example: 'Pérez' },
    segundo_apellido: { type: 'string', maxLength: 100, example: 'Santos' },
    email: { type: 'string', maxLength: 150, format: 'email', example: 'juan.perez@example.com' }
  }
});


fastify.addSchema({
  $id: 'AplicacionesEstudiantesID',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    estudiante_id: { type: 'number', example: 123 },
    proyecto_id: { type: 'number', example: 456 },
    estado: { type: 'string', example: 'Pendiente', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
    proyecto: { $ref: 'ProyectosInstitucion' },
    estudiante: { $ref: 'Estudiante' },
    created_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
    updated_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
  }
});

fastify.addSchema({
  $id: 'AplicacionesEstudiantePorProyecto',
  type: 'object',
  properties: {
    proyecto_id: { type: 'integer', example: 2 },
    estado: {
      type: 'string',
      example: 'Pendiente',
      enum: ['Pendiente', 'Aprobado', 'Rechazado']
    },
    proyectos: {
      $ref: 'ProyectosInstitucion'
    },
    estudiante: {
      $ref: 'Estudiante'
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
});

fastify.addSchema({
  $id: 'AplicacionesEstudiante',
  type: 'object',
  properties: {
    proyecto_id: { type: 'integer', example: 2 },
    estado: {
      type: 'string',
      example: 'Pendiente',
      enum: ['Pendiente', 'Aprobado', 'Rechazado']
    },
    proyecto: {
      allOf: [
        { $ref: 'ProyectosInstitucion' },
        {
          type: 'object',
          properties: {
            institucion: { $ref: 'Institucion' }
          }
        }
      ]
    },
    estudiantes: {
      type: 'array',
      items: {
        type: 'object',
        allOf: [
          { $ref: 'Estudiante' },  // Hereda todas las propiedades del esquema Estudiante
          {
            type: 'object',
            properties: {
              aplicacion_id: { type: 'integer', example: 1 },
              estado: {
                type: 'string',
                enum: ['Pendiente', 'Aprobado', 'Rechazado'],
                example: 'Pendiente'
              }
            }
          }
        ]
      }
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
});


fastify.addSchema({
  $id: 'Habilidades',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    descripcion: { type: 'string', example: 'Comunicación' },
    created_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
    updated_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
  }
});

fastify.addSchema({
  $id: 'UsuariosHabilidades',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    usuario_id: { type: 'number', example: 101 },
    habilidad: { $ref: 'Habilidades' },
    //habilidad_id: { type: 'number', example: 202 },
    created_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
    updated_at: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
  }
});

fastify.addSchema({
  $id: 'ProyectosInstitucionesHabilidades',
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    proyecto_id: { type: 'number', example: 100 },
    habilidad_id: { type: 'number', example: 50 },
    proyecto: { $ref: 'ProyectosInstitucion' },
    habilidades: { $ref: 'Habilidades' },
    created_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' },
    updated_at: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' }
  }
});

fastify.addSchema({
  $id: 'PerfilUsuario',
  type: 'object',
  properties: {
    id: { type: 'integer', example: 1 },
    usuario_id: { type: 'integer', example: 101 },
    telefono: { type: 'string', example: '+5491123456789', nullable: true },
    direccion: { type: 'string', example: 'Calle Falsa 123', nullable: true },
    anio_academico: { type: 'string', example: '2', nullable: true },
    fecha_nacimiento: {
      type: 'string',
      format: 'date',
      example: '1990-01-01',
      nullable: true
    },
    genero: {
      type: 'string',
      example: 'Masculino',
      enum: ['Masculino', 'Femenino', 'Otro'],
      nullable: true
    },
    foto_perfil: {
      type: 'string',
      example: 'uploads/perfil.jpg',
      nullable: true
    },
    carnet: { type: 'string', example: '1234567', maxLength: 7 },
    carrera: { $ref: 'Carreras' },
    usuario: { $ref: 'Usuario' }, 
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2023-01-01T00:00:00Z'
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      example: '2023-01-01T00:00:00Z'
    },
    usuario: { $ref: 'Estudiante' } // Referencia al esquema Usuario
  }
});


/**
 * Esquemas de validación sin ejemplos
 * Estos esquemas se utilizarán para la validación en lugar de para la documentación
 */
fastify.addSchema({
  $id: 'RoleValidation',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombre: { type: 'string' },
    descripcion: { type: 'string' }
  }
});

fastify.addSchema({
  $id: 'ErrorResponseValidation',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'string' }
      }
    }
  }
});

fastify.addSchema({
  $id: 'InstitucionValidation',
  type: 'object',
  properties: {
    nombre: { type: 'string' },
    direccion: { type: 'string' },
    telefono: { type: 'string' },
    email: { type: 'string' },
    fecha_fundacion: { type: 'string', format: 'date' },
    nit: { type: 'string' },
    estado: { type: 'string', enum: ['Pendiente', 'Aprobado', 'Rechazado'] }
  }
});

fastify.addSchema({
  $id: 'ProyectoInstitucionValidation',
  type: 'object',
  properties: {
    institucion_id: { type: 'integer' },
    nombre: { type: 'string' },
    descripcion: { type: 'string' },
    fecha_inicio: { type: 'string', format: 'date' },
    fecha_fin: { type: 'string', format: 'date' },
    modalidad: { type: 'string', enum: ['Presencial', 'Virtual', 'Híbrida'] },
    direccion: { type: 'string' },
    disponibilidad: { type: 'boolean' },
    estado: { type: 'string', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
  },
  required: ['institucion_id', 'nombre', 'descripcion']
});

fastify.addSchema({
  $id: 'UsuarioValidation',
  allOf: [
    { $ref: 'Usuario' },
    {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 1 },
        created_at: { type: 'string', format: 'date-time', example: '2025-04-21T14:30:00Z' },
        updated_at: { type: 'string', format: 'date-time', example: '2025-04-21T15:00:00Z' }
      }
    }
  ]
});


fastify.addSchema({
  $id: 'AplicacionesEstudiantesValidation',
  type: 'object',
  properties: {
    estudiante_id: { type: 'number' },
    proyecto_id: { type: 'number' },
    estado: { type: 'string', enum: ['Pendiente', 'Aprobado', 'Rechazado'] },
  },
  required: ['estudiante_id', 'proyecto_id', 'estado']
});

fastify.addSchema({
  $id: 'HabilidadesValidation',
  type: 'object',
  properties: {
    descripcion: { type: 'string', maxLength: 50 }
  },
  required: ['descripcion']
});

fastify.addSchema({
  $id: 'UsuariosHabilidadesValidation',
  type: 'object',
  properties: {
    usuario_id: { type: 'number' },
    habilidad_id: { type: 'number' }
  },
  required: ['usuario_id', 'habilidad_id']
});

fastify.addSchema({
  $id: 'ProyectosInstitucionesHabilidadesValidation',
  type: 'object',
  properties: {
    proyecto_id: { type: 'number' },
    habilidad_id: { type: 'number' }
  },
  required: ['proyecto_id', 'habilidad_id'],
});

fastify.addSchema({
  $id: 'PerfilUsuarioValidation',
  type: 'object',
  properties: {
    usuario_id: { type: 'integer' },
    direccion: { type: 'string', nullable: true },
    fecha_nacimiento: {
      type: 'string',
      format: 'date',
      nullable: true
    },
    genero: {
      type: 'string',
      enum: ['Masculino', 'Femenino', 'Otro'],
      nullable: true
    },
    foto_perfil: { type: 'string', nullable: true },
    telefono: { type: 'string', maxLength: 20, nullable: true },
    anio_academico: { type: 'string', maxLength: 4, nullable: true },
    id_carrera: { type: 'integer', nullable: true }
  },
  required: ['usuario_id']
});

fastify.addSchema({
  $id: 'EscuelaValidation',
  type: 'object',
  properties: {
    nombre: {
      type: 'string',
      maxLength: 300,
      description: 'Nombre de la escuela académica'
    }
  },
  required: ['nombre']
});

fastify.addSchema({
  $id: 'Escuelas',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombre: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
});
fastify.addSchema({
  $id: 'CarreraValidation',
  type: 'object',
  properties: {
    nombre: {
      type: 'string',
      description: 'Nombre de la carrera'
    },
    id_escuela: {
      type: 'integer',
      description: 'ID de la escuela a la que pertenece la carrera'
    }
  },
  required: ['nombre', 'id_escuela']
});

fastify.addSchema({
  $id: 'Carreras',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombre: { type: 'string' },
    id_escuela: { type: 'integer' },
    escuela: { $ref: 'Escuelas' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
});

fastify.addSchema({
  $id: 'CarrerasWithEscuela',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombre: { type: 'string' },
    id_escuela: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    Escuela: { $ref: 'Escuelas' }
  }
});

fastify.addSchema({
  $id: 'CoordinadorValidation',
  type: 'object',
  properties: {
    nombres: {
      type: 'string',
      maxLength: 100,
      description: 'Nombres del coordinador'
    },
    apellidos: {
      type: 'string',
      maxLength: 100,
      description: 'Apellidos del coordinador'
    },
    correo_institucional: {
      type: 'string',
      format: 'email',
      maxLength: 100,
      description: 'Correo institucional del coordinador'
    },
    telefono: {
      type: 'string',
      maxLength: 15,
      description: 'Teléfono del coordinador'
    },
    id_carrera: {
      type: 'integer',
      description: 'ID de la carrera que coordina'
    }
  },
  required: ['nombres', 'apellidos', 'correo_institucional', 'id_carrera']
});

fastify.addSchema({
  $id: 'Coordinadores',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombres: { type: 'string' },
    apellidos: { type: 'string' },
    correo_institucional: { type: 'string' },
    telefono: { type: 'string' },
    id_carrera: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' }
  }
});

fastify.addSchema({
  $id: 'CoordinadoresWithCarrera',
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nombres: { type: 'string' },
    apellidos: { type: 'string' },
    correo_institucional: { type: 'string' },
    telefono: { type: 'string' },
    id_carrera: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    Carrera: { $ref: 'CarrerasWithEscuela' }
  }
});

fastify.addSchema({
  $id: 'ContactoEmergenciaValidation',
  type: 'object',
  properties: {
    nombres: {
      type: 'string',
      maxLength: 200,
      description: 'Nombres del contacto de emergencia'
    },
    apellidos: {
      type: 'string',
      maxLength: 200,
      description: 'Apellidos del contacto de emergencia'
    },
    telefono: {
      type: 'string',
      maxLength: 14,
      description: 'Número de teléfono del contacto'
    },
    direccion: {
      type: 'string',
      nullable: true,
      description: 'Dirección del contacto'
    },
    id_perfil_usuario: {
      type: 'integer',
      description: 'ID del perfil de usuario asociado'
    }
  },
  required: ['nombres', 'apellidos', 'telefono', 'id_perfil_usuario']
});

fastify.addSchema({
  $id: 'ContactoEmergencia',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'ID único del contacto de emergencia'
    },
    nombres: {
      type: 'string',
      description: 'Nombres del contacto de emergencia'
    },
    apellidos: {
      type: 'string',
      description: 'Apellidos del contacto de emergencia'
    },
    telefono: {
      type: 'string',
      description: 'Número de teléfono del contacto'
    },
    direccion: {
      type: 'string',
      nullable: true,
      description: 'Dirección del contacto'
    },
    id_perfil_usuario: {
      type: 'integer',
      description: 'ID del perfil de usuario asociado'
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación del registro'
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de última actualización'
    },
    PerfilUsuario: {
      $ref: 'PerfilUsuario',
      description: 'Información del perfil de usuario asociado'
    }
  }
});

fastify.addSchema({
  $id: 'EncargadoInstitucionValidation',
  type: 'object',
  properties: {
    nombres: {
      type: 'string',
      maxLength: 100,
      description: 'Nombres del encargado'
    },
    apellidos: {
      type: 'string',
      maxLength: 100,
      description: 'Apellidos del encargado'
    },
    correo: {
      type: 'string',
      format: 'email',
      maxLength: 100,
      description: 'Correo electrónico institucional'
    },
    telefono: {
      type: 'string',
      maxLength: 15,
      description: 'Número de teléfono del encargado'
    }
  },
  required: ['nombres', 'apellidos', 'correo', 'telefono']
});

fastify.addSchema({
  $id: 'EncargadoInstitucion',
  type: 'object',
  properties: {
    id: {
      type: 'integer',
      description: 'ID único del encargado'
    },
    nombres: {
      type: 'string',
      description: 'Nombres del encargado'
    },
    apellidos: {
      type: 'string',
      description: 'Apellidos del encargado'
    },
    correo: {
      type: 'string',
      description: 'Correo electrónico institucional'
    },
    telefono: {
      type: 'string',
      description: 'Número de teléfono del encargado'
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación del registro'
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de última actualización'
    }
  }
});



// En tu configuración de Fastify donde defines los schemas
fastify.addSchema({
  $id: 'ChatbotMessage',
  type: 'object',
  properties: {
    message: { type: 'string', example: '¿Cómo registro mis horas de servicio?' },
    conversationId: { type: 'string', example: 'conv_123456' },
    getPerfilUsuarioById: { type: 'number', example: 123 }
  }
});

fastify.addSchema({
  $id: 'ChatbotResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    response: { type: 'string', example: 'Puedes registrar tus horas...' },
    conversationId: { type: 'string', example: 'conv_123456' },
    timestamp: { type: 'string', example: '2023-01-01T00:00:00Z' }
  }
});


fastify.addSchema({
  $id: 'ChatbotConversation',
  type: 'object',
  properties: {
    id: { type: 'number' },
    conversationId: { type: 'string' },
    usuarioId: { type: 'number' },
    userMessage: { type: 'string' },
    botResponse: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' }
  }
});

fastify.addSchema({
  $id: 'ChatbotStartResponse',
  type: 'object',
  properties: {
    conversationId: { type: 'string' },
    welcomeMessage: { type: 'string' },
    usuario: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        nombre: { type: 'string' }
      }
    }
  }
});

fastify.addSchema({
  $id: 'ConversationSession',
  type: 'object',
  properties: {
    id: { type: 'string' },
    conversationId: { type: 'string' },
    usuarioId: { type: 'string' },
    startTime: { type: 'string', format: 'date-time' },
    endTime: { type: 'string', format: 'date-time' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    conversations: {
      type: 'array',
      items: { $ref: 'Conversation' }
    }
  }
});

fastify.addSchema({
  $id: 'Conversation',
  type: 'object',
  properties: {
    id: { type: 'string' },
    conversationId: { type: 'string' },
    userMessage: { type: 'string' },
    botResponse: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' }
  }
});




/**
 * Configuración de Swagger UI (interfaz).
 * Define la ruta donde estará disponible la documentación y opciones de la interfaz.
 */
await fastify.register(swaggerUI, {
  routePrefix: `/${docsPath}`,
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true // Permite compartir enlaces directos a endpoints
  },
  staticCSP: true, // Mantiene seguridad básica
  transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
  transformSpecificationClone: true
});







/**
 * Configuración para servir archivos estáticos.
 * Define el directorio raíz y el prefijo para acceder a los archivos públicos.
 */
await fastify.register(staticFiles, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});

/**
 * Registra las rutas de la API.
 * Todas las rutas definidas en homeRoutes estarán bajo el prefijo '/api'.
 */
fastify.register(homeRoutes, { prefix: '/api' });
fastify.register(roleRoutes, { prefix: '/api' });
fastify.register(institucionRoutes, { prefix: '/api' });
fastify.register(proyectoInstitucionRoutes, { prefix: '/api' });
fastify.register(aplicacionesEstudiantesRoutes, { prefix: '/api' });
fastify.register(habilidadesRoutes, { prefix: '/api' });
fastify.register(usuariosHabilidadesRoutes, { prefix: '/api' });
fastify.register(proyectosInstitucionesHabilidadesRoutes, { prefix: '/api' });
fastify.register(perfilUsuarioRoutes, { prefix: '/api' });
fastify.register(escuelasRoutes, { prefix: '/api' });
fastify.register(carrerasRoutes, { prefix: '/api' });
fastify.register(coordinadoresCarreraRoutes, { prefix: '/api' });
fastify.register(contactoEmergenciaRoutes, { prefix: '/api' });
fastify.register(encargadoInstitucionRoutes, { prefix: '/api' });
fastify.register(chatbotRoutes, { prefix: '/api' });

/**
 * Registra la landing page de la API
 */
fastify.get('/', {
  schema: {
    hide: true
  }
}, (request, reply) => {
  reply.sendFile('index.html', { root: path.join(__dirname, '../public') });
});

/**
 * Función asíncrona para iniciar el servidor.
 * Intenta escuchar en el puerto y host definidos y maneja errores en caso de fallo.
 */
const start = async () => {
  try {
    await fastify.listen({
      port: port,
      host: host
    });
    fastify.log.info(`Servidor ejecutandose en http://${host}:${port}`);
    fastify.log.info(`Documentacion disponible en http://${host}:${port}/${docsPath}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();