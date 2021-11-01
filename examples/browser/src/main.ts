/* eslint-disable no-console */
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

document.addEventListener( 'DOMContentLoaded', ( event ) =>
{
	const key = 2;

	cache.set( key, 'Hello world', 5000, ( value ) =>
	{
		console.log( `Value: ${value} expired` );
	} );

	console.log( cache.get( key ) );
} );
