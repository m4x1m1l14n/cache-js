import { ExpirationCallback } from '../types';

export interface CacheValue<T>
{
	created: number,
	ttl: number;
	value: T;
	callback?: ExpirationCallback<T>;
}
