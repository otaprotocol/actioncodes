**@actioncodes/protocol**

***

# 🛡️ Action Codes Protocol

![Coverage](https://img.shields.io/badge/coverage-98%-brightgreen)

**Action Codes Protocol** enables short-lived, cryptographically verifiable action codes that authorize blockchain transactions and intents without requiring live wallet sessions.

This repository contains the canonical specifications, SDK modules, and chain adapter interfaces that implement the Action Codes Protocol.

---

## ✨ Key Features

- 🔐 **Deterministic Code Generation**  
  Users can generate time-limited codes directly in their wallet or client, without external servers.

- ✅ **Signature-Based Verification**  
  Codes are signed by the wallet, and transactions must be signed by protocol-authorized relayers.

- 🧩 **Meta-Based Intent Encoding**  
  Each transaction carries an encoded `meta` string for verifiable context across chains.

- 🧱 **Chain-Agnostic Design**  
  Works on Solana today; built for future EVM, Cosmos, and more.

- 🌐 **Prefix Namespace System**  
  Enables ecosystem-wide namespacing (e.g. `JUP`, `ME`) for branded intents and UIs.

---

## 📦 Repository Structure

```
/src         - SDK modules (codegen, meta, validator, blockchain adapters)
/specs       - Formal specifications (AIPs)
README.md    - You are here
LICENSE      - Apache 2.0
```

---

## 📄 Specifications

[Protocol Specifications](_media/README.md)

- [`AIP-0`](./specs/aip-0.md): Action Codes Protocol Architecture
- [`AIP-1`](./specs/aip-1.md): Protocol Meta Format
- [`AIP-2`](./specs/aip-2.md): Authority Signature Validation
- [`AIP-3`](./specs/aip-3.md): Intent Resolution & Routing
- [`AIP-4`](./specs/aip-4.md): Prefix System

---

## 📜 License

This protocol is open source under the [Apache 2.0 License](_media/LICENSE).
