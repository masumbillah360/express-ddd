import Redis from 'ioredis';
import { type ICacheService } from '../../application/interfaces/ICacheService';

export class RedisCacheService implements ICacheService {
    private readonly client: Redis;

    constructor(host: string, port: number) {
        this.client = new Redis({ host, port });

        this.client.on('connect', () => console.log('✅ Redis connected'));
        this.client.on('error', (err) =>
            console.error('❌ Redis error:', err.message),
        );
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async delete(key: string): Promise<void> {
        await this.client.del(key);
    }

    async exists(key: string): Promise<boolean> {
        const result = await this.client.exists(key);
        return result === 1;
    }
}
