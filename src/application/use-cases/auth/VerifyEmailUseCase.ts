import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    UserNotFoundError,
    UserAlreadyVerifiedError,
    InvalidOTPError,
} from '../../../domain/errors/DomainError';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type VerifyEmailDTO } from '../../dtos/auth/VerifyEmailDTO';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

export class VerifyEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
        private readonly metrics: MetricsService,
    ) {}

    async execute(dto: VerifyEmailDTO): Promise<{ message: string }> {
        logger.debug('Verify email request received', { email: dto.email });

        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            logger.warn('User not found for email verification', {
                email: dto.email,
            });
            throw new UserNotFoundError();
        }

        if (user.isVerified) {
            logger.warn('User already verified', {
                email: dto.email,
                userId: user.id,
            });
            throw new UserAlreadyVerifiedError();
        }

        // Verify OTP from Redis (case-insensitive email handling)
        const cachedOTP = await this.cacheService.get(
            `otp:verify-email:${dto.email.toLowerCase()}`,
        );

        if (!cachedOTP || String(cachedOTP) !== String(dto.otp)) {
            logger.warn('Invalid OTP for email verification', {
                email: dto.email,
                userId: user.id,
            });
            this.metrics.recordOTPVerified('verify-email', 'failure');
            throw new InvalidOTPError();
        }

        // Domain behavior
        user.markAsVerified();
        await this.userRepository.update(user);

        // Cleanup
        await this.cacheService.delete(`otp:verify-email:${dto.email}`);

        this.metrics.recordOTPVerified('verify-email', 'success');
        logger.info('Email verified successfully', {
            email: dto.email,
            userId: user.id,
        });

        return { message: 'Email verified successfully.' };
    }
}
