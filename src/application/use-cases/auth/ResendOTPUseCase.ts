import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    UserNotFoundError,
    UserAlreadyVerifiedError,
} from '../../../domain/errors/DomainError';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type IEmailService } from '../../interfaces/IEmailService';

export class ResendOTPUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
        private readonly emailService: IEmailService,
        private readonly otpExpiryMinutes: number,
    ) {}

    async execute(
        email: string,
        purpose: 'verify-email' | 'reset-password',
    ): Promise<{ message: string }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new UserNotFoundError();

        if (purpose === 'verify-email' && user.isVerified) {
            throw new UserAlreadyVerifiedError();
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cacheService.set(
            `otp:${purpose}:${email.toLowerCase()}`,
            otp,
            this.otpExpiryMinutes * 60,
        );

        const subject =
            purpose === 'verify-email'
                ? 'Verify your email'
                : 'Reset your password';

        await this.emailService.sendMail({
            to: email,
            subject,
            html: `<p>Your OTP: <strong>${otp}</strong></p><p>Expires in ${this.otpExpiryMinutes} minutes.</p>`,
        });

        return { message: 'OTP sent to your email.' };
    }
}
