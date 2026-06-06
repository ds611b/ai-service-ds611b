import {
    Usuarios, PerfilUsuario, Carreras, Escuelas,
    AplicacionesEstudiantes, ProyectosInstitucion, Instituciones,
    Habilidades, UsuariosHabilidades
} from '../models/index.js';

/**
 * ContextService — Servicio encargado de construir el contexto que se le proporciona
 * al modelo de IA antes de generar una respuesta.
 *
 * El contexto es información real de la base de datos (datos del estudiante, proyectos
 * del sistema, instituciones, etc.) que se inyecta en el prompt para que la IA pueda
 * dar respuestas personalizadas y relevantes.
 */
export class ContextService {
    // Instrucción de sistema estática: define el rol y comportamiento base del chatbot
    static SYSTEM_CONTEXT = `...`; // Tu SYSTEM_CONTEXT original

    /**
     * Obtiene el contexto personal del estudiante desde la base de datos.
     * Incluye: nombre, carrera, escuela, habilidades registradas y proyectos en los que participa.
     * Este contexto se usa para personalizar la respuesta de la IA según el perfil del usuario.
     *
     * @param {number} usuarioId - ID del usuario en la base de datos
     * @returns {Promise<Object|null>} - Objeto con los datos del estudiante, o null si no existe
     */
    async getStudentContext(usuarioId) {

        try {
            console.log('Obteniendo contexto del estudiante con ID:', usuarioId);

            // Consulta al usuario junto con todas sus relaciones relevantes para la IA
            const estudiante = await Usuarios.findByPk(usuarioId, {
                include: [
                    // Habilidades del estudiante (relación N:M a través de UsuariosHabilidades)
                    {
                        model: Habilidades,
                        as: 'Habilidades',
                        through: {
                            model: UsuariosHabilidades,
                            as: 'usuariosHabilidades'
                        },
                    },
                    // Perfil del estudiante con carrera y escuela anidadas
                    {
                        model: PerfilUsuario,
                        as: 'perfil',
                        include: [
                            {
                                model: Carreras,
                                as: 'carrera',
                                include: [
                                    {
                                        model: Escuelas,
                                        as: 'escuela'
                                    }
                                ]
                            }
                        ]
                    },
                    // Proyectos a los que el estudiante ha aplicado (con institución incluida)
                    {
                        model: AplicacionesEstudiantes,
                        as: 'aplicacionesEstudiantes',
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
                            }
                        ]
                    }
                ]
            });


            if (!estudiante) {
                console.log('Usuario no encontrado');
                return null;
            }
            console.log('Estudiante encontrado:', JSON.stringify(estudiante, null, 2));

            // Extrae y formatea los datos relevantes en un objeto plano para el prompt
            const perfil = estudiante.perfil;
            const aplicaciones = estudiante.aplicacionesEstudiantes;
            return {
                contextBotInicial: SYSTEM_CONTEXT,
                nombre: `${estudiante.primer_nombre} ${estudiante.primer_apellido}`,
                carrera: perfil?.carrera?.nombre || 'No especificada',
                escuela: perfil?.carrera?.escuela?.nombre || 'No especificada',
                añoAcademico: perfil?.año_academico || 'No especificado',
                habilidades: estudiante.Habilidades.map(h => h.descripcion),
                proyectos: aplicaciones.map(app => ({
                    nombre: app.proyecto.nombre,
                    institucion: app.proyecto.institucion.nombre,
                    estado: app.estado
                }))
            };
        } catch (error) {
            console.error('Error al obtener contexto:', error);
            return null;
        }
    }

    /**
     * Obtiene el contexto general del sistema desde la base de datos.
     * Incluye: todos los proyectos disponibles, instituciones y carreras.
     * Esto permite que la IA conozca qué opciones existen en el sistema
     * aunque el estudiante no esté inscrito en ellas.
     *
     * @returns {Promise<Object>} - Objeto con listas de proyectos, instituciones y carreras
     */
    async getSystemContext() {

        // Proyectos disponibles con su institución asociada
        const proyectos = await ProyectosInstitucion.findAll({
            include: [
                {
                    model: Instituciones,
                    as: 'institucion',
                    attributes: ['id', 'nombre']
                }
            ]
        });

        // Todas las instituciones registradas
        const instituciones = await Instituciones.findAll({
            attributes: ['id', 'nombre']
        });

        // Todas las carreras con su escuela
        const carreras = await Carreras.findAll({
            include: [
                {
                    model: Escuelas,
                    as: 'escuela',
                    attributes: ['id', 'nombre']
                }
            ],
            attributes: ['id', 'nombre']
        });

        // Retorna los datos en formato simplificado para insertar en el prompt
        return {
            proyectos: proyectos.map(p => ({
                id: p.id,
                nombre: p.nombre
            })),
            instituciones: instituciones.map(i => ({
                id: i.id,
                nombre: i.nombre
            })),
            carreras: carreras.map(c => ({
                id: c.id,
                nombre: c.nombre,
                escuela: c.escuela ? c.escuela.nombre : 'No especificada'
            }))
        };
    }

    /**
     * Construye el prompt completo que se enviará al modelo de IA.
     * Combina: instrucciones del sistema + contexto del estudiante +
     * contexto del sistema + historial de conversación + mensaje actual.
     *
     * @param {string} message - El mensaje nuevo del usuario
     * @param {Object} context - Contexto personal del estudiante (de getStudentContext)
     * @param {Array} history - Historial de mensajes anteriores de la conversación
     * @param {Object} sistemaContext - Contexto general del sistema (de getSystemContext)
     * @returns {string} - El prompt final listo para enviar a Gemini
     */
    buildPrompt(message, context, history, sistemaContext) {
        // Instrucciones base del chatbot (personalidad, formato, reglas)
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

        // Si existe contexto del estudiante, se inyecta en el prompt para personalizar la respuesta
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

            // Si el estudiante tiene proyectos, se listan con su estado de aplicación
            if (context.proyectos.length > 0) {
                prompt += `\n\nProyectos en los que participa:`;
                context.proyectos.forEach(proyecto => {
                    prompt += `\n- ${proyecto.nombre} (${proyecto.institucion}): ${proyecto.estado}`;
                });
            }
        }

        // Agrega el historial de la conversación para que la IA mantenga coherencia entre mensajes
        if (history && history.length > 0) {
            prompt += `\n\nHistorial de la conversación:`;
            history.reverse().forEach(msg => {
                prompt += `\nUsuario: ${msg.userMessage}`;
                prompt += `\nAsistente: ${msg.botResponse}`;
            });
        }

        // Agrega el mensaje nuevo del usuario al final del prompt
        prompt += `\n\nNuevo mensaje del usuario: ${message}`;
        prompt += `\nRespuesta del asistente:`;

        return prompt;
    }
}
