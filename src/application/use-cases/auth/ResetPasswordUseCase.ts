import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    UserNotFoundError,
    InvalidOTPError,
} from '../../../domain/errors/DomainError';
import { type IHashService } from '../../interfaces/IHashService';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type ResetPasswordDTO } from '../../dtos/auth/ResetPasswordDTO';

export class ResetPasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly hashService: IHashService,
        private readonly cacheService: ICacheService,
    ) {}

    async execute(dto: ResetPasswordDTO): Promise<{ message: string }> {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new UserNotFoundError();

        // Verify OTP (case-insensitive email handling)
        const cached = await this.cacheService.get(
            `otp:reset-password:${dto.email.toLowerCase()}`,
        );
        if (!cached || String(cached) !== String(dto.otp)) throw new InvalidOTPError();

        // Domain behavior
        const hashed = await this.hashService.hash(dto.newPassword);
        user.changePassword(hashed);
        await this.userRepository.update(user);

        // Cleanup
        await this.cacheService.delete(`otp:reset-password:${dto.email}`);

        return { message: 'Password reset successful.' };
    }
}
