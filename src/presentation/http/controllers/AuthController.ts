import type { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '../../../application/use-cases/auth/RegisterUseCase';
import { LoginUseCase } from '../../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../../application/use-cases/auth/RefreshTokenUseCase';
import { VerifyEmailUseCase } from '../../../application/use-cases/auth/VerifyEmailUseCase';
import { ForgotPasswordUseCase } from '../../../application/use-cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/ResetPasswordUseCase';
import { ResendOTPUseCase } from '../../../application/use-cases/auth/ResendOTPUseCase';
import { LogoutUseCase } from '../../../application/use-cases/auth/LogoutUseCase';

export class AuthController {
    constructor(
        private readonly registerUC: RegisterUseCase,
        private readonly loginUC: LoginUseCase,
        private readonly refreshTokenUC: RefreshTokenUseCase,
        private readonly verifyEmailUC: VerifyEmailUseCase,
        private readonly forgotPasswordUC: ForgotPasswordUseCase,
        private readonly resetPasswordUC: ResetPasswordUseCase,
        private readonly resendOTPUC: ResendOTPUseCase,
        private readonly logoutUC: LogoutUseCase,
    ) {}

    register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.registerUC.execute(req.body);
            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    user: {
                        id: result.user.id,
                        name: result.user.name,
                        email: result.user.email,
                        isVerified: result.user.isVerified,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    };

    verifyEmail = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.verifyEmailUC.execute(req.body);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    };

    login = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.loginUC.execute(req.body);

            // Refresh token → httpOnly cookie (not accessible via JS)
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                path: '/',
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: { accessToken: result.accessToken },
            });
        } catch (error) {
            next(error);
        }
    };

    refreshToken = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const token = req.cookies?.refreshToken;
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Refresh token not found',
                });
                return;
            }

            const result = await this.refreshTokenUC.execute(token);

            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });

            res.status(200).json({
                success: true,
                message: 'Token refreshed',
                data: { accessToken: result.accessToken },
            });
        } catch (error) {
            next(error);
        }
    };

    forgotPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.forgotPasswordUC.execute(req.body.email);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    };

    resetPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const result = await this.resetPasswordUC.execute(req.body);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    };

    resendOTP = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { email, purpose } = req.body;
            const result = await this.resendOTPUC.execute(email, purpose);
            res.status(200).json({ success: true, message: result.message });
        } catch (error) {
            next(error);
        }
    };

    logout = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const token = req.cookies?.refreshToken;
            if (token) {
                await this.logoutUC.execute(token);
            }

            res.clearCookie('refreshToken', { path: '/' });
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        } catch (error) {
            next(error);
        }
    };

    // Protected route example
    getMe = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            res.status(200).json({
                success: true,
                data: { user: req.user },
            });
        } catch (error) {
            next(error);
        }
    };
}
