import { env } from '../infrastructure/config/env';

// Infrastructure
import { MongoUserRepository } from '../infrastructure/database/mongodb/repositories/MongoUserRepository';
import { RedisCacheService } from '../infrastructure/cache/RedisCacheService';
import { NodemailerEmailService } from '../infrastructure/email/NodemailerEmailService';
import { BcryptHashService } from '../infrastructure/security/BcryptHashService';
import { JWTTokenService } from '../infrastructure/security/JWTTokenService';
import { QueueService } from '../infrastructure/queue/QueueService';
import { MetricsService } from '../infrastructure/metrics/MetricsService';
import { EmailJobProcessor } from '../infrastructure/queue/EmailJobProcessor';

// Use Cases
import { RegisterUseCase } from '../application/use-cases/auth/RegisterUseCase';
import { LoginUseCase } from '../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../application/use-cases/auth/RefreshTokenUseCase';
import { VerifyEmailUseCase } from '../application/use-cases/auth/VerifyEmailUseCase';
import { ForgotPasswordUseCase } from '../application/use-cases/auth/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../application/use-cases/auth/ResetPasswordUseCase';
import { ResendOTPUseCase } from '../application/use-cases/auth/ResendOTPUseCase';
import { LogoutUseCase } from '../application/use-cases/auth/LogoutUseCase';

// Presentation
import { AuthController } from '../presentation/http/controllers/AuthController';

export function createContainer() {
    // ─── Infrastructure Services ───────────────────────────────
    const userRepository = new MongoUserRepository();
    const hashService = new BcryptHashService(12);
    const metricsService = new MetricsService();
    const cacheService = new RedisCacheService(env.redis.host, env.redis.port);
    const emailService = new NodemailerEmailService(
        env.email.smtpHost,
        env.email.smtpPort,
        env.email.from,
        metricsService,
    );
    const queueService = new QueueService(
        `redis://${env.redis.host}:${env.redis.port}`,
    );
    const tokenService = new JWTTokenService(
        env.jwt.accessTokenSecret,
        env.jwt.refreshTokenSecret,
        env.jwt.accessTokenExpiry,
        env.jwt.refreshTokenExpiry,
    );

    // Create job processors
    const emailJobProcessor = new EmailJobProcessor(
        emailService,
        metricsService,
    );
    queueService.createWorker(
        'email-queue',
        emailJobProcessor.process.bind(emailJobProcessor),
    );

    const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    // ─── Use Cases ─────────────────────────────────────────────
    const registerUC = new RegisterUseCase(
        userRepository,
        hashService,
        cacheService,
        queueService,
        metricsService,
        env.otp.expiryMinutes,
    );

    const loginUC = new LoginUseCase(
        userRepository,
        hashService,
        tokenService,
        cacheService,
        REFRESH_TOKEN_TTL,
    );

    const refreshTokenUC = new RefreshTokenUseCase(
        tokenService,
        cacheService,
        userRepository,
        REFRESH_TOKEN_TTL,
    );

    const verifyEmailUC = new VerifyEmailUseCase(userRepository, cacheService);

    const forgotPasswordUC = new ForgotPasswordUseCase(
        userRepository,
        cacheService,
        emailService,
        env.otp.expiryMinutes,
    );

    const resetPasswordUC = new ResetPasswordUseCase(
        userRepository,
        hashService,
        cacheService,
    );

    const resendOTPUC = new ResendOTPUseCase(
        userRepository,
        cacheService,
        emailService,
        env.otp.expiryMinutes,
    );

    const logoutUC = new LogoutUseCase(tokenService, cacheService);

    // ─── Controllers ───────────────────────────────────────────
    const authController = new AuthController(
        registerUC,
        loginUC,
        refreshTokenUC,
        verifyEmailUC,
        forgotPasswordUC,
        resetPasswordUC,
        resendOTPUC,
        logoutUC,
    );

    return {
        authController,
        tokenService,
        metricsService,
    };
}
