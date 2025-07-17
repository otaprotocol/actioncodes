# AIP-0: One-Time Action Code Architecture

- **Author**: Action Codes Core Team
- **Status**: Final
- **Created**: 2025-06-29

## Overview

Defines the foundational concept of the Action Codes Protocol: one-time codes that encode an action intent tied to a specific user’s public key.

## Motivation

Enable secure, one-time programmable actions that can be verified on-chain and used for payment, access, voting, and other workflows.

## Specification

Each Action Code:
- Is a short-lived, verifiable intent tied to a user’s public key.
- Is delivered via a transaction or payload signed by a trusted protocol authority.
- Includes metadata similar to Solana Pay fields (label, memo, and reference, etc.)
- Is resolved through a provided REST API or SDK.
- Is bound to a user’s wallet pubkey at creation or intent level.
- May include a registered prefix, allowing integration with branded or categorized systems. See [AIP-5](./aip-5.md) for details.
- Codes can be generated directly in wallets, through the open SDK, or via the hosted interface at [app.ota.codes](https://app.ota.codes)

---
