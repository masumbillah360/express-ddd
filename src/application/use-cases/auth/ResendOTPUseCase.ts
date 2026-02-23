import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    UserNotFoundError,
    UserAlreadyVerifiedError,
} from '../../../domain/errors/DomainError';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type IEmailService } from '../../interfaces/IEmailService';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

export class ResendOTPUseCase {
    private static readonly RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
        private readonly emailService: IEmailService,
        private readonly otpExpiryMinutes: number,
        private readonly metrics: MetricsService,
    ) {}

    async execute(
        email: string,
        purpose: 'verify-email' | 'reset-password',
    ): Promise<{ message: string }> {
        // 1. Input validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            logger.warn('Invalid email format for resend OTP', {
                email,
                purpose,
            });
            throw new Error('Invalid email format');
        }

        if (!['verify-email', 'reset-password'].includes(purpose)) {
            logger.warn('Invalid OTP purpose', { email, purpose });
            throw new Error('Invalid OTP purpose');
        }

        // 2. Check resend cooldown
        const cooldownKey = `resend-otp-cooldown:${purpose}:${email.toLowerCase()}`;
        const lastSentTime = await this.cacheService.get(cooldownKey);

        if (lastSentTime && typeof lastSentTime === 'string') {
            const timeSinceLastSent = Date.now() - parseInt(lastSentTime);
            if (
                timeSinceLastSent <
                ResendOTPUseCase.RESEND_COOLDOWN_SECONDS * 1000
            ) {
                const remainingCooldown = Math.ceil(
                    (ResendOTPUseCase.RESEND_COOLDOWN_SECONDS * 1000 -
                        timeSinceLastSent) /
                        1000,
                );
                logger.warn('Resend OTP cooldown active', {
                    email,
                    purpose,
                    remainingCooldown,
                });
                throw new Error(
                    `Please wait ${remainingCooldown} seconds before requesting another OTP`,
                );
            }
        }

        logger.debug('Resend OTP request received', { email, purpose });

        // 3. Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            logger.warn('User not found for resend OTP', { email, purpose });
            throw new UserNotFoundError();
        }

        // 4. Check user state
        if (purpose === 'verify-email' && user.isVerified) {
            logger.warn('User already verified', {
                email,
                purpose,
                userId: user.id,
            });
            throw new UserAlreadyVerifiedError();
        }

        // 5. Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cacheService.set(
            `otp:${purpose}:${email.toLowerCase()}`,
            otp,
            this.otpExpiryMinutes * 60,
        );

        // 6. Set resend cooldown
        await this.cacheService.set(
            cooldownKey,
            Date.now().toString(),
            ResendOTPUseCase.RESEND_COOLDOWN_SECONDS,
        );

        // 7. Send email
        const subject =
            purpose === 'verify-email'
                ? 'Verify your email'
                : 'Reset your password';

        try {
            const emailStartTime = Date.now();
            await this.emailService.sendMail({
                to: email,
                subject,
                html: `<p>Your OTP: <strong>${otp}</strong></p><p>Expires in ${this.otpExpiryMinutes} minutes.</p>`,
            });
            const emailDuration = (Date.now() - emailStartTime) / 1000;

            this.metrics.recordEmailSent('success', purpose);
            this.metrics.recordEmailSendDuration(emailDuration, purpose);
            this.metrics.recordOTPGenerated(purpose);

            logger.info('OTP email sent successfully', {
                email,
                purpose,
                userId: user.id,
                duration: emailDuration.toFixed(2),
            });
        } catch (emailError: any) {
            this.metrics.recordEmailSent('failure', purpose);
            logger.error('Failed to send OTP email', {
                email,
                purpose,
                userId: user.id,
                error: emailError.message,
            });
            throw new Error('Failed to send OTP. Please try again later.');
        }

        return { message: 'OTP sent to your email.' };
    }
}
