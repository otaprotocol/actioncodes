[**@actioncodes/protocol**](../../../../README.md)

***

[@actioncodes/protocol](../../../../modules.md) / [adapters/solana/solana](../README.md) / SolanaAdapter

# Class: SolanaAdapter

Defined in: [adapters/solana/solana.ts:26](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L26)

Simple Solana adapter for protocol meta operations
Supports both legacy and versioned transactions

## Extends

- [`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md)\<[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)\>

## Constructors

### Constructor

> **new SolanaAdapter**(): `SolanaAdapter`

#### Returns

`SolanaAdapter`

#### Inherited from

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`constructor`](../../../base/classes/BaseChainAdapter.md#constructor)

## Properties

### chain

> `readonly` **chain**: `"solana"` = `'solana'`

Defined in: [adapters/solana/solana.ts:29](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L29)

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`chain`](../../../base/classes/BaseChainAdapter.md#chain)

## Methods

### decodeFromBase64()

> **decodeFromBase64**(`base64String`): `null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/solana/solana.ts:357](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L357)

Decode protocol meta from base64 string (for backward compatibility)

#### Parameters

##### base64String

`string`

Base64 encoded transaction

#### Returns

`null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null

***

### decodeMeta()

> **decodeMeta**(`tx`): `null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/solana/solana.ts:57](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L57)

Decode protocol meta from Solana transaction (legacy or versioned)

#### Parameters

##### tx

The Solana transaction (can be deserialized object or base64 string)

`string` | [`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

#### Returns

`null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null if not found

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`decodeMeta`](../../../base/classes/BaseChainAdapter.md#decodemeta)

***

### deserializeTransaction()

> **deserializeTransaction**(`base64String`): [`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

Defined in: [adapters/solana/solana.ts:82](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L82)

Deserialize a Solana transaction from base64 string

#### Parameters

##### base64String

`string`

Base64 encoded transaction

#### Returns

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

SolanaTransaction object

***

### detectTampering()

> **detectTampering**(`tx`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/base.ts:58](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/base.ts#L58)

Detect tampered transactions by cross-checking metadata

#### Parameters

##### tx

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

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

#### Inherited from

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`detectTampering`](../../../base/classes/BaseChainAdapter.md#detecttampering)

***

### encodeMeta()

> **encodeMeta**(`meta`): `TransactionInstruction`

Defined in: [adapters/solana/solana.ts:36](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L36)

Encode protocol meta as a Solana memo instruction

#### Parameters

##### meta

[`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

The protocol meta to encode

#### Returns

`TransactionInstruction`

TransactionInstruction for the memo

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`encodeMeta`](../../../base/classes/BaseChainAdapter.md#encodemeta)

***

### getCodeSignatureMessage()

> **getCodeSignatureMessage**(`code`, `timestamp`, `prefix`): `string`

Defined in: [adapters/base.ts:104](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/base.ts#L104)

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

#### Inherited from

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`getCodeSignatureMessage`](../../../base/classes/BaseChainAdapter.md#getcodesignaturemessage)

***

### hasIssuerSignature()

> **hasIssuerSignature**(`tx`, `issuer`): `boolean`

Defined in: [adapters/solana/solana.ts:194](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L194)

Check if the issuer has signed the transaction

#### Parameters

##### tx

The Solana transaction (can be deserialized object or base64 string)

`string` | [`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

##### issuer

`string`

Issuer public key to check

#### Returns

`boolean`

True if issuer has signed

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`hasIssuerSignature`](../../../base/classes/BaseChainAdapter.md#hasissuersignature)

***

### injectMeta()

> **injectMeta**(`serializedTx`, `meta`): `string`

Defined in: [adapters/solana/solana.ts:102](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L102)

Inject protocol meta into Solana transaction

#### Parameters

##### serializedTx

`string`

Serialized transaction string (base64)

##### meta

[`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

#### Returns

`string`

Serialized transaction with injected meta

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`injectMeta`](../../../base/classes/BaseChainAdapter.md#injectmeta)

***

### signWithProtocolKey()

> **signWithProtocolKey**(`actionCode`, `key`): `Promise`\<[`ActionCode`](../../../../actioncode/classes/ActionCode.md)\>

Defined in: [adapters/solana/solana.ts:367](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L367)

Sign the transaction with the protocol key

#### Parameters

##### actionCode

[`ActionCode`](../../../../actioncode/classes/ActionCode.md)

The action code containing the transaction

##### key

`Keypair`

The keypair to sign with

#### Returns

`Promise`\<[`ActionCode`](../../../../actioncode/classes/ActionCode.md)\>

Promise that resolves to the signed action code

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`signWithProtocolKey`](../../../base/classes/BaseChainAdapter.md#signwithprotocolkey)

***

### validate()

> **validate**(`tx`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/solana/solana.ts:184](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L184)

Validate transaction with protocol meta and authority list

#### Parameters

##### tx

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

The Solana transaction

##### authorities

`string`[]

Array of valid protocol authority public keys (base58)

##### expectedPrefix

`string` = `'DEFAULT'`

Expected protocol prefix (default: 'DEFAULT')

#### Returns

`boolean`

True if transaction is valid

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`validate`](../../../base/classes/BaseChainAdapter.md#validate)

***

### validateTransactionIntegrity()

> `protected` **validateTransactionIntegrity**(`tx`, `meta`): `boolean`

Defined in: [adapters/solana/solana.ts:310](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L310)

Validate Solana transaction integrity with additional checks

#### Parameters

##### tx

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

The Solana transaction

##### meta

[`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Decoded protocol meta

#### Returns

`boolean`

True if transaction integrity is valid

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`validateTransactionIntegrity`](../../../base/classes/BaseChainAdapter.md#validatetransactionintegrity)

***

### verifyCodeSignature()

> **verifyCodeSignature**(`actionCode`): `boolean`

Defined in: [adapters/solana/solana.ts:339](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L339)

Verify the code signature
This is specific to the chain and should be implemented by the concrete adapter
It will be used to verify the code signature for the action code if the right wallet is used to sign the code

#### Parameters

##### actionCode

[`ActionCode`](../../../../actioncode/classes/ActionCode.md)

The action code to verify

#### Returns

`boolean`

True if the code signature is valid

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`verifyCodeSignature`](../../../base/classes/BaseChainAdapter.md#verifycodesignature)

***

### verifyFinalizedTransaction()

> **verifyFinalizedTransaction**(`tx`, `actionCode`): `boolean`

Defined in: [adapters/solana/solana.ts:417](https://github.com/otaprotocol/actioncodes/blob/a8b35c1388affc2365ea89beead5f92a97b38de7/src/adapters/solana/solana.ts#L417)

Verify the finalized transaction from blockchain

#### Parameters

##### tx

`VersionedTransactionResponse`

The finalized transaction response from blockchain

##### actionCode

[`ActionCode`](../../../../actioncode/classes/ActionCode.md)

The action code to verify against

#### Returns

`boolean`

True if the transaction is valid and matches the action code

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`verifyFinalizedTransaction`](../../../base/classes/BaseChainAdapter.md#verifyfinalizedtransaction)
