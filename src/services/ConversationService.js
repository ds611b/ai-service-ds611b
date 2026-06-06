import { ConversationSession, Conversation } from '../models/index.js';
import { ResponseService } from './ResponseService.js';

/**
 * ConversationService — Servicio que gestiona el ciclo de vida de las conversaciones
 * con el chatbot: creación, acceso, almacenamiento de mensajes e historial.
 *
 * Cada conversación tiene:
 *  - Una "sesión" (ConversationSession): agrupa todos los mensajes de una misma sesión de chat.
 *  - Mensajes individuales (Conversation): cada par pregunta-respuesta guardado en BD.
 */
export class ConversationService {

    /**
     * Genera un ID único para cada conversación.
     * Usa la marca de tiempo actual + una cadena aleatoria para evitar colisiones.
     * Ejemplo de resultado: "conv_1716900000000_a3f9xk2"
     *
     * @returns {string} - ID único de conversación
     */
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Verifica que un usuario tenga acceso a una conversación específica.
     * Se usa como control de seguridad antes de leer o enviar mensajes,
     * evitando que un usuario acceda a la conversación de otro.
     *
     * @param {string} conversationId - ID de la conversación a verificar
     * @param {number} usuarioId - ID del usuario que intenta acceder
     * @throws {Object} - Lanza un error con código si el acceso no está autorizado
     */
    async verifyConversationAccess(conversationId, usuarioId) {
        // Busca la sesión que corresponda a ese conversationId Y ese usuarioId
        const sesion = await ConversationSession.findOne({
            where: { conversationId, usuarioId }
        });

        // Si no existe la sesión, el usuario no es dueño de esa conversación
        if (!sesion) {
            throw {
                code: 'UNAUTHORIZED_CONVERSATION_ACCESS',
                message: 'No tienes permiso para acceder a esta conversación'
            };
        }
    }

    /**
     * Inicia una nueva conversación para un usuario.
     * Crea la sesión en BD y guarda el mensaje de bienvenida inicial.
     *
     * NOTA: Este método está incompleto — usa `request` y `reply` que no existen
     * en el contexto de un servicio. La lógica funcional equivalente
     * está implementada directamente en chatbotController.js.
     *
     * @param {number} usuarioId - ID del usuario que inicia la conversación
     */
    async startConversation(usuarioId) {

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

            // Genera el ID único de la conversación
            const conversationId = generateConversationId();
            const welcomeMessage = "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?";

            // Crea la sesión que agrupa todos los mensajes de esta conversación
            await ConversationSession.create({
                conversationId,
                usuarioId,
                startTime: new Date()
            });

            // Guarda el mensaje de bienvenida como primer mensaje de la conversación
            await Conversation.create({
                conversationId,
                userMessage: 'INICIO_DE_CONVERSACION', // Marcador especial para indicar inicio
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

    /**
     * Guarda un par de mensajes (pregunta del usuario + respuesta del bot) en la BD.
     * Se llama después de que la IA genera su respuesta, para mantener el historial persistido.
     *
     * @param {string} conversationId - ID de la conversación a la que pertenece el mensaje
     * @param {string} userMessage - Texto del mensaje enviado por el usuario
     * @param {string} botResponse - Texto de la respuesta generada por la IA
     * @returns {Promise<Conversation>} - El registro creado en la base de datos
     */
    async saveMessage(conversationId, userMessage, botResponse) {
        return await Conversation.create({
            conversationId,
            userMessage,
            botResponse,
            timestamp: new Date()
        });
    }

    /**
     * Recupera el historial completo de mensajes de una conversación, ordenados cronológicamente.
     * Se usa para mostrar el historial al usuario o para enviárselo a la IA como contexto.
     *
     * @param {string} conversationId - ID de la conversación
     * @returns {Promise<Array>} - Lista de mensajes ordenados de más antiguo a más reciente
     */
    async getHistory(conversationId) {
        return await Conversation.findAll({
            where: { conversationId },
            order: [['timestamp', 'ASC']], // Orden cronológico para la IA
            attributes: ['id', 'userMessage', 'botResponse', 'timestamp']
        });
    }

    /**
     * Elimina una conversación completa (sesión + todos sus mensajes) de la BD.
     * Solo el dueño de la conversación puede eliminarla.
     *
     * NOTA: Este método está incompleto — usa `request`, `reply` y `sequelize`
     * que no existen en el contexto de un servicio. La lógica funcional equivalente
     * está implementada directamente en chatbotController.js.
     *
     * @param {string} conversationId - ID de la conversación a eliminar
     */
    async deleteConversation(conversationId) {

        const { conversationId } = request.params;
        const { usuarioId } = request.body;

        if (!conversationId) {
            return reply.status(400).send(createErrorResponse(
                'El ID de la conversación es obligatorio',
                'MISSING_CONVERSATION_ID'
            ));
        }

        try {
            // Verifica que el usuario sea el dueño antes de eliminar
            const sesion = await ConversationSession.findOne({
                where: { conversationId, usuarioId }
            });

            if (!sesion) {
                return reply.status(403).send(createErrorResponse(
                    'No tienes permiso para eliminar esta conversación',
                    'UNAUTHORIZED_CONVERSATION_DELETION'
                ));
            }

            // Elimina mensajes y sesión en una transacción para garantizar consistencia
            await sequelize.transaction(async (t) => {
                // Primero elimina todos los mensajes de la conversación
                await Conversation.destroy({
                    where: { conversationId },
                    transaction: t
                });

                // Luego elimina la sesión contenedora
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
}
