/* eslint-disable no-console */
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache.set( 2, 'Hello world' );

console.log( cache.get( 2 ) );
