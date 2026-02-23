import { UserNotFoundError } from '../../../domain/errors/DomainError';
import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type IEmailService } from '../../interfaces/IEmailService';

export class ForgotPasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
        private readonly emailService: IEmailService,
        private readonly otpExpiryMinutes: number,
    ) {}

    async execute(email: string): Promise<{ message: string }> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) throw new UserNotFoundError();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await this.cacheService.set(
            `otp:reset-password:${email.toLowerCase()}`,
            otp,
            this.otpExpiryMinutes * 60,
        );

        await this.emailService.sendMail({
            to: email,
            subject: 'Reset your password',
            html: `
        <h1>Password Reset</h1>
        <p>Your OTP: <strong>${otp}</strong></p>
        <p>Expires in ${this.otpExpiryMinutes} minutes.</p>
      `,
        });

        return { message: 'Password reset OTP sent to your email.' };
    }
}
