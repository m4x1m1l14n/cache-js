/* eslint-disable no-console */
import { Cache, CacheOptions } from '@m4x1m1l14n/cache';

const options: CacheOptions =
{
	resolution: 1000,
	defaultTTL: Number.POSITIVE_INFINITY,
	maxItems: 1000
};

const cache = new Cache<number, string>( options );

cache.set( 2, 'Hello world' );

console.log( cache.get( 2 ) );
