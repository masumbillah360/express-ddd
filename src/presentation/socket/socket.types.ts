// Socket connection state
export interface SocketConnectionState {
    userId: string;
    socketId: string;
    connectedAt: number;
    lastActiveAt: number;
}

// Socket event payload types
export interface SocketAuthenticatePayload {
    token: string;
}

export interface SocketJoinRoomPayload {
    roomId: string;
    userId: string;
}

export interface SocketLeaveRoomPayload {
    roomId: string;
    userId: string;
}

// Error types for Socket operations
export class SocketAuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SocketAuthenticationError';
    }
}

export class SocketRoomError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SocketRoomError';
    }
}

export class SocketMessageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SocketMessageError';
    }
}
