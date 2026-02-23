import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    UserNotFoundError,
    UserAlreadyVerifiedError,
    InvalidOTPError,
} from '../../../domain/errors/DomainError';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type VerifyEmailDTO } from '../../dtos/auth/VerifyEmailDTO';

export class VerifyEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly cacheService: ICacheService,
    ) {}

    async execute(dto: VerifyEmailDTO): Promise<{ message: string }> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new UserNotFoundError();
        if (user.isVerified) throw new UserAlreadyVerifiedError();

        // Verify OTP from Redis
        const cachedOTP = await this.cacheService.get(
            `otp:verify-email:${dto.email}`,
        );
        if (!cachedOTP || cachedOTP !== dto.otp) throw new InvalidOTPError();

        // Domain behavior
        user.markAsVerified();
        await this.userRepository.update(user);

        // Cleanup
        await this.cacheService.delete(`otp:verify-email:${dto.email}`);

        return { message: 'Email verified successfully.' };
    }
}
