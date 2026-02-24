import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    },
);

// Index for faster lookups
userSchema.index({ email: 1 });

export const UserModel =
    mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
