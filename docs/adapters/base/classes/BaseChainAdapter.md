[**@actioncodes/protocol**](../../../README.md)

***

[@actioncodes/protocol](../../../modules.md) / [adapters/base](../README.md) / BaseChainAdapter

# Class: `abstract` BaseChainAdapter\<T\>

Defined in: [adapters/base.ts:9](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L9)

Base adapter class for chain-specific protocol meta operations

## Extended by

- [`SolanaAdapter`](../../solana/solana/classes/SolanaAdapter.md)

## Type Parameters

### T

`T` = `any`

Chain-specific transaction type

## Constructors

### Constructor

> **new BaseChainAdapter**\<`T`\>(): `BaseChainAdapter`\<`T`\>

#### Returns

`BaseChainAdapter`\<`T`\>

## Properties

### chain

> `abstract` `readonly` **chain**: `string`

Defined in: [adapters/base.ts:10](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L10)

## Methods

### decodeMeta()

> `abstract` **decodeMeta**(`tx`): `null` \| [`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/base.ts:24](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L24)

Decode protocol meta from chain-specific transaction

#### Parameters

##### tx

`T`

Chain-specific transaction

#### Returns

`null` \| [`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null

***

### detectTampering()

> **detectTampering**(`tx`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/base.ts:58](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L58)

Detect tampered transactions by cross-checking metadata

#### Parameters

##### tx

`T`

Chain-specific transaction

##### authorities

`string`[]

Array of valid protocol authority identifiers

##### expectedPrefix

`string` = `'DEFAULT'`

Expected protocol prefix

#### Returns

`boolean`

True if transaction is valid and not tampered

***

### encodeMeta()

> `abstract` **encodeMeta**(`meta`): `any`

Defined in: [adapters/base.ts:17](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L17)

Encode protocol meta for this chain

#### Parameters

##### meta

[`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

#### Returns

`any`

Chain-specific encoded data

***

### getCodeSignatureMessage()

> **getCodeSignatureMessage**(`code`, `timestamp`, `prefix`): `string`

Defined in: [adapters/base.ts:104](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L104)

Get the code signature message

#### Parameters

##### code

`string`

The code to sign

##### timestamp

`number`

The timestamp of the code

##### prefix

`string` = `PROTOCOL_CODE_PREFIX`

The prefix of the code

#### Returns

`string`

The code signature message

***

### hasIssuerSignature()

> `abstract` **hasIssuerSignature**(`tx`, `issuer`): `boolean`

Defined in: [adapters/base.ts:49](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L49)

Check if the issuer has signed the transaction

#### Parameters

##### tx

`T`

Chain-specific transaction

##### issuer

`string`

Issuer public key to check

#### Returns

`boolean`

True if issuer has signed

***

### injectMeta()

> `abstract` **injectMeta**(`serializedTx`, `meta`): `string`

Defined in: [adapters/base.ts:32](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L32)

Inject protocol meta into chain-specific transaction

#### Parameters

##### serializedTx

`string`

Serialized transaction string

##### meta

[`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

#### Returns

`string`

Serialized transaction with injected meta

***

### signWithProtocolKey()

> `abstract` **signWithProtocolKey**(`actionCode`, `key`): `Promise`\<[`ActionCode`](../../../actioncode/classes/ActionCode.md)\>

Defined in: [adapters/base.ts:126](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L126)

Sign the transaction with the protocol key using a callback approach
This method should be implemented by each chain-specific adapter to handle
the chain's specific signing mechanism asynchronously

#### Parameters

##### actionCode

[`ActionCode`](../../../actioncode/classes/ActionCode.md)

##### key

`any`

#### Returns

`Promise`\<[`ActionCode`](../../../actioncode/classes/ActionCode.md)\>

Promise that resolves to the signed transaction

***

### validate()

> `abstract` **validate**(`tx`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: [adapters/base.ts:41](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L41)

Validate transaction with protocol meta and authority list

#### Parameters

##### tx

`T`

Chain-specific transaction

##### authorities

`string`[]

Array of valid protocol authority identifiers

##### expectedPrefix?

`string`

Expected protocol prefix (default: 'DEFAULT')

#### Returns

`boolean`

True if transaction is valid

***

### validateSignedMessage()

> `abstract` **validateSignedMessage**(`message`, `signedMessage`, `pubkey`): `boolean`

Defined in: [adapters/base.ts:138](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L138)

#### Parameters

##### message

`string`

##### signedMessage

`string`

##### pubkey

`string`

#### Returns

`boolean`

***

### validateTransactionIntegrity()

> `abstract` `protected` **validateTransactionIntegrity**(`tx`, `meta`): `boolean`

Defined in: [adapters/base.ts:95](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L95)

Chain-specific transaction integrity validation
Override this method for additional validation logic

#### Parameters

##### tx

`T`

Chain-specific transaction

##### meta

[`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

Decoded protocol meta

#### Returns

`boolean`

True if transaction integrity is valid

***

### verifyCodeSignature()

> `abstract` **verifyCodeSignature**(`actionCode`): `boolean`

Defined in: [adapters/base.ts:115](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L115)

Verify the code signature
This is specific to the chain and should be implemented by the concrete adapter
It will be used to verify the code signature for the action code if the right wallet is used to sign the code

#### Parameters

##### actionCode

[`ActionCode`](../../../actioncode/classes/ActionCode.md)

The action code to verify

#### Returns

`boolean`

True if the code signature is valid

***

### verifyFinalizedTransaction()

> `abstract` **verifyFinalizedTransaction**(`tx`, `actionCode`): `boolean`

Defined in: [adapters/base.ts:136](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/adapters/base.ts#L136)

Verify the finalized transaction

#### Parameters

##### tx

`any`

The finalized transaction to verify

##### actionCode

[`ActionCode`](../../../actioncode/classes/ActionCode.md)

#### Returns

`boolean`

True if the transaction is valid
