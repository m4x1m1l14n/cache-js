import { MinHeap } from '../src/classes/MinHeap';
import { ExpirationEntry } from '../src/models/ExpirationEntry';

describe('MinHeap', () => {
	let heap: MinHeap<string>;

	beforeEach(() => {
		heap = new MinHeap<string>();
	});

	describe('Basic operations', () => {
		test('should start empty', () => {
			expect(heap.size).toBe(0);
			expect(heap.isEmpty).toBe(true);
			expect(heap.peek()).toBeUndefined();
		});

		test('should insert and peek single element', () => {
			const entry: ExpirationEntry<string> = { expiration: 100, key: 'test' };
			heap.insert(entry);

			expect(heap.size).toBe(1);
			expect(heap.isEmpty).toBe(false);
			expect(heap.peek()).toEqual(entry);
		});

		test('should extract minimum from single element', () => {
			const entry: ExpirationEntry<string> = { expiration: 100, key: 'test' };
			heap.insert(entry);

			const extracted = heap.extractMin();
			expect(extracted).toEqual(entry);
			expect(heap.size).toBe(0);
			expect(heap.isEmpty).toBe(true);
		});
	});

	describe('Multiple elements', () => {
		test('should maintain min-heap property with multiple insertions', () => {
			const entries: ExpirationEntry<string>[] = [
				{ expiration: 300, key: 'third' },
				{ expiration: 100, key: 'first' },
				{ expiration: 200, key: 'second' },
				{ expiration: 400, key: 'fourth' },
				{ expiration: 50, key: 'earliest' }
			];

			for (const entry of entries) {
				heap.insert(entry);
			}

			expect(heap.size).toBe(5);
			expect(heap.peek()?.expiration).toBe(50);
			expect(heap.peek()?.key).toBe('earliest');
		});

		test('should extract elements in ascending order of expiration', () => {
			const entries: ExpirationEntry<string>[] = [
				{ expiration: 300, key: 'third' },
				{ expiration: 100, key: 'first' },
				{ expiration: 200, key: 'second' },
				{ expiration: 400, key: 'fourth' },
				{ expiration: 50, key: 'earliest' }
			];

			for (const entry of entries) {
				heap.insert(entry);
			}

			const extracted: ExpirationEntry<string>[] = [];
			while (!heap.isEmpty) {
				extracted.push(heap.extractMin()!);
			}

			expect(extracted).toHaveLength(5);
			expect(extracted[0]).toEqual({ expiration: 50, key: 'earliest' });
			expect(extracted[1]).toEqual({ expiration: 100, key: 'first' });
			expect(extracted[2]).toEqual({ expiration: 200, key: 'second' });
			expect(extracted[3]).toEqual({ expiration: 300, key: 'third' });
			expect(extracted[4]).toEqual({ expiration: 400, key: 'fourth' });
		});

		test('should handle duplicate expiration times', () => {
			const entries: ExpirationEntry<string>[] = [
				{ expiration: 100, key: 'first' },
				{ expiration: 100, key: 'second' },
				{ expiration: 50, key: 'earliest' },
				{ expiration: 100, key: 'third' }
			];

			for (const entry of entries) {
				heap.insert(entry);
			}

			expect(heap.peek()?.expiration).toBe(50);

			const extracted: ExpirationEntry<string>[] = [];
			while (!heap.isEmpty) {
				extracted.push(heap.extractMin()!);
			}

			expect(extracted[0].expiration).toBe(50);
			expect(extracted[1].expiration).toBe(100);
			expect(extracted[2].expiration).toBe(100);
			expect(extracted[3].expiration).toBe(100);
		});
	});

	describe('removeByKey', () => {
		beforeEach(() => {
			const entries: ExpirationEntry<string>[] = [
				{ expiration: 100, key: 'key1' },
				{ expiration: 200, key: 'key2' },
				{ expiration: 300, key: 'key1' }, // duplicate key
				{ expiration: 400, key: 'key3' },
				{ expiration: 150, key: 'key2' }  // duplicate key
			];

			for (const entry of entries) {
				heap.insert(entry);
			}
		});

		test('should remove all entries with specified key', () => {
			const removed = heap.removeByKey('key1');
			expect(removed).toBe(2);
			expect(heap.size).toBe(3);

			// Verify remaining entries
			const remaining: ExpirationEntry<string>[] = [];
			while (!heap.isEmpty) {
				remaining.push(heap.extractMin()!);
			}

			expect(remaining).toHaveLength(3);
			expect(remaining.every(entry => entry.key !== 'key1')).toBe(true);
		});

		test('should return 0 when removing non-existent key', () => {
			const removed = heap.removeByKey('nonexistent');
			expect(removed).toBe(0);
			expect(heap.size).toBe(5);
		});

		test('should maintain heap property after removal', () => {
			heap.removeByKey('key2');
			expect(heap.size).toBe(3);

			// Extract all and verify order
			const extracted: ExpirationEntry<string>[] = [];
			while (!heap.isEmpty) {
				extracted.push(heap.extractMin()!);
			}

			expect(extracted).toHaveLength(3);
			for (let i = 1; i < extracted.length; i++) {
				expect(extracted[i].expiration).toBeGreaterThanOrEqual(extracted[i - 1].expiration);
			}
		});

		test('should handle removing all elements', () => {
			heap.removeByKey('key1');
			heap.removeByKey('key2');
			heap.removeByKey('key3');

			expect(heap.size).toBe(0);
			expect(heap.isEmpty).toBe(true);
			expect(heap.peek()).toBeUndefined();
		});
	});

	describe('clear', () => {
		test('should remove all elements', () => {
			const entries: ExpirationEntry<string>[] = [
				{ expiration: 100, key: 'key1' },
				{ expiration: 200, key: 'key2' },
				{ expiration: 300, key: 'key3' }
			];

			for (const entry of entries) {
				heap.insert(entry);
			}

			expect(heap.size).toBe(3);

			heap.clear();

			expect(heap.size).toBe(0);
			expect(heap.isEmpty).toBe(true);
			expect(heap.peek()).toBeUndefined();
		});

		test('should work on empty heap', () => {
			heap.clear();
			expect(heap.size).toBe(0);
			expect(heap.isEmpty).toBe(true);
		});
	});

	describe('Edge cases', () => {
		test('should handle extractMin on empty heap', () => {
			expect(heap.extractMin()).toBeUndefined();
		});

		test('should handle large number of elements', () => {
			const numElements = 1000;
			const entries: ExpirationEntry<string>[] = [];

			// Insert random expiration times
			for (let i = 0; i < numElements; i++) {
				entries.push({
					expiration: Math.floor(Math.random() * 10000),
					key: `key${i}`
				});
			}

			for (const entry of entries) {
				heap.insert(entry);
			}

			expect(heap.size).toBe(numElements);

			// Extract all and verify order
			const extracted: ExpirationEntry<string>[] = [];
			while (!heap.isEmpty) {
				extracted.push(heap.extractMin()!);
			}

			expect(extracted).toHaveLength(numElements);
			for (let i = 1; i < extracted.length; i++) {
				expect(extracted[i].expiration).toBeGreaterThanOrEqual(extracted[i - 1].expiration);
			}
		});

		test('should handle numeric keys', () => {
			const numHeap = new MinHeap<number>();
			const entries: ExpirationEntry<number>[] = [
				{ expiration: 300, key: 3 },
				{ expiration: 100, key: 1 },
				{ expiration: 200, key: 2 }
			];

			for (const entry of entries) {
				numHeap.insert(entry);
			}

			expect(numHeap.peek()?.key).toBe(1);
			expect(numHeap.extractMin()?.key).toBe(1);
			expect(numHeap.extractMin()?.key).toBe(2);
			expect(numHeap.extractMin()?.key).toBe(3);
		});
	});
});