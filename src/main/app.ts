import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { AuthController } from '../presentation/http/controllers/AuthController';
import type { ITokenService } from '../application/interfaces/ITokenService';
import { createAuthRoutes } from '../presentation/http/routes/authRoutes';
import { errorHandler } from '../presentation/http/middlewares/errorHandler';
import { MetricsService } from '../infrastructure/metrics/MetricsService';
import { logger } from '../infrastructure/logger/WinstonLogger';

export function createApp(
    authController: AuthController,
    tokenService: ITokenService,
    metricsService: MetricsService,
): Application {
    const app = express();

    // ─── Global Middleware ─────────────────────────────────────
    // Security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
                    fontSrc: ["'self'", 'https:', 'data:'],
                    imgSrc: ["'self'", 'https:', 'data:'],
                },
            },
        }),
    );

    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ─── Health Check ──────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ─── Metrics Endpoint ──────────────────────────────────────
    app.get('/metrics', async (_req, res) => {
        try {
            const metrics = await metricsService.getMetrics();
            res.set('Content-Type', 'text/plain');
            res.send(metrics);
        } catch (error) {
            logger.error('Failed to get metrics', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            res.status(500).json({ error: 'Failed to get metrics' });
        }
    });

    // ─── Routes ────────────────────────────────────────────────
    app.use(
        '/api/auth',
        createAuthRoutes(authController, tokenService, metricsService),
    );

    // ─── Error Handler (must be last) ─────────────────────────
    app.use(errorHandler);

    return app;
}
