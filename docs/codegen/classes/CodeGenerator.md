[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [codegen](../README.md) / CodeGenerator

# Class: CodeGenerator

Defined in: codegen.ts:4

## Constructors

### Constructor

> **new CodeGenerator**(): `CodeGenerator`

#### Returns

`CodeGenerator`

## Properties

### CODE\_DIGITS

> `static` **CODE\_DIGITS**: `number` = `CODE_LENGTH`

Defined in: codegen.ts:6

***

### MAX\_PREFIX\_LENGTH

> `static` **MAX\_PREFIX\_LENGTH**: `number`

Defined in: codegen.ts:8

***

### MIN\_PREFIX\_LENGTH

> `static` **MIN\_PREFIX\_LENGTH**: `number`

Defined in: codegen.ts:7

***

### TIME\_WINDOW\_MS

> `static` **TIME\_WINDOW\_MS**: `number` = `CODE_TTL`

Defined in: codegen.ts:5

## Methods

### deriveCodeHash()

> `static` **deriveCodeHash**(`pubkey`, `prefix`, `timestamp?`): `string`

Defined in: codegen.ts:74

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

> `static` **generateCode**(`pubkey`, `signature`, `prefix`, `timestamp`): `object`

Defined in: codegen.ts:43

Generate a deterministic 8-digit code based on public key, prefix, and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### signature

`string`

User's signature string

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

***

### generateCodeSignatureMessage()

> `static` **generateCodeSignatureMessage**(`code`, `timestamp`): `string`

Defined in: codegen.ts:92

Generate the message that should be signed for code verification

#### Parameters

##### code

`string`

The generated 8-digit code

##### timestamp

`number`

UNIX timestamp in milliseconds

#### Returns

`string`

Message string in format "actioncodes:<code>:<timestamp>"

***

### getExpectedCode()

> `static` **getExpectedCode**(`pubkey`, `timestamp`, `signature`, `prefix`): `string`

Defined in: codegen.ts:104

Get the expected code for a given public key and timestamp

#### Parameters

##### pubkey

`string`

Solana wallet public key (base58)

##### timestamp

`number`

UNIX timestamp in milliseconds

##### signature

`string`

User's signature string

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

#### Returns

`string`

8-digit numeric string

***

### isValidTimestamp()

> `static` **isValidTimestamp**(`timestamp`): `boolean`

Defined in: codegen.ts:140

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

Defined in: codegen.ts:27

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

> `static` **validateCode**(`code`, `pubkey`, `timestamp`, `signature`, `prefix`): `boolean`

Defined in: codegen.ts:122

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

##### signature

`string`

User's signature string

##### prefix

`string` = `"DEFAULT"`

Optional namespace prefix (default: "DEFAULT")

#### Returns

`boolean`

True if code matches expected code and timestamp is valid

***

### validatePrefix()

> `static` **validatePrefix**(`prefix`): `boolean`

Defined in: codegen.ts:15

Validate prefix format

#### Parameters

##### prefix

`string`

The prefix to validate

#### Returns

`boolean`

True if prefix is valid, false otherwise
