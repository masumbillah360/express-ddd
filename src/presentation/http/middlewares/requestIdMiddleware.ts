import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    // Generate new request ID if not provided
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    // Attach to request object for logging and tracking
    (req as any).requestId = requestId;
    
    // Add to response headers
    res.setHeader('X-Request-ID', requestId);
    
    next();
};
