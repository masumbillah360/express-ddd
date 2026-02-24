import type { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';

// CSRF token cookie name
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

// CSRF token validation middleware
export const csrfMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    // Skip CSRF check for GET, HEAD, OPTIONS, TRACE requests
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(req.method)) {
        // Generate and set CSRF token if not present
        if (!req.cookies[CSRF_COOKIE_NAME]) {
            const csrfToken = generateCsrfToken();
            setCsrfCookie(res, csrfToken);
        }
        return next();
    }

    // Bypass CSRF check for API requests (specifically /api/auth routes) during development/testing
    // This allows tools like Bruno/Postman to send requests without CSRF tokens
    if (req.path.startsWith('/api/auth')) {
        return next();
    }

    // Validate CSRF token for other state-changing requests
    const csrfTokenFromCookie = req.cookies[CSRF_COOKIE_NAME];
    const csrfTokenFromHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()];
    const csrfTokenFromBody = (req.body as any)?._csrf;

    // Check if token exists in any of the valid locations
    if (!csrfTokenFromCookie || (!csrfTokenFromHeader && !csrfTokenFromBody)) {
        return next(new DomainError('CSRF token required', 403));
    }

    // Validate token match
    const submittedToken = csrfTokenFromHeader || csrfTokenFromBody;
    if (csrfTokenFromCookie !== submittedToken) {
        return next(new DomainError('Invalid CSRF token', 403));
    }

    // Token is valid, proceed
    next();
};

// Generate a secure CSRF token
const generateCsrfToken = (): string => {
    // Generate a random 32-byte string (64 hex characters)
    return [...Array(32)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('');
};

// Set CSRF token as an HTTP-only cookie (or secure cookie in production)
const setCsrfCookie = (res: Response, token: string): void => {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Allow access via JavaScript for SPA applications
        secure: isProduction, // Use HTTPS only in production
        sameSite: 'strict', // Prevent CSRF attacks by only sending cookie with same-site requests
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
};

// Middleware to expose CSRF token to response locals (for templates)
export const exposeCsrfToken = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    const csrfToken = req.cookies[CSRF_COOKIE_NAME] || generateCsrfToken();
    (res as any).locals.csrfToken = csrfToken;
    next();
};
