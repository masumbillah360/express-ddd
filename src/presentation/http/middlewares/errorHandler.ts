import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';
import { logger } from '../../../infrastructure/logger/WinstonLogger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    const errorInfo = {
        requestId: (req as any).requestId,
        userId: (req as any).user?.id,
        method: req.method,
        path: req.path,
        message: err.message,
        stack: err.stack,
    };

    logger.error('Request failed', errorInfo);

    if (err instanceof DomainError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            requestId: (req as any).requestId,
        });
        return;
    }

    // Mongoose duplicate key
    if (err.name === 'MongoServerError' && (err as any).code === 11000) {
        res.status(409).json({
            success: false,
            message: 'Duplicate entry',
            requestId: (req as any).requestId,
        });
        return;
    }

    // Fallback
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        requestId: (req as any).requestId,
    });
};
