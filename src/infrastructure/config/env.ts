import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = ['ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET'];
for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
}

export const env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '8080', 10),

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27019/ddd-auth',
    },

    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },

    jwt: {
        accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
        refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    },

    email: {
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
        from: process.env.EMAIL_FROM || 'noreply@ddd-auth.com',
    },

    otp: {
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    },
} as const;
