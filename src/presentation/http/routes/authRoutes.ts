import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { createAuthMiddleware } from '../middlewares/authMiddleware';
import type { ITokenService } from '../../../application/interfaces/ITokenService';
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
): Router => {
    const router = Router();
    const protect = createAuthMiddleware(tokenService);

    // Public routes
    router.post('/register', validate(registerSchema), controller.register);
    router.post('/login', validate(loginSchema), controller.login);
    router.post(
        '/verify-email',
        validate(verifyEmailSchema),
        controller.verifyEmail,
    );
    router.post(
        '/forgot-password',
        validate(forgotPasswordSchema),
        controller.forgotPassword,
    );
    router.post(
        '/reset-password',
        validate(resetPasswordSchema),
        controller.resetPassword,
    );
    router.post('/resend-otp', validate(resendOTPSchema), controller.resendOTP);
    router.post('/refresh-token', controller.refreshToken);
    router.post('/logout', controller.logout);

    // Protected routes
    router.get('/me', protect, controller.getMe);

    return router;
};
