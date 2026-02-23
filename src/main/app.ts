import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { AuthController } from '../presentation/http/controllers/AuthController';
import type { ITokenService } from '../application/interfaces/ITokenService';
import { createAuthRoutes } from '../presentation/http/routes/authRoutes';
import { errorHandler } from '../presentation/http/middlewares/errorHandler';

export function createApp(
    authController: AuthController,
    tokenService: ITokenService,
): Application {
    const app = express();

    // ─── Global Middleware ─────────────────────────────────────
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // ─── Health Check ──────────────────────────────────────────
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // ─── Routes ────────────────────────────────────────────────
    app.use('/api/auth', createAuthRoutes(authController, tokenService));

    // ─── Error Handler (must be last) ─────────────────────────
    app.use(errorHandler);

    return app;
}
