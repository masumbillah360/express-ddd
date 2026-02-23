import nodemailer, { type Transporter } from 'nodemailer';
import {
    type IEmailService,
    type EmailOptions,
} from '../../application/interfaces/IEmailService';
import { logger } from '../logger/WinstonLogger';
import { MetricsService } from '../metrics/MetricsService';

export class NodemailerEmailService implements IEmailService {
    private readonly transporter: Transporter;
    private readonly fromAddress: string;
    private readonly metricsService: MetricsService;

    constructor(
        smtpHost: string,
        smtpPort: number,
        fromAddress: string,
        metricsService: MetricsService,
    ) {
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
        });
        this.fromAddress = fromAddress;
        this.metricsService = metricsService;
        logger.info(`Email service configured`, {
            host: smtpHost,
            port: smtpPort,
        });
    }

    async sendMail(options: EmailOptions): Promise<void> {
        const startTime = Date.now();

        try {
            logger.debug('Sending email', {
                to: options.to,
                subject: options.subject,
            });

            await this.transporter.sendMail({
                from: this.fromAddress,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordEmailSent('success');
            this.metricsService.recordEmailSendDuration(duration);

            logger.info('Email sent successfully', {
                to: options.to,
                subject: options.subject,
                duration,
            });
        } catch (error) {
            const duration = (Date.now() - startTime) / 1000;
            this.metricsService.recordEmailSent('failure');
            this.metricsService.recordEmailSendDuration(duration);

            logger.error('Failed to send email', {
                to: options.to,
                subject: options.subject,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                duration,
            });

            throw error;
        }
    }
}
