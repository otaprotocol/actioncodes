[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [protocol](../README.md) / ActionCodesProtocol

# Class: ActionCodesProtocol

Defined in: [protocol.ts:31](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L31)

OTA Protocol - Main entry point for the One-Time Action Code Protocol

Provides a unified interface for generating, validating, and managing
action codes across multiple blockchain networks.

## Constructors

### Constructor

> **new ActionCodesProtocol**(`config?`): `ActionCodesProtocol`

Defined in: [protocol.ts:35](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L35)

#### Parameters

##### config?

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

#### Returns

`ActionCodesProtocol`

## Methods

### attachTransaction()

> **attachTransaction**(`actionCode`, `transaction`, `issuer`, `params?`, `txType?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)

Defined in: [protocol.ts:163](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L163)

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

Defined in: [protocol.ts:111](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L111)

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

Defined in: [protocol.ts:252](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L252)

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

Defined in: [protocol.ts:288](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L288)

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

Defined in: [protocol.ts:370](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L370)

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

Defined in: [protocol.ts:350](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L350)

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

Defined in: [protocol.ts:273](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L273)

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

Defined in: [protocol.ts:219](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L219)

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

Defined in: [protocol.ts:77](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L77)

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

Defined in: [protocol.ts:383](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L383)

Get protocol configuration

#### Returns

[`ProtocolConfig`](../interfaces/ProtocolConfig.md)

Current protocol configuration

***

### getRegisteredChains()

> **getRegisteredChains**(): `string`[]

Defined in: [protocol.ts:59](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L59)

Get registered chain adapters

#### Returns

`string`[]

Array of registered chain identifiers

***

### isChainSupported()

> **isChainSupported**(`chain`): `boolean`

Defined in: [protocol.ts:68](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L68)

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

Defined in: [protocol.ts:51](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L51)

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

Defined in: [protocol.ts:391](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L391)

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

Defined in: [protocol.ts:86](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L86)

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

Defined in: [protocol.ts:305](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L305)

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

Defined in: [protocol.ts:328](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L328)

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

Defined in: [protocol.ts:399](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L399)

Create a new protocol instance with default configuration

#### Returns

`ActionCodesProtocol`

New protocol instance

***

### createWithConfig()

> `static` **createWithConfig**(`config`): `ActionCodesProtocol`

Defined in: [protocol.ts:408](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/protocol.ts#L408)

Create a new protocol instance with custom configuration

#### Parameters

##### config

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

Custom configuration

#### Returns

`ActionCodesProtocol`

New protocol instance
