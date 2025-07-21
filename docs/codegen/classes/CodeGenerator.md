[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [codegen](../README.md) / CodeGenerator

# Class: CodeGenerator

Defined in: [codegen.ts:4](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L4)

## Constructors

### Constructor

> **new CodeGenerator**(): `CodeGenerator`

#### Returns

`CodeGenerator`

## Properties

### CODE\_DIGITS

> `static` **CODE\_DIGITS**: `number` = `CODE_LENGTH`

Defined in: [codegen.ts:6](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L6)

***

### MAX\_PREFIX\_LENGTH

> `static` **MAX\_PREFIX\_LENGTH**: `number`

Defined in: [codegen.ts:8](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L8)

***

### MIN\_PREFIX\_LENGTH

> `static` **MIN\_PREFIX\_LENGTH**: `number`

Defined in: [codegen.ts:7](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L7)

***

### TIME\_WINDOW\_MS

> `static` **TIME\_WINDOW\_MS**: `number` = `CODE_TTL`

Defined in: [codegen.ts:5](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L5)

## Methods

### deriveCodeHash()

> `static` **deriveCodeHash**(`pubkey`, `prefix`, `timestamp?`): `string`

Defined in: [codegen.ts:167](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L167)

Derive the full SHA-256 hash for storage or encryption key generation

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### prefix

`string` = `PROTOCOL_CODE_PREFIX`

Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)

##### timestamp?

`number`

UNIX timestamp in milliseconds (defaults to now)

#### Returns

`string`

Full SHA-256 hash string

***

### generateCode()

> `static` **generateCode**(`pubkey`, `prefix`, `timestamp`): `object`

Defined in: [codegen.ts:123](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L123)

Generate a deterministic 8-digit code based on public key, prefix, and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### prefix

`string` = `PROTOCOL_CODE_PREFIX`

Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)

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

Defined in: [codegen.ts:186](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L186)

Get the expected code for a given public key and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### timestamp

`number`

UNIX timestamp in milliseconds

##### prefix

`string` = `PROTOCOL_CODE_PREFIX`

Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)

#### Returns

`string`

Full code string with prefix + 8 digits

***

### isValidTimestamp()

> `static` **isValidTimestamp**(`timestamp`): `boolean`

Defined in: [codegen.ts:228](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L228)

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

Defined in: [codegen.ts:107](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L107)

Normalize prefix - convert PROTOCOL_CODE_PREFIX to empty string, validate others

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

Defined in: [codegen.ts:202](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L202)

Validate if a code matches the expected code for a given public key and timestamp

#### Parameters

##### code

`string`

The code to validate (can include prefix)

##### pubkey

`string`

Solana wallet public key (base58)

##### timestamp

`number`

UNIX timestamp in milliseconds

##### prefix

`string` = `PROTOCOL_CODE_PREFIX`

Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)

#### Returns

`boolean`

True if code matches expected code and timestamp is valid

***

### validateCodeDigits()

> `static` **validateCodeDigits**(`code`): `boolean`

Defined in: [codegen.ts:67](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L67)

Validate that the numeric part of a code is exactly 8 digits

#### Parameters

##### code

`string`

The code to validate (can include prefix)

#### Returns

`boolean`

True if numeric part is valid, false otherwise

***

### validateCodeFormat()

> `static` **validateCodeFormat**(`code`): `boolean`

Defined in: [codegen.ts:26](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L26)

Validate generated code format (prefix + exactly 8 digits)

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

Defined in: [codegen.ts:15](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/codegen.ts#L15)

Validate prefix format

#### Parameters

##### prefix

`string`

The prefix to validate

#### Returns

`boolean`

True if prefix is valid, false otherwise
