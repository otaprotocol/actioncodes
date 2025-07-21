[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [actioncode](../README.md) / ActionCode

# Class: ActionCode

Defined in: [actioncode.ts:35](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L35)

## Constructors

### Constructor

> **new ActionCode**(`fields`): `ActionCode`

Defined in: [actioncode.ts:36](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L36)

#### Parameters

##### fields

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`

## Accessors

### chain

#### Get Signature

> **get** **chain**(): `string`

Defined in: [actioncode.ts:98](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L98)

Get the target chain for this action code

##### Returns

`string`

Chain identifier (e.g., "solana", "evm")

***

### code

#### Get Signature

> **get** **code**(): `string`

Defined in: [actioncode.ts:114](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L114)

Get the action code string

##### Returns

`string`

The 8-character action code

***

### codeHash

#### Get Signature

> **get** **codeHash**(): `string`

Defined in: [actioncode.ts:220](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L220)

Get the code hash for this action code
it is also used in the protocol meta as the code id

##### Returns

`string`

Code hash string

***

### description

#### Get Signature

> **get** **description**(): `undefined` \| `string`

Defined in: [actioncode.ts:154](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L154)

Get a human-readable description of the action

##### Returns

`undefined` \| `string`

Description string or undefined

***

### displayString

#### Get Signature

> **get** **displayString**(): `string`

Defined in: [actioncode.ts:186](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L186)

Get a human-readable display string for the action code

##### Returns

`string`

Formatted display string

***

### encoded

#### Get Signature

> **get** **encoded**(): `string`

Defined in: [actioncode.ts:50](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L50)

##### Returns

`string`

***

### expired

#### Get Signature

> **get** **expired**(): `boolean`

Defined in: [actioncode.ts:90](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L90)

Check if the action code has expired

##### Returns

`boolean`

True if the code has expired

***

### intentType

#### Get Signature

> **get** **intentType**(): `"transaction"` \| `"sign-only"`

Defined in: [actioncode.ts:224](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L224)

##### Returns

`"transaction"` \| `"sign-only"`

***

### json

#### Get Signature

> **get** **json**(): [`ActionCodeFields`](../interfaces/ActionCodeFields.md)

Defined in: [actioncode.ts:71](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L71)

##### Returns

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

***

### metadata

#### Get Signature

> **get** **metadata**(): `undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Defined in: [actioncode.ts:146](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L146)

Get metadata associated with this action code

##### Returns

`undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Metadata object or undefined

***

### params

#### Get Signature

> **get** **params**(): `undefined` \| `Record`\<`string`, `any`\>

Defined in: [actioncode.ts:162](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L162)

Get parameters associated with this action

##### Returns

`undefined` \| `Record`\<`string`, `any`\>

Parameters object or undefined

***

### prefix

#### Get Signature

> **get** **prefix**(): `string`

Defined in: [actioncode.ts:122](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L122)

Get the prefix used for this action code

##### Returns

`string`

Normalized prefix

***

### pubkey

#### Get Signature

> **get** **pubkey**(): `string`

Defined in: [actioncode.ts:130](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L130)

Get the user's public key

##### Returns

`string`

User's public key

***

### remainingTime

#### Get Signature

> **get** **remainingTime**(): `number`

Defined in: [actioncode.ts:81](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L81)

Get remaining time in milliseconds until expiration

##### Returns

`number`

Remaining time in milliseconds, or 0 if expired

***

### remainingTimeString

#### Get Signature

> **get** **remainingTimeString**(): `string`

Defined in: [actioncode.ts:199](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L199)

Get a formatted time string showing remaining time

##### Returns

`string`

Human-readable time string (e.g., "1m 30s remaining")

***

### signature

#### Get Signature

> **get** **signature**(): `string`

Defined in: [actioncode.ts:178](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L178)

Get the user's signature

##### Returns

`string`

User's signature string

***

### status

#### Get Signature

> **get** **status**(): [`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Defined in: [actioncode.ts:106](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L106)

Get the current status of the action code

##### Returns

[`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Current status

***

### timestamp

#### Get Signature

> **get** **timestamp**(): `number`

Defined in: [actioncode.ts:170](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L170)

Get the timestamp when the code was generated

##### Returns

`number`

Timestamp in milliseconds

***

### transaction

#### Get Signature

> **get** **transaction**(): `undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Defined in: [actioncode.ts:138](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L138)

Get the transaction data (chain-specific)

##### Returns

`undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Transaction data or undefined

## Methods

### isValid()

> **isValid**(`protocol`): `boolean`

Defined in: [actioncode.ts:54](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L54)

#### Parameters

##### protocol

[`ActionCodesProtocol`](../../protocol/classes/ActionCodesProtocol.md)

#### Returns

`boolean`

***

### fromEncoded()

> `static` **fromEncoded**(`encoded`): `ActionCode`

Defined in: [actioncode.ts:45](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L45)

#### Parameters

##### encoded

`string`

#### Returns

`ActionCode`

***

### fromPayload()

> `static` **fromPayload**(`input`): `ActionCode`

Defined in: [actioncode.ts:38](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/actioncode.ts#L38)

#### Parameters

##### input

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`
