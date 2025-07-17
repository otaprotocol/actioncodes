[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [protocol](../README.md) / ActionCodesProtocol

# Class: ActionCodesProtocol

Defined in: protocol.ts:31

OTA Protocol - Main entry point for the One-Time Action Code Protocol

Provides a unified interface for generating, validating, and managing
action codes across multiple blockchain networks.

## Constructors

### Constructor

> **new ActionCodesProtocol**(`config?`): `ActionCodesProtocol`

Defined in: protocol.ts:35

#### Parameters

##### config?

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

#### Returns

`ActionCodesProtocol`

## Methods

### attachTransaction()

> **attachTransaction**(`actionCode`, `transaction`, `txType?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

Defined in: protocol.ts:155

Attach a transaction to an action code

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

ActionCode to attach transaction to

##### transaction

`string`

Chain-specific transaction data

##### txType?

`string`

Optional transaction type

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

Updated ActionCode

***

### createProtocolMeta()

> **createProtocolMeta**(`actionCode`, `issuer?`, `params?`): [`ProtocolMetaV1`](../../meta/interfaces/ProtocolMetaV1.md)

Defined in: protocol.ts:220

Create protocol meta for a transaction

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

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

Defined in: protocol.ts:254

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

Defined in: protocol.ts:335

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

Defined in: protocol.ts:315

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

Defined in: protocol.ts:239

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

> **finalizeActionCode**(`actionCode`, `txSignature`): [`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

Defined in: protocol.ts:188

Finalize an action code with transaction signature

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

ActionCode to finalize

##### txSignature

`string`

Transaction signature

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

Updated ActionCode

***

### generateActionCode()

> **generateActionCode**(`pubkey`, `signature`, `chain`, `prefix?`, `timestamp?`): [`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

Defined in: protocol.ts:90

Generate an action code for a specific chain

#### Parameters

##### pubkey

`string`

User's public key

##### signature

`string`

User's signature

##### chain

`"solana"`

Target chain

##### prefix?

`string`

Optional prefix (defaults to config defaultPrefix)

##### timestamp?

`number`

Optional timestamp (defaults to now)

#### Returns

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

ActionCode object

***

### getChainAdapter()

> **getChainAdapter**\<`T`\>(`chain`): `undefined` \| [`BaseChainAdapter`](../../adapters/base/classes/BaseChainAdapter.md)\<`T`\>

Defined in: protocol.ts:77

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

Defined in: protocol.ts:348

Get protocol configuration

#### Returns

[`ProtocolConfig`](../interfaces/ProtocolConfig.md)

Current protocol configuration

***

### getRegisteredChains()

> **getRegisteredChains**(): `string`[]

Defined in: protocol.ts:59

Get registered chain adapters

#### Returns

`string`[]

Array of registered chain identifiers

***

### isChainSupported()

> **isChainSupported**(`chain`): `boolean`

Defined in: protocol.ts:68

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

Defined in: protocol.ts:51

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

Defined in: protocol.ts:356

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

Defined in: protocol.ts:132

Validate an action code

#### Parameters

##### actionCode

[`ActionCode`](../../actioncode/classes/ActionCode.md)\<`string`\>

ActionCode to validate

#### Returns

`boolean`

True if valid

***

### validateTransaction()

> **validateTransaction**(`transaction`, `chain`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: protocol.ts:271

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

Defined in: protocol.ts:293

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

Defined in: protocol.ts:364

Create a new protocol instance with default configuration

#### Returns

`ActionCodesProtocol`

New protocol instance

***

### createWithConfig()

> `static` **createWithConfig**(`config`): `ActionCodesProtocol`

Defined in: protocol.ts:373

Create a new protocol instance with custom configuration

#### Parameters

##### config

`Partial`\<[`ProtocolConfig`](../interfaces/ProtocolConfig.md)\>

Custom configuration

#### Returns

`ActionCodesProtocol`

New protocol instance
