import { ExpirationEntry } from '../models/ExpirationEntry';

/**
 * A min-heap implementation for efficiently tracking cache item expiration times.
 * The heap is ordered by expiration timestamp, with the earliest expiration at the root.
 */
export class MinHeap<K> {
	private heap: ExpirationEntry<K>[] = [];

	/**
	 * Gets the number of items in the heap
	 */
	get size(): number {
		return this.heap.length;
	}

	/**
	 * Checks if the heap is empty
	 */
	get isEmpty(): boolean {
		return this.heap.length === 0;
	}

	/**
	 * Gets the minimum expiration entry without removing it
	 * @returns The entry with the earliest expiration time, or undefined if heap is empty
	 */
	peek(): ExpirationEntry<K> | undefined {
		return this.heap.length > 0 ? this.heap[0] : undefined;
	}

	/**
	 * Inserts a new expiration entry into the heap
	 * @param entry The expiration entry to insert
	 */
	insert(entry: ExpirationEntry<K>): void {
		this.heap.push(entry);
		this.heapifyUp(this.heap.length - 1);
	}

	/**
	 * Removes and returns the minimum expiration entry
	 * @returns The entry with the earliest expiration time, or undefined if heap is empty
	 */
	extractMin(): ExpirationEntry<K> | undefined {
		if (this.heap.length === 0) {
			return undefined;
		}

		if (this.heap.length === 1) {
			return this.heap.pop();
		}

		const min = this.heap[0];
		this.heap[0] = this.heap.pop()!;
		this.heapifyDown(0);
		
return min;
	}

	/**
	 * Removes all entries with the specified key
	 * @param key The key to remove
	 * @returns The number of entries removed
	 */
	removeByKey(key: K): number {
		let removed = 0;
		for (let i = this.heap.length - 1; i >= 0; i--) {
			if (this.heap[i].key === key) {
				this.removeAt(i);
				removed++;
			}
		}
		
return removed;
	}

	/**
	 * Removes all entries from the heap
	 */
	clear(): void {
		this.heap = [];
	}

	/**
	 * Removes the entry at the specified index
	 * @param index The index to remove
	 */
	private removeAt(index: number): void {
		if (index >= this.heap.length) {
			return;
		}

		if (index === this.heap.length - 1) {
			this.heap.pop();
			
return;
		}

		const lastElement = this.heap.pop()!;
		this.heap[index] = lastElement;

		// Need to maintain heap property
		this.heapifyDown(index);
		this.heapifyUp(index);
	}

	/**
	 * Moves an element up the heap to maintain heap property
	 * @param index The index of the element to move up
	 */
	private heapifyUp(index: number): void {
		while (index > 0) {
			const parentIndex = Math.floor((index - 1) / 2);
			
			if (this.heap[index].expiration >= this.heap[parentIndex].expiration) {
				break;
			}

			this.swap(index, parentIndex);
			index = parentIndex;
		}
	}

	/**
	 * Moves an element down the heap to maintain heap property
	 * @param index The index of the element to move down
	 */
	private heapifyDown(index: number): void {
		while (true) {
			const leftChild = 2 * index + 1;
			const rightChild = 2 * index + 2;
			let smallest = index;

			if (leftChild < this.heap.length && 
				this.heap[leftChild].expiration < this.heap[smallest].expiration) {
				smallest = leftChild;
			}

			if (rightChild < this.heap.length && 
				this.heap[rightChild].expiration < this.heap[smallest].expiration) {
				smallest = rightChild;
			}

			if (smallest === index) {
				break;
			}

			this.swap(index, smallest);
			index = smallest;
		}
	}

	/**
	 * Swaps two elements in the heap
	 * @param i First index
	 * @param j Second index
	 */
	private swap(i: number, j: number): void {
		[this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
	}
}
