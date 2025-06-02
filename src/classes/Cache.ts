import { getMilliseconds } from '../helpers';

import { CacheOptions } from '../models/CacheOptions';
import { CacheValue } from '../models/CacheValue';

import { ExpirationCallback } from '../types';

import isNode from 'detect-node';

export class Cache<K, T> {
	private options: Required<CacheOptions>;
	private cache = new Map<K, CacheValue<T>>();
	private timeoutHandle: NodeJS.Timeout | number | null = null;

	constructor(options?: CacheOptions) {
		this.options = {
			...{
				maxItems: 1000,
				resolution: 1000,
				// Default timeout is infinity
				defaultTTL: Number.POSITIVE_INFINITY,
			},
			...(options ?? {}),
		};

		// Note: resolution is now deprecated in favor of dynamic timeout scheduling
		// Dynamic timeout scheduling provides better accuracy by scheduling cleanup
		// at the exact moment items expire, rather than checking periodically
	}

	public set(key: K, value: T, ttl?: number, callback?: ExpirationCallback<T>): Cache<K, T> {
		const now = getMilliseconds();

		const wrapped: CacheValue<T> = {
			created: now,
			value,
			ttl: ttl ?? this.options.defaultTTL,
			callback,
		};

		this.cache.set(key, wrapped);

		// Reschedule cleanup since we added a new item
		this.scheduleCleanup();

		return this;
	}

	/**
	 * Returns value by its key
	 *
	 * @param key Key of value to get
	 * @param refresh True to refresh item TTL or false to not
	 */
	public get(key: K, refresh = false): T | undefined {
		const wrapped = this.cache.get(key);
		if (wrapped) {
			if (refresh) {
				const now = getMilliseconds();

				wrapped.created = now;
				
				// Reschedule cleanup since we refreshed an item's TTL
				this.scheduleCleanup();
			}
		}

		return wrapped?.value;
	}

	/**
	 * Takes value by its key from cache.
	 *
	 * Value is returned and key is removed from cache.
	 *
	 * @param key Key to take
	 * @returns Value of specified key
	 */
	public take(key: K): T | undefined {
		const value = this.get(key);
		if (value !== undefined) {
			this.delete(key);
		}

		return value;
	}

	public has(key: K): boolean {
		return this.cache.has(key);
	}

	public delete(key: K): boolean {
		const result = this.cache.delete(key);
		
		// Reschedule cleanup since we removed an item
		if (result) {
			this.scheduleCleanup();
		}
		
		return result;
	}

	public mdelete(keys: K[]): Cache<K, T> {
		let deletedAny = false;
		for (const key of keys) {
			if (this.cache.delete(key)) {
				deletedAny = true;
			}
		}

		// Reschedule cleanup since we may have removed items
		if (deletedAny) {
			this.scheduleCleanup();
		}

		return this;
	}

	public get size(): number {
		return this.cache.size;
	}

	public forEach(cb: (value: T, key: K) => void): void {
		this.cache.forEach((value, key) => {
			cb(value.value, key);
		});
	}

	private cleanup() {
		if (this.cache.size === 0) {
			return;
		}

		const now = getMilliseconds();

		for (const [key, value] of this.cache) {
			if (now > value.created + value.ttl) {
				this.cache.delete(key);

				if (value.callback) {
					value.callback(value.value);
				}
			}
		}

		// Schedule the next cleanup based on remaining items
		this.scheduleCleanup();
	}

	/**
	 * Finds the earliest expiration time among all cached items
	 * @returns The earliest expiration timestamp, or null if no items expire
	 */
	private findEarliestExpiration(): number | null {
		if (this.cache.size === 0) {
			return null;
		}

		let earliest: number | null = null;

		for (const [, value] of this.cache) {
			if (value.ttl !== Number.POSITIVE_INFINITY) {
				const expiration = value.created + value.ttl;
				if (earliest === null || expiration < earliest) {
					earliest = expiration;
				}
			}
		}

		return earliest;
	}

	/**
	 * Schedules the next cleanup based on the earliest expiration time
	 */
	private scheduleCleanup(): void {
		// Clear any existing timeout
		this.clearScheduledCleanup();

		const earliestExpiration = this.findEarliestExpiration();
		if (earliestExpiration === null) {
			// No items to expire
			return;
		}

		const now = getMilliseconds();
		const delay = Math.max(0, earliestExpiration - now);

		if (isNode) {
			this.timeoutHandle = setTimeout(() => this.cleanup(), delay);
			this.timeoutHandle.unref();
		} else {
			this.timeoutHandle = window.setTimeout(() => this.cleanup(), delay);
		}
	}

	/**
	 * Clears any scheduled cleanup timeout
	 */
	private clearScheduledCleanup(): void {
		if (this.timeoutHandle !== null) {
			if (isNode) {
				clearTimeout(this.timeoutHandle);
			} else {
				window.clearTimeout(this.timeoutHandle);
			}
			this.timeoutHandle = null;
		}
	}

	public flush(invokeCallback: boolean = false) {
		if (invokeCallback) {
			for (const [, value] of this.cache) {
				if (value.callback) {
					value.callback(value.value);
				}
			}
		}

		this.cache.clear();
		
		// Clear any scheduled cleanup since cache is empty
		this.clearScheduledCleanup();
	}
}
