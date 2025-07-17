[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [actioncode](../README.md) / ActionCode

# Class: ActionCode\<T\>

Defined in: actioncode.ts:30

## Type Parameters

### T

`T`

## Constructors

### Constructor

> **new ActionCode**\<`T`\>(`fields`): `ActionCode`\<`T`\>

Defined in: actioncode.ts:31

#### Parameters

##### fields

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)\<`T`\>

#### Returns

`ActionCode`\<`T`\>

## Accessors

### chain

#### Get Signature

> **get** **chain**(): `string`

Defined in: actioncode.ts:86

Get the target chain for this action code

##### Returns

`string`

Chain identifier (e.g., "solana", "evm")

***

### code

#### Get Signature

> **get** **code**(): `string`

Defined in: actioncode.ts:102

Get the action code string

##### Returns

`string`

The 8-character action code

***

### description

#### Get Signature

> **get** **description**(): `undefined` \| `string`

Defined in: actioncode.ts:142

Get a human-readable description of the action

##### Returns

`undefined` \| `string`

Description string or undefined

***

### displayString

#### Get Signature

> **get** **displayString**(): `string`

Defined in: actioncode.ts:174

Get a human-readable display string for the action code

##### Returns

`string`

Formatted display string

***

### encoded

#### Get Signature

> **get** **encoded**(): `string`

Defined in: actioncode.ts:45

##### Returns

`string`

***

### expired

#### Get Signature

> **get** **expired**(): `boolean`

Defined in: actioncode.ts:78

Check if the action code has expired

##### Returns

`boolean`

True if the code has expired

***

### isValid

#### Get Signature

> **get** **isValid**(): `boolean`

Defined in: actioncode.ts:49

##### Returns

`boolean`

***

### json

#### Get Signature

> **get** **json**(): [`ActionCodeFields`](../interfaces/ActionCodeFields.md)\<`T`\>

Defined in: actioncode.ts:59

##### Returns

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)\<`T`\>

***

### metadata

#### Get Signature

> **get** **metadata**(): `undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Defined in: actioncode.ts:134

Get metadata associated with this action code

##### Returns

`undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Metadata object or undefined

***

### params

#### Get Signature

> **get** **params**(): `undefined` \| `Record`\<`string`, `any`\>

Defined in: actioncode.ts:150

Get parameters associated with this action

##### Returns

`undefined` \| `Record`\<`string`, `any`\>

Parameters object or undefined

***

### prefix

#### Get Signature

> **get** **prefix**(): `string`

Defined in: actioncode.ts:110

Get the prefix used for this action code

##### Returns

`string`

Normalized prefix

***

### pubkey

#### Get Signature

> **get** **pubkey**(): `string`

Defined in: actioncode.ts:118

Get the user's public key

##### Returns

`string`

User's public key

***

### remainingTime

#### Get Signature

> **get** **remainingTime**(): `number`

Defined in: actioncode.ts:69

Get remaining time in milliseconds until expiration

##### Returns

`number`

Remaining time in milliseconds, or 0 if expired

***

### remainingTimeString

#### Get Signature

> **get** **remainingTimeString**(): `string`

Defined in: actioncode.ts:187

Get a formatted time string showing remaining time

##### Returns

`string`

Human-readable time string (e.g., "1m 30s remaining")

***

### signature

#### Get Signature

> **get** **signature**(): `string`

Defined in: actioncode.ts:166

Get the user's signature

##### Returns

`string`

User's signature string

***

### status

#### Get Signature

> **get** **status**(): [`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Defined in: actioncode.ts:94

Get the current status of the action code

##### Returns

[`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Current status

***

### timestamp

#### Get Signature

> **get** **timestamp**(): `number`

Defined in: actioncode.ts:158

Get the timestamp when the code was generated

##### Returns

`number`

Timestamp in milliseconds

***

### transaction

#### Get Signature

> **get** **transaction**(): `undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)\<`T`\>

Defined in: actioncode.ts:126

Get the transaction data (chain-specific)

##### Returns

`undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)\<`T`\>

Transaction data or undefined

## Methods

### fromEncoded()

> `static` **fromEncoded**\<`T`\>(`encoded`): `ActionCode`\<`T`\>

Defined in: actioncode.ts:40

#### Type Parameters

##### T

`T`

#### Parameters

##### encoded

`string`

#### Returns

`ActionCode`\<`T`\>

***

### fromPayload()

> `static` **fromPayload**\<`T`\>(`input`): `ActionCode`\<`T`\>

Defined in: actioncode.ts:33

#### Type Parameters

##### T

`T`

#### Parameters

##### input

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)\<`T`\>

#### Returns

`ActionCode`\<`T`\>
