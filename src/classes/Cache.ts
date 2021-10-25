import { getMilliseconds } from '../helpers';

import { CacheOptions } from '../models/CacheOptions';
import { CacheValue } from '../models/CacheValue';

import { ExpirationCallback } from '../types';

export class Cache<K, T>
{
	private options: Required<CacheOptions>;
	private cache = new Map<K, CacheValue<T>>();

	constructor( options?: CacheOptions )
	{
		this.options =
		{
			...( {
				maxItems: 1000,
				resolution: 1000,
				// Default timeout is infinity
				defaultTTL: Number.POSITIVE_INFINITY
			} ),
			...( options ?? {} )
		};

		const interval = setInterval( () => this.cleanup(), this.options.resolution );
		interval.unref();
	}

	public set( key : K, value : T, ttl? : number, callback?: ExpirationCallback<T> ) : Cache<K, T>
	{
		const now = getMilliseconds();

		const wrapped : CacheValue<T> =
		{
			created: now,
			value,
			ttl: ttl ?? this.options.defaultTTL,
			callback
		};

		this.cache.set( key, wrapped );

		return this;
	}

	/**
	 * Returns value by its key
	 * 
	 * @param key Key of value to get
	 * @param refresh True to refresh item TTL or false to not
	 */
	public get( key : K, refresh = false ) : T | undefined
	{
		const wrapped = this.cache.get( key );
		if ( wrapped )
		{
			if ( refresh )
			{
				const now = getMilliseconds();

				wrapped.created = now;
			}
		}

		return wrapped?.value;
	}

	public has( key : K ) : boolean
	{
		return this.cache.has( key );
	}

	public delete( key : K ) : boolean
	{
		return this.cache.delete( key );
	}

	public get size() : number
	{
		return this.cache.size;
	}

	public forEach( cb : ( value: T, key: K ) => void ) : void
	{
		this.cache.forEach( ( value, key ) =>
		{
			cb( value.value, key );
		} );
	}

	private cleanup()
	{
		if ( this.cache.size === 0 )
		{
			return;
		}

		const now = getMilliseconds();

		for ( const [ key, value ] of this.cache )
		{
			if ( now > ( value.created + value.ttl ) )
			{
				this.cache.delete( key );

				if ( value.callback )
				{
					value.callback( value.value );
				}
			}
		}
	}
}
