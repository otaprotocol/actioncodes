import {
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    MessageV0
} from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { BaseChainAdapter } from '../base';

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
    encode(meta: ProtocolMetaV1): TransactionInstruction {
        const metaString = ProtocolMetaParser.serialize(meta);
        return createMemoInstruction(metaString);
    }

    /**
     * Decode protocol meta from Solana transaction (legacy or versioned)
     * @param tx - The Solana transaction
     * @returns Decoded ProtocolMetaV1 or null if not found
     */
    decode(tx: SolanaTransaction): ProtocolMetaV1 | null {
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
     * @param tx - The Solana transaction
     * @param issuer - Issuer public key to check
     * @returns True if issuer has signed
     */
    hasIssuerSignature(tx: SolanaTransaction, issuer: string): boolean {
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
                        if (meta && meta.version !== '1') {
                            return null;
                        }
                        return meta;
                    } catch {
                        return null;
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
                        if (meta && meta.version !== '1') {
                            return null;
                        }
                        return meta;
                    } catch {
                        return null;
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
        const decodedMeta = this.decode(tx);
        if (!decodedMeta) {
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

    /**
     * Decode protocol meta from base64 string (for backward compatibility)
     * @param base64String - Base64 encoded transaction
     * @returns Decoded ProtocolMetaV1 or null
     */
    decodeFromBase64(base64String: string): ProtocolMetaV1 | null {
        try {
            const buffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
            // Try legacy first, then versioned
            try {
                const transaction = Transaction.from(buffer);
                return this.decode(transaction);
            } catch {
                const transaction = VersionedTransaction.deserialize(buffer);
                return this.decode(transaction);
            }
        } catch {
            return null;
        }
    }

    /**
     * Validate base64 transaction (for backward compatibility)
     * @param base64String - Base64 encoded transaction
     * @param authorities - Array of valid protocol authority public keys (base58)
     * @param expectedPrefix - Expected protocol prefix (default: 'DEFAULT')
     * @returns True if transaction is valid
     */
    validateFromBase64(base64String: string, authorities: string[], expectedPrefix: string = 'DEFAULT'): boolean {
        try {
            const buffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
            // Try legacy first, then versioned
            try {
                const transaction = Transaction.from(buffer);
                return this.validate(transaction, authorities, expectedPrefix);
            } catch {
                const transaction = VersionedTransaction.deserialize(buffer);
                return this.validate(transaction, authorities, expectedPrefix);
            }
        } catch {
            return false;
        }
    }
} 