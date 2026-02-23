import nodemailer, { type Transporter } from 'nodemailer';
import {
    type IEmailService,
    type EmailOptions,
} from '../../application/interfaces/IEmailService';

export class NodemailerEmailService implements IEmailService {
    private readonly transporter: Transporter;
    private readonly fromAddress: string;

    constructor(smtpHost: string, smtpPort: number, fromAddress: string) {
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
        });
        this.fromAddress = fromAddress;
        console.log(`✅ Email service configured (${smtpHost}:${smtpPort})`);
    }

    async sendMail(options: EmailOptions): Promise<void> {
        await this.transporter.sendMail({
            from: this.fromAddress,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
    }
}
