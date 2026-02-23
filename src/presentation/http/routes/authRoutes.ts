import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { createAuthMiddleware } from '../middlewares/authMiddleware';
import type { ITokenService } from '../../../application/interfaces/ITokenService';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';
import { getRateLimitMiddleware } from '../middlewares/rateLimiterMiddleware';
import {
    validate,
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendOTPSchema,
} from '../validators/authValidators';

export const createAuthRoutes = (
    controller: AuthController,
    tokenService: ITokenService,
    metricsService: MetricsService,
): Router => {
    const router = Router();
    const protect = createAuthMiddleware(tokenService);

    // Rate limiting middleware
    const resendOTPLimiter = getRateLimitMiddleware(
        'resend-otp',
        metricsService,
    );
    const forgotPasswordLimiter = getRateLimitMiddleware(
        'forgot-password',
        metricsService,
    );
    const loginLimiter = getRateLimitMiddleware('login', metricsService);
    const verifyEmailLimiter = getRateLimitMiddleware(
        'verify-email',
        metricsService,
    );

    // Public routes
    router.post('/register', validate(registerSchema), controller.register);
    router.post(
        '/login',
        loginLimiter,
        validate(loginSchema),
        controller.login,
    );
    router.post(
        '/verify-email',
        verifyEmailLimiter,
        validate(verifyEmailSchema),
        controller.verifyEmail,
    );
    router.post(
        '/forgot-password',
        forgotPasswordLimiter,
        validate(forgotPasswordSchema),
        controller.forgotPassword,
    );
    router.post(
        '/reset-password',
        validate(resetPasswordSchema),
        controller.resetPassword,
    );
    router.post(
        '/resend-otp',
        resendOTPLimiter,
        validate(resendOTPSchema),
        controller.resendOTP,
    );
    router.post('/refresh-token', controller.refreshToken);
    router.post('/logout', controller.logout);

    // Protected routes
    router.get('/me', protect, controller.getMe);

    return router;
};
