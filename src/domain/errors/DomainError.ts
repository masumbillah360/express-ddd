export class DomainError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class UserNotFoundError extends DomainError {
    constructor() {
        super('User not found', 404);
    }
}

export class UserAlreadyExistsError extends DomainError {
    constructor() {
        super('User with this email already exists', 409);
    }
}

export class InvalidCredentialsError extends DomainError {
    constructor() {
        super('Invalid email or password', 401);
    }
}

export class InvalidOTPError extends DomainError {
    constructor() {
        super('Invalid or expired OTP', 400);
    }
}

export class UserNotVerifiedError extends DomainError {
    constructor() {
        super('Please verify your email first', 403);
    }
}

export class UserAlreadyVerifiedError extends DomainError {
    constructor() {
        super('User is already verified', 400);
    }
}

export class InvalidTokenError extends DomainError {
    constructor() {
        super('Invalid or expired token', 401);
    }
}
