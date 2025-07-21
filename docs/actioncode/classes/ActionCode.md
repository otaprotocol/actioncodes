[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [actioncode](../README.md) / ActionCode

# Class: ActionCode

Defined in: [actioncode.ts:35](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L35)

## Constructors

### Constructor

> **new ActionCode**(`fields`): `ActionCode`

Defined in: [actioncode.ts:36](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L36)

#### Parameters

##### fields

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`

## Accessors

### chain

#### Get Signature

> **get** **chain**(): `string`

Defined in: [actioncode.ts:102](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L102)

Get the target chain for this action code

##### Returns

`string`

Chain identifier (e.g., "solana", "evm")

***

### code

#### Get Signature

> **get** **code**(): `string`

Defined in: [actioncode.ts:118](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L118)

Get the action code string

##### Returns

`string`

The 8-character action code

***

### codeHash

#### Get Signature

> **get** **codeHash**(): `string`

Defined in: [actioncode.ts:224](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L224)

Get the code hash for this action code
it is also used in the protocol meta as the code id

##### Returns

`string`

Code hash string

***

### description

#### Get Signature

> **get** **description**(): `undefined` \| `string`

Defined in: [actioncode.ts:158](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L158)

Get a human-readable description of the action

##### Returns

`undefined` \| `string`

Description string or undefined

***

### displayString

#### Get Signature

> **get** **displayString**(): `string`

Defined in: [actioncode.ts:190](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L190)

Get a human-readable display string for the action code

##### Returns

`string`

Formatted display string

***

### encoded

#### Get Signature

> **get** **encoded**(): `string`

Defined in: [actioncode.ts:50](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L50)

##### Returns

`string`

***

### expired

#### Get Signature

> **get** **expired**(): `boolean`

Defined in: [actioncode.ts:94](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L94)

Check if the action code has expired

##### Returns

`boolean`

True if the code has expired

***

### intentType

#### Get Signature

> **get** **intentType**(): `"transaction"` \| `"sign-only"`

Defined in: [actioncode.ts:228](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L228)

##### Returns

`"transaction"` \| `"sign-only"`

***

### json

#### Get Signature

> **get** **json**(): [`ActionCodeFields`](../interfaces/ActionCodeFields.md)

Defined in: [actioncode.ts:75](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L75)

##### Returns

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

***

### metadata

#### Get Signature

> **get** **metadata**(): `undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Defined in: [actioncode.ts:150](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L150)

Get metadata associated with this action code

##### Returns

`undefined` \| [`ActionCodeMetadata`](../interfaces/ActionCodeMetadata.md)

Metadata object or undefined

***

### params

#### Get Signature

> **get** **params**(): `undefined` \| `Record`\<`string`, `any`\>

Defined in: [actioncode.ts:166](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L166)

Get parameters associated with this action

##### Returns

`undefined` \| `Record`\<`string`, `any`\>

Parameters object or undefined

***

### prefix

#### Get Signature

> **get** **prefix**(): `string`

Defined in: [actioncode.ts:126](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L126)

Get the prefix used for this action code

##### Returns

`string`

Normalized prefix

***

### pubkey

#### Get Signature

> **get** **pubkey**(): `string`

Defined in: [actioncode.ts:134](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L134)

Get the user's public key

##### Returns

`string`

User's public key

***

### remainingTime

#### Get Signature

> **get** **remainingTime**(): `number`

Defined in: [actioncode.ts:85](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L85)

Get remaining time in milliseconds until expiration

##### Returns

`number`

Remaining time in milliseconds, or 0 if expired

***

### remainingTimeString

#### Get Signature

> **get** **remainingTimeString**(): `string`

Defined in: [actioncode.ts:203](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L203)

Get a formatted time string showing remaining time

##### Returns

`string`

Human-readable time string (e.g., "1m 30s remaining")

***

### signature

#### Get Signature

> **get** **signature**(): `string`

Defined in: [actioncode.ts:182](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L182)

Get the user's signature

##### Returns

`string`

User's signature string

***

### status

#### Get Signature

> **get** **status**(): [`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Defined in: [actioncode.ts:110](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L110)

Get the current status of the action code

##### Returns

[`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

Current status

***

### timestamp

#### Get Signature

> **get** **timestamp**(): `number`

Defined in: [actioncode.ts:174](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L174)

Get the timestamp when the code was generated

##### Returns

`number`

Timestamp in milliseconds

***

### transaction

#### Get Signature

> **get** **transaction**(): `undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Defined in: [actioncode.ts:142](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L142)

Get the transaction data (chain-specific)

##### Returns

`undefined` \| [`ActionCodeTransaction`](../interfaces/ActionCodeTransaction.md)

Transaction data or undefined

## Methods

### isValid()

> **isValid**(`protocol`): `boolean`

Defined in: [actioncode.ts:54](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L54)

#### Parameters

##### protocol

[`ActionCodesProtocol`](../../protocol/classes/ActionCodesProtocol.md)

#### Returns

`boolean`

***

### updateStatus()

> **updateStatus**(`status`): `void`

Defined in: [actioncode.ts:71](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L71)

#### Parameters

##### status

[`ActionCodeStatus`](../type-aliases/ActionCodeStatus.md)

#### Returns

`void`

***

### fromEncoded()

> `static` **fromEncoded**(`encoded`): `ActionCode`

Defined in: [actioncode.ts:45](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L45)

#### Parameters

##### encoded

`string`

#### Returns

`ActionCode`

***

### fromPayload()

> `static` **fromPayload**(`input`): `ActionCode`

Defined in: [actioncode.ts:38](https://github.com/otaprotocol/actioncodes/blob/7fa582d3aecdeca51131d2fc9eec0802298f9a4d/src/actioncode.ts#L38)

#### Parameters

##### input

[`ActionCodeFields`](../interfaces/ActionCodeFields.md)

#### Returns

`ActionCode`
