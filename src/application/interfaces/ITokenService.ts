export interface TokenPayload {
    userId: string;
    email: string;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
}

export interface ITokenService {
    generateAccessToken(payload: TokenPayload): string;
    generateRefreshToken(userId: string): { token: string; tokenId: string };
    verifyAccessToken(token: string): TokenPayload;
    verifyRefreshToken(token: string): RefreshTokenPayload;
}
