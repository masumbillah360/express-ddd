import { type ITokenService } from '../../interfaces/ITokenService';
import { type ICacheService } from '../../interfaces/ICacheService';

export class LogoutUseCase {
    constructor(
        private readonly tokenService: ITokenService,
        private readonly cacheService: ICacheService,
    ) {}

    async execute(refreshToken: string): Promise<void> {
        try {
            const payload = this.tokenService.verifyRefreshToken(refreshToken);
            await this.cacheService.delete(
                `refresh:${payload.userId}:${payload.tokenId}`,
            );
        } catch {
            // Token already invalid — that's fine, we're logging out anyway
        }
    }
}
