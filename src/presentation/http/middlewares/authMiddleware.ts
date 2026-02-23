import type { Request, Response, NextFunction } from 'express';
import type { ITokenService } from '../../../application/interfaces/ITokenService';

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

export const createAuthMiddleware = (tokenService: ITokenService) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const header = req.headers.authorization;

        if (!header || !header.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
            });
            return;
        }

        try {
            const token = header.split(' ')[1];
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Access token required',
                });
                return;
            }
            req.user = tokenService.verifyAccessToken(token);
            next();
        } catch {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired access token',
            });
        }
    };
};
