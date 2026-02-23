import { env } from '../infrastructure/config/env';
import { connectDatabase } from '../infrastructure/database/mongodb/connection';
import { createApp } from './app';
import { createContainer } from './container';
import { logger } from '../infrastructure/logger/WinstonLogger';

async function bootstrap(): Promise<void> {
    try {
        // 1. Connect to database
        await connectDatabase(env.mongodb.uri);
        logger.info('Database connected', { uri: env.mongodb.uri });

        // 2. Build the dependency graph
        const { authController, tokenService, metricsService } =
            createContainer();

        // 3. Create Express app with injected dependencies
        const app = createApp(authController, tokenService, metricsService);

        // 4. Start listening
        app.listen(env.port, () => {
            console.log(`
  ╔════════════════════════════════════════════════════════╗
  ║   🚀  Server running on port ${env.port}               ║
  ║   📧  MailHog UI: http://localhost:8026                ║
  ║   🏥  Health:  http://localhost:${env.port}/health     ║
  ╚════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
