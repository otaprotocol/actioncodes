[**@actioncodes/protocol**](../../../../README.md)

***

[@actioncodes/protocol](../../../../modules.md) / [adapters/solana/solana](../README.md) / SolanaAdapter

# Class: SolanaAdapter

Defined in: [adapters/solana/solana.ts:20](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L20)

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

Defined in: [adapters/solana/solana.ts:23](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L23)

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`chain`](../../../base/classes/BaseChainAdapter.md#chain)

## Methods

### decode()

> **decode**(`tx`): `null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/solana/solana.ts:40](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L40)

Decode protocol meta from Solana transaction (legacy or versioned)

#### Parameters

##### tx

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

The Solana transaction

#### Returns

`null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null if not found

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`decode`](../../../base/classes/BaseChainAdapter.md#decode)

***

### decodeFromBase64()

> **decodeFromBase64**(`base64String`): `null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/solana/solana.ts:201](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L201)

Decode protocol meta from base64 string (for backward compatibility)

#### Parameters

##### base64String

`string`

Base64 encoded transaction

#### Returns

`null` \| [`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

Decoded ProtocolMetaV1 or null

***

### detectTampering()

> **detectTampering**(`tx`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/base.ts:48](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/base.ts#L48)

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

### encode()

> **encode**(`meta`): `TransactionInstruction`

Defined in: [adapters/solana/solana.ts:30](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L30)

Encode protocol meta as a Solana memo instruction

#### Parameters

##### meta

[`ProtocolMetaV1`](../../../../meta/interfaces/ProtocolMetaV1.md)

The protocol meta to encode

#### Returns

`TransactionInstruction`

TransactionInstruction for the memo

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`encode`](../../../base/classes/BaseChainAdapter.md#encode)

***

### hasIssuerSignature()

> **hasIssuerSignature**(`tx`, `issuer`): `boolean`

Defined in: [adapters/solana/solana.ts:68](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L68)

Check if the issuer has signed the transaction

#### Parameters

##### tx

[`SolanaTransaction`](../type-aliases/SolanaTransaction.md)

The Solana transaction

##### issuer

`string`

Issuer public key to check

#### Returns

`boolean`

True if issuer has signed

#### Overrides

[`BaseChainAdapter`](../../../base/classes/BaseChainAdapter.md).[`hasIssuerSignature`](../../../base/classes/BaseChainAdapter.md#hasissuersignature)

***

### validate()

> **validate**(`tx`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/solana/solana.ts:58](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L58)

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

### validateFromBase64()

> **validateFromBase64**(`base64String`, `authorities`, `expectedPrefix`): `boolean`

Defined in: [adapters/solana/solana.ts:224](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L224)

Validate base64 transaction (for backward compatibility)

#### Parameters

##### base64String

`string`

Base64 encoded transaction

##### authorities

`string`[]

Array of valid protocol authority public keys (base58)

##### expectedPrefix

`string` = `'DEFAULT'`

Expected protocol prefix (default: 'DEFAULT')

#### Returns

`boolean`

True if transaction is valid

***

### validateTransactionIntegrity()

> `protected` **validateTransactionIntegrity**(`tx`, `meta`): `boolean`

Defined in: [adapters/solana/solana.ts:175](https://github.com/otaprotocol/actioncodes/blob/b4bc06f6d42b5f06660c6f068ac123b4cd9daff7/src/adapters/solana/solana.ts#L175)

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
