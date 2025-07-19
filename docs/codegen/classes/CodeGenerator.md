[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [codegen](../README.md) / CodeGenerator

# Class: CodeGenerator

Defined in: [codegen.ts:4](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L4)

## Constructors

### Constructor

> **new CodeGenerator**(): `CodeGenerator`

#### Returns

`CodeGenerator`

## Properties

### CODE\_DIGITS

> `static` **CODE\_DIGITS**: `number` = `CODE_LENGTH`

Defined in: [codegen.ts:6](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L6)

***

### MAX\_PREFIX\_LENGTH

> `static` **MAX\_PREFIX\_LENGTH**: `number`

Defined in: [codegen.ts:8](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L8)

***

### MIN\_PREFIX\_LENGTH

> `static` **MIN\_PREFIX\_LENGTH**: `number`

Defined in: [codegen.ts:7](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L7)

***

### TIME\_WINDOW\_MS

> `static` **TIME\_WINDOW\_MS**: `number` = `CODE_TTL`

Defined in: [codegen.ts:5](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L5)

## Methods

### deriveCodeHash()

> `static` **deriveCodeHash**(`pubkey`, `prefix`, `timestamp?`): `string`

Defined in: [codegen.ts:106](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L106)

Derive the full SHA-256 hash for storage or encryption key generation

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

##### timestamp?

`number`

UNIX timestamp in milliseconds (defaults to now)

#### Returns

`string`

Full SHA-256 hash string

***

### generateCode()

> `static` **generateCode**(`pubkey`, `prefix`, `timestamp`): `object`

Defined in: [codegen.ts:65](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L65)

Generate a deterministic 8-digit code based on public key, prefix, and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

##### timestamp

`number` = `...`

UNIX timestamp in milliseconds (defaults to now)

#### Returns

`object`

Object containing code, issuedAt, and expiresAt timestamps

##### code

> **code**: `string`

##### expiresAt

> **expiresAt**: `number`

##### issuedAt

> **issuedAt**: `number`

#### Throws

Error if generated code is invalid

***

### getExpectedCode()

> `static` **getExpectedCode**(`pubkey`, `timestamp`, `prefix`): `string`

Defined in: [codegen.ts:125](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L125)

Get the expected code for a given public key and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### timestamp

`number`

UNIX timestamp in milliseconds

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

#### Returns

`string`

8-digit numeric string

***

### isValidTimestamp()

> `static` **isValidTimestamp**(`timestamp`): `boolean`

Defined in: [codegen.ts:167](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L167)

Check if a timestamp falls within a valid time window

#### Parameters

##### timestamp

`number`

UNIX timestamp in milliseconds

#### Returns

`boolean`

True if timestamp is valid

***

### normalizePrefix()

> `static` **normalizePrefix**(`prefix`): `string`

Defined in: [codegen.ts:49](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L49)

Normalize prefix - convert "DEFAULT" to empty string, validate others

#### Parameters

##### prefix

`string`

The prefix to normalize

#### Returns

`string`

Normalized prefix

#### Throws

Error if prefix is invalid

***

### validateCode()

> `static` **validateCode**(`code`, `pubkey`, `timestamp`, `prefix`): `boolean`

Defined in: [codegen.ts:141](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L141)

Validate if a code matches the expected code for a given public key and timestamp

#### Parameters

##### code

`string`

The code to validate

##### pubkey

`string`

Solana wallet public key (base58)

##### timestamp

`number`

UNIX timestamp in milliseconds

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

#### Returns

`boolean`

True if code matches expected code and timestamp is valid

***

### validateCodeDigits()

> `static` **validateCodeDigits**(`code`): `boolean`

Defined in: [codegen.ts:37](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L37)

Validate that a code without prefix is exactly 8 digits and only numbers

#### Parameters

##### code

`string`

The code to validate

#### Returns

`boolean`

True if code is valid, false otherwise

***

### validateCodeFormat()

> `static` **validateCodeFormat**(`code`): `boolean`

Defined in: [codegen.ts:26](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L26)

Validate generated code format

#### Parameters

##### code

`string`

The code to validate

#### Returns

`boolean`

True if code is valid, false otherwise

***

### validatePrefix()

> `static` **validatePrefix**(`prefix`): `boolean`

Defined in: [codegen.ts:15](https://github.com/otaprotocol/actioncodes/blob/6e0359c879f763df764595dbea0cb596eff80113/src/codegen.ts#L15)

Validate prefix format

#### Parameters

##### prefix

`string`

The prefix to validate

#### Returns

`boolean`

True if prefix is valid, false otherwise
