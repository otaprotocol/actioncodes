# AIP-4: Prefix System

- **Author**: Action Codes Core Team  
- **Status**: Draft  
- **Created**: 2025-06-29

## Overview

This AIP introduces the concept of *prefixes* in action codes — short identifiers registered to external entities (e.g. dApps, merchants, wallets) that allow namespacing, trust branding, and routing of metadata and actions.

## Motivation

Prefixes allow different organizations or apps to define metadata standards and branding without fragmenting the protocol. They provide a way to associate trusted behaviors, style, or usage constraints with action codes.

## Specification

### Prefix Structure

- Prefixes are 3–12 uppercase alphanumeric characters.
- They are registered on-chain or in the registry service hosted by Action Codes (e.g. `registry.actioncodes.com`).
- Each prefix maps to a metadata schema or handler and public authority.

### Code Usage

Action codes generated with a prefix appear as:

```
JUP-99283234  
```

Where `JUP` is the prefix registered by Jupiter (example), and `99283234` is the one-time code body.

The prefix is included in the `pre` field of the memo:

```
actioncodes:ver=1&pre=JUP&...
```

### Registry

A prefix registry includes:

- Prefix name
- Linked metadata schema URL
- Authority public key (for signature validation)
- Branding info (e.g. icon URL, display name)
- Optional UI hints or intent categories

This registry is currently centralized but may be replicated on-chain in the future.

### Resolution Flow

When a code is submitted:
1. The prefix is extracted from the memo (`pre=JUP`).
2. The registry is queried to fetch metadata and handler info.
3. Metadata is validated if applicable.
4. UI and processing logic may adapt to prefix branding.

## Notes

- Prefixes are optional. The default (`DEFAULT`) prefix represents the protocol.
- Prefix branding improves UX for wallets and dApps.
- Prefix enforcement is handled by relayers during code validation.

---

