import { User } from '../../../domain/entities/User';
import { UserAlreadyExistsError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { RegisterDTO } from '../../dtos/auth/RegisterDTO';
import type { ICacheService } from '../../interfaces/ICacheService';
import type { IQueueService } from '../../interfaces/IQueueService';
import type { IHashService } from '../../interfaces/IHashService';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

export class RegisterUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly hashService: IHashService,
        private readonly cacheService: ICacheService,
        private readonly queueService: IQueueService,
        private readonly metricsService: MetricsService,
        private readonly otpExpiryMinutes: number,
    ) {}

    async execute(dto: RegisterDTO): Promise<{ user: User; message: string }> {
        const startTime = Date.now();

        try {
            // 1. Check cache
            const cacheKey = `user:email:${dto.email}`;
            const cachedUser = await this.cacheService.get(cacheKey);
            if (cachedUser) {
                logger.debug('Cache hit for user email', { email: dto.email });
                this.metricsService.recordCacheHit(cacheKey);
                throw new UserAlreadyExistsError();
            }

            this.metricsService.recordCacheMiss(cacheKey);

            const existing = await this.userRepository.findByEmail(dto.email);
            if (existing) {
                await this.cacheService.set(cacheKey, existing, 300); // Cache for 5 minutes
                throw new UserAlreadyExistsError();
            }

            // 2. Hash password
            const hashedPassword = await this.hashService.hash(dto.password);

            // 3. Create domain entity
            const user = User.create({
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
            });

            // 4. Persist
            const savedUser = await this.userRepository.create(user);

            // 5. Generate OTP → store in Redis
            const otp = this.generateOTP();
            await this.cacheService.set(
                `otp:verify-email:${dto.email.toLowerCase()}`,
                otp,
                this.otpExpiryMinutes * 60,
            );

            // 6. Send verification email via background job
            await this.queueService.addJob('email-queue', 'send-email', {
                to: dto.email,
                subject: 'Verify your email',
                html: `
                    <h1>Welcome!</h1>
                    <p>Your verification OTP: <strong>${otp}</strong></p>
                    <p>Expires in ${this.otpExpiryMinutes} minutes.</p>
                `,
            });

            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordDatabaseQueryDuration(
                'users',
                'create',
                duration,
            );

            logger.info('User registered successfully', {
                userId: savedUser.id,
                email: dto.email,
                duration,
            });

            return {
                user: savedUser,
                message:
                    'Registration successful. Please check your email for the verification OTP.',
            };
        } catch (error) {
            logger.error('Failed to register user', {
                email: dto.email,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        }
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
