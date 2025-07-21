[**@actioncodes/protocol**](../../README.md)

***

[@actioncodes/protocol](../../modules.md) / [meta](../README.md) / ProtocolMetaParser

# Class: ProtocolMetaParser

Defined in: [meta.ts:19](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L19)

Protocol meta parser for structured memo/message parsing

## Constructors

### Constructor

> **new ProtocolMetaParser**(): `ProtocolMetaParser`

#### Returns

`ProtocolMetaParser`

## Methods

### fromInitiator()

> `static` **fromInitiator**(`initiator`, `iss`, `prefix`, `params?`, `timestamp?`): [`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

Defined in: [meta.ts:74](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L74)

Create protocol meta from code and parameters

#### Parameters

##### initiator

`string`

The initiator public key

##### iss

`string`

The issuer (protocol authority)

##### prefix

`string` = `"DEFAULT"`

The prefix (default: "DEFAULT")

##### params?

`string`

Optional parameters

##### timestamp?

`number`

Optional timestamp

#### Returns

[`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

ProtocolMeta object

***

### parse()

> `static` **parse**(`metaString`): `null` \| [`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

Defined in: [meta.ts:27](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L27)

Parse protocol meta from string

#### Parameters

##### metaString

`string`

The protocol meta string to parse

#### Returns

`null` \| [`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

Parsed ProtocolMeta object or null if invalid

***

### serialize()

> `static` **serialize**(`meta`): `string`

Defined in: [meta.ts:55](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L55)

Serialize ProtocolMeta to string

#### Parameters

##### meta

[`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

The protocol meta to serialize

#### Returns

`string`

Serialized protocol meta string

***

### validateCode()

> `static` **validateCode**(`meta`, `timestamp?`): `boolean`

Defined in: [meta.ts:99](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L99)

Validate if a code matches the protocol meta

#### Parameters

##### meta

[`ProtocolMetaV1`](../interfaces/ProtocolMetaV1.md)

The protocol meta to validate against

##### timestamp?

`number`

Optional timestamp for validation (if not provided, uses current time)

#### Returns

`boolean`

True if the meta is valid

***

### validateMetaFromString()

> `static` **validateMetaFromString**(`metaString`, `timestamp?`): `boolean`

Defined in: [meta.ts:110](https://github.com/otaprotocol/actioncodes/blob/d0ef10ae3bd279eafa4f9f7708c521c6ab240398/src/meta.ts#L110)

Validate if a code matches the protocol meta by parsing from string

#### Parameters

##### metaString

`string`

The protocol meta string to validate against

##### timestamp?

`number`

Optional timestamp for validation (if not provided, uses current time)

#### Returns

`boolean`

True if the code matches the meta
