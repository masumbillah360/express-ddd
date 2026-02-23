import { type IUserRepository } from '../../../domain/repositories/IUserRepository';
import {
    InvalidTokenError,
    UserNotFoundError,
} from '../../../domain/errors/DomainError';
import { type ITokenService } from '../../interfaces/ITokenService';
import { type ICacheService } from '../../interfaces/ICacheService';

export class RefreshTokenUseCase {
    constructor(
        private readonly tokenService: ITokenService,
        private readonly cacheService: ICacheService,
        private readonly userRepository: IUserRepository,
        private readonly refreshTokenTTL: number,
    ) {}

    async execute(
        oldRefreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // 1. Verify the old refresh token
        const payload = this.tokenService.verifyRefreshToken(oldRefreshToken);

        // 2. Check it exists in Redis (not revoked)
        const key = `refresh:${payload.userId}:${payload.tokenId}`;
        const exists = await this.cacheService.exists(key);
        if (!exists) throw new InvalidTokenError();

        // 3. Revoke old token (rotate)
        await this.cacheService.delete(key);

        // 4. Verify user still exists
        const user = await this.userRepository.findById(payload.userId);
        if (!user) throw new UserNotFoundError();

        // 5. Issue new pair
        const accessToken = this.tokenService.generateAccessToken({
            userId: user.id!,
            email: user.email,
        });

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
