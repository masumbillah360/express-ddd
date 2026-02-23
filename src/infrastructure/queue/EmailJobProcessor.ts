import { Job } from 'bullmq';
import { logger } from '../logger/WinstonLogger';
import { MetricsService } from '../metrics/MetricsService';
import type { EmailJobData } from './QueueManager';
import type { IEmailService } from '../../application/interfaces/IEmailService';

class EmailJobProcessor {
    constructor(
        private readonly emailService: IEmailService,
        private readonly metricsService: MetricsService,
    ) {}

    async process(job: Job<EmailJobData>): Promise<void> {
        const startTime = Date.now();

        try {
            logger.debug('Processing email job', {
                jobId: job.id,
                to: job.data.to,
                subject: job.data.subject,
            });

            await this.emailService.sendMail({
                to: job.data.to,
                subject: job.data.subject,
                html: job.data.html,
            });

            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordJobProcessed(
                'email-queue',
                'send-email',
                'success',
            );
            this.metricsService.recordJobProcessDuration(
                'email-queue',
                'send-email',
                duration,
            );
            this.metricsService.recordEmailSent('success');
            this.metricsService.recordEmailSendDuration(duration);

            logger.info('Email job processed successfully', {
                jobId: job.id,
                to: job.data.to,
                subject: job.data.subject,
                duration,
            });
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordJobProcessed(
                'email-queue',
                'send-email',
                'failure',
            );
            this.metricsService.recordJobProcessDuration(
                'email-queue',
                'send-email',
                duration,
            );
            this.metricsService.recordEmailSent('failure');
            this.metricsService.recordEmailSendDuration(duration);

            logger.error('Failed to process email job', {
                jobId: job.id,
                to: job.data.to,
                subject: job.data.subject,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration,
            });

            throw error;
        }
    }
}

export { EmailJobProcessor };
