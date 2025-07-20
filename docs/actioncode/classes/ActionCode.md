[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [actioncode](../README.md) / ActionCode

# Class: ActionCode

Defined in: [actioncode.ts:32](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L32)

## Constructors

### Constructor

> **new ActionCode**(`fields`): `ActionCode`

Defined in: [actioncode.ts:33](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L33)

#### Parameters

##### fields

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`

## Accessors

### chain

#### Get Signature

> **get** **chain**(): `string`

Defined in: [actioncode.ts:95](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L95)

Get the target chain for this action code

##### Returns

`string`

Chain identifier (e.g., "solana", "evm")

***

### code

#### Get Signature

> **get** **code**(): `string`

Defined in: [actioncode.ts:111](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L111)

Get the action code string

##### Returns

`string`

The 8-character action code

***

### codeHash

#### Get Signature

> **get** **codeHash**(): `string`

Defined in: [actioncode.ts:217](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L217)

Get the code hash for this action code
it is also used in the protocol meta as the code id

##### Returns

`string`

Code hash string

***

### description

#### Get Signature

> **get** **description**(): `undefined` \| `string`

Defined in: [actioncode.ts:151](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L151)

Get a human-readable description of the action

##### Returns

`undefined` \| `string`

Description string or undefined

***

### displayString

#### Get Signature

> **get** **displayString**(): `string`

Defined in: [actioncode.ts:183](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L183)

Get a human-readable display string for the action code

##### Returns

`string`

Formatted display string

***

### encoded

#### Get Signature

> **get** **encoded**(): `string`

Defined in: [actioncode.ts:47](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L47)

##### Returns

`string`

***

### expired

#### Get Signature

> **get** **expired**(): `boolean`

Defined in: [actioncode.ts:87](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L87)

Check if the action code has expired

##### Returns

`boolean`

True if the code has expired

***

### json

#### Get Signature

> **get** **json**(): [`ActionCodeFields`](../interfaces/ActionCodeFields.md)

Defined in: [actioncode.ts:68](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L68)

##### Returns

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

***

### metadata

#### Get Signature

> **get** **metadata**(): `undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Defined in: [actioncode.ts:143](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L143)

Get metadata associated with this action code

##### Returns

`undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Metadata object or undefined

***

### params

#### Get Signature

> **get** **params**(): `undefined` \| `Record`\<`string`, `any`\>

Defined in: [actioncode.ts:159](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L159)

Get parameters associated with this action

##### Returns

`undefined` \| `Record`\<`string`, `any`\>

Parameters object or undefined

***

### prefix

#### Get Signature

> **get** **prefix**(): `string`

Defined in: [actioncode.ts:119](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L119)

Get the prefix used for this action code

##### Returns

`string`

Normalized prefix

***

### pubkey

#### Get Signature

> **get** **pubkey**(): `string`

Defined in: [actioncode.ts:127](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L127)

Get the user's public key

##### Returns

`string`

User's public key

***

### remainingTime

#### Get Signature

> **get** **remainingTime**(): `number`

Defined in: [actioncode.ts:78](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L78)

Get remaining time in milliseconds until expiration

##### Returns

`number`

Remaining time in milliseconds, or 0 if expired

***

### remainingTimeString

#### Get Signature

> **get** **remainingTimeString**(): `string`

Defined in: [actioncode.ts:196](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L196)

Get a formatted time string showing remaining time

##### Returns

`string`

Human-readable time string (e.g., "1m 30s remaining")

***

### signature

#### Get Signature

> **get** **signature**(): `string`

Defined in: [actioncode.ts:175](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L175)

Get the user's signature

##### Returns

`string`

User's signature string

***

### status

#### Get Signature

> **get** **status**(): [`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Defined in: [actioncode.ts:103](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L103)

Get the current status of the action code

##### Returns

[`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Current status

***

### timestamp

#### Get Signature

> **get** **timestamp**(): `number`

Defined in: [actioncode.ts:167](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L167)

Get the timestamp when the code was generated

##### Returns

`number`

Timestamp in milliseconds

***

### transaction

#### Get Signature

> **get** **transaction**(): `undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Defined in: [actioncode.ts:135](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L135)

Get the transaction data (chain-specific)

##### Returns

`undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Transaction data or undefined

## Methods

### isValid()

> **isValid**(`protocol`): `boolean`

Defined in: [actioncode.ts:51](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L51)

#### Parameters

##### protocol

[`ActionCodesProtocol`](../../protocol/classes/ActionCodesProtocol.md)

#### Returns

`boolean`

***

### fromEncoded()

> `static` **fromEncoded**(`encoded`): `ActionCode`

Defined in: [actioncode.ts:42](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L42)

#### Parameters

##### encoded

`string`

#### Returns

`ActionCode`

***

### fromPayload()

> `static` **fromPayload**(`input`): `ActionCode`

Defined in: [actioncode.ts:35](https://github.com/otaprotocol/actioncodes/blob/57f8663219c9af5c455731c797e721cd72058ff4/src/actioncode.ts#L35)

#### Parameters

##### input

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`
