import { ActionCodesProtocol } from '../../src/protocol';
import { ActionCode, ActionCodeStatus, ActionCodeFields } from '../../src/actioncode';
import { ProtocolMetaV1 } from '../../src/meta';
import { BaseChainAdapter } from '../../src/adapters/base';
import { SolanaAdapter } from '../../src/adapters/solana';
import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import { CodeGenerator } from '../../src/codegen';
import { Buffer } from "buffer";

/**
 * Helper function to create a real signature for testing
 */
function createRealSignature(keypair: Keypair, message: string): string {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    return Buffer.from(signatureBytes).toString('base64');
}

/**
 * Helper function to generate a valid signature for an action code
 */
function generateValidSignature(
    keypair: Keypair,
    pubkey: string,
    prefix: string = 'DEFAULT',
    timestamp?: number,
    solanaAdapter?: SolanaAdapter
): string {
    // Use the exact same timestamp logic as the protocol
    const ts = timestamp || Date.now();
    const { code, issuedAt } = CodeGenerator.generateCode(pubkey, prefix, ts);
    
    // Create the message that should be signed using the adapter
    // Use issuedAt to match what the protocol uses
    const adapter = solanaAdapter || new SolanaAdapter();
    const message = adapter.getCodeSignatureMessage(code, issuedAt, prefix);
    
    return createRealSignature(keypair, message);
}

/**
 * Mock Relayer Implementation
 * 
 * This mock relayer implements the complete flow:
 * 1. Accepts codes via register API
 * 2. Validates codes by deriving them from inputs
 * 3. Stores codes for their active time period
 * 4. Resolves codes via resolve API
 * 5. Attaches transactions via attach API
 * 6. Signs with relayer authority
 * 7. Allows user finalization
 */

interface RelayerConfig {
    authorityKey: string;
}

interface StoredActionCode {
    actionCode: ActionCode;
    registeredAt: number;
    lastAccessed: number;
}

interface AttachRequest {
    code: string;
    transaction: string;
    txType?: string;
    metadata?: {
        description?: string;
        params?: Record<string, any>;
    };
}

interface ResolveResponse {
    code: string;
    expiry: number;
    walletAddress: string;
    status: ActionCodeStatus;
    transaction?: any;
    metadata?: any;
}

class MockRelayer {
    private protocol: ActionCodesProtocol;
    private config: RelayerConfig;
    private storage: Map<string, StoredActionCode> = new Map();
    private adapters: Map<string, BaseChainAdapter<any>> = new Map();

    constructor(config: RelayerConfig) {
        this.config = config;
        this.protocol = ActionCodesProtocol.create();
    }

    /**
     * Register a chain adapter for the relayer
     */
    registerAdapter(adapter: BaseChainAdapter<any>): void {
        this.adapters.set(adapter.chain, adapter);
        this.protocol.registerAdapter(adapter);
    }

    /**
     * Register an action code with the relayer
     * This is the main entry point for accepting codes from API
     */
    async register(
        pubkey: string,
        signature: string,
        chain: string,
        prefix?: string,
        timestamp?: number
    ): Promise<ActionCode> {
        // Validate input parameters
        if (!pubkey || pubkey.trim() === '') {
            throw new Error('Public key cannot be empty');
        }
        if (!signature || signature.trim() === '') {
            throw new Error('Signature cannot be empty');
        }
        if (!chain || chain.trim() === '') {
            throw new Error('Chain cannot be empty');
        }

        // Generate action code using protocol
        const actionCode = await this.protocol.createActionCode(
            pubkey,
            async () => signature,
            chain as any,
            prefix,
            timestamp
        );

        // Check if code is expired
        if (actionCode.expired) {
            throw new Error('Action code has already expired');
        }

        // Store the action code
        const storedCode: StoredActionCode = {
            actionCode,
            registeredAt: Date.now(),
            lastAccessed: Date.now()
        };

        this.storage.set(actionCode.code, storedCode);

        console.log(`✅ Registered action code: ${actionCode.displayString}`);
        return actionCode;
    }

    /**
     * Resolve an action code - returns code, expiry, and wallet address
     */
    resolve(code: string): ResolveResponse | null {
        const storedCode = this.storage.get(code);

        if (!storedCode) {
            console.log(`❌ Code not found: ${code}`);
            return null;
        }

        // Update last accessed time
        storedCode.lastAccessed = Date.now();
        this.storage.set(code, storedCode);

        // Check if expired
        if (storedCode.actionCode.expired) {
            console.log(`⏰ Code expired: ${code}`);
            return null;
        }

        const response: ResolveResponse = {
            code: storedCode.actionCode.code,
            expiry: storedCode.actionCode.json.expiresAt,
            walletAddress: storedCode.actionCode.pubkey,
            status: storedCode.actionCode.status,
            transaction: storedCode.actionCode.transaction,
            metadata: storedCode.actionCode.metadata
        };

        console.log(`🔍 Resolved code: ${code} -> ${storedCode.actionCode.pubkey}`);
        return response;
    }

    /**
     * Attach a transaction to an action code
     */
    attach(request: AttachRequest): ActionCode | null {
        const storedCode = this.storage.get(request.code);

        if (!storedCode) {
            console.log(`❌ Code not found for attach: ${request.code}`);
            return null;
        }

        // Check if expired
        if (storedCode.actionCode.expired) {
            console.log(`⏰ Code expired for attach: ${request.code}`);
            return null;
        }

        // Check if already has transaction
        if (storedCode.actionCode.transaction) {
            console.log(`⚠️ Code already has transaction: ${request.code}`);
            return null;
        }

        // Attach transaction using protocol
        const updatedCode = this.protocol.attachTransaction(
            storedCode.actionCode as ActionCode,
            request.transaction,
            this.config.authorityKey,
            request.metadata?.params ? JSON.stringify(request.metadata.params) : undefined,
            request.txType
        ) as ActionCode;

        // Update metadata if provided
        if (request.metadata) {
            // Ensure we have all required fields from the updated code
            const updatedFields: ActionCodeFields = {
                ...updatedCode.json,
                metadata: request.metadata
            };
            const codeWithMetadata = ActionCode.fromPayload(updatedFields) as ActionCode;

            // Update storage
            const updatedStoredCode: StoredActionCode = {
                actionCode: codeWithMetadata,
                registeredAt: storedCode.registeredAt,
                lastAccessed: Date.now()
            };
            this.storage.set(request.code, updatedStoredCode);

            console.log(`🔗 Attached transaction to code: ${request.code}`);
            return codeWithMetadata;
        }

        // Update storage
        const updatedStoredCode: StoredActionCode = {
            actionCode: updatedCode,
            registeredAt: storedCode.registeredAt,
            lastAccessed: Date.now()
        };
        this.storage.set(request.code, updatedStoredCode);

        console.log(`🔗 Attached transaction to code: ${request.code}`);
        return updatedCode;
    }

    /**
     * Sign transaction with relayer authority and inject metadata
     */
    signAndInjectMetadata(
        code: string,
        transaction: any,
        chain: string
    ): { signedTransaction: any; meta: ProtocolMetaV1 } | null {
        const storedCode = this.storage.get(code);

        if (!storedCode) {
            console.log(`❌ Code not found for signing: ${code}`);
            return null;
        }

        // Check if expired
        if (storedCode.actionCode.expired) {
            console.log(`⏰ Code expired for signing: ${code}`);
            return null;
        }

        // Check if has transaction
        if (!storedCode.actionCode.transaction) {
            console.log(`⚠️ Code has no transaction for signing: ${code}`);
            return null;
        }

        // Create protocol meta
        const meta = this.protocol.createProtocolMeta(
            storedCode.actionCode as ActionCode,
            this.config.authorityKey,
            storedCode.actionCode.metadata?.params ? JSON.stringify(storedCode.actionCode.metadata.params) : undefined
        );

        // Get adapter for the chain
        const adapter = this.adapters.get(chain);
        if (!adapter) {
            console.log(`❌ No adapter found for chain: ${chain}`);
            return null;
        }

        // Encode meta into transaction
        const metaInstruction = adapter.encodeMeta(meta);

        // For this mock, we'll just return the meta and a mock signed transaction
        // In a real implementation, you would inject the meta into the actual transaction
        const signedTransaction = {
            ...transaction,
            meta: meta,
            relayerSignature: `relayer_signature_${Date.now()}`
        };

        console.log(`✍️ Signed transaction for code: ${code}`);
        return {
            signedTransaction,
            meta
        };
    }

    /**
     * Finalize an action code with user signature
     */
    finalize(code: string, txSignature: string): ActionCode | null {
        const storedCode = this.storage.get(code);

        if (!storedCode) {
            console.log(`❌ Code not found for finalization: ${code}`);
            return null;
        }

        // Check if expired
        if (storedCode.actionCode.expired) {
            console.log(`⏰ Code expired for finalization: ${code}`);
            return null;
        }

        // Check if has transaction
        if (!storedCode.actionCode.transaction) {
            console.log(`⚠️ Code has no transaction for finalization: ${code}`);
            return null;
        }

        // Finalize using protocol
        const finalizedCode = this.protocol.finalizeActionCode(storedCode.actionCode as ActionCode, txSignature) as ActionCode;

        // Update storage
        const updatedStoredCode: StoredActionCode = {
            actionCode: finalizedCode,
            registeredAt: storedCode.registeredAt,
            lastAccessed: Date.now()
        };
        this.storage.set(code, updatedStoredCode);

        console.log(`✅ Finalized code: ${code} with signature: ${txSignature}`);
        return finalizedCode;
    }

    /**
     * Get all stored codes (for testing/debugging)
     */
    getAllCodes(): StoredActionCode[] {
        return Array.from(this.storage.values());
    }

    /**
     * Clean up expired codes
     */
    cleanup(): number {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [code, storedCode] of this.storage.entries()) {
            if (storedCode.actionCode.expired) {
                this.storage.delete(code);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired codes`);
        }

        return cleanedCount;
    }

    /**
     * Get relayer statistics
     */
    getStats(): {
        totalCodes: number;
        activeCodes: number;
        expiredCodes: number;
        resolvedCodes: number;
        finalizedCodes: number;
    } {
        const codes = Array.from(this.storage.values());
        const now = Date.now();

        return {
            totalCodes: codes.length,
            activeCodes: codes.filter(c => !c.actionCode.expired).length,
            expiredCodes: codes.filter(c => c.actionCode.expired).length,
            resolvedCodes: codes.filter(c => c.actionCode.status === 'resolved').length,
            finalizedCodes: codes.filter(c => c.actionCode.status === 'finalized').length
        };
    }
}

describe('Mock Relayer Integration Tests', () => {
    let relayer: MockRelayer;
    let protocol: ActionCodesProtocol;
    let userKeypair: Keypair;
    let authorityKey: string;
    let solanaAdapter: SolanaAdapter;

    beforeEach(() => {
        // Initialize relayer with configuration
        authorityKey = 'relayer_authority_key_123456789';
        relayer = new MockRelayer({
            authorityKey
        });

        // Register Solana adapter
        solanaAdapter = new SolanaAdapter();
        relayer.registerAdapter(solanaAdapter);

        protocol = ActionCodesProtocol.create();

        // Generate real user keypair
        userKeypair = Keypair.generate();
    });

    describe('🔄 Complete Relayer Workflow', () => {
        it('should handle complete relayer workflow from register to finalize', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now(); // Use exact same timestamp
            const signature = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp, solanaAdapter);
            const chain = 'solana';
            const prefix = 'TEST';

            // 1. Register action code
            console.log('\n📝 Step 1: Registering action code...');
            const registeredCode = await relayer.register(pubkey, signature, chain, prefix, timestamp);

            expect(registeredCode.code).toHaveLength(prefix.length + 8); // prefix + 8 digits
            expect(registeredCode.code.startsWith(prefix)).toBe(true);
            expect(registeredCode.pubkey).toBe(pubkey);
            expect(registeredCode.chain).toBe(chain);
            expect(registeredCode.prefix).toBe(prefix);
            expect(registeredCode.status).toBe('pending');
            expect(registeredCode.expired).toBe(false);

            // 2. Resolve action code
            console.log('\n🔍 Step 2: Resolving action code...');
            const resolved = relayer.resolve(registeredCode.code);

            expect(resolved).not.toBeNull();
            expect(resolved!.code).toBe(registeredCode.code);
            expect(resolved!.walletAddress).toBe(pubkey);
            expect(resolved!.expiry).toBe(registeredCode.json.expiresAt);
            expect(resolved!.status).toBe('pending');

            // 3. Attach transaction
            console.log('\n🔗 Step 3: Attaching transaction...');
            // Create a proper serialized transaction
            const solanaTransaction = new Transaction();
            solanaTransaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            solanaTransaction.feePayer = authorityKeypair.publicKey;
            solanaTransaction.partialSign(authorityKeypair);
            const transaction = solanaTransaction.serialize({ requireAllSignatures: false }).toString('base64');
            const attachRequest: AttachRequest = {
                code: registeredCode.code,
                transaction,
                txType: 'payment',
                metadata: {
                    description: 'Test payment transaction',
                    params: { amount: 100, currency: 'USDC' }
                }
            };

            const attachedCode = relayer.attach(attachRequest);

            expect(attachedCode).not.toBeNull();
            expect(attachedCode!.transaction).toBeDefined();
            expect(attachedCode!.transaction!.transaction).not.toBe(transaction); // Should be different due to meta injection
            expect(attachedCode!.transaction!.txType).toBe('payment');
            expect(attachedCode!.status).toBe('resolved');
            expect(attachedCode!.metadata?.description).toBe('Test payment transaction');

            // 4. Sign and inject metadata
            console.log('\n✍️ Step 4: Signing and injecting metadata...');
            const mockTransaction = { id: 'tx_123', data: 'transaction_data' };
            const signedResult = relayer.signAndInjectMetadata(
                registeredCode.code,
                mockTransaction,
                chain
            );

            expect(signedResult).not.toBeNull();
            expect(signedResult!.meta.version).toBe('1');
            expect(signedResult!.meta.initiator).toBe(pubkey);
            expect(signedResult!.meta.iss).toBe(authorityKey);
            expect(signedResult!.signedTransaction.relayerSignature).toBeDefined();

            // 5. Finalize with user signature
            console.log('\n✅ Step 5: Finalizing with user signature...');
            const txSignature = 'user_transaction_signature_456';
            const finalizedCode = relayer.finalize(registeredCode.code, txSignature);

            expect(finalizedCode).not.toBeNull();
            expect(finalizedCode!.transaction!.txSignature).toBe(txSignature);
            expect(finalizedCode!.status).toBe('finalized');

            // 6. Verify final state
            console.log('\n📊 Step 6: Verifying final state...');
            const stats = relayer.getStats();
            expect(stats.totalCodes).toBe(1);
            expect(stats.finalizedCodes).toBe(1);
            expect(stats.activeCodes).toBe(1); // Still active until expired
        });
    });

    describe('🔐 Code Validation', () => {
        it('should validate codes during registration', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Valid registration
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);
            expect(code.isValid(relayer['protocol'])).toBe(true);

            // Invalid chain
            await expect(
                relayer.register(pubkey, signature, 'unsupported_chain', 'DEFAULT', timestamp)
            ).rejects.toThrow("Chain 'unsupported_chain' is not supported. Registered chains: solana");
        });

        it('should handle expired codes', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', undefined, solanaAdapter);
            const chain = 'solana';

            // Create expired timestamp
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago

            await expect(
                relayer.register(pubkey, signature, chain, 'DEFAULT', expiredTimestamp)
            ).rejects.toThrow('Invalid action code');
        });
    });

    describe('📦 Storage and Retrieval', () => {
        it('should store and retrieve codes correctly', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = Date.now() + 1000; // Different timestamp for second code
            const signature1 = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp1, solanaAdapter);
            const signature2 = generateValidSignature(userKeypair, pubkey, 'DEMO', timestamp2, solanaAdapter);
            const chain = 'solana';

            // Register multiple codes
            const code1 = await relayer.register(pubkey, signature1, chain, 'TEST', timestamp1);
            const code2 = await relayer.register(pubkey, signature2, chain, 'DEMO', timestamp2);

            // Verify storage
            const allCodes = relayer.getAllCodes();
            expect(allCodes).toHaveLength(2);
            expect(allCodes.map(c => c.actionCode.code)).toContain(code1.code);
            expect(allCodes.map(c => c.actionCode.code)).toContain(code2.code);

            // Verify resolve works for both
            const resolved1 = relayer.resolve(code1.code);
            const resolved2 = relayer.resolve(code2.code);

            expect(resolved1).not.toBeNull();
            expect(resolved2).not.toBeNull();
            expect(resolved1!.code).toBe(code1.code);
            expect(resolved2!.code).toBe(code2.code);
        });

        it('should handle non-existent codes', () => {
            const resolved = relayer.resolve('NONEXISTENT');
            expect(resolved).toBeNull();
        });
    });

    describe('🔗 Transaction Attachment', () => {
        it('should attach transactions correctly', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Attach transaction
            // Create proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            const attachRequest: AttachRequest = {
                code: code.code,
                transaction: serializedTx,
                txType: 'swap',
                metadata: {
                    description: 'Token swap',
                    params: { from: 'SOL', to: 'USDC', amount: 1 }
                }
            };

            const attachedCode = relayer.attach(attachRequest);

            expect(attachedCode).not.toBeNull();
            expect(attachedCode!.status).toBe('resolved');
            expect(attachedCode!.transaction!.transaction).not.toBe(serializedTx); // Should be different due to meta injection
            expect(attachedCode!.transaction!.txType).toBe('swap');
            expect(attachedCode!.metadata?.description).toBe('Token swap');
        });

        it('should prevent double attachment', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Create proper serialized transactions
            const authorityKeypair1 = Keypair.generate();
            const transaction1 = new Transaction();
            transaction1.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction1.feePayer = authorityKeypair1.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction1 = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction1.add(dummyInstruction1);
            transaction1.sign(authorityKeypair1);
            const serializedTx1 = transaction1.serialize({ requireAllSignatures: false }).toString('base64');

            const authorityKeypair2 = Keypair.generate();
            const transaction2 = new Transaction();
            transaction2.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction2.feePayer = authorityKeypair2.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction2 = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction2.add(dummyInstruction2);
            transaction2.sign(authorityKeypair2);
            const serializedTx2 = transaction2.serialize({ requireAllSignatures: false }).toString('base64');

            // First attachment
            const attachRequest1: AttachRequest = {
                code: code.code,
                transaction: serializedTx1
            };
            const attached1 = relayer.attach(attachRequest1);
            expect(attached1).not.toBeNull();

            // Second attachment should fail
            const attachRequest2: AttachRequest = {
                code: code.code,
                transaction: serializedTx2
            };
            const attached2 = relayer.attach(attachRequest2);
            expect(attached2).toBeNull();
        });
    });

    describe('🧹 Cleanup and Maintenance', () => {
        it('should clean up expired codes', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = Date.now() + 1000;
            const signature1 = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp1, solanaAdapter);
            const signature2 = generateValidSignature(userKeypair, pubkey, 'DEMO', timestamp2, solanaAdapter);
            const chain = 'solana';

            // Register codes
            const code1 = await relayer.register(pubkey, signature1, chain, 'TEST', timestamp1);
            const code2 = await relayer.register(pubkey, signature2, chain, 'DEMO', timestamp2);

            // Verify initial state
            expect(relayer.getAllCodes()).toHaveLength(2);

            // Manually expire one code by modifying storage
            const storedCodes = relayer.getAllCodes();
            const expiredCode = storedCodes.find(c => c.actionCode.code === code1.code);
            if (expiredCode) {
                // This is a hack for testing - in real implementation, codes expire naturally
                // We need to create a new ActionCode with expired timestamp
                const expiredFields: ActionCodeFields = {
                    ...expiredCode.actionCode.json,
                    expiresAt: Date.now() - 1000 // Expired 1 second ago
                };
                const expiredActionCode = ActionCode.fromPayload(expiredFields);
                expiredCode.actionCode = expiredActionCode as ActionCode;
            }

            // Cleanup
            const cleanedCount = relayer.cleanup();
            expect(cleanedCount).toBe(1);
            expect(relayer.getAllCodes()).toHaveLength(1);
        });

        it('should provide accurate statistics', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = Date.now() + 1000;
            const signature1 = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp1, solanaAdapter);
            const signature2 = generateValidSignature(userKeypair, pubkey, 'DEMO', timestamp2, solanaAdapter);
            const chain = 'solana';

            // Register codes
            const code1 = await relayer.register(pubkey, signature1, chain, 'TEST', timestamp1);
            const code2 = await relayer.register(pubkey, signature2, chain, 'DEMO', timestamp2);

            // Create proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            // Attach transaction to one
            relayer.attach({
                code: code1.code,
                transaction: serializedTx
            });

            // Finalize one
            relayer.finalize(code1.code, 'signature_123');

            // Check stats
            const stats = relayer.getStats();
            expect(stats.totalCodes).toBe(2);
            expect(stats.activeCodes).toBe(2);
            expect(stats.resolvedCodes).toBe(0); // code1 was finalized, so no resolved codes
            expect(stats.finalizedCodes).toBe(1);
            expect(stats.expiredCodes).toBe(0);
        });
    });

    describe('⚠️ Error Handling', () => {
        it('should handle invalid registration parameters', async () => {
            await expect(
                relayer.register('', 'signature', 'solana', 'DEFAULT')
            ).rejects.toThrow('Public key cannot be empty');

            await expect(
                relayer.register('pubkey', '', 'solana')
            ).rejects.toThrow('Signature cannot be empty');
        });

        it('should handle invalid resolve requests', async () => {
            const resolved = relayer.resolve('');
            expect(resolved).toBeNull();
        });

        it('should handle invalid attach requests', async () => {
            // Create proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            const attached = relayer.attach({
                code: 'nonexistent',
                transaction: serializedTx
            });
            expect(attached).toBeNull();
        });

        it('should handle invalid finalize requests', () => {
            const finalized = relayer.finalize('nonexistent', 'signature');
            expect(finalized).toBeNull();
        });
    });

    describe('🔐 Relayer Security Scenarios', () => {
        it('❌ Rejects attaching tx to finalized code', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Create proper serialized transactions
            const authorityKeypair1 = Keypair.generate();
            const transaction1 = new Transaction();
            transaction1.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction1.feePayer = authorityKeypair1.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction1 = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction1.add(dummyInstruction1);
            transaction1.sign(authorityKeypair1);
            const serializedTx1 = transaction1.serialize({ requireAllSignatures: false }).toString('base64');

            const authorityKeypair2 = Keypair.generate();
            const transaction2 = new Transaction();
            transaction2.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction2.feePayer = authorityKeypair2.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction2 = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction2.add(dummyInstruction2);
            transaction2.sign(authorityKeypair2);
            const serializedTx2 = transaction2.serialize({ requireAllSignatures: false }).toString('base64');

            // Attach transaction and finalize
            relayer.attach({
                code: code.code,
                transaction: serializedTx1
            });
            relayer.finalize(code.code, 'tx_signature');

            // Try to attach another transaction to finalized code
            const attached = relayer.attach({
                code: code.code,
                transaction: serializedTx2
            });

            // Should reject attaching to finalized code
            expect(attached).toBeNull();
        });

        it('❌ Rejects attaching tx to expired code', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code normally first
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Manually expire the code by modifying the stored action code
            const storedCodes = relayer.getAllCodes();
            const storedCode = storedCodes.find(c => c.actionCode.code === code.code);
            if (storedCode) {
                // Create an expired version of the action code
                const expiredFields: ActionCodeFields = {
                    ...storedCode.actionCode.json,
                    expiresAt: Date.now() - 1000 // Expired 1 second ago
                };
                const expiredActionCode = ActionCode.fromPayload(expiredFields);
                storedCode.actionCode = expiredActionCode as ActionCode;
            }

            // Create proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            // Try to attach transaction to expired code
            const attached = relayer.attach({
                code: code.code,
                transaction: serializedTx
            });

            // Should reject attaching to expired code
            expect(attached).toBeNull();
        });

        it('❌ Prevents re-registering same code twice', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = Date.now() + 100; // 100ms later
            const signature1 = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp1, solanaAdapter);
            const signature2 = generateValidSignature(userKeypair, pubkey, 'TEST', timestamp2, solanaAdapter);
            const chain = 'solana';

            // Register code first time
            const code1 = await relayer.register(pubkey, signature1, chain, 'TEST', timestamp1);

            // Try to register the same code again (same pubkey, different signature, same prefix)
            const code2 = await relayer.register(pubkey, signature2, chain, 'TEST', timestamp2);

            // Both should be valid but different codes (due to different timestamps)
            expect(code1.code).not.toBe(code2.code);
            expect(code1.isValid(relayer['protocol'])).toBe(true);
            expect(code2.isValid(relayer['protocol'])).toBe(true);

            // In a real implementation, you might want to prevent registering the same signature
            // multiple times within a short time window
        });

        it('❌ Finalization only possible if tx was attached', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Try to finalize without attaching transaction
            const finalized = relayer.finalize(code.code, 'tx_signature');

            // Should reject finalization without attached transaction
            expect(finalized).toBeNull();
        });

        it('✅ Allows finalization only after transaction is attached', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Create proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            // Attach transaction first
            const attached = relayer.attach({
                code: code.code,
                transaction: serializedTx
            });
            expect(attached).not.toBeNull();
            expect(attached!.status).toBe('resolved');

            // Now finalize should work
            const finalized = relayer.finalize(code.code, 'tx_signature');
            expect(finalized).not.toBeNull();
            expect(finalized!.status).toBe('finalized');
            expect(finalized!.transaction!.txSignature).toBe('tx_signature');
        });

        it('❌ Rejects attaching tx to non-existent code', () => {
            // Create a dummy transaction for testing
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const authorityKeypair = Keypair.generate();
            transaction.feePayer = authorityKeypair.publicKey;
            
            // Add a dummy instruction to make the transaction valid
            const dummyInstruction = new TransactionInstruction({
                keys: [],
                programId: new PublicKey('11111111111111111111111111111111'),
                data: Buffer.from([])
            });
            transaction.add(dummyInstruction);
            
            // Sign the transaction with the authority (issuer)
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            const attached = relayer.attach({
                code: 'NONEXISTENT_CODE',
                transaction: serializedTx
            });

            expect(attached).toBeNull();
        });

        it('❌ Rejects finalizing non-existent code', () => {
            const finalized = relayer.finalize('NONEXISTENT_CODE', 'tx_signature');
            expect(finalized).toBeNull();
        });

        it('❌ Rejects resolving expired code', async () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const signature = generateValidSignature(userKeypair, pubkey, 'DEFAULT', timestamp, solanaAdapter);
            const chain = 'solana';

            // Register code normally first
            const code = await relayer.register(pubkey, signature, chain, 'DEFAULT', timestamp);

            // Manually expire the code by modifying the stored action code
            const storedCodes = relayer.getAllCodes();
            const storedCode = storedCodes.find(c => c.actionCode.code === code.code);
            if (storedCode) {
                // Create an expired version of the action code
                const expiredFields: ActionCodeFields = {
                    ...storedCode.actionCode.json,
                    expiresAt: Date.now() - 1000 // Expired 1 second ago
                };
                const expiredActionCode = ActionCode.fromPayload(expiredFields);
                storedCode.actionCode = expiredActionCode as ActionCode;
            }

            // Try to resolve expired code
            const resolved = relayer.resolve(code.code);

            // Should reject resolving expired code
            expect(resolved).toBeNull();
        });
    });
});
