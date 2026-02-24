import mongoose from 'mongoose';
import { logger } from '../../logger/WinstonLogger';

export const connectDatabase = async (uri: string): Promise<void> => {
    try {
        await mongoose.connect(uri);
        logger.info('✅ MongoDB connected');
    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
