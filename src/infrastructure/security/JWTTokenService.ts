import jwt, {
    type SignOptions,
    type VerifyOptions,
    type JwtPayload,
} from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
    type ITokenService,
    type TokenPayload,
    type RefreshTokenPayload,
} from '../../application/interfaces/ITokenService';
import { InvalidTokenError } from '../../domain/errors/DomainError';

export class JWTTokenService implements ITokenService {
    constructor(
        private readonly accessSecret: string,
        private readonly refreshSecret: string,
        private readonly accessExpiry: string,
        private readonly refreshExpiry: string,
    ) {}

    generateAccessToken(payload: TokenPayload): string {
        const options = {
            expiresIn: this.accessExpiry,
        } as unknown as SignOptions;
        return jwt.sign(
            { userId: payload.userId, email: payload.email },
            this.accessSecret as jwt.Secret,
            options,
        );
    }

    generateRefreshToken(userId: string): { token: string; tokenId: string } {
        const tokenId = uuidv4();
        const options = {
            expiresIn: this.refreshExpiry,
        } as unknown as SignOptions;
        const token = jwt.sign(
            { userId, tokenId },
            this.refreshSecret as jwt.Secret,
            options,
        );
        return { token, tokenId };
    }

    verifyAccessToken(token: string): TokenPayload {
        try {
            const options: VerifyOptions = {};
            const decoded = jwt.verify(
                token,
                this.accessSecret as jwt.Secret,
                options,
            ) as JwtPayload;
            return { userId: decoded.userId, email: decoded.email };
        } catch {
            throw new InvalidTokenError();
        }
    }

    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            const options: VerifyOptions = {};
            const decoded = jwt.verify(
                token,
                this.refreshSecret as jwt.Secret,
                options,
            ) as JwtPayload;
            return { userId: decoded.userId, tokenId: decoded.tokenId };
        } catch {
            throw new InvalidTokenError();
        }
    }
}
