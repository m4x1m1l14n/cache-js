/* eslint-disable no-console */
import { Cache, CacheOptions } from '@m4x1m1l14n/cache';

const options: CacheOptions =
{
	resolution: 1000,
	defaultTTL: Number.POSITIVE_INFINITY,
	maxItems: 1000
};

const cache = new Cache<number, string>( options );

document.addEventListener( 'DOMContentLoaded', ( event ) =>
{
	const key = 2;

	cache.set( key, 'Hello world', 5000, ( value ) =>
	{
		console.log( `Value: ${value} expired` );
	} );

	console.log( cache.get( key ) );
} );
