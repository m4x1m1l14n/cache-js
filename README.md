# @m4x1m1l14n/cache

[![npm (scoped)](https://img.shields.io/npm/v/@m4x1m1l14n/cache)](https://www.npmjs.com/package/@m4x1m1l14n/cache)
[![ci](https://github.com/m4x1m1l14n/cache-js/actions/workflows/ci.yml/badge.svg?branch=devel)](https://github.com/m4x1m1l14n/cache-js/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/m4x1m1l14n/cache-js/branch/devel/graph/badge.svg?token=RR5TO815BJ)](https://codecov.io/gh/m4x1m1l14n/cache-js)
![GitHub issues](https://img.shields.io/github/issues/m4x1m1l14n/cache-js)

# Lightweight in-memory isomorphic cache implementation with TTL for browser & Node JS

This simple cache is written in TypeScript and works both for browser and Node. It is build on top of built-in `Map` thus theoretical limit for stored entries is in case of Node 2 ^ 24, which is approximately 16.6 million.
Each entry in cache can has its own TTL (timeout) and assigned expiration callback fired once entry expire.

## Table of Contents
* [Installation](#installation)
* [Documentation](#documentation)
  * [Instantiation](#instantiation)
  * [set](#set)
  * [get](#get)
  * [take](#take)
  * [has](#has)
  * [delete](#delete)

## Installation

```bash
npm i @m4x1m1l14n/cache
```

## Documentation

### Instantiation

Cache implementation uses templates so when you use this library in TypeScript project, you can restrict what type of `key` and `value` cache has to consume. 

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();
```

Cache behavior can be altered with `options` object passed to its constructor. Following table shows options that can be changed.

Option | Default value | Description
--- | --- | ---
resolution | 1000 | Interval in milliseconds after which entries are checked for expiry
defaultTTL | Infinity | Default TTL for all added entries
maxItems | 1000 | Maximum number of entries stored in cache

Example:

```ts
import { Cache, CacheOptions } from '@m4x1m1l14n/cache';

const options: CacheOptions =
{
	resolution: 1000,
	defaultTTL: Number.POSITIVE_INFINITY,
	maxItems: 1000
};

const cache = new Cache<number, string>( options );
```

### set

Store value in cache under specified key.

Prototype:
```ts
public set( key : K, value : T, ttl? : number, callback?: ExpirationCallback<T> ) : Cache<K, T>;
```

Params:
* `key`: Key under which value will be stored
* `value`: Value to store
* `ttl (optional)`: Timeout after which cache entry will expire and will be deleted
* `callback (optional)`: Callback invoked once entry expire

Return value:

`set` method returns itself, so it is possible to chain multiple sets

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache
	.set( 1, 'Hello' )
	.set( 2, 'World' )
	.set( 3, '!');
```

Example:

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

// Key 1 will persist in cache until standardTTL is reached
cache.set( 1, 'Hello' );
// Key 2 will expire after 5 seconds
cache.set( 2, 'World', 5000 );
// Key 3 will expire after 3 seconds, and callback is called
cache.set( 3, 'Some other value', 3000, (value) =>
{
	console.log( `'${value}' has expired` );
	// Expected output
	// > 'Some other value' has expired
} );
```

### get

Retrieve value of cached entry by its key.

Prototype:
```ts
public get( key : K, refresh = false ) : T | undefined
```

Params:
* `key`: Key to retrieve
* `refresh (default: false)`: Whether to refresh entry TTL or not. In case `true` is passed, item TTL is refreshed and its expiration is postponed, like item is freshly inserted in cache.

Return value:

`get` returns value assigned to specified `key`. If `key` is not found in cache, `undefined` is returned.

Example:

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache.set( 1, 'Hello' );
console.log( cache.get( 1 ) );
// Expected output
// > Hello
```

### take

Retrieve value of cached entry by its key and remove it from cache.

Prototype:
```ts
public take( key: K ): T | undefined
```

Params:
* `key`: Key to retrieve

Return value:

`take` returns value assigned to specified `key`. If `key` is not found in cache, `undefined` is returned.

Example:

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache.set( 1, 'Hello' );
console.log( cache.take( 1 ) );
console.log( cache.take( 1 ) );
// Expected output
// > Hello
// > undefined
```

### has

Returns wether cache contains specified key or not.

Prototype:
```ts
public has( key : K ) : boolean
```

Params:
* `key`: Key to check for

Return value:

`true` in case `key` exists in cache, `false` otherwise

Example:

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache.set( 1, 'Hello' );
console.log( cache.has( 1 ) );
console.log( cache.has( 2 ) );
// Expected output
// > true
// > false
```

### delete

Removes cache entry by specified key.

Prototype:
```ts
public delete( key : K ) : boolean
```

Params:
* `key`: Key of entry to remove

Return value:

`true` in case `key` was removed, `false` otherwise

Example:

```ts
import { Cache } from '@m4x1m1l14n/cache';

const cache = new Cache<number, string>();

cache.set( 1, 'Hello' );
console.log( cache.get( 1 ) );
console.log( cache.delete( 1 ) );
console.log( cache.get( 1 ) );
console.log( cache.delete( 1 ) );
// Expected output
// > Hello
// > true
// > undefined
// > false
```
