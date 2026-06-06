import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';

/**
 * AIService — Servicio encargado de la comunicación directa con la API de Google Gemini.
 * Esta clase centraliza la configuración del modelo de IA y expone un método
 * para generar respuestas a partir de un prompt de texto.
 */
export class AIService {
    constructor() {
        // Inicializa el cliente de Google Generative AI usando la API Key del archivo .env
        this.genAI = new GoogleGenerativeAI(config.google.ai.apiKey);

        // Obtiene el modelo específico de Gemini con su configuración
        this.aiModel = this.genAI.getGenerativeModel({
            // Modelo de Gemini a usar: gemini-2.5-flash es rápido y eficiente para chat
            model: 'gemini-2.5-flash',

            // Filtros de seguridad: evitan que el modelo genere contenido dañino.
            // BLOCK_ONLY_HIGH = solo bloquea si la probabilidad de daño es muy alta
            // BLOCK_LOW_AND_ABOVE = más estricto, bloquea desde baja probabilidad
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' }
            ],

            // Parámetros de generación de texto
            generationConfig: {
                maxOutputTokens: 20000,  // Límite máximo de tokens en la respuesta (~15,000 palabras)
                temperature: 0.9         // Controla la creatividad: 0 = determinista, 1 = más creativo
            },

            // Instrucción de sistema: define la personalidad y reglas base del chatbot.
            // Esto se envía en cada llamada antes que el prompt del usuario.
            systemInstruction: {
                parts: [{
                    text: `Eres **CHAT FELIZ**, asistente virtual de la ITCA FEPADE...` // Tu contexto inicial
                }]
            }
        });
    }

    /**
     * Genera una respuesta del modelo de IA dado un prompt de texto.
     * @param {string} prompt - El texto completo que se le envía al modelo (incluye contexto + historial + mensaje del usuario)
     * @returns {Promise<string>} - La respuesta generada por Gemini como texto plano
     */
    async generateResponse(prompt) {
        // Envía el prompt al modelo y espera la respuesta
        const result = await this.aiModel.generateContent(prompt);
        const response = await result.response;

        // Extrae el texto de la respuesta del objeto de resultado
        return response.text();
    }
}
