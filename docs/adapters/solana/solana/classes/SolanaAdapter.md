[**@actioncodes/protocol**](../../../../README.md)

***

[@actioncodes/protocol](../../../../modules.md) / [adapters/solana/solana](../README.md) / SolanaAdapter

# Class: SolanaAdapter

Defined in: [adapters/solana/solana.ts:25](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L25)

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

Defined in: [adapters/solana/solana.ts:28](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L28)

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`chain`](../../../base/classes/BaseChainAdapter.md#chain)

## Methods

### decodeFromBase64()

> **decodeFromBase64**(`base64String`): `null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/solana/solana.ts:356](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L356)

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

Defined in: [adapters/solana/solana.ts:56](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L56)

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

Defined in: [adapters/solana/solana.ts:81](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L81)

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

Defined in: [adapters/base.ts:58](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/base.ts#L58)

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

Defined in: [adapters/solana/solana.ts:35](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L35)

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

Defined in: [adapters/base.ts:104](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/base.ts#L104)

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

Defined in: [adapters/solana/solana.ts:193](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L193)

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

Defined in: [adapters/solana/solana.ts:101](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L101)

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

Defined in: [adapters/solana/solana.ts:366](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L366)

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

Defined in: [adapters/solana/solana.ts:183](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L183)

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

Defined in: [adapters/solana/solana.ts:309](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L309)

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

Defined in: [adapters/solana/solana.ts:338](https://github.com/otaprotocol/actioncodes/blob/8a4aa3018c6ed7e0af5268c1fef98a56ef85fed1/src/adapters/solana/solana.ts#L338)

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
