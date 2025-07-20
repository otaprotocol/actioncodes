import {
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    MessageV0,
    PublicKey,
    Keypair
} from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { BaseChainAdapter } from '../base';
import * as nacl from 'tweetnacl';
import { ActionCode } from '../../actioncode';
import { Buffer } from "buffer";

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
     * @param tx - The Solana transaction
     * @returns Decoded ProtocolMetaV1 or null if not found
     */
    decodeMeta(tx: SolanaTransaction): ProtocolMetaV1 | null {
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
     * Inject protocol meta into Solana transaction
     * @param tx - The Solana transaction
     * @param meta - ProtocolMetaV1 object
     * @returns Solana transaction with injected meta
     */
    injectMeta(tx: SolanaTransaction, meta: ProtocolMetaV1): SolanaTransaction {
        const metaIx = this.encodeMeta(meta);
                if (tx instanceof VersionedTransaction) {
            // Convert TransactionInstruction to MessageCompiledInstruction for versioned transactions
            
            // First, ensure all required keys are in static account keys
            metaIx.keys.forEach(({ pubkey }) => {
                if (!tx.message.staticAccountKeys.some(key => key.equals(pubkey))) {
                    tx.message.staticAccountKeys.push(pubkey);
                }
            });

            // Ensure programId is also in static keys
            if (!tx.message.staticAccountKeys.some(key => key.equals(metaIx.programId))) {
                tx.message.staticAccountKeys.push(metaIx.programId);
            }

            // Now find the program ID index after ensuring it's in the static keys
            const programIdIndex = tx.message.staticAccountKeys.findIndex(key => 
                key.equals(metaIx.programId)
            );
            
            const accountKeyIndexes = metaIx.keys.map(key => {
                const index = tx.message.staticAccountKeys.findIndex(staticKey => 
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
            
            tx.message.compiledInstructions.push(compiledInstruction);
        } else if (tx instanceof Transaction) {
            tx.instructions.push(metaIx);
        } else {
            throw new Error('Invalid transaction type');
        }
        return tx;
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

    /**
     * Decode protocol meta from base64 string (for backward compatibility)
     * @param base64String - Base64 encoded transaction
     * @returns Decoded ProtocolMetaV1 or null
     */
    decodeFromBase64(base64String: string): ProtocolMetaV1 | null {
        try {
            const buffer = Buffer.from(base64String, 'base64');
            // Try legacy first, then versioned
            try {
                const transaction = Transaction.from(buffer);
                return this.decodeMeta(transaction);
            } catch {
                const transaction = VersionedTransaction.deserialize(buffer);
                return this.decodeMeta(transaction);
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
            const buffer = Buffer.from(base64String, 'base64');
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


    public verifyCodeSignature(actionCode: ActionCode): boolean {
        try {
            const message = this.getCodeSignatureMessage(actionCode.code, actionCode.timestamp, actionCode.prefix);
            const messageBytes = new TextEncoder().encode(message);
            const pubkeyBytes = new PublicKey(actionCode.pubkey).toBytes();
            const sigBytes = Buffer.from(actionCode.signature, 'base64');

            return nacl.sign.detached.verify(messageBytes, sigBytes, pubkeyBytes);
        } catch (error) {
            return false;
        }
    }

    /**
     * Sign the transaction with the protocol key using a callback approach
     * @param signCallback - Callback function that performs the actual signing
     * @returns Promise that resolves to the signed transaction
     */
    async signWithProtocolKey(
        actionCode: ActionCode,
        key: Keypair
    ): Promise<ActionCode> {
        try {
            if (!actionCode.transaction?.transaction) {
                throw new Error('No transaction found');
            }

            const tx = Transaction.from(Buffer.from(actionCode.transaction.transaction, 'base64'));

            tx.partialSign(key);

            const meta = this.decodeMeta(tx);

            if (!meta) {
                throw new Error('Invalid transaction, protocol meta not found');
            }

            if (!this.validateTransactionIntegrity(tx, meta)) {
                throw new Error('Invalid transaction, transaction integrity not valid');
            }

            const newActionCode = Object.assign({}, actionCode, {
                transaction: {
                    ...actionCode.transaction,
                    transaction: Buffer.from(tx.serialize({
                        requireAllSignatures: false
                    })).toString('base64'),
                }
            });

            return newActionCode;
        } catch (error) {
            throw new Error(`Failed to sign transaction with protocol key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 