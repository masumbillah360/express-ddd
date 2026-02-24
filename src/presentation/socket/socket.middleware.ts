import type { Socket } from 'socket.io';
import { logger } from '../../infrastructure/logger/WinstonLogger';
import { JWTTokenService } from '../../infrastructure/security/JWTTokenService';
import { SocketAuthenticationError } from './socket.types';

export class SocketMiddleware {
    private tokenService: JWTTokenService;

    constructor(tokenService: JWTTokenService) {
        this.tokenService = tokenService;
    }

    // Authenticate socket connection using JWT token
    public async authenticate(socket: Socket, token: string): Promise<string> {
        try {
            const decoded = this.tokenService.verifyAccessToken(token);
            if (!decoded.userId) {
                throw new SocketAuthenticationError('Invalid token payload');
            }

            socket.data.userId = decoded.userId;
            logger.info('Socket authenticated', {
                userId: decoded.userId,
                socketId: socket.id,
            });

            return decoded.userId;
        } catch (error) {
            logger.warn('Socket authentication failed', {
                socketId: socket.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw new SocketAuthenticationError('Invalid or expired token');
        }
    }

    // Validate connection before establishing
    public validateConnection(socket: Socket): boolean {
        const userAgent = socket.handshake.headers['user-agent'];
        const origin = socket.handshake.headers['origin'];

        logger.debug('Validating socket connection', {
            socketId: socket.id,
            userAgent,
            origin,
        });

        // Basic validation - user agent check is optional for testing purposes
        if (!userAgent) {
            logger.debug(
                'Socket connection: User agent missing (allowed for testing)',
                {
                    socketId: socket.id,
                },
            );
        }

        return true;
    }

    // Middleware for authorization checks
    public isAuthorized(userId: string, requiredRoles?: string[]): boolean {
        // In a real application, you would check user roles from database
        // This is a placeholder implementation
        logger.debug('Checking socket authorization', {
            userId,
            requiredRoles,
        });
        return true;
    }
}
