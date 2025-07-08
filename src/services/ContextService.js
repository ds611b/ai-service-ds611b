import {
    Usuarios, PerfilUsuario, Carreras, Escuelas,
    AplicacionesEstudiantes, ProyectosInstitucion, Instituciones,
    Habilidades, UsuariosHabilidades
} from '../models/index.js';

export class ContextService {
    static SYSTEM_CONTEXT = `...`; // Tu SYSTEM_CONTEXT original

    async getStudentContext(usuarioId) {

        try {
            console.log('Obteniendo contexto del estudiante con ID:', usuarioId);
            const estudiante = await Usuarios.findByPk(usuarioId, {
                include: [
                    // incluir las habilidades del usuario
                    // Incluir las habilidades del usuario
                    {
                        model: Habilidades,
                        as: 'Habilidades', // Este es el alias que deberías usar (o el que definiste en la asociación)
                        through: {
                            model: UsuariosHabilidades,
                            as: 'usuariosHabilidades' // Alias para la tabla intermedia
                        },
                    },
                    {
                        model: PerfilUsuario,
                        as: 'perfil', // Alias definido en la asociación de Usuarios
                        include: [
                            {
                                model: Carreras,
                                as: 'carrera', // Alias definido en la asociación de PerfilUsuario
                                include: [
                                    {
                                        model: Escuelas,
                                        as: 'escuela' // Alias definido en la asociación de Carreras (si existe)
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: AplicacionesEstudiantes,
                        as: 'aplicacionesEstudiantes', // Alias definido en la asociación de Usuarios
                        include: [
                            {
                                model: ProyectosInstitucion,
                                as: 'proyecto', // Alias definido en la asociación de AplicacionesEstudiantes
                                include: [
                                    {
                                        model: Instituciones,
                                        as: 'institucion' // Alias definido en la asociación de ProyectosInstitucion
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });


            if (!estudiante) {
                console.log('Usuario no encontrado');
                return null;
            }
            // Imprimir el estudiante para depuración
            console.log('Estudiante encontrado:', JSON.stringify(estudiante, null, 2));


            // Extraer datos
            const perfil = estudiante.perfil;
            const aplicaciones = estudiante.aplicacionesEstudiantes;
            return {
                contextBotInicial: SYSTEM_CONTEXT,
                nombre: `${estudiante.primer_nombre} ${estudiante.primer_apellido}`,
                carrera: perfil?.carrera?.nombre || 'No especificada',
                escuela: perfil?.carrera?.escuela?.nombre || 'No especificada',
                añoAcademico: perfil?.año_academico || 'No especificado',
                habilidades: estudiante.Habilidades.map(h => h.descripcion), // Asumiendo que 'nombre' es un campo en Habilidades
                proyectos: aplicaciones.map(app => ({
                    nombre: app.proyecto.nombre,
                    institucion: app.proyecto.institucion.nombre,
                    estado: app.estado // Asumiendo que 'estado' es un campo en AplicacionesEstudiantes
                }))
            };
        } catch (error) {
            console.error('Error al obtener contexto:', error);
            return null;
        }
    }

    async getSystemContext() {

        // peticion de proyectos
        const proyectos = await ProyectosInstitucion.findAll({
            include: [
                {
                    model: Instituciones,
                    as: 'institucion', // Alias definido en la asociación de ProyectosInstitucion
                    attributes: ['id', 'nombre']
                }
            ]
        });

        // peticion de instituciones
        const instituciones = await Instituciones.findAll({
            attributes: ['id', 'nombre']
        });
        // peticion de carreras
        const carreras = await Carreras.findAll({
            include: [
                {
                    model: Escuelas,
                    as: 'escuela', // Alias definido en la asociación de Carreras
                    attributes: ['id', 'nombre']
                }
            ],
            attributes: ['id', 'nombre']
        });

        // retornar el contexto del sistema
        return {
            proyectos: proyectos.map(p => ({
                id: p.id,
                nombre: p.nombre// Asumiendo que 'descripcion' es el campo en Habilidades
            })),
            instituciones: instituciones.map(i => ({
                id: i.id,
                nombre: i.nombre
            })),
            carreras: carreras.map(c => ({
                id: c.id,
                nombre: c.nombre,
                escuela: c.escuela ? c.escuela.nombre : 'No especificada' // Manejo de escuela opcional
            }))
        };
    }

    buildPrompt(message, context, history, sistemaContext) {
        let prompt = `Eres **CHAT FELIZ**, asistente virtual de la ITCA FEPADE. 
                   Reglas estrictas:
                   1. Presentarte siempre como "CHAT FELIZ" en tu primera respuesta
                   2. Usar emojis educativos relevantes (📚, ✏️)
                   3. Formato: 
                      - Párrafos breves
                      - Negritas para términos importantes
                      - Viñetas para listas
                   Ejemplo de respuesta: 
                   "¡Hola José! 👋 Soy **CHAT FELIZ**, tu asistente de ITCA FEPADE. 
                   Sobre desarrollo de software..."
                   
                   -si ya le diste el saludo inicial al usuario, no vuelvas a saludarlo ni te presentés de nuevo.
                   `;

        if (context) {
            prompt += `\n\nInformación del usuario:
    - Proyectos del sistema: ${sistemaContext.proyectos.map(p => p.nombre).join(', ') || 'No especificados'}
    - Instituciones del sistema: ${sistemaContext.instituciones.map(i => i.nombre).join(', ') || 'No especificadas'}
    - Nombre: ${context.nombre}
    - Carrera: ${context.carrera}
    - Escuela: ${context.escuela}
    - Habilidades: ${context.habilidades.join(', ') || 'No especificadas'}
    - Proyectos: ${context.proyectos.length > 0 ? context.proyectos.map(p => `${p.nombre} (${p.institucion})`).join(', ') : 'No especificados'}
    - Año académico: ${context.añoAcademico || 'No especificado'}  
    - Año académico: ${context.añoAcademico}`;

            if (context.proyectos.length > 0) {
                prompt += `\n\nProyectos en los que participa:`;
                context.proyectos.forEach(proyecto => {
                    prompt += `\n- ${proyecto.nombre} (${proyecto.institucion}): ${proyecto.estado}`;
                });
            }
        }

        if (history && history.length > 0) {
            prompt += `\n\nHistorial de la conversación:`;
            history.reverse().forEach(msg => {
                prompt += `\nUsuario: ${msg.userMessage}`;
                prompt += `\nAsistente: ${msg.botResponse}`;
            });
        }

        prompt += `\n\nNuevo mensaje del usuario: ${message}`;
        prompt += `\nRespuesta del asistente:`;

        return prompt;
    }
}