import { ConversationSession, Conversation } from '../models/index.js';
import { ResponseService } from './ResponseService.js';

export class ConversationService {
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async verifyConversationAccess(conversationId, usuarioId) {
        const sesion = await ConversationSession.findOne({
            where: { conversationId, usuarioId }
        });

        if (!sesion) {
            throw {
                code: 'UNAUTHORIZED_CONVERSATION_ACCESS',
                message: 'No tienes permiso para acceder a esta conversación'
            };
        }
    }

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

    async saveMessage(conversationId, userMessage, botResponse) {
        return await Conversation.create({
            conversationId,
            userMessage,
            botResponse,
            timestamp: new Date()
        });
    }

    async getHistory(conversationId) {
        return await Conversation.findAll({
            where: { conversationId },
            order: [['timestamp', 'ASC']],
            attributes: ['id', 'userMessage', 'botResponse', 'timestamp']
        });
    }

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
}