/**
 * Represents an entry in the expiration heap
 */
export interface ExpirationEntry<K> {
	/** The timestamp when this item expires */
	expiration: number;
	/** The cache key associated with this expiration */
	key: K;
}
