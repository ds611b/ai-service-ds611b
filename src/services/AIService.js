import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';

export class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(config.google.ai.apiKey);
        this.aiModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' }
            ],
            generationConfig: {
                maxOutputTokens: 20000,
                temperature: 0.9
            },
            systemInstruction: {
                parts: [{
                    text: `Eres **CHAT FELIZ**, asistente virtual de la ITCA FEPADE...` // Tu contexto inicial
                }]
            }
        });
    }

    async generateResponse(prompt) {
        const result = await this.aiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}