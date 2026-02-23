import { User } from '../../../domain/entities/User';
import { UserAlreadyExistsError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { RegisterDTO } from '../../dtos/auth/RegisterDTO';
import type { ICacheService } from '../../interfaces/ICacheService';
import type { IEmailService } from '../../interfaces/IEmailService';
import type { IHashService } from '../../interfaces/IHashService';

export class RegisterUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly hashService: IHashService,
        private readonly cacheService: ICacheService,
        private readonly emailService: IEmailService,
        private readonly otpExpiryMinutes: number,
    ) {}

    async execute(dto: RegisterDTO): Promise<{ user: User; message: string }> {
        // 1. Check uniqueness
        const existing = await this.userRepository.findByEmail(dto.email);
        if (existing) throw new UserAlreadyExistsError();

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
            `otp:verify-email:${dto.email}`,
            otp,
            this.otpExpiryMinutes * 60,
        );

        // 6. Send verification email
        await this.emailService.sendMail({
            to: dto.email,
            subject: 'Verify your email',
            html: `
        <h1>Welcome!</h1>
        <p>Your verification OTP: <strong>${otp}</strong></p>
        <p>Expires in ${this.otpExpiryMinutes} minutes.</p>
      `,
        });

        return {
            user: savedUser,
            message:
                'Registration successful. Please check your email for the verification OTP.',
        };
    }

    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}
