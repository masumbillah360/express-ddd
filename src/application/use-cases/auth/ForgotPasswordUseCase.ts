import { UserNotFoundError } from '../../../domain/errors/DomainError';
import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type IEmailService } from '../../interfaces/IEmailService';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

export class ForgotPasswordUseCase {
    private static readonly RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
        private readonly emailService: IEmailService,
        private readonly otpExpiryMinutes: number,
        private readonly metrics: MetricsService,
    ) {}

    async execute(email: string): Promise<{ message: string }> {
        const purpose = 'reset-password';

        // 1. Input validation
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            logger.warn('Invalid email format for forgot password', { email });
            throw new Error('Invalid email format');
        }

        // 2. Check cooldown
        const cooldownKey = `forgot-password-cooldown:${email.toLowerCase()}`;
        const lastSentTime = await this.cacheService.get(cooldownKey);

        if (lastSentTime && typeof lastSentTime === 'string') {
            const timeSinceLastSent =
                Date.now() - parseInt(lastSentTime as string);
            if (
                timeSinceLastSent <
                ForgotPasswordUseCase.RESEND_COOLDOWN_SECONDS * 1000
            ) {
                const remainingCooldown = Math.ceil(
                    (ForgotPasswordUseCase.RESEND_COOLDOWN_SECONDS * 1000 -
                        timeSinceLastSent) /
                        1000,
                );
                logger.warn('Forgot password cooldown active', {
                    email,
                    remainingCooldown,
                });
                throw new Error(
                    `Please wait ${remainingCooldown} seconds before requesting another OTP`,
                );
            }
        }

        logger.debug('Forgot password request received', { email });

        // 3. Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            logger.warn('User not found for forgot password', { email });
            throw new UserNotFoundError();
        }

        // 4. Generate and store OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cacheService.set(
            `otp:${purpose}:${email.toLowerCase()}`,
            otp,
            this.otpExpiryMinutes * 60,
        );

        // 5. Set cooldown
        await this.cacheService.set(
            cooldownKey,
            Date.now().toString(),
            ForgotPasswordUseCase.RESEND_COOLDOWN_SECONDS,
        );

        // 6. Send email
        try {
            const emailStartTime = Date.now();
            await this.emailService.sendMail({
                to: email,
                subject: 'Reset your password',
                html: `
                    <h1>Password Reset</h1>
                    <p>Your OTP: <strong>${otp}</strong></p>
                    <p>Expires in ${this.otpExpiryMinutes} minutes.</p>
                `,
            });
            const emailDuration = (Date.now() - emailStartTime) / 1000;

            this.metrics.recordEmailSent('success', purpose);
            this.metrics.recordEmailSendDuration(emailDuration, purpose);
            this.metrics.recordOTPGenerated(purpose);

            logger.info('Forgot password email sent successfully', {
                email,
                userId: user.id,
                duration: emailDuration.toFixed(2),
            });
        } catch (emailError: any) {
            this.metrics.recordEmailSent('failure', purpose);
            logger.error('Failed to send forgot password email', {
                email,
                userId: user.id,
                error: emailError.message,
            });
            throw new Error('Failed to send OTP. Please try again later.');
        }

        return { message: 'Password reset OTP sent to your email.' };
    }
}
