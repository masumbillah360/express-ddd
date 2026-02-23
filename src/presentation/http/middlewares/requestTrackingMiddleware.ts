import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

export const createRequestTrackingMiddleware = (metricsService: MetricsService) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const startTime = process.hrtime();
        
        // Log request details
        const requestInfo = {
            requestId: (req as any).requestId,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: (req as any).user?.id,
        };
        
        logger.info('Request received', requestInfo);
        
        // Hook into response finish to log duration
        res.on('finish', () => {
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const durationMs = seconds * 1000 + nanoseconds / 1e6;
            
            const responseInfo = {
                ...requestInfo,
                statusCode: res.statusCode,
                durationMs: durationMs.toFixed(2),
                contentLength: res.get('Content-Length'),
            };
            
            logger.info('Request completed', responseInfo);
            
            // Record metrics
            metricsService.recordRequestDuration(
                req.method,
                req.path,
                res.statusCode,
                durationMs,
                (req as any).user?.id,
            );
        });
        
        next();
    };
};
