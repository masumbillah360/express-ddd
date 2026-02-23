export interface UserProps {
    id?: string;
    name: string;
    email: string;
    password: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class User {
    private readonly props: UserProps;

    private constructor(props: UserProps) {
        this.props = { ...props };
    }

    /**
     * Factory: create a brand-new user (registration).
     * Business rule: new users are always unverified.
     */
    static create(input: {
        name: string;
        email: string;
        password: string;
    }): User {
        return new User({
            ...input,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Factory: reconstitute a user from persistence (DB → Domain).
     * No business rules applied — this is a "hydration" path.
     */
    static reconstitute(props: UserProps): User {
        return new User(props);
    }

    // --- Getters (read-only access to internals) ---

    get id(): string | undefined {
        return this.props.id;
    }
    get name(): string {
        return this.props.name;
    }
    get email(): string {
        return this.props.email;
    }
    get password(): string {
        return this.props.password;
    }
    get isVerified(): boolean {
        return this.props.isVerified;
    }
    get createdAt(): Date {
        return this.props.createdAt;
    }
    get updatedAt(): Date {
        return this.props.updatedAt;
    }

    // --- Domain Behaviors (encapsulated business rules) ---

    markAsVerified(): void {
        if (this.props.isVerified) {
            throw new Error('User is already verified');
        }
        this.props.isVerified = true;
        this.props.updatedAt = new Date();
    }

    changePassword(newHashedPassword: string): void {
        this.props.password = newHashedPassword;
        this.props.updatedAt = new Date();
    }
}
