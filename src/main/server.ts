import { env } from '../infrastructure/config/env';
import { connectDatabase } from '../infrastructure/database/mongodb/connection';
import { createApp } from './app';
import { createContainer } from './container';
import { logger } from '../infrastructure/logger/WinstonLogger';
import { createServer } from 'http';
import { Server } from 'socket.io';

async function bootstrap(): Promise<void> {
    try {
        // 1. Connect to database
        await connectDatabase(env.mongodb.uri);
        logger.info('Database connected', { uri: env.mongodb.uri });

        // 2. Build the dependency graph
        const {
            authController,
            tokenService,
            metricsService,
            createSocketService,
        } = createContainer();

        // 3. Create Express app with injected dependencies
        const app = createApp(authController, tokenService, metricsService);

        // 4. Create HTTP server and Socket.io server
        const server = createServer(app);
        const io = new Server(server, {
            cors: {
                origin: true,
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        // 5. Initialize Socket service
        createSocketService(io);
        logger.info('Socket.io server initialized');

        // 6. Start listening
        server.listen(env.port, () => {
            console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║   🚀  Server running on port ${env.port}               ║
  ║   📧  MailHog UI: http://localhost:8026                ║
  ║   🏥  Health:  http://localhost:${env.port}/health     ║
  ║   🔌  Socket.io: http://localhost:${env.port}          ║
  ╚════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
