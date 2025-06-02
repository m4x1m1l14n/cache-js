export interface CacheOptions {
	/**
	 * Maximum number of items stored in cache
	 */
	maxItems?: number;
	/**
	 * @deprecated This option is deprecated. The cache now uses dynamic timeout scheduling
	 * for accurate expiration timing instead of periodic cleanup intervals.
	 * Items are now expired at their exact TTL expiration time rather than being
	 * checked periodically. This option is kept for backward compatibility but has no effect.
	 */
	resolution?: number;
	/**
	 * Default timeout for added item
	 */
	defaultTTL?: number;
}
