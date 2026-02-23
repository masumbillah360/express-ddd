import type { JobType, JobData } from '../../infrastructure/queue/QueueManager';

export interface IQueueService {
  addJob(queueName: string, jobType: JobType, data: JobData, options?: any): Promise<any>;
  createWorker(queueName: string, processor: (job: any) => Promise<void>): any;
  close(): Promise<void>;
}
