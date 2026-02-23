import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    InvalidCredentialsError,
    UserNotVerifiedError,
} from '../../../domain/errors/DomainError';
import { type IHashService } from '../../interfaces/IHashService';
import { type ITokenService } from '../../interfaces/ITokenService';
import { type ICacheService } from '../../interfaces/ICacheService';
import { type LoginDTO } from '../../dtos/auth/LoginDTO';

export class LoginUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly hashService: IHashService,
        private readonly tokenService: ITokenService,
        private readonly cacheService: ICacheService,
        private readonly refreshTokenTTL: number, // seconds
    ) {}

    async execute(
        dto: LoginDTO,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // 1. Find user
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new InvalidCredentialsError();

        // 2. Verify password
        const valid = await this.hashService.compare(
            dto.password,
            user.password,
        );
        if (!valid) throw new InvalidCredentialsError();

        // 3. Must be verified
        if (!user.isVerified) throw new UserNotVerifiedError();

        // 4. Generate access token
        const accessToken = this.tokenService.generateAccessToken({
            userId: user.id!,
            email: user.email,
        });

        // 5. Generate refresh token + store in Redis
        const { token: refreshToken, tokenId } =
            this.tokenService.generateRefreshToken(user.id!);

        await this.cacheService.set(
            `refresh:${user.id}:${tokenId}`,
            'valid',
            this.refreshTokenTTL,
        );

        return { accessToken, refreshToken };
    }
}
