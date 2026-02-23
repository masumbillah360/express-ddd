import bcrypt from 'bcryptjs';
import { type IHashService } from '../../application/interfaces/IHashService';

export class BcryptHashService implements IHashService {
    constructor(private readonly saltRounds: number = 12) {}

    async hash(value: string): Promise<string> {
        return bcrypt.hash(value, this.saltRounds);
    }

    async compare(value: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(value, hashed);
    }
}
