import { User } from '../../../../domain/entities/User';
import { type IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { UserModel, type IUserDocument } from '../models/UserModel';

export class MongoUserRepository implements IUserRepository {
    /**
     * Maps a Mongoose document → Domain Entity.
     * The domain never sees Mongoose types.
     */
    private toDomain(doc: IUserDocument): User {
        return User.reconstitute({
            id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            password: doc.password,
            isVerified: doc.isVerified,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        });
    }

    async create(user: User): Promise<User> {
        const doc = await UserModel.create({
            name: user.name,
            email: user.email,
            password: user.password,
            isVerified: user.isVerified,
        });
        return this.toDomain(doc);
    }

    async findByEmail(email: string): Promise<User | null> {
        const doc = await UserModel.findOne({ email: email.toLowerCase() });
        return doc ? this.toDomain(doc) : null;
    }

    async findById(id: string): Promise<User | null> {
        const doc = await UserModel.findById(id);
        return doc ? this.toDomain(doc) : null;
    }

    async update(user: User): Promise<User> {
        const doc = await UserModel.findByIdAndUpdate(
            user.id,
            {
                name: user.name,
                email: user.email,
                password: user.password,
                isVerified: user.isVerified,
                updatedAt: user.updatedAt,
            },
            { new: true },
        );

        if (!doc) throw new Error('User not found for update');
        return this.toDomain(doc);
    }
}
