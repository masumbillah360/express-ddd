export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface IEmailService {
    sendMail(options: EmailOptions): Promise<void>;
}
