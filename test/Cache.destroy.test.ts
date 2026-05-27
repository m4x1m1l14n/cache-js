import { Cache } from '../src/classes/Cache';

describe('Cache.destroy()', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// --- Lifecycle tests ---

	test('destroy() stops the cleanup timeout', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value', 100, callback);

		// Timeout should be scheduled
		expect((cache as any).timeoutHandle).not.toBeNull();

		cache.destroy();

		// Timeout should be cleared
		expect((cache as any).timeoutHandle).toBeNull();

		// Advance time past the TTL — callback should NOT fire via cleanup
		jest.advanceTimersByTime(200);
		// Callback was invoked by flush during destroy, not by the timer
		expect(callback).not.toHaveBeenCalled();
	});

	test('destroy(true) invokes expiration callbacks', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value1', 100, callback);
		cache.set(2, 'value2', 200, callback);

		cache.destroy(true);

		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenCalledWith('value1');
		expect(callback).toHaveBeenCalledWith('value2');
	});

	test('destroy(false) does not invoke expiration callbacks', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value1', 100, callback);
		cache.set(2, 'value2', 200, callback);

		cache.destroy(false);

		expect(callback).not.toHaveBeenCalled();
	});

	test('destroy() without arguments does not invoke callbacks (default)', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value1', 100, callback);

		cache.destroy();

		expect(callback).not.toHaveBeenCalled();
	});

	test('destroy() flushes all cached entries', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'a');
		cache.set(2, 'b');
		cache.set(3, 'c');

		expect((cache as any).cache.size).toBe(3);

		cache.destroy();

		expect((cache as any).cache.size).toBe(0);
	});

	test('destroy() is idempotent — calling twice does not throw', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');

		expect(() => {
			cache.destroy();
			cache.destroy();
		}).not.toThrow();
	});

	test('destroy() is idempotent — callbacks invoked only once', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value', 100, callback);

		cache.destroy(true);
		cache.destroy(true);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	// --- Use after destroy ---

	test('after destroy(), set() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.destroy();

		expect(() => cache.set(1, 'value')).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), get() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.get(1)).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), has() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.has(1)).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), size throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.size).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), take() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.take(1)).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), delete() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.delete(1)).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), mdelete() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.mdelete([1])).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), forEach() throws an error', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.destroy();

		expect(() => cache.forEach(() => {})).toThrow('Cache instance has been destroyed');
	});

	test('after destroy(), flush() does not throw', () => {
		const cache = new Cache<number, string>();

		cache.destroy();

		expect(() => cache.flush()).not.toThrow();
		expect(() => cache.flush(true)).not.toThrow();
	});

	// --- Timer cleanup verification ---

	test('destroy() clears the timeout handle to undefined/null', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value', 500);
		expect((cache as any).timeoutHandle).not.toBeNull();

		cache.destroy();
		expect((cache as any).timeoutHandle).toBeNull();
	});

	test('multiple Cache instances — destroy all cleans up all timeouts', () => {
		const caches = [new Cache<number, string>(), new Cache<number, string>(), new Cache<number, string>()];

		caches.forEach((cache, i) => cache.set(i, `value-${i}`, 1000));

		// All should have scheduled timeouts
		caches.forEach((cache) => {
			expect((cache as any).timeoutHandle).not.toBeNull();
		});

		caches.forEach((cache) => cache.destroy());

		// All timeouts should be cleared
		caches.forEach((cache) => {
			expect((cache as any).timeoutHandle).toBeNull();
			expect((cache as any).destroyed).toBe(true);
		});
	});

	test('destroy() after some items expire via fake timers — timeout is stopped', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'first', 100, callback);
		cache.set(2, 'second', 500, callback);

		// Advance past first item's TTL
		jest.advanceTimersByTime(200);

		// Trigger lazy expiration for first item
		expect(cache.get(1)).toBeUndefined();

		// Second item should still have a scheduled timeout
		expect((cache as any).timeoutHandle).not.toBeNull();

		cache.destroy();

		expect((cache as any).timeoutHandle).toBeNull();

		// Advance past second item's TTL — no more timer activity
		jest.advanceTimersByTime(500);
	});

	test('flush() does NOT stop the cache from being functional', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'before-flush', 1000);
		cache.flush();

		// Cache should still be usable after flush
		cache.set(2, 'after-flush');
		expect(cache.get(2)).toBe('after-flush');
		expect(cache.size).toBe(1);
	});

	test('flush() does NOT mark cache as destroyed', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'value');
		cache.flush();

		expect((cache as any).destroyed).toBe(false);

		// set() should still work
		expect(() => cache.set(2, 'new-value')).not.toThrow();
	});

	// --- Expiration callback interaction ---

	test('destroy(true) invokes callbacks for items with expiration callbacks', () => {
		const callback1 = jest.fn();
		const callback2 = jest.fn();
		const cache = new Cache<number, string>();

		cache.set(1, 'val1', 1000, callback1);
		cache.set(2, 'val2', undefined); // no callback
		cache.set(3, 'val3', 2000, callback2);

		cache.destroy(true);

		expect(callback1).toHaveBeenCalledWith('val1');
		expect(callback2).toHaveBeenCalledWith('val3');
	});

	// --- Edge cases ---

	test('destroy() called immediately after construction (no items)', () => {
		const cache = new Cache<number, string>();

		expect(() => cache.destroy()).not.toThrow();
		expect(() => cache.size).toThrow('Cache instance has been destroyed');
	});

	test('destroy() called from within an expiration callback', () => {
		const cache = new Cache<number, string>();

		cache.set(1, 'self-destruct', 100, () => {
			// Calling destroy from within a callback during destroy(true)/flush(true)
			// should be safe since destroy is idempotent
			expect(() => cache.destroy()).not.toThrow();
		});

		cache.set(2, 'other', 200);

		// Trigger via destroy(true) which calls flush(true)
		cache.destroy(true);

		expect((cache as any).destroyed).toBe(true);
		expect((cache as any).cache.size).toBe(0);
	});

	test('destroy() during cleanup — items expiring while destroy is called', () => {
		const cache = new Cache<number, string>();
		const callback = jest.fn();

		cache.set(1, 'value1', 100, callback);
		cache.set(2, 'value2', 100, callback);

		cache.destroy(true);

		// Both callbacks should have been called exactly once
		expect(callback).toHaveBeenCalledTimes(2);
		expect((cache as any).timeoutHandle).toBeNull();
	});

	// --- Regression tests ---

	describe('regression - existing functionality unchanged', () => {
		test('set and get work before destroy', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'hello');
			expect(cache.get(1)).toBe('hello');

			cache.destroy();
		});

		test('take works before destroy', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'take-me');
			expect(cache.take(1)).toBe('take-me');
			expect(cache.take(1)).toBeUndefined();

			cache.destroy();
		});

		test('has works before destroy', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'exists');
			expect(cache.has(1)).toBe(true);
			expect(cache.has(2)).toBe(false);

			cache.destroy();
		});

		test('delete works before destroy', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'delete-me');
			expect(cache.delete(1)).toBe(true);
			expect(cache.delete(1)).toBe(false);

			cache.destroy();
		});

		test('mdelete works before destroy', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'a');
			cache.set(2, 'b');
			cache.set(3, 'c');

			cache.mdelete([1, 3]);

			expect(cache.has(1)).toBe(false);
			expect(cache.has(2)).toBe(true);
			expect(cache.has(3)).toBe(false);

			cache.destroy();
		});

		test('flush works before destroy', () => {
			const callback = jest.fn();
			const cache = new Cache<number, string>();

			cache.set(1, 'val', undefined, callback);
			cache.flush(true);

			expect(callback).toHaveBeenCalledWith('val');
			expect(cache.size).toBe(0);

			// Cache is still functional after flush
			cache.set(2, 'new');
			expect(cache.get(2)).toBe('new');

			cache.destroy();
		});

		test('forEach works before destroy', () => {
			const cache = new Cache<number, string>();
			const collected: [number, string][] = [];

			cache.set(1, 'a');
			cache.set(2, 'b');

			cache.forEach((value, key) => collected.push([key, value]));

			expect(collected).toEqual([
				[1, 'a'],
				[2, 'b'],
			]);

			cache.destroy();
		});

		test('size works before destroy', () => {
			const cache = new Cache<number, string>();

			expect(cache.size).toBe(0);
			cache.set(1, 'a');
			expect(cache.size).toBe(1);

			cache.destroy();
		});

		test('TTL expiration still works before destroy', () => {
			const cache = new Cache<number, string>();
			const callback = jest.fn();

			cache.set(1, 'expire-me', 100, callback);

			jest.advanceTimersByTime(150);

			expect(cache.get(1)).toBeUndefined();
			expect(callback).toHaveBeenCalledWith('expire-me');

			cache.destroy();
		});

		test('chained set still works', () => {
			const cache = new Cache<number, string>();

			cache.set(1, 'a').set(2, 'b').set(3, 'c');

			expect(cache.size).toBe(3);

			cache.destroy();
		});
	});
});
