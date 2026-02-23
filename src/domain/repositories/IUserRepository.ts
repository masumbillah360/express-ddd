import { User } from '../entities/User';

/**
 * Repository interface — this is a PORT.
 * The domain says "I need these capabilities" without caring
 * whether it's MongoDB, Postgres, or a text file behind the scenes.
 */
export interface IUserRepository {
    create(user: User): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    update(user: User): Promise<User>;
}
