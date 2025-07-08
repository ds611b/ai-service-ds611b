/**
 * Crea una respuesta de error estandarizada.
 *
 * @param {string} message - Mensaje de error legible.
 * @param {string} errorCode - Código de error interno.
 * @param {Error} [error] - Objeto error opcional para depuración.
 * @returns {object} Objeto con el error formateado.
 */
export function createErrorResponse(message, errorCode, error) {
  return {
    success: false,
    error: {
      code: errorCode,
      message,
      details: error ? error.toString() : null
    }
  };
}
