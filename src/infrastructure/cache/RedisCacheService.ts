import Redis from 'ioredis';
import { type ICacheService } from '../../application/interfaces/ICacheService';
import { logger } from '../logger/WinstonLogger';

export class RedisCacheService implements ICacheService {
    private readonly client: Redis;

    constructor(host: string, port: number) {
        this.client = new Redis({ host, port });

        this.client.on('connect', () => logger.info('Redis connected'));
        this.client.on('error', (err) =>
            logger.error('Redis error', { error: err.message }),
        );
    }

    async set(
        key: string,
        value: string | object,
        ttlSeconds?: number,
    ): Promise<void> {
        const serializedValue =
            typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, serializedValue);
        } else {
            await this.client.set(key, serializedValue);
        }
    }

    async get(key: string): Promise<string | object | null> {
        const value = await this.client.get(key);
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }
}
