import { getMilliseconds } from '../helpers';

import { CacheOptions } from '../models/CacheOptions';
import { CacheValue } from '../models/CacheValue';
import { ExpirationEntry } from '../models/ExpirationEntry';

import { ExpirationCallback } from '../types';
import { MinHeap } from './MinHeap';

import isNode from 'detect-node';

export class Cache<K, T> {
	private options: Required<CacheOptions>;
	private cache = new Map<K, CacheValue<T>>();
	private timeoutHandle: NodeJS.Timeout | number | null = null;
	private expirationHeap = new MinHeap<K>();

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
		const itemTTL = ttl ?? this.options.defaultTTL;

		const wrapped: CacheValue<T> = {
			created: now,
			value,
			ttl: itemTTL,
			callback,
		};

		// Remove any existing entries for this key from the heap
		this.expirationHeap.removeByKey(key);

		this.cache.set(key, wrapped);

		// Add to expiration heap if item has a finite TTL
		if (itemTTL !== Number.POSITIVE_INFINITY) {
			this.expirationHeap.insert({
				expiration: now + itemTTL,
				key
			});
		}

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
		if (!wrapped) {
			return undefined;
		}

		const now = getMilliseconds();

		// Check if item is expired
		if (wrapped.ttl !== Number.POSITIVE_INFINITY && now > wrapped.created + wrapped.ttl) {
			// Item is expired, remove it
			this.cache.delete(key);
			this.expirationHeap.removeByKey(key);
			
			if (wrapped.callback) {
				wrapped.callback(wrapped.value);
			}
			
			return undefined;
		}

		if (refresh) {
			// Remove old expiration entry from heap
			this.expirationHeap.removeByKey(key);

			wrapped.created = now;
			
			// Add new expiration entry if item has finite TTL
			if (wrapped.ttl !== Number.POSITIVE_INFINITY) {
				this.expirationHeap.insert({
					expiration: now + wrapped.ttl,
					key
				});
			}
			
			// Reschedule cleanup since we refreshed an item's TTL
			this.scheduleCleanup();
		}

		return wrapped.value;
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
		const wrapped = this.cache.get(key);
		if (!wrapped) {
			return false;
		}

		// Check if item is expired
		const now = getMilliseconds();
		if (wrapped.ttl !== Number.POSITIVE_INFINITY && now > wrapped.created + wrapped.ttl) {
			// Item is expired, remove it
			this.cache.delete(key);
			this.expirationHeap.removeByKey(key);
			
			if (wrapped.callback) {
				wrapped.callback(wrapped.value);
			}
			
			return false;
		}

		return true;
	}

	public delete(key: K): boolean {
		const result = this.cache.delete(key);
		
		// Remove from expiration heap and reschedule cleanup since we removed an item
		if (result) {
			this.expirationHeap.removeByKey(key);
			this.scheduleCleanup();
		}
		
		return result;
	}

	public mdelete(keys: K[]): Cache<K, T> {
		let deletedAny = false;
		for (const key of keys) {
			if (this.cache.delete(key)) {
				this.expirationHeap.removeByKey(key);
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

		// Process expired items from the heap
		while (!this.expirationHeap.isEmpty) {
			const nextExpiration = this.expirationHeap.peek();
			if (!nextExpiration || nextExpiration.expiration > now) {
				// No more expired items
				break;
			}

			// Remove the expired entry from heap
			this.expirationHeap.extractMin();

			// Check if the item still exists in cache and is actually expired
			const cached = this.cache.get(nextExpiration.key);
			if (cached && now > cached.created + cached.ttl) {
				// Item is expired, remove it
				this.cache.delete(nextExpiration.key);

				if (cached.callback) {
					cached.callback(cached.value);
				}
			}
		}

		// Schedule the next cleanup based on remaining items
		this.scheduleCleanup();
	}

	/**
	 * Finds the earliest expiration time among all cached items using the heap
	 * @returns The earliest expiration timestamp, or null if no items expire
	 */
	private findEarliestExpiration(): number | null {
		// Clean up any stale entries in the heap first
		while (!this.expirationHeap.isEmpty) {
			const peek = this.expirationHeap.peek()!;
			const cached = this.cache.get(peek.key);
			
			// If the item doesn't exist in cache or the expiration doesn't match, remove from heap
			if (!cached || cached.created + cached.ttl !== peek.expiration) {
				this.expirationHeap.extractMin();
				continue;
			}
			
			// Found a valid entry
			return peek.expiration;
		}

		return null;
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
		this.expirationHeap.clear();
		
		// Clear any scheduled cleanup since cache is empty
		this.clearScheduledCleanup();
	}
}
