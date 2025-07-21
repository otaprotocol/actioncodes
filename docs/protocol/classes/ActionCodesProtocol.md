[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [protocol](../README.md) / ActionCodesProtocol

# Class: ActionCodesProtocol

Defined in: [protocol.ts:31](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L31)

OTA Protocol - Main entry point for the One-Time Action Code Protocol

Provides a unified interface for generating, validating, and managing
action codes across multiple blockchain networks.

## Constructors

### Constructor

> **new ActionCodesProtocol**(`config?`): `ActionCodesProtocol`

Defined in: [protocol.ts:35](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L35)

#### Parameters

##### config?

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

#### Returns

`ActionCodesProtocol`

## Methods

### attachMessage()

> **attachMessage**(`actionCode`, `message`, `params?`, `messageType?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:226](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L226)

Attach a message to an action code (sign-only mode, resolved state)

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to attach message to

##### message

`string`

The message that will be signed

##### params?

`string`

Optional parameters for protocol meta

##### messageType?

`string`

Optional message type

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)

Updated ActionCode with transaction containing message

***

### attachTransaction()

> **attachTransaction**(`actionCode`, `transaction`, `issuer`, `params?`, `txType?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:168](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L168)

Attach a transaction to an action code with automatic protocol meta injection

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to attach transaction to

##### transaction

`string`

Chain-specific transaction data (serialized)

##### issuer

`string`

Issuer public key for protocol meta, this is the proof of who is attaching the transaction to the action code

##### params?

`string`

Optional parameters for protocol meta

##### txType?

`string`

Optional transaction type

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)

Updated ActionCode with injected protocol meta

***

### createActionCode()

> **createActionCode**(`pubkey`, `signFn`, `chain`, `prefix`, `timestamp?`): `Promise`\<[`ActionCode`](../../actioncode/classes/ActionCode.md)\>

Defined in: [protocol.ts:116](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L116)

Create an action code

#### Parameters

##### pubkey

`string`

Wallet public key

##### signFn

(`message`) => `Promise`\<`string`\>

Chain-specific signing function (e.g.wallet.signMessage)

##### chain

`"solana"`

Target blockchain

##### prefix

`string` = `...`

Optional code prefix

##### timestamp?

`number`

Optional timestamp

#### Returns

`Promise`\<[`ActionCode`](../../actioncode/classes/ActionCode.md)\>

Promise resolving to a complete ActionCode object

***

### createProtocolMeta()

> **createProtocolMeta**(`actionCode`, `issuer?`, `params?`, `timestamp?`): [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [protocol.ts:314](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L314)

Create protocol meta for a transaction

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to create meta for

##### issuer?

`string`

Optional issuer public key

##### params?

`string`

Optional parameters

##### timestamp?

`number`

Optional timestamp (defaults to action code timestamp)

#### Returns

[`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

***

### decodeProtocolMeta()

> **decodeProtocolMeta**(`transaction`, `chain`): `null` \| [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [protocol.ts:350](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L350)

Decode protocol meta from a transaction

#### Parameters

##### transaction

`any`

Chain-specific transaction

##### chain

`string`

Source chain

#### Returns

`null` \| [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null

***

### decodeProtocolMetaTyped()

> **decodeProtocolMetaTyped**\<`T`\>(`transaction`, `chain`): `null` \| [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [protocol.ts:432](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L432)

Decode protocol meta with type safety

#### Type Parameters

##### T

`T`

#### Parameters

##### transaction

`T`

Chain-specific transaction

##### chain

`string`

Source chain

#### Returns

`null` \| [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null

***

### detectTampering()

> **detectTampering**\<`T`\>(`transaction`, `chain`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: [protocol.ts:412](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L412)

Detect tampered transactions with type safety

#### Type Parameters

##### T

`T`

#### Parameters

##### transaction

`T`

Chain-specific transaction

##### chain

`string`

Source chain

##### authorities

`string`[]

Array of valid protocol authority identifiers

##### expectedPrefix?

`string`

Expected protocol prefix

#### Returns

`boolean`

True if transaction is valid and not tampered

***

### encodeProtocolMeta()

> **encodeProtocolMeta**(`meta`, `chain`): `any`

Defined in: [protocol.ts:335](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L335)

Encode protocol meta for a specific chain

#### Parameters

##### meta

[`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

##### chain

`string`

Target chain

#### Returns

`any`

Chain-specific encoded meta

***

### finalizeActionCode()

> **finalizeActionCode**(`actionCode`, `signature`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:264](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L264)

Finalize an action code based on its intent type

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to finalize

##### signature

`string`

Transaction signature (for transaction intent) or signed message (for sign-only intent)

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)

Updated ActionCode

***

### getChainAdapter()

> **getChainAdapter**\<`T`\>(`chain`): `undefined` \| [`BaseChainAdapter`](../../adapters/base/classes/BaseChainAdapter.md)\<`T`\>

Defined in: [protocol.ts:77](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L77)

Get chain adapter with proper typing

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### chain

`string`

Chain identifier

#### Returns

`undefined` \| [`BaseChainAdapter`](../../adapters/base/classes/BaseChainAdapter.md)\<`T`\>

Chain adapter or undefined

***

### getConfig()

> **getConfig**(): [`ProtocolConfig`](../interfaces/ProtocolConfig.md)

Defined in: [protocol.ts:445](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L445)

Get protocol configuration

#### Returns

[`ProtocolConfig`](../interfaces/ProtocolConfig.md)

Current protocol configuration

***

### getRegisteredChains()

> **getRegisteredChains**(): `string`[]

Defined in: [protocol.ts:59](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L59)

Get registered chain adapters

#### Returns

`string`[]

Array of registered chain identifiers

***

### isChainSupported()

> **isChainSupported**(`chain`): `boolean`

Defined in: [protocol.ts:68](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L68)

Check if a chain is supported

#### Parameters

##### chain

`string`

Chain identifier

#### Returns

`boolean`

True if chain is supported

***

### registerAdapter()

> **registerAdapter**\<`T`\>(`adapter`): `void`

Defined in: [protocol.ts:51](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L51)

Register a chain adapter

#### Type Parameters

##### T

`T`

#### Parameters

##### adapter

[`BaseChainAdapter`](../../adapters/base/classes/BaseChainAdapter.md)\<`T`\>

Chain adapter implementation

#### Returns

`void`

***

### updateConfig()

> **updateConfig**(`updates`): `void`

Defined in: [protocol.ts:453](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L453)

Update protocol configuration

#### Parameters

##### updates

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

Configuration updates

#### Returns

`void`

***

### validateActionCode()

> **validateActionCode**(`actionCode`): `boolean`

Defined in: [protocol.ts:86](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L86)

Validate an action code, checking intent type and required fields

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to validate

#### Returns

`boolean`

True if valid

***

### validateTransaction()

> **validateTransaction**(`transaction`, `chain`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: [protocol.ts:367](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L367)

Validate a transaction with protocol meta

#### Parameters

##### transaction

`any`

Chain-specific transaction (can be serialized string or deserialized object)

##### chain

`string`

Source chain

##### authorities

`string`[]

Array of valid protocol authority identifiers

##### expectedPrefix?

`string`

Expected protocol prefix

#### Returns

`boolean`

True if transaction is valid

***

### validateTransactionTyped()

> **validateTransactionTyped**\<`T`\>(`transaction`, `chain`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: [protocol.ts:390](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L390)

Type-safe transaction validation for specific chains

#### Type Parameters

##### T

`T`

#### Parameters

##### transaction

`T`

Chain-specific transaction

##### chain

`string`

Source chain

##### authorities

`string`[]

Array of valid protocol authority identifiers

##### expectedPrefix?

`string`

Expected protocol prefix

#### Returns

`boolean`

True if transaction is valid

***

### create()

> `static` **create**(): `ActionCodesProtocol`

Defined in: [protocol.ts:461](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L461)

Create a new protocol instance with default configuration

#### Returns

`ActionCodesProtocol`

New protocol instance

***

### createWithConfig()

> `static` **createWithConfig**(`config`): `ActionCodesProtocol`

Defined in: [protocol.ts:470](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/protocol.ts#L470)

Create a new protocol instance with custom configuration

#### Parameters

##### config

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

Custom configuration

#### Returns

`ActionCodesProtocol`

New protocol instance
