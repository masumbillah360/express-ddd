import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../logger/WinstonLogger';

// Define job types
export type JobType = 'send-email' | 'send-notification' | 'send-sms';

export interface EmailJobData {
    to: string;
    subject: string;
    html: string;
}

export interface NotificationJobData {
    userId: string;
    message: string;
    type: 'email' | 'push' | 'sms';
}

export interface SMSJobData {
    to: string;
    message: string;
}

export interface JobData {
    [key: string]: any;
}

class QueueManager {
    private readonly redisConnection: Redis;
    private readonly queues: Map<string, Queue> = new Map();
    private readonly workers: Worker[] = [];

    constructor(redisUrl: string) {
        this.redisConnection = new Redis(redisUrl, {
            maxRetriesPerRequest: null,
        });
        logger.info('Queue manager initialized', { redisUrl });
    }

    // Create or get a queue
    getQueue(name: string): Queue {
        if (!this.queues.has(name)) {
            const queue = new Queue(name, {
                connection: this.redisConnection,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            });
            this.queues.set(name, queue);
            logger.info('Queue created', { queueName: name });
        }
        return this.queues.get(name)!;
    }

    // Add job to queue
    async addJob(
        queueName: string,
        jobType: JobType,
        data: JobData,
        options?: any,
    ): Promise<Job> {
        const queue = this.getQueue(queueName);
        const job = await queue.add(jobType, data, options);
        logger.info('Job added to queue', {
            queueName,
            jobType,
            jobId: job.id,
        });
        return job;
    }

    // Create worker for queue
    createWorker(
        queueName: string,
        processor: (job: Job) => Promise<void>,
    ): Worker {
        const worker = new Worker(queueName, processor, {
            connection: this.redisConnection,
        });

        worker.on('completed', (job) => {
            logger.info('Job completed', {
                jobId: job.id,
                queueName,
                jobType: job.name,
            });
        });

        worker.on('failed', (job, err) => {
            logger.error('Job failed', {
                jobId: job?.id,
                queueName,
                jobType: job?.name,
                error: err.message,
                stack: err.stack,
            });
        });

        worker.on('error', (err) => {
            logger.error('Worker error', { queueName, error: err.message });
        });

        this.workers.push(worker);
        logger.info('Worker created', { queueName });

        return worker;
    }

    // Gracefully close all connections
    async close(): Promise<void> {
        logger.info('Closing queue manager');

        // Close workers
        await Promise.all(this.workers.map((worker) => worker.close()));

        // Close queues
        await Promise.all(
            Array.from(this.queues.values()).map((queue) => queue.close()),
        );

        // Close Redis connection
        await this.redisConnection.quit();

        logger.info('Queue manager closed');
    }
}

export { QueueManager };
