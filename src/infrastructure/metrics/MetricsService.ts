import client from 'prom-client';

// Register all the default metrics
client.collectDefaultMetrics();

// Create custom metrics
const emailSentCounter = new client.Counter({
    name: 'email_sent_total',
    help: 'Total number of emails sent',
    labelNames: ['status', 'purpose'],
});

const emailSendDuration = new client.Histogram({
    name: 'email_send_duration_seconds',
    help: 'Duration of email sending operations',
    labelNames: ['purpose'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const jobProcessedCounter = new client.Counter({
    name: 'jobs_processed_total',
    help: 'Total number of jobs processed',
    labelNames: ['queue', 'jobType', 'status'],
});

const jobProcessDuration = new client.Histogram({
    name: 'job_process_duration_seconds',
    help: 'Duration of job processing operations',
    labelNames: ['queue', 'jobType'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const cacheHitCounter = new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cacheKey'],
});

const cacheMissCounter = new client.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cacheKey'],
});

const databaseQueryDuration = new client.Histogram({
    name: 'database_query_duration_seconds',
    help: 'Duration of database query operations',
    labelNames: ['table', 'operation'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const rateLimitExceededCounter = new client.Counter({
    name: 'rate_limit_exceeded_total',
    help: 'Total number of rate limit exceeded events',
    labelNames: ['identifier'],
});

const otpGeneratedCounter = new client.Counter({
    name: 'otp_generated_total',
    help: 'Total number of OTPs generated',
    labelNames: ['purpose'],
});

const otpVerifiedCounter = new client.Counter({
    name: 'otp_verified_total',
    help: 'Total number of OTPs verified',
    labelNames: ['purpose', 'status'],
});

const otpExpiredCounter = new client.Counter({
    name: 'otp_expired_total',
    help: 'Total number of expired OTPs',
    labelNames: ['purpose'],
});

const requestDurationHistogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests',
    labelNames: ['method', 'path', 'statusCode', 'userId'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const requestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'statusCode', 'userId'],
});

class MetricsService {
    // Request metrics
    recordRequestDuration(
        method: string,
        path: string,
        statusCode: number,
        durationMs: number,
        userId?: string,
    ): void {
        const durationSeconds = durationMs / 1000;
        requestDurationHistogram.observe(
            {
                method,
                path,
                statusCode,
                userId: userId || 'anonymous',
            },
            durationSeconds,
        );

        requestCounter.inc({
            method,
            path,
            statusCode,
            userId: userId || 'anonymous',
        });
    }
    // Email metrics
    recordEmailSent(status: 'success' | 'failure', purpose?: string): void {
        emailSentCounter.inc({ status, purpose: purpose || 'general' });
    }

    recordEmailSendDuration(duration: number, purpose?: string): void {
        emailSendDuration.observe({ purpose: purpose || 'general' }, duration);
    }

    // Rate limit metrics
    recordRateLimitExceeded(identifier: string): void {
        rateLimitExceededCounter.inc({ identifier });
    }

    // OTP metrics
    recordOTPGenerated(purpose: 'verify-email' | 'reset-password'): void {
        otpGeneratedCounter.inc({ purpose });
    }

    recordOTPVerified(
        purpose: 'verify-email' | 'reset-password',
        status: 'success' | 'failure',
    ): void {
        otpVerifiedCounter.inc({ purpose, status });
    }

    recordOTPExpired(purpose: 'verify-email' | 'reset-password'): void {
        otpExpiredCounter.inc({ purpose });
    }

    // Job metrics
    recordJobProcessed(
        queue: string,
        jobType: string,
        status: 'success' | 'failure',
    ): void {
        jobProcessedCounter.inc({ queue, jobType, status });
    }

    recordJobProcessDuration(
        queue: string,
        jobType: string,
        duration: number,
    ): void {
        jobProcessDuration.observe({ queue, jobType }, duration);
    }

    // Cache metrics
    recordCacheHit(cacheKey: string): void {
        cacheHitCounter.inc({ cacheKey });
    }

    recordCacheMiss(cacheKey: string): void {
        cacheMissCounter.inc({ cacheKey });
    }

    // Database metrics
    recordDatabaseQueryDuration(
        table: string,
        operation: string,
        duration: number,
    ): void {
        databaseQueryDuration.observe({ table, operation }, duration);
    }

    // Get metrics as text
    async getMetrics(): Promise<string> {
        return client.register.metrics();
    }
}

export { MetricsService };
export type { Histogram, Counter } from 'prom-client';
