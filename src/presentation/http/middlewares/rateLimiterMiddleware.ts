import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logger/WinstonLogger';
import { MetricsService } from '../../../infrastructure/metrics/MetricsService';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    max: number; // Maximum number of requests per windowMs
}

interface RateLimitData {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private readonly store = new Map<string, RateLimitData>();
    private readonly config: RateLimitConfig;
    private readonly metrics: MetricsService;

    constructor(config: RateLimitConfig, metrics: MetricsService) {
        this.config = config;
        this.metrics = metrics;
        this.cleanupStore();
    }

    private cleanupStore(): void {
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.store.entries()) {
                if (data.resetTime < now) {
                    this.store.delete(key);
                }
            }
        }, this.config.windowMs).unref();
    }

    private generateKey(req: Request, identifier: string): string {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return `${identifier}:${ip}`;
    }

    public createMiddleware(
        identifier: string,
        config: RateLimitConfig,
    ): (req: Request, res: Response, next: NextFunction) => void {
        return (req, res, next) => {
            const now = Date.now();
            const key = this.generateKey(req, identifier);
            const existing = this.store.get(key);

            if (existing) {
                if (existing.resetTime < now) {
                    // Window expired, reset count
                    this.store.set(key, {
                        count: 1,
                        resetTime: now + config.windowMs,
                    });
                } else if (existing.count >= config.max) {
                    // Rate limit exceeded
                    logger.warn('Rate limit exceeded', {
                        identifier,
                        key,
                        count: existing.count,
                        max: config.max,
                        resetTime: existing.resetTime,
                    });
                    this.metrics.recordRateLimitExceeded(identifier);
                    res.status(429).json({
                        success: false,
                        message: 'Too many requests. Please try again later.',
                        retryAfter: Math.ceil(
                            (existing.resetTime - now) / 1000,
                        ),
                    });
                    return;
                } else {
                    // Increment count
                    existing.count++;
                }
            } else {
                // First request
                this.store.set(key, {
                    count: 1,
                    resetTime: now + config.windowMs,
                });
            }

            next();
        };
    }
}

// Default configurations
const DEFAULT_CONFIGS = {
    'resend-otp': { windowMs: 60000, max: 3 }, // 3 requests per minute
    'verify-email': { windowMs: 300000, max: 5 }, // 5 requests per 5 minutes
    'forgot-password': { windowMs: 60000, max: 3 }, // 3 requests per minute
    login: { windowMs: 60000, max: 5 }, // 5 requests per minute
};

let instance: RateLimiter;

export const createRateLimiter = (metrics: MetricsService): RateLimiter => {
    if (!instance) {
        instance = new RateLimiter({ windowMs: 60000, max: 10 }, metrics);
    }
    return instance;
};

export const getRateLimitMiddleware = (
    identifier: string,
    metrics: MetricsService,
) => {
    const limiter = createRateLimiter(metrics);
    const config =
        DEFAULT_CONFIGS[identifier as keyof typeof DEFAULT_CONFIGS] ||
        DEFAULT_CONFIGS['login'];
    return limiter.createMiddleware(identifier, config);
};

// Update MetricsService to include rate limit metrics
declare module '../../../infrastructure/metrics/MetricsService' {
    interface MetricsService {
        recordRateLimitExceeded(identifier: string): void;
    }
}
