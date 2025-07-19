[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [protocol](../README.md) / ActionCodesProtocol

# Class: ActionCodesProtocol

Defined in: [protocol.ts:31](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L31)

OTA Protocol - Main entry point for the One-Time Action Code Protocol

Provides a unified interface for generating, validating, and managing
action codes across multiple blockchain networks.

## Constructors

### Constructor

> **new ActionCodesProtocol**(`config?`): `ActionCodesProtocol`

Defined in: [protocol.ts:35](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L35)

#### Parameters

##### config?

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

#### Returns

`ActionCodesProtocol`

## Methods

### attachTransaction()

> **attachTransaction**(`actionCode`, `transaction`, `txType?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:161](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L161)

Attach a transaction to an action code

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to attach transaction to

##### transaction

`string`

Chain-specific transaction data

##### txType?

`string`

Optional transaction type

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)

Updated ActionCode

***

### createActionCode()

> **createActionCode**(`pubkey`, `signFn`, `chain`, `prefix`, `timestamp?`): `Promise`\<[`ActionCode`](../../actioncode/classes/ActionCode.md)\>

Defined in: [protocol.ts:111](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L111)

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

> **createProtocolMeta**(`actionCode`, `issuer?`, `params?`): [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [protocol.ts:226](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L226)

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

#### Returns

[`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

***

### decodeProtocolMeta()

> **decodeProtocolMeta**(`transaction`, `chain`): `null` \| [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [protocol.ts:260](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L260)

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

Defined in: [protocol.ts:341](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L341)

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

Defined in: [protocol.ts:321](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L321)

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

Defined in: [protocol.ts:245](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L245)

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

> **finalizeActionCode**(`actionCode`, `txSignature`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:194](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L194)

Finalize an action code with transaction signature

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)

ActionCode to finalize

##### txSignature

`string`

Transaction signature

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)

Updated ActionCode

***

### getChainAdapter()

> **getChainAdapter**\<`T`\>(`chain`): `undefined` \| [`BaseChainAdapter`](../../adapters/base/classes/BaseChainAdapter.md)\<`T`\>

Defined in: [protocol.ts:77](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L77)

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

Defined in: [protocol.ts:354](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L354)

Get protocol configuration

#### Returns

[`ProtocolConfig`](../interfaces/ProtocolConfig.md)

Current protocol configuration

***

### getRegisteredChains()

> **getRegisteredChains**(): `string`[]

Defined in: [protocol.ts:59](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L59)

Get registered chain adapters

#### Returns

`string`[]

Array of registered chain identifiers

***

### isChainSupported()

> **isChainSupported**(`chain`): `boolean`

Defined in: [protocol.ts:68](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L68)

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

Defined in: [protocol.ts:51](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L51)

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

Defined in: [protocol.ts:362](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L362)

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

Defined in: [protocol.ts:86](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L86)

Validate an action code

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

Defined in: [protocol.ts:277](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L277)

Validate a transaction with protocol meta

#### Parameters

##### transaction

`any`

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

### validateTransactionTyped()

> **validateTransactionTyped**\<`T`\>(`transaction`, `chain`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: [protocol.ts:299](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L299)

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

Defined in: [protocol.ts:370](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L370)

Create a new protocol instance with default configuration

#### Returns

`ActionCodesProtocol`

New protocol instance

***

### createWithConfig()

> `static` **createWithConfig**(`config`): `ActionCodesProtocol`

Defined in: [protocol.ts:379](https://github.com/otaprotocol/actioncodes/blob/007a9e0d8a0303f8bd7d2ee1ee5ee3e0ff8d987c/src/protocol.ts#L379)

Create a new protocol instance with custom configuration

#### Parameters

##### config

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

Custom configuration

#### Returns

`ActionCodesProtocol`

New protocol instance
