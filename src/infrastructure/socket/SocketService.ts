import { Server, Socket } from 'socket.io';
import { logger } from '../logger/WinstonLogger';
import type { ISocketService } from '../../application/interfaces/ISocketService';
import { SocketMiddleware } from '../../presentation/socket/socket.middleware';

export type SocketEvent =
    | 'notification'
    | 'message'
    | 'join-room'
    | 'leave-room';

export interface NotificationData {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: number;
    userId?: string;
}

export interface MessageData {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: number;
    type: 'text' | 'image' | 'file';
}

export class SocketService implements ISocketService {
    private io: Server;
    private activeUsers = new Map<string, string>(); // userId -> socketId
    private socketMiddleware: SocketMiddleware;

    constructor(io: Server, socketMiddleware: SocketMiddleware) {
        this.io = io;
        this.socketMiddleware = socketMiddleware;
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        // Validate connection before establishing
        this.io.use((socket, next) => {
            if (this.socketMiddleware.validateConnection(socket)) {
                next();
            } else {
                next(new Error('Connection validation failed'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info('New socket connection established', {
                socketId: socket.id,
            });

            // Handle user authentication with JWT token
            socket.on('authenticate', async (token: string) => {
                try {
                    const userId = await this.socketMiddleware.authenticate(
                        socket,
                        token,
                    );
                    this.activeUsers.set(userId, socket.id);
                    socket.emit('authentication-success', {
                        userId,
                        socketId: socket.id,
                    });
                } catch (error) {
                    socket.emit('authentication-error', {
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Authentication failed',
                    });
                    socket.disconnect();
                }
            });

            // Handle joining rooms
            socket.on('join-room', (roomId: string) => {
                socket.join(roomId);
                logger.info('User joined room', {
                    roomId,
                    socketId: socket.id,
                });
                socket.emit('room-joined', { roomId });
            });

            // Handle leaving rooms
            socket.on('leave-room', (roomId: string) => {
                socket.leave(roomId);
                logger.info('User left room', { roomId, socketId: socket.id });
                socket.emit('room-left', { roomId });
            });

            // Handle direct messages
            socket.on('message', (data: MessageData) => {
                this.sendDirectMessage(data);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                const userId = socket.data.userId;
                if (userId) {
                    this.activeUsers.delete(userId);
                    logger.info('User disconnected', {
                        userId,
                        socketId: socket.id,
                    });
                } else {
                    logger.info('Socket disconnected', { socketId: socket.id });
                }
            });
        });
    }

    // Send notification to a specific user
    public sendNotification(data: NotificationData): void {
        if (data.userId && this.activeUsers.has(data.userId)) {
            const socketId = this.activeUsers.get(data.userId)!;
            this.io.to(socketId).emit('notification', data);
            logger.debug('Notification sent to user', {
                userId: data.userId,
                notificationId: data.id,
            });
        }
    }

    // Send message to a specific user
    public sendDirectMessage(data: MessageData): void {
        if (this.activeUsers.has(data.receiverId)) {
            const socketId = this.activeUsers.get(data.receiverId)!;
            this.io.to(socketId).emit('message', data);
            logger.debug('Direct message sent', {
                senderId: data.senderId,
                receiverId: data.receiverId,
                messageId: data.id,
            });
        }
    }

    // Send message to all users in a room
    public sendRoomMessage(roomId: string, data: MessageData): void {
        this.io.to(roomId).emit('message', data);
        logger.debug('Room message sent', { roomId, messageId: data.id });
    }

    // Send notification to all users in a room
    public sendRoomNotification(roomId: string, data: NotificationData): void {
        this.io.to(roomId).emit('notification', data);
        logger.debug('Room notification sent', {
            roomId,
            notificationId: data.id,
        });
    }

    // Send notification to all connected users
    public sendBroadcastNotification(data: NotificationData): void {
        this.io.emit('notification', data);
        logger.debug('Broadcast notification sent', {
            notificationId: data.id,
        });
    }

    // Get number of active connections
    public getActiveConnections(): number {
        return this.io.sockets.sockets.size;
    }

    // Get number of active users
    public getActiveUsersCount(): number {
        return this.activeUsers.size;
    }

    // Get all active users
    public getActiveUsers(): string[] {
        return Array.from(this.activeUsers.keys());
    }

    // Check if user is online
    public isUserOnline(userId: string): boolean {
        return this.activeUsers.has(userId);
    }
}
