import config from '../config/config.js';

export class ResponseService {
    static createErrorResponse(message, code, error = null) {
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

    static createSuccessResponse(data = {}) {
        return {
            success: true,
            ...data
        };
    }
}