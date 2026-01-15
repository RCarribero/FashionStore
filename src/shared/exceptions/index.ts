/**
 * Custom Exceptions
 * Application-specific error classes for better error handling
 */

/**
 * Base application error
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly code: string = 'APP_ERROR',
        public readonly statusCode: number = 500
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * API error for HTTP-related errors
 */
export class ApiError extends AppError {
    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'API_ERROR'
    ) {
        super(message, code, statusCode);
        this.name = 'ApiError';
    }

    static badRequest(message: string): ApiError {
        return new ApiError(message, 400, 'BAD_REQUEST');
    }

    static unauthorized(message: string = 'No autorizado'): ApiError {
        return new ApiError(message, 401, 'UNAUTHORIZED');
    }

    static forbidden(message: string = 'Acceso denegado'): ApiError {
        return new ApiError(message, 403, 'FORBIDDEN');
    }

    static notFound(message: string = 'Recurso no encontrado'): ApiError {
        return new ApiError(message, 404, 'NOT_FOUND');
    }

    static conflict(message: string): ApiError {
        return new ApiError(message, 409, 'CONFLICT');
    }

    static internal(message: string = 'Error interno del servidor'): ApiError {
        return new ApiError(message, 500, 'INTERNAL_ERROR');
    }
}

/**
 * Validation error for form/input validation
 */
export class ValidationError extends AppError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly errors: Record<string, string[]> = {}
    ) {
        super(message, 'VALIDATION_ERROR', 422);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication error
 */
export class AuthError extends AppError {
    constructor(message: string = 'Error de autenticacion') {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthError';
    }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
    constructor(message: string, public readonly originalError?: unknown) {
        super(message, 'DATABASE_ERROR', 500);
        this.name = 'DatabaseError';
    }
}

/**
 * Stock error for inventory-related issues
 */
export class StockError extends AppError {
    constructor(
        message: string,
        public readonly productId?: string,
        public readonly requestedQuantity?: number,
        public readonly availableQuantity?: number
    ) {
        super(message, 'STOCK_ERROR', 409);
        this.name = 'StockError';
    }
}
