# AIP-3: Intent Resolution & Code Routing

- **Author**: Action Codes Core Team  
- **Status**: Final  
- **Created**: 2025-06-29

## Overview

This AIP defines how action codes are resolved to intents and how metadata flows through the system. It specifies the ActionCode object format and describes the general flow of intent resolution without prescribing specific implementation details.

## Motivation

To standardize how action codes translate into executable instructions and how metadata (title, description, parameters) flows through the protocol. This ensures consistent behavior across different implementations while allowing flexibility in how relayers and services handle code resolution.

## Specification

### ActionCode Object Format

The ActionCode object represents a resolved action code with its associated metadata:

```typescript
type ActionCodeStatus = 'pending' | 'resolved' | 'finalized' | 'expired' | 'error';

interface ActionCodeMetadata {
    description?: string;
    params?: Record<string, any>;
}

interface ActionCodeTransaction<T> {
    transaction?: T;
    txSignature?: string;
    txType?: string;
}

interface ActionCode<T> {
  code: string;           // The 8-character action code
  prefix: string;         // Normalized prefix
  pubkey: string;         // User's public key
  timestamp: number;      // Code generation timestamp
  signature: string;      // User's signature of the message
  chain: (typeof SUPPORTED_CHAINS)[number];          // Target chain or network (e.g., "solana")
  transaction?: ActionCodeTransaction<T>;      // Optional chain-specific or serialized transaction
  metadata?: ActionCodeMetadata;
  expiresAt: number;      // Expiration timestamp
  status: ActionCodeStatus;
}
```

### Intent Resolution Flow

The general flow for resolving action codes involves:

1. **Code Validation**: Code is validated using signature verification (AIP-2)
2. **Metadata Processing**: Optional metadata is processed according to the ActionCode structure
3. **Intent Resolution**: Code is resolved to its associated intent based on the protocol specification

### Metadata Flow

Metadata flows through the system as follows:

- **Description**: Detailed description of the action
- **Params**: Additional parameters for the action (e.g., amount, recipient)

Metadata is optional and can be attached at any point during the code lifecycle.

### Protocol Scope

This AIP defines only the protocol-level concepts and data structures. Implementation details such as:

- Relayer servers and APIs
- Database storage and caching
- Transaction attachment mechanisms
- Infrastructure and deployment
- Completion callbacks and webhooks

Are outside the scope of the protocol specification and left to individual implementations.

## Notes

- Action codes expire exactly at their 2-minute boundary
- Metadata is not validated by the protocol but can be used by applications
- Future versions may standardize specific intent types and metadata schemas
- The protocol focuses on core specification, not implementation details

## Appendix A: ActionCodeStatus Lifecycle

### Status Definitions

| Status | Meaning | Who Sets It | When / Condition |
|--------|---------|-------------|------------------|
| `pending` | Code has been generated and submitted, awaiting intent or transaction | SDK / client / relayer | After code is signed and sent to the relayer (or self-hosted) |
| `resolved` | Code has a transaction attached (but not yet signed or broadcast) | Relayer | After calling /attach or assigning transaction field |
| `finalized` | The transaction has been signed and confirmed on chain | Wallet or relayer | After TX is broadcast and confirmed. Attach txSignature |
| `expired` | The code's expiresAt timestamp is in the past | 🔁 Computed dynamically | Date.now() > expiresAt (not stored permanently) |
| `error` | An error occurred (invalid input, failed tx, wrong pubkey, etc) | Relayer / SDK | Validation failure, relayer rejection, or internal logic fault |

### Valid Transitions

```
        [generated]
            │
            ▼
        pending
            │
     ┌──────┴───────┐
     ▼              ▼
  resolved       expired (time-based)
     │
     ▼
 finalized
     │
     ▼
 expired (optionally)
```

**Note**: `error` status can occur at any stage if validation or logic fails.

### Implementation Notes

- `expired` is always derived from the `expiresAt` field — not manually set
- `finalized` usually comes from a wallet callback or relayer monitor
- Future versions may include optional `finalizedAt: number` for analytics
- All implementations must respect these status transitions for protocol compatibility

---
