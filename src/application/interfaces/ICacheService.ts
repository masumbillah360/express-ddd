export interface ICacheService {
    set(
        key: string,
        value: string | object,
        ttlSeconds?: number,
    ): Promise<void>;
    get(key: string): Promise<string | object | null>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
