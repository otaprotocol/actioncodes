# AIP-1: Protocol Meta Format

- **Author**: Action Codes Core Team  
- **Status**: Final  
- **Created**: 2025-06-29

## Overview

This AIP defines the canonical meta format used in Action Codes powered transactions. The meta string encodes authoritative metadata that allows transactions to be verified, traced, and trusted.

## Motivation

To ensure each transaction processed via Action Codes is traceable, validated, and cryptographically anchored to both an issuer and an initiator. This enables cross-system trust, analytics, and branding without compromising privacy or requiring off-chain assumptions.

## Specification

The meta format is a URL-style key-value structure prefixed by `actioncodes:`.

### Format

```
actioncodes:ver=1&pre=PREFIX&id=CODE_ID[&iss=ISSUER][&p=PARAMS]
```

- `ver`: Protocol version (e.g. `1`)
- `pre`: Registered prefix (e.g. `DEFAULT`, or a brand-specific prefix like `JUP`)
- `id`: The unique code hash
- `iss`: Optional issuer public key (for relayer attribution or audits)
- `p`: Optional parameters string (used for UI hints or metadata)

### Example

```
actioncodes:ver=1&pre=DEFAULT&id=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234&iss=7gNqUuY5rWfqU6SRb3rMiD6kKMeX7jhkoXLUzbiDPKGz&p=pay-2usdc
```

## Validation

Validation requires:

1. Parsing the meta and verifying required fields (`ver`, `pre`, `id`)
2. Validating the action code using the signature verification process (see [AIP-2](./aip-2.md))
3. Ensuring the code is within its valid time window (2-minute TTL)

## Notes

- The meta is publicly visible on-chain.
- It avoids including any sensitive or encrypted data.
- This format may be extended in future protocol versions and ready to use with other blockchains.

---
