import { Cache } from '../src/classes/Cache';
import { CacheOptions } from '../src/models/CacheOptions';

function delay( ms: number ): Promise<void>
{
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe( 'Cache', () =>
{
	test( 'set / get - within TTL limit - string', () =>
	{
		const cache = new Cache<number, string>();
		const value = 'Some string to store in cache';
		cache.set( 1, value );

		expect( cache.get( 1 ) ).toBe( value );
	} );


	test( 'set / get - within TTL limit - number', () =>
	{
		const cache = new Cache<number, number>();
		const value = 10;
		cache.set( 1, value );

		expect( cache.get( 1 ) ).toBe( value );
	} );


	test( 'set / has - within TTL limit', () =>
	{
		const cache = new Cache<number, string>();
		cache.set( 1, 'Some string to store in cache' );

		expect( cache.has( 1 ) ).toBe( true );
	} );


	test( 'set / has - with expired TTL limit', async () =>
	{
		const cache = new Cache<number, string>();
		cache.set( 1, 'Some string to store in cache', 10 );

		await delay( 1000 );

		expect( cache.has( 1 ) ).toBe( false );
	}, 5000 );


	test( 'set / delete / has', () =>
	{
		const cache = new Cache<number, string>();
		cache.set( 1, 'Some string to store in cache' );
		cache.delete( 1 );

		expect( cache.has( 1 ) ).toBe( false );
	} );


	test( 'set / delete / delete', () =>
	{
		const cache = new Cache<number, string>();
		cache.set( 1, 'Some string to store in cache' );
		cache.delete( 1 );

		expect( cache.delete( 1 ) ).toBe( false );
	} );


	test( 'set / forEach / get', () =>
	{
		const cache = new Cache<number, string>();

		const m = new Map( [
			[ 1, '45D4E9731C33CF2DDA5C6AE7372651282162C4AEA7ADB744F80975A973A2DACA89A1A729859A43C5' ],
			[ 2, '89AB1B0E98CFD3F7A5F6DE06A3E53BECEFD26E1F6A7956D210558BD17A0F88BC63B853CA87005ECB' ],
			[ 3, 'B21D363F84AD2EAF4AC0B45E5C557B7B571D3AC5D9682DC2A1FF6E508834E94FBC0004B81B224124' ],
			[ 4, 'F7C25D41F670F154891A8EE6DB01752B2AE2D30932710D182A3DF98B59E66AA36DEE874485EC8DB3' ],
			[ 5, '24C10FE7FD903F9A5205C614B74F2B7F984E7A10AFFC96ACD6470D87DF23F110DF6F5E5784F0C7C7' ],
			[ 6, 'CCB696C74C96B231538551368232567904DB11DAD31CF980571A877024C01CD28209620CCE93EE22' ],
			[ 7, '23E9370D8755B69361C969E7B62037BBE9029E349DC32CD25E4588A6FCC9A3E272C675D94A12EFC4' ],
			[ 8, '119E75752D40265977C7B4AEE54D18A059EFA39860F4424C8A1D28D8916A75D2F874970AE6E93647' ],
			[ 9, '70BEBC321814F4EA342642E53FDB9F8C3E49B3BF6193B7AD4275FE7F7D107F1D8E0017942553E816' ],
			[ 10, '1A6B6CC0A7F47003B153BB05C3F226567F05283E835BAAE7B9186D86BA28E9C925C5293D6B96ECF6' ]
		] );

		for ( const [ key, val ] of m )
		{
			cache.set( key, val );
		}

		cache.forEach( ( value, key ) =>
		{
			expect( cache.get( key ) ).toBe( m.get( key as number ) );
		} );
	} );


	test( 'set / get - with expired TTL passed via constructor', async () =>
	{
		const options: CacheOptions =
		{
			maxItems: 10,
			resolution: 1000,
			defaultTTL: 10
		};

		const cache = new Cache<number, string>( options );
		cache.set( 1, 'Some string to store in cache' );

		await delay( 1000 );
		expect( cache.get( 1 ) ).toBe( undefined );
	}, 3000 );


	test( 'set / get - with expired TTL passed via set method', async () =>
	{
		const cache = new Cache<number, string>();
		cache.set( 1, 'Some string to store in cache', 10 );

		await delay( 1000 );
		expect( cache.get( 1 ) ).toBe( undefined );
	}, 3000 );

	// TODO: maxItems test
} );
