# Socket.io Integration Setup for Express DDD

This document provides a comprehensive guide for setting up and using Socket.io in your Express DDD application.

## Installation

First, install the Socket.io dependencies:

```bash
npm install socket.io @types/socket.io
```

## Project Structure

The Socket.io integration is organized as follows:

```bash
src/
├── application/
│   └── interfaces/
│       └── ISocketService.ts       # Application interface for Socket service
├── infrastructure/
│   └── socket/
│       └── SocketService.ts        # Implementation of Socket service
├── presentation/
│   └── socket/
│       ├── socket.types.ts         # Type definitions for Socket operations
│       └── socket.middleware.ts    # Middleware for Socket connections
└── main/
    ├── container.ts                # Dependency injection container
    ├── server.ts                   # Server initialization with Socket.io
    └── app.ts                      # Express app configuration
```

## Usage

### Server-Side Implementation

#### 1. Initialize Socket.io Server (server.ts)

The Socket.io server is initialized along with the Express server:

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SocketService } from '../infrastructure/socket/SocketService';

// Create HTTP server and Socket.io server
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Initialize Socket service
const socketService = new SocketService(io);
```

#### 2. Using Socket Service in Your Application

The Socket service is available through dependency injection. You can use it in controllers, use cases, or other services:

```typescript
import type { ISocketService } from '../application/interfaces/ISocketService';
import type {
    NotificationData,
    MessageData,
} from '../infrastructure/socket/SocketService';

export class SomeController {
    constructor(private socketService: ISocketService) {}

    public async someAction(): Promise<void> {
        // Send notification to a specific user
        const notification: NotificationData = {
            id: '123',
            type: 'success',
            title: 'Success',
            message: 'Operation completed successfully',
            timestamp: Date.now(),
            userId: 'user-123',
        };

        this.socketService.sendNotification(notification);

        // Send message to all users in a room
        const message: MessageData = {
            id: '456',
            senderId: 'user-123',
            receiverId: 'room-789',
            content: 'Hello everyone!',
            timestamp: Date.now(),
            type: 'text',
        };

        this.socketService.sendRoomMessage('room-789', message);
    }
}
```

### Client-Side Implementation

#### 1. Connect to Socket.io Server

```javascript
import { io } from 'socket.io-client';

// Connect to Socket.io server
const socket = io('http://localhost:3000', {
    auth: {
        token: 'YOUR_JWT_TOKEN',
    },
});

// Connection event
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

// Authentication success
socket.on('authentication-success', (data) => {
    console.log('Authenticated:', data.userId);
});

// Disconnect event
socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});
```

#### 2. Receive Notifications and Messages

```javascript
// Listen for notifications
socket.on('notification', (notification) => {
    console.log('New notification:', notification);
    // Display notification to user
    showNotification(notification);
});

// Listen for messages
socket.on('message', (message) => {
    console.log('New message:', message);
    // Display message in chat interface
    showMessage(message);
});
```

#### 3. Send Messages

```javascript
// Send direct message
const message = {
    id: 'unique-message-id',
    senderId: 'current-user-id',
    receiverId: 'target-user-id',
    content: 'Hello there!',
    timestamp: Date.now(),
    type: 'text',
};

socket.emit('message', message);

// Join a room
socket.emit('join-room', 'room-id');

// Leave a room
socket.emit('leave-room', 'room-id');
```

## API Reference

### Socket Service Methods

#### sendNotification(data: NotificationData)

Sends a notification to a specific user if they are online.

#### sendDirectMessage(data: MessageData)

Sends a direct message to a specific user if they are online.

#### sendRoomMessage(roomId: string, data: MessageData)

Sends a message to all users in a specific room.

#### sendRoomNotification(roomId: string, data: NotificationData)

Sends a notification to all users in a specific room.

#### sendBroadcastNotification(data: NotificationData)

Sends a notification to all connected users.

#### getActiveConnections()

Returns the number of active Socket.io connections.

#### getActiveUsersCount()

Returns the number of authenticated active users.

#### getActiveUsers()

Returns an array of all authenticated user IDs.

#### isUserOnline(userId: string)

Checks if a user is currently online.

## Configuration

### Socket.io Options

The Socket.io server is configured with the following options:

```typescript
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});
```

- `cors`: Enables CORS with credentials support
- `pingTimeout`: Timeout for ping events
- `pingInterval`: Interval between ping events

## Security Considerations

1. **Authentication**: Socket connections require JWT token authentication
2. **Authorization**: Role-based access control can be implemented
3. **Rate Limiting**: Add rate limiting for Socket connections
4. **Data Validation**: Validate all incoming Socket data
5. **Encryption**: Use HTTPS and WSS for secure connections

## Troubleshooting

### Common Issues

1. **Connection Errors**: Check CORS configuration and server address
2. **Authentication Failures**: Verify JWT token validity and format
3. **Message Delivery Failures**: Check user online status and room membership
4. **Performance Issues**: Monitor active connections and optimize event handling

### Debugging Tips

1. Use Socket.io debugging tools
2. Monitor server logs for connection events
3. Test with simple echo events
4. Use network tools to inspect Socket traffic

## Performance Optimization

1. **Use Rooms and Namespaces**: Organize connections efficiently
2. **Limit Event Payloads**: Keep messages small and focused
3. **Clean Up Connections**: Ensure proper disconnection handling
4. **Scale Horizontally**: Use Socket.io adapter for scaling
5. **Optimize Events**: Reduce unnecessary event emissions

## Future Enhancements

- Implement Socket.io adapter for horizontal scaling
- Add persistent message storage
- Implement typing indicators
- Add message read receipts
- Enhance security with rate limiting and IP filtering
- Add Socket.io health monitoring
