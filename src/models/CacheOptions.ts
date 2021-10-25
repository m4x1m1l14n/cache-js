export interface CacheOptions
{
	/**
	 * Maximum number of items stored in cache
	 */
	maxItems? : number;
	/**
	 * Time in milliseconds in which timer will check for
	 * outdated items
	 */
	resolution? : number;
	/**
	 * Default timeout for added item
	 */
	defaultTTL? : number;
}
