[**@actioncodes/protocol**](../../../README.md)

***

[@actioncodes/protocol](../../../modules.md) / [adapters/base](../README.md) / BaseChainAdapter

# Class: `abstract` BaseChainAdapter\<T\>

Defined in: [adapters/base.ts:9](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L9)

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

Defined in: [adapters/base.ts:10](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L10)

## Methods

### decode()

> `abstract` **decode**(`tx`): `null` \| [`ProtocolMetaV1`](../../../meta/interfaces/ProtocolMetaV1.md)

Defined in: [adapters/base.ts:24](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L24)

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

Defined in: [adapters/base.ts:50](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L50)

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

Defined in: [adapters/base.ts:17](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L17)

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

Defined in: [adapters/base.ts:96](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L96)

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

Defined in: [adapters/base.ts:41](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L41)

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

Defined in: [adapters/base.ts:33](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L33)

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

Defined in: [adapters/base.ts:87](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L87)

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

Defined in: [adapters/base.ts:107](https://github.com/otaprotocol/actioncodes/blob/fa975e9d2d8d3ff72314243f62c7c4bd689877da/src/adapters/base.ts#L107)

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
