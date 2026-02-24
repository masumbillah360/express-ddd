import type {
    NotificationData,
    MessageData,
} from '../../infrastructure/socket/SocketService';

export interface ISocketService {
    // Send notification to a specific user
    sendNotification(data: NotificationData): void;

    // Send message to a specific user
    sendDirectMessage(data: MessageData): void;

    // Send message to all users in a room
    sendRoomMessage(roomId: string, data: MessageData): void;

    // Send notification to all users in a room
    sendRoomNotification(roomId: string, data: NotificationData): void;

    // Send notification to all connected users
    sendBroadcastNotification(data: NotificationData): void;

    // Get number of active connections
    getActiveConnections(): number;

    // Get number of active users
    getActiveUsersCount(): number;

    // Get all active users
    getActiveUsers(): string[];

    // Check if user is online
    isUserOnline(userId: string): boolean;
}
