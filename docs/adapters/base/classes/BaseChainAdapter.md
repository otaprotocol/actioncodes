[**@actioncodes/protocol**](../../../README.md)

***

[@actioncodes/protocol](../../../modules.md) / [adapters/base](../README.md) / BaseChainAdapter

# Class: `abstract` BaseChainAdapter\<T\>

Defined in: adapters/base.ts:7

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

Defined in: adapters/base.ts:8

## Methods

### decode()

> `abstract` **decode**(`tx`): `null` \| [`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: adapters/base.ts:22

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

Defined in: adapters/base.ts:48

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

### encode()

> `abstract` **encode**(`meta`): `any`

Defined in: adapters/base.ts:15

Encode protocol meta for this chain

#### Parameters

##### meta

[`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

ProtocolMetaV1 object

#### Returns

`any`

Chain-specific encoded data

***

### hasIssuerSignature()

> `abstract` **hasIssuerSignature**(`tx`, `issuer`): `boolean`

Defined in: adapters/base.ts:39

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

### validate()

> `abstract` **validate**(`tx`, `authorities`, `expectedPrefix?`): `boolean`

Defined in: adapters/base.ts:31

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

### validateTransactionIntegrity()

> `abstract` `protected` **validateTransactionIntegrity**(`tx`, `meta`): `boolean`

Defined in: adapters/base.ts:85

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
