import config from '../config/config.js';

/**
 * ResponseService — Servicio utilitario para estandarizar el formato de respuestas HTTP
 * del chatbot y otros endpoints de la IA.
 *
 * Garantiza que todos los errores y éxitos tengan la misma estructura JSON,
 * lo que facilita el manejo en el cliente (frontend/app móvil).
 */
export class ResponseService {

    /**
     * Crea una respuesta de error estandarizada.
     * En entorno de desarrollo, incluye detalles técnicos del error para facilitar el debug.
     * En producción, oculta esos detalles por seguridad.
     *
     * Estructura resultante:
     * {
     *   success: false,
     *   error: { code, message, details?, stack? }
     * }
     *
     * @param {string} message - Mensaje legible del error (para mostrar al usuario)
     * @param {string} code - Código identificador del error (ej: 'USER_NOT_FOUND')
     * @param {Error|null} error - El objeto de error original de JavaScript (opcional)
     * @returns {Object} - Objeto de respuesta de error
     */
    static createErrorResponse(message, code, error = null) {
        return {
            success: false,
            error: {
                code,
                message,
                // Solo incluye los detalles técnicos en desarrollo, nunca en producción
                details: config.env === 'development' ? error?.message : undefined,
                stack: config.env === 'development' ? error?.stack : undefined
            }
        };
    }

    /**
     * Crea una respuesta de éxito estandarizada.
     * Agrega `success: true` al objeto de datos recibido.
     *
     * Estructura resultante:
     * {
     *   success: true,
     *   ...data
     * }
     *
     * @param {Object} data - Datos a incluir en la respuesta (se "aplanan" junto a success)
     * @returns {Object} - Objeto de respuesta exitosa
     */
    static createSuccessResponse(data = {}) {
        return {
            success: true,
            ...data // Spread: copia todas las propiedades de data al nivel raíz del objeto
        };
    }
}
