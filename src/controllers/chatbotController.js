import { json } from 'sequelize';
import {
    ConversationSession, Conversation, Usuarios, PerfilUsuario, Carreras,
    Escuelas, AplicacionesEstudiantes, ProyectosInstitucion, Instituciones,
    Habilidades, UsuariosHabilidades
} from '../models/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';

const SYSTEM_CONTEXT = `
    ## INSTRUCCIONES ##
    - Eres un tutor educativo amable y profesional.
    - tu nombre es  "Chatbot Tutor".
    - Responde en español, con claridad y precisión.
    - Considera el historial de la conversación para mantener coherencia.
    - Utiliza un tono amigable y accesible, evitando tecnicismos innecesarios.
    - que sean respuestas breves y concisas, evitando respuestas largas.
    - Si el estudiante pregunta sobre su perfil, proporciona información relevante.
    - Si el estudiante pregunta sobre su carrera, proporciona información relevante.
    - Si el estudiante pregunta sobre su escuela, proporciona información relevante.
    - Si el estudiante pregunta sobre sus proyectos, proporciona información relevante.
    - Si el estudiante pregunta sobre sus habilidades, proporciona información relevante.
    - Si el estudiante pregunta sobre sus aplicaciones, proporciona información relevante.
    - Si el estudiante pregunta algo fuera de contexto, sugiere volver al tema principal.
    `;

// Configuración de IA Generativa
const genAI = new GoogleGenerativeAI(config.google.ai.apiKey);
const aiModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings: [
        {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_ONLY_HIGH'
        },
        {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_LOW_AND_ABOVE' // Más estricto para ambiente educativo
        }
    ],
    generationConfig: {
        maxOutputTokens: 20000, // Ideal para respuestas concisas
        temperature: 0.9
    },
    systemInstruction: {
        parts: [{
            text: `Eres **CHAT FELIZ**, asistente virtual de la ITCA FEPADE. 
                   Reglas estrictas:
                   1. Presentarte siempre como "CHAT FELIZ" en tu primera respuesta
                   2. Usar emojis educativos relevantes (📚, ✏️)
                   3. Formato: 
                      - Párrafos breves
                      - Negritas para términos importantes
                      - Viñetas para listas
                   Ejemplo de respuesta: 
                   "¡Hola José! 👋 Soy **CHAT FELIZ**, tu asistente de ITCA FEPADE. 
                   Sobre desarrollo de software..."`
        }]
    }
});

// Generar ID de conversación único
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Respuesta de error estandarizada
function createErrorResponse(message, code, error = null) {
    return {
        success: false,
        error: {
            code,
            message,
            details: config.env === 'development' ? error?.message : undefined,
            stack: config.env === 'development' ? error?.stack : undefined
        }
    };
}

// Iniciar nueva conversación
export async function startConversation(request, reply) {
    const { usuarioId } = request.body;

    if (!usuarioId) {
        return reply.status(400).send(createErrorResponse(
            'El ID de usuario es obligatorio',
            'MISSING_USER_ID'
        ));
    }

    try {
        const usuario = await Usuarios.findByPk(usuarioId, {
            attributes: ['id', 'primer_nombre', 'primer_apellido']
        });

        if (!usuario) {
            return reply.status(404).send(createErrorResponse(
                'Usuario no encontrado',
                'USER_NOT_FOUND'
            ));
        }

        const conversationId = generateConversationId();
        const welcomeMessage = "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";


        await ConversationSession.create({
            conversationId,
            usuarioId,
            startTime: new Date()
        });

        await Conversation.create({
            conversationId,
            userMessage: 'INICIO_DE_CONVERSACION',
            botResponse: welcomeMessage,
            timestamp: new Date()
        });

        reply.status(201).send({
            success: true,
            conversationId,
            welcomeMessage,
            usuario: {
                id: usuario.id,
                nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`
            }
        });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send(createErrorResponse(
            'Error al iniciar la conversación',
            'START_CONVERSATION_ERROR',
            error
        ));
    }
}

// Enviar mensaje en conversación existente
export async function sendMessage(request, reply) {
    const { message, conversationId, usuarioId } = request.body;

    // Validaciones básicas
    if (!conversationId) {
        return reply.status(400).send(createErrorResponse(
            'El ID de la conversación es obligatorio',
            'MISSING_CONVERSATION_ID'
        ));
    }

    if (!message?.trim()) {
        return reply.status(400).send(createErrorResponse(
            'El mensaje no puede estar vacío',
            'EMPTY_MESSAGE'
        ));
    }

    if (!usuarioId) {
        return reply.status(400).send(createErrorResponse(
            'El ID de usuario es obligatorio',
            'MISSING_USER_ID'
        ));
    }

    try {
        // Verificar que el usuario tiene permiso para esta conversación
        const sesion = await ConversationSession.findOne({
            where: { conversationId, usuarioId }
        });

        if (!sesion) {
            return reply.status(403).send(createErrorResponse(
                'No tienes permiso para acceder a esta conversación',
                'UNAUTHORIZED_CONVERSATION_ACCESS'
            ));
        }

        const usuario = await Usuarios.findByPk(usuarioId);
        if (!usuario) {
            return reply.status(404).send(createErrorResponse(
                'Usuario no encontrado',
                'USER_NOT_FOUND'
            ));
        }

        // Obtener contexto del usuario
        const studentContext = await getStudentContext(usuarioId);
        const sistemaContext = await getSystemContext();
        console.log('Contexto del sistema:', JSON.stringify(sistemaContext, null, 2));
        const historial = await getConversationMessages(conversationId);

        // imprime en consola el historial de la conversación
        console.log('Historial de conversación:', JSON.stringify(historial, null, 2));

        // Construir prompt contextualizado
        const fullPrompt = buildPrompt(message, studentContext, historial, sistemaContext);

        // Generar respuesta con IA
        const result = await aiModel.generateContent(fullPrompt);
        const response = await result.response;
        const botResponse = response.text();

        // Guardar mensaje en la conversación
        const nuevoMensaje = await Conversation.create({
            conversationId,
            userMessage: message,
            botResponse,
            timestamp: new Date()
        });

        // imprimir el la variable studentContext
        console.log('Contexto del estudiante:', studentContext);
        console.log('Contexto del estudiante:', JSON.stringify(studentContext, null, 2));

        reply.status(201).send({
            success: true,
            message: nuevoMensaje,
            context: {
                contextBotInicial: SYSTEM_CONTEXT,
                habilidades: studentContext.habilidades,
                escuela: studentContext.escuela,
                carrera: studentContext.carrera
            }
        });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send(createErrorResponse(
            'Error al procesar el mensaje',
            'MESSAGE_PROCESSING_ERROR',
            error
        ));
    }
}

// Obtener historial de conversación
export async function getConversationHistory(request, reply) {
    const { conversationId } = request.params;
    const { usuarioId } = request.query; // Asumimos que el usuarioId viene en query params

    if (!conversationId) {
        return reply.status(400).send(createErrorResponse(
            'El ID de la conversación es obligatorio',
            'MISSING_CONVERSATION_ID'
        ));
    }

    try {
        // Verificar permisos
        const sesion = await ConversationSession.findOne({
            where: { conversationId }
        });

        // imprime session en consola
        console.log('Sesión encontrada:', JSON.stringify(sesion, null, 2));

        if (!sesion) {
            return reply.status(403).send(createErrorResponse(
                'No tienes permiso para acceder a esta conversación',
                'UNAUTHORIZED_CONVERSATION_ACCESS'
            ));
        }

        const historial = await Conversation.findAll({
            where: { conversationId },
            order: [['timestamp', 'ASC']],
            attributes: ['id', 'userMessage', 'botResponse', 'timestamp']
        });

        // imprime historial en consola
        console.log('Historial de conversación:', JSON.stringify(historial, null, 2));

        reply.send({
            success: true,
            conversationId,
            conversations: historial,
            startTime: sesion.startTime
        });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send(createErrorResponse(
            'Error al obtener el historial de conversación',
            'GET_CONVERSATION_HISTORY_ERROR',
            error
        ));
    }
}

// Eliminar conversación
export async function deleteConversation(request, reply) {
    const { conversationId } = request.params;
    const { usuarioId } = request.body;

    if (!conversationId) {
        return reply.status(400).send(createErrorResponse(
            'El ID de la conversación es obligatorio',
            'MISSING_CONVERSATION_ID'
        ));
    }

    try {
        // Verificar que el usuario es dueño de la conversación
        const sesion = await ConversationSession.findOne({
            where: { conversationId, usuarioId }
        });

        if (!sesion) {
            return reply.status(403).send(createErrorResponse(
                'No tienes permiso para eliminar esta conversación',
                'UNAUTHORIZED_CONVERSATION_DELETION'
            ));
        }

        // Eliminar en transacción
        await sequelize.transaction(async (t) => {
            await Conversation.destroy({
                where: { conversationId },
                transaction: t
            });

            await ConversationSession.destroy({
                where: { conversationId },
                transaction: t
            });
        });

        reply.status(204).send();

    } catch (error) {
        request.log.error(error);
        reply.status(500).send(createErrorResponse(
            'Error al eliminar la conversación',
            'CONVERSATION_DELETION_ERROR',
            error
        ));
    }
}

// funcion para obtener informacion de todo el sistema 
async function getSystemContext() {
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


async function getStudentContext(usuarioId) {
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


async function getConversationMessages(conversationId, limit = 10) {
    return Conversation.findAll({
        where: { conversationId },
        order: [['timestamp', 'DESC']],
        limit,
        attributes: ['userMessage', 'botResponse', 'timestamp']
    });
}

function buildPrompt(message, context, history, sistemaContext) {
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