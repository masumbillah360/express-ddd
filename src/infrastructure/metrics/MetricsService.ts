import client from 'prom-client';

// Register all the default metrics
client.collectDefaultMetrics();

// Create custom metrics
const emailSentCounter = new client.Counter({
    name: 'email_sent_total',
    help: 'Total number of emails sent',
    labelNames: ['status'],
});

const emailSendDuration = new client.Histogram({
    name: 'email_send_duration_seconds',
    help: 'Duration of email sending operations',
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

class MetricsService {
    // Email metrics
    recordEmailSent(status: 'success' | 'failure'): void {
        emailSentCounter.inc({ status });
    }

    recordEmailSendDuration(duration: number): void {
        emailSendDuration.observe(duration);
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
