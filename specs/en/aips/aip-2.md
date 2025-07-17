# AIP-2: One-Time Code Signature Validation

- **Author**: Action Codes Core Team  
- **Status**: Final  
- **Created**: 2025-06-29

## Overview

This AIP defines the signature validation mechanism for Action Codes. Every action code must be signed by the user's own wallet, providing cryptographic proof of authorization without requiring any centralized protocol authority or trusted issuer.

## Motivation

To enable a fully decentralized, stateless protocol where users can generate and authorize action codes directly from their wallets. This eliminates the need for trusted authorities while maintaining security through cryptographic proof of user intent.

## Specification

### Code Generation & Signature

Each action code is generated through a deterministic process that requires the user to sign a specific message with their wallet:

1. **Message Format**: `actioncodes:<code>:<timestamp>`
   - `<code>`: The 8-digit action code with prefix or `DEFAULT` (empty string)
   - `<timestamp>`: Unix timestamp in milliseconds

2. **Code Derivation**: 
   ```
   code = hash(prefix + pubkey + timestamp + signature)
   ```
   Where `signature` is the user's signature of the message above.

3. **Validation**: The code is valid only if the signature can be verified against the user's public key.

### Signature Verification Process

To validate an action code:

1. Extract the code, public key, and timestamp from the code metadata
2. Reconstruct the signed message: `actioncodes:<code>:<timestamp>`
3. Verify the signature against the user's public key
4. Recompute the code hash using the same algorithm
5. Compare the computed hash with the provided code
6. Ensure the code is within its 2-minute time window

### Time Window & TTL

- **Time Window**: 2-minute TTL from timestamp
- **TTL**: Exact 2-minute expiration (no drift tolerance)
- **Validation**: Codes are only valid within their 2-minute time window

### Prefix Normalization Rules

1. **Case Insensitive**: All prefixes are normalized to uppercase
2. **Alphanumeric Only**: Only A-Z and 0-9 characters are allowed
3. **Length**: 3-12 characters
4. **Reserved**: `DEFAULT` is reserved for the protocol

### ActionCode Object Format

When resolved, an action code returns an ActionCode object:

```typescript
interface ActionCode {
  code: string;           // The 8-character action code
  prefix: string;         // Normalized prefix
  pubkey: string;         // User's public key
  timestamp: number;      // Code generation timestamp
  signature: string;      // User's signature of the message
  chain: string;          // Target chain or network (e.g., "solana")
  transaction?: any;      // Optional chain-specific or serialized transaction
  metadata?: {       
    description?: string;
    params?: Record<string, any>;
  };
  expiresAt: number;      // Expiration timestamp
}
```

## Security Model

- **User-Authorized**: Every code requires the user's wallet signature
- **Deterministic**: Same inputs always produce the same code
- **Time-Bound**: Codes expire exactly at their 2-minute boundary
- **Stateless**: No centralized issuance or authority required
- **No Reuse**: Each code is tied to a specific time slot

## Implementation Notes

- Wallets generate codes locally using this algorithm
- Code validation follows the deterministic derivation process
- No trusted authorities or centralized code issuance required
- The system is fully decentralized and operates as a public good

---
