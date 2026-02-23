import { QueueManager } from './QueueManager';
import type { JobType, JobData } from './QueueManager';
import type { IQueueService } from '../../application/interfaces/IQueueService';

class QueueService implements IQueueService {
    private readonly queueManager: QueueManager;

    constructor(redisUrl: string) {
        this.queueManager = new QueueManager(redisUrl);
    }

    async addJob(
        queueName: string,
        jobType: JobType,
        data: JobData,
        options?: any,
    ): Promise<any> {
        return this.queueManager.addJob(queueName, jobType, data, options);
    }

    createWorker(
        queueName: string,
        processor: (job: any) => Promise<void>,
    ): any {
        return this.queueManager.createWorker(queueName, processor);
    }

    async close(): Promise<void> {
        return this.queueManager.close();
    }
}

export { QueueService };
