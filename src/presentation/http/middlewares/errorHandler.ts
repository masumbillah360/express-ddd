import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    console.error(`[ERROR] ${err.name}: ${err.message}`);

    if (err instanceof DomainError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Mongoose duplicate key
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        res.status(409).json({
            success: false,
            message: 'Duplicate entry',
        });
        return;
    }

    // Fallback
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
