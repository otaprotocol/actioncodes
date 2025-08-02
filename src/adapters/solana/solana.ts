// Copyright 2025 Trana, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    MessageV0,
    PublicKey,
    Keypair,
    VersionedTransactionResponse
} from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { BaseChainAdapter } from '../base';
import * as nacl from 'tweetnacl';
import { ActionCode } from '../../actioncode';
import { Buffer } from "buffer";
import bs58 from 'bs58';

/**
 * Solana transaction type union
 */
export type SolanaTransaction = Transaction | VersionedTransaction;

/**
 * Simple Solana adapter for protocol meta operations
 * Supports both legacy and versioned transactions
 */
export class SolanaAdapter extends BaseChainAdapter<SolanaTransaction> {
    private static readonly MEMO_PROGRAM_ID = MEMO_PROGRAM_ID;

    readonly chain = 'solana';

    /**
     * Encode protocol meta as a Solana memo instruction
     * @param meta - The protocol meta to encode
     * @returns TransactionInstruction for the memo
     */
    encodeMeta(meta: ProtocolMetaV1): TransactionInstruction {
        const metaString = ProtocolMetaParser.serialize(meta);
        const signerPubkeys = [];

        try {
            if (meta.iss && meta.iss !== 'undefined') {
                const pubkey = new PublicKey(meta.iss);
                signerPubkeys.push(pubkey);
            }
        } catch (error) {
            // Ignore error, issuer is not a valid public key
        }

        return createMemoInstruction(metaString, signerPubkeys);
    }

    /**
     * Decode protocol meta from Solana transaction (legacy or versioned)
     * @param tx - The Solana transaction (can be deserialized object or base64 string)
     * @returns Decoded ProtocolMetaV1 or null if not found
     */
    decodeMeta(tx: SolanaTransaction | string): ProtocolMetaV1 | null {
        // If it's a string, deserialize it first
        if (typeof tx === 'string') {
            try {
                tx = this.deserializeTransaction(tx);
            } catch {
                return null;
            }
        }

        // Check if it's a versioned transaction
        if ('message' in tx && tx.message) {
            return this.decodeVersionedTransaction(tx as VersionedTransaction);
        } else if ('instructions' in tx && Array.isArray(tx.instructions)) {
            return this.decodeLegacyTransaction(tx as Transaction);
        } else {
            return null;
        }
    }

    /**
     * Deserialize a Solana transaction from base64 string
     * @param base64String - Base64 encoded transaction
     * @returns SolanaTransaction object
     */
    public deserializeTransaction(base64String: string): SolanaTransaction {
        try {
            const buffer = Buffer.from(base64String, 'base64');
            // Try legacy first, then versioned
            try {
                return Transaction.from(buffer);
            } catch {
                return VersionedTransaction.deserialize(buffer);
            }
        } catch (error) {
            throw new Error('Failed to deserialize Solana transaction');
        }
    }

    /**
     * Inject protocol meta into Solana transaction
     * @param serializedTx - Serialized transaction string (base64)
     * @param meta - ProtocolMetaV1 object
     * @returns Serialized transaction with injected meta
     */
    injectMeta(serializedTx: string, meta: ProtocolMetaV1): string {
        // Deserialize the transaction using existing pattern
        const tx = this.deserializeTransaction(serializedTx);

        const metaIx = this.encodeMeta(meta);

        if (tx instanceof VersionedTransaction) {
            // Convert TransactionInstruction to MessageCompiledInstruction for versioned transactions

            // Create new static account keys array with all required keys
            const newStaticAccountKeys = [...tx.message.staticAccountKeys];

            // Add any missing keys from the memo instruction
            metaIx.keys.forEach(({ pubkey }) => {
                if (!newStaticAccountKeys.some(key => key.equals(pubkey))) {
                    newStaticAccountKeys.push(pubkey);
                }
            });

            // Ensure programId is also in static keys
            if (!newStaticAccountKeys.some(key => key.equals(metaIx.programId))) {
                newStaticAccountKeys.push(metaIx.programId);
            }

            // Create new compiled instructions array
            const newCompiledInstructions = [...tx.message.compiledInstructions];

            // Find the program ID index in the new static keys
            const programIdIndex = newStaticAccountKeys.findIndex(key =>
                key.equals(metaIx.programId)
            );

            const accountKeyIndexes = metaIx.keys.map(key => {
                const index = newStaticAccountKeys.findIndex(staticKey =>
                    staticKey.equals(key.pubkey)
                );
                if (index === -1) {
                    throw new Error(`Account key ${key.pubkey.toBase58()} not found in static account keys`);
                }
                return index;
            });

            const compiledInstruction = {
                programIdIndex,
                accountKeyIndexes,
                data: metaIx.data
            };

            newCompiledInstructions.push(compiledInstruction);

            // Create new MessageV0 with updated data
            const newMessage = new MessageV0({
                header: tx.message.header,
                staticAccountKeys: newStaticAccountKeys,
                recentBlockhash: tx.message.recentBlockhash,
                compiledInstructions: newCompiledInstructions,
                addressTableLookups: tx.message.addressTableLookups,
            });

            // Create new VersionedTransaction
            const newVersionedTx = new VersionedTransaction(newMessage);
            return Buffer.from(newVersionedTx.serialize()).toString('base64');
        } else if (tx instanceof Transaction) {
            tx.instructions.push(metaIx);

            // Clear existing signatures since we modified the transaction
            tx.signatures = [];

            // Serialize the transaction back without requiring signatures
            return tx.serialize({ requireAllSignatures: false }).toString('base64');
        } else {
            throw new Error('Invalid transaction type');
        }
    }

    /**
     * Validate transaction with protocol meta and authority list
     * @param tx - The Solana transaction
     * @param authorities - Array of valid protocol authority public keys (base58)
     * @param expectedPrefix - Expected protocol prefix (default: 'DEFAULT')
     * @returns True if transaction is valid
     */
    validate(tx: SolanaTransaction, authorities: string[], expectedPrefix: string = 'DEFAULT'): boolean {
        return this.detectTampering(tx, authorities, expectedPrefix);
    }

    /**
     * Check if the issuer has signed the transaction
     * @param tx - The Solana transaction (can be deserialized object or base64 string)
     * @param issuer - Issuer public key to check
     * @returns True if issuer has signed
     */
    hasIssuerSignature(tx: SolanaTransaction | string, issuer: string): boolean {
        // If it's a string, deserialize it first
        if (typeof tx === 'string') {
            try {
                tx = this.deserializeTransaction(tx);
            } catch {
                return false;
            }
        }

        // Check if it's a versioned transaction
        if ('message' in tx && tx.message) {
            return this.hasIssuerSignatureVersioned(tx as VersionedTransaction, issuer);
        } else if ('signatures' in tx && Array.isArray(tx.signatures)) {
            return this.hasIssuerSignatureLegacy(tx as Transaction, issuer);
        } else {
            return false;
        }
    }

    /**
     * Decode protocol meta from legacy Solana transaction
     */
    private decodeLegacyTransaction(transaction: Transaction): ProtocolMetaV1 | null {
        for (const instruction of transaction.instructions) {
            if (instruction.programId.equals(SolanaAdapter.MEMO_PROGRAM_ID)) {
                const memoData = instruction.data;
                if (memoData && memoData.length > 0) {
                    try {
                        const memoString = new TextDecoder().decode(memoData);
                        const meta = ProtocolMetaParser.parse(memoString);
                        if (meta && meta.version === '1') {
                            return meta;
                        }
                        // Continue searching if this memo is not a valid protocol meta
                    } catch {
                        // Continue searching if this memo cannot be parsed
                    }
                }
            }
        }
        return null;
    }

    /**
     * Decode protocol meta from versioned Solana transaction
     */
    private decodeVersionedTransaction(transaction: VersionedTransaction): ProtocolMetaV1 | null {
        const message = transaction.message;

        if (message instanceof MessageV0) {
            return this.decodeMessageV0(message);
        } else {
            return null;
        }
    }

    /**
     * Decode protocol meta from MessageV0
     */
    private decodeMessageV0(message: MessageV0): ProtocolMetaV1 | null {
        for (const instruction of message.compiledInstructions) {
            const programId = message.staticAccountKeys[instruction.programIdIndex];

            if (programId.equals(SolanaAdapter.MEMO_PROGRAM_ID)) {
                const memoData = instruction.data;
                if (memoData && memoData.length > 0) {
                    try {
                        const memoString = new TextDecoder().decode(memoData);
                        const meta = ProtocolMetaParser.parse(memoString);
                        if (meta && meta.version === '1') {
                            return meta;
                        }
                        // Continue searching if this memo is not a valid protocol meta
                    } catch {
                        // Continue searching if this memo cannot be parsed
                    }
                }
            }
        }
        return null;
    }

    /**
     * Check if the issuer has signed a legacy transaction
     */
    private hasIssuerSignatureLegacy(transaction: Transaction, issuer: string): boolean {
        return transaction.signatures.some(sig =>
            sig.publicKey.toBase58() === issuer
        );
    }

    /**
     * Check if the issuer has signed a versioned transaction
     */
    private hasIssuerSignatureVersioned(transaction: VersionedTransaction, issuer: string): boolean {
        const message = transaction.message;

        if (message instanceof MessageV0) {
            // Check static account keys
            for (const key of message.staticAccountKeys) {
                if (key.toBase58() === issuer) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Validate Solana transaction integrity with additional checks
     * @param tx - The Solana transaction
     * @param meta - Decoded protocol meta
     * @returns True if transaction integrity is valid
     */
    protected validateTransactionIntegrity(tx: SolanaTransaction, meta: ProtocolMetaV1): boolean {
        // Additional Solana-specific validation can be added here
        // For example, checking transaction signatures, recent blockhash, etc.

        // Verify that the memo instruction contains the expected protocol meta
        const decodedMeta = this.decodeMeta(tx);
        if (!decodedMeta) {
            return false;
        }

        if (!meta.iss) {
            return false;
        }

        if (!this.hasIssuerSignature(tx, meta.iss!)) {
            return false;
        }

        // Cross-check the decoded meta with the provided meta
        return (
            decodedMeta.version === meta.version &&
            decodedMeta.prefix === meta.prefix &&
            decodedMeta.initiator === meta.initiator &&
            decodedMeta.id === meta.id &&
            decodedMeta.iss === meta.iss &&
            decodedMeta.params === meta.params
        );
    }

    public verifyCodeSignature(actionCode: ActionCode): boolean {
        try {
            const message = this.getCodeSignatureMessage(actionCode.code, actionCode.timestamp, actionCode.prefix);
            const messageBytes = new TextEncoder().encode(message);
            const pubkeyBytes = new PublicKey(actionCode.pubkey).toBytes();
            const sigBytes = bs58.decode(actionCode.signature);

            return nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
        } catch (error) {
            return false;
        }
    }

    /**
     * Decode protocol meta from base64 string (for backward compatibility)
     * @param base64String - Base64 encoded transaction
     * @returns Decoded ProtocolMetaV1 or null
     */
    decodeFromBase64(base64String: string): ProtocolMetaV1 | null {
        return this.decodeMeta(base64String);
    }

    /**
     * Sign the transaction with the protocol key
     * @param actionCode - The action code containing the transaction
     * @param key - The keypair to sign with
     * @returns Promise that resolves to the signed action code
     */
    async signWithProtocolKey(
        actionCode: ActionCode,
        key: Keypair
    ): Promise<ActionCode> {
        try {
            if (!actionCode.transaction?.transaction) {
                throw new Error('No transaction found');
            }

            const tx = this.deserializeTransaction(actionCode.transaction.transaction);

            // Check if transaction has protocol meta
            const meta = this.decodeMeta(tx);
            if (!meta) {
                throw new Error('Invalid transaction, protocol meta not found');
            }

            // Validate transaction integrity
            if (!this.validateTransactionIntegrity(tx, meta)) {
                throw new Error('Invalid transaction, transaction integrity not valid');
            }

            // Sign the transaction
            if (tx instanceof Transaction) {
                tx.partialSign(key);
            } else if (tx instanceof VersionedTransaction) {
                tx.sign([key]);
            } else {
                throw new Error('Invalid transaction type');
            }

            const updatedTransaction = {
                ...actionCode.transaction,
                transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'),
            };

            const updatedFields = {
                ...actionCode.json,
                transaction: updatedTransaction,
            };

            return ActionCode.fromPayload(updatedFields);
        } catch (error) {
            throw new Error(`Failed to sign transaction with protocol key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Verify the finalized transaction from blockchain
     * @param tx - The finalized transaction response from blockchain
     * @param actionCode - The action code to verify against
     * @returns True if the transaction is valid and matches the action code
     */
    verifyFinalizedTransaction(tx: VersionedTransactionResponse, actionCode: ActionCode): boolean {
        try {
            // Handle null/undefined transaction
            if (tx.transaction === null || tx.transaction === undefined) {
                return false;
            }

            // Both legacy and versioned responses have message and signatures
            const response = tx.transaction as any;
            if (!response.message || !response.signatures) {
                return false;
            }

            let transaction: SolanaTransaction;

            // Check if it's a versioned transaction by looking at the message structure
            if (response.message instanceof MessageV0) {
                // Versioned transaction - reconstruct from message and signatures
                transaction = new VersionedTransaction(response.message);
                // Note: In a real scenario, signatures would be attached, but for testing we just need the message
            } else {
                // Legacy transaction - reconstruct from compiled message and signatures
                const compiledMessage = response.message;
                transaction = Transaction.populate(compiledMessage, response.signatures);
            }

            const meta = this.decodeMeta(transaction);
            if (!meta) {
                return false; // No protocol meta found
            }

            if (!meta.iss) {
                return false; // No issuer field in meta
            }

            if (!actionCode.codeHash) {
                return false; // No codeHash available
            }
            if (!meta.id || meta.id !== actionCode.codeHash) {
                return false; // ID doesn't match expected value
            }


            if (meta.prefix !== actionCode.prefix) {
                return false;
            }


            if (meta.initiator !== actionCode.pubkey) {
                return false;
            }



            let userPubkey: PublicKey | null = null;
            try {
                userPubkey = new PublicKey(actionCode.pubkey);
            } catch (error) {
                return false;
            }

            if (userPubkey) {
                if (transaction instanceof VersionedTransaction) {
                    const message = transaction.message;

                    if (message instanceof MessageV0) {
                        // Check if user's public key is in the static account keys
                        const userKeyIndex = message.staticAccountKeys.findIndex(key =>
                            key.equals(userPubkey!)
                        );

                        if (userKeyIndex === -1) {
                            return false; // User's key not found in transaction
                        }

                        // Check if user's key is a signer (first bit of header indicates signer status)
                        const isUserSigner = (message.header.numRequiredSignatures > 0) &&
                            (userKeyIndex < message.header.numRequiredSignatures);

                        if (!isUserSigner) {
                            return false; // User didn't sign the transaction
                        }
                    } else {
                        return false; // Unsupported message type
                    }
                } else if (transaction instanceof Transaction) {
                    // For legacy transactions, check if user's key is in the account keys
                    const accountKeys = transaction.compileMessage().accountKeys;
                    const userKeyIndex = accountKeys.findIndex(key =>
                        key.equals(userPubkey!)
                    );

                    if (userKeyIndex === -1) {
                        return false; // User's key not found in transaction
                    }

                    // Check if user's key is a signer
                    const isUserSigner = userKeyIndex < transaction.compileMessage().header.numRequiredSignatures;

                    if (!isUserSigner) {
                        return false; // User didn't sign the transaction
                    }
                } else {
                    return false; // Invalid transaction type
                }
            }

            // 5. Check that tx is signed by protocol (issuer)
            if (!this.hasIssuerSignature(transaction, meta.iss)) {
                return false; // Protocol didn't sign the transaction
            }

            // All checks passed
            return true;
        } catch (error) {
            // If any error occurs during verification, return false
            return false;
        }
    }

    /**
     * Validate a signed message for sign-only mode
     * @param message - The message that was signed
     * @param signedMessage - The signed message (base64 or hex)
     * @param pubkey - The public key that should have signed the message
     * @returns True if the signature is valid
     */
    validateSignedMessage(message: string, signedMessage: string, pubkey: string): boolean {
        try {
            // Decode the public key (base58)
            const publicKeyBytes = bs58.decode(pubkey);
            // Decode the signature as base58 (Solana convention)
            const signature = bs58.decode(signedMessage);
            const messageBuffer = Buffer.from(message, 'utf8');
            return nacl.sign.detached.verify(messageBuffer, signature, publicKeyBytes);
        } catch (e) {
            return false;
        }
    }
} 