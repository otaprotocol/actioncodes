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

import { ActionCodesProtocol, ProtocolConfig } from './protocol';
import { ProtocolMetaV1 } from './meta';
import { ActionCode } from './actioncode';
import { BaseChainAdapter } from './adapters/base';
import { SolanaAdapter } from './adapters/solana';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

// Mock chain adapter for testing
class MockChainAdapter extends BaseChainAdapter<any> {
    readonly chain = 'mock';

    injectMeta(serializedTx: string, meta: ProtocolMetaV1): string {
        return serializedTx;
    }

    encodeMeta(meta: ProtocolMetaV1): any {
        return { encoded: meta };
    }

    decodeMeta(data: any): ProtocolMetaV1 | null {
        return data.encoded || null;
    }

    validate(): boolean {
        return true; // Mock validation
    }

    hasIssuerSignature(): boolean {
        return true; // Mock signature verification
    }

    protected validateTransactionIntegrity(): boolean {
        return true; // Mock integrity validation
    }

    public verifyCodeSignature(actionCode: ActionCode): boolean {
        return true; // Mock code signature verification
    }

    signWithProtocolKey(actionCode: ActionCode, key: Keypair): Promise<ActionCode> {
        return Promise.resolve(actionCode);
    }

    verifyFinalizedTransaction(actionCode: ActionCode): boolean {
        return true; // Mock finalized transaction verification
    }

    validateSignedMessage(message: string, signedMessage: string, pubkey: string): boolean {
        return true;
    }
}

describe('ActionCodesProtocol', () => {
    let protocol: ActionCodesProtocol;
    let mockAdapter: MockChainAdapter;

    beforeEach(() => {
        protocol = ActionCodesProtocol.create();
        mockAdapter = new MockChainAdapter();
    });

    describe('Configuration', () => {
        it('should create with default configuration', () => {
            expect(protocol.getConfig()).toEqual({
                version: '1',
                defaultPrefix: 'DEFAULT',
                codeTTL: 120000,
                codeLength: 8,
                maxPrefixLength: 12,
                minPrefixLength: 3
            });
        });

        it('should create with custom configuration', () => {
            const customConfig: Partial<ProtocolConfig> = {
                version: '2.0.0',
                defaultPrefix: 'CUSTOM',
                codeTTL: 60000
            };

            const customProtocol = ActionCodesProtocol.createWithConfig(customConfig);
            const config = customProtocol.getConfig();

            expect(config.version).toBe('2.0.0');
            expect(config.defaultPrefix).toBe('CUSTOM');
            expect(config.codeTTL).toBe(60000);
        });

        it('should update configuration', () => {
            protocol.updateConfig({ defaultPrefix: 'UPDATED' });
            expect(protocol.getConfig().defaultPrefix).toBe('UPDATED');
        });
    });

    describe('Chain Adapter Registration', () => {
        it('should register chain adapters', () => {
            protocol.registerAdapter(mockAdapter);
            expect(protocol.getRegisteredChains()).toContain('mock');
            expect(protocol.isChainSupported('mock')).toBe(true);
        });

        it('should support multiple chain adapters', () => {
            const mockAdapter2 = new MockChainAdapter();
            // Override the chain property for the second adapter
            Object.defineProperty(mockAdapter2, 'chain', { value: 'mock2' });

            protocol.registerAdapter(mockAdapter);
            protocol.registerAdapter(mockAdapter2);

            expect(protocol.getRegisteredChains()).toContain('mock');
            expect(protocol.getRegisteredChains()).toContain('mock2');
            expect(protocol.getRegisteredChains()).toHaveLength(2);
        });

        it('should get chain adapter', () => {
            protocol.registerAdapter(mockAdapter);
            const adapter = protocol.getChainAdapter('mock');
            expect(adapter).toBe(mockAdapter);
        });
    });

    describe('Action Code Generation', () => {
        it('should generate action code for supported chain', async () => {
            const protocol = ActionCodesProtocol.create();
            const solanaAdapter = new SolanaAdapter();
            protocol.registerAdapter(solanaAdapter);

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('test_signature');

            // Mock verifyCodeSignature to return true for this test
            jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(true);

            const actionCode = await protocol.createActionCode(pubkey, signFn, 'solana');

            expect(actionCode.code).toHaveLength(8);
            expect(actionCode.pubkey).toBe(pubkey);
            expect(actionCode.chain).toBe('solana');
            expect(actionCode.status).toBe('pending');
        });

        it('should generate action code with custom prefix', async () => {
            const protocol = ActionCodesProtocol.create();
            const solanaAdapter = new SolanaAdapter();
            protocol.registerAdapter(solanaAdapter);

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('test_signature');

            // Mock verifyCodeSignature to return true for this test
            jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(true);

            const actionCode = await protocol.createActionCode(pubkey, signFn, 'solana', 'TEST');

            expect(actionCode.prefix).toBe('TEST');
        });

        it('should throw error for unsupported chain', async () => {
            const protocol = ActionCodesProtocol.create();

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('test_signature');

            await expect(
                protocol.createActionCode(pubkey, signFn, 'unsupported_chain' as any)
            ).rejects.toThrow("Chain 'unsupported_chain' is not supported. Registered chains: ");
        });

        it('should throw error when no adapter is found', async () => {
            const protocol = ActionCodesProtocol.create();
            // Don't register any adapters

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('test_signature');

            await expect(
                protocol.createActionCode(pubkey, signFn, 'solana')
            ).rejects.toThrow("Chain 'solana' is not supported.");
        });

        it('should throw error when signature verification fails', async () => {
            const protocol = ActionCodesProtocol.create();
            const solanaAdapter = new SolanaAdapter();
            protocol.registerAdapter(solanaAdapter);

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('invalid_signature');

            await expect(
                protocol.createActionCode(pubkey, signFn, 'solana')
            ).rejects.toThrow('Invalid signature for generated code');
        });
    });

    describe('Error handling', () => {
        it('should throw error when no adapter is found for chain', async () => {
            const protocol = ActionCodesProtocol.create();
            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('test_signature');

            // Test line 119: Chain not supported
            await expect(
                protocol.createActionCode(pubkey, signFn, 'unsupported_chain' as any)
            ).rejects.toThrow("Chain 'unsupported_chain' is not supported");
        });

        it('should throw error when adapter verification fails', async () => {
            const protocol = ActionCodesProtocol.create();
            const solanaAdapter = new SolanaAdapter();
            protocol.registerAdapter(solanaAdapter);

            const pubkey = 'test_pubkey';
            const signFn = jest.fn().mockResolvedValue('invalid_signature');

            // Mock verifyCodeSignature to return false
            jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(false);

            await expect(
                protocol.createActionCode(pubkey, signFn, 'solana')
            ).rejects.toThrow('Invalid signature for generated code');
        });
    });

    describe('Action Code Validation', () => {
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should validate action code', async () => {
            const pubkey = 'test-pubkey';
            const signature = 'test-signature';
            const chain = 'mock';

            const actionCode = await protocol.createActionCode(pubkey, async () => signature, chain as any);
            const isValid = protocol.validateActionCode(actionCode);

            expect(isValid).toBe(true);
        });

        it('should return false for unsupported chain', () => {
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test-pubkey',
                timestamp: Date.now(),
                signature: 'test-signature',
                chain: 'unsupported' as any,
                expiresAt: Date.now() + 120000,
                status: 'pending'
            });

            const isValid = protocol.validateActionCode(actionCode);
            expect(isValid).toBe(false);
        });

        it('should return false for expired action code', async () => {
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test-pubkey',
                timestamp: Date.now() - 200000, // 200 seconds ago
                signature: 'test-signature',
                chain: 'mock' as any,
                expiresAt: Date.now() - 100000, // 100 seconds ago
                status: 'pending'
            });

            const isValid = protocol.validateActionCode(actionCode);
            expect(isValid).toBe(false);
        });
    });

    describe('Transaction Management', () => {
        it('should attach transaction to action code with protocol meta injection', () => {
            const protocol = ActionCodesProtocol.create();
            const solanaAdapter = new SolanaAdapter();
            protocol.registerAdapter(solanaAdapter);
            
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test_pubkey',
                timestamp: Date.now(),
                signature: 'test_signature',
                chain: 'solana',
                status: 'pending',
                expiresAt: Date.now() + 120000
            });

            // Create a proper serialized transaction
            const transaction = new Transaction();
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            const issuerKeypair = Keypair.generate();
            transaction.feePayer = issuerKeypair.publicKey;
            const mockTransaction = transaction.serialize({ requireAllSignatures: false }).toString('base64');
            const issuer = issuerKeypair.publicKey.toBase58();
            const params = 'test_params';

            const updatedCode = protocol.attachTransaction(actionCode, mockTransaction, issuer, params, 'payment');

            expect(updatedCode.transaction?.transaction).not.toBe(mockTransaction); // Should be different due to meta injection
            expect(updatedCode.transaction?.txType).toBe('payment');
            expect(updatedCode.status).toBe('resolved');
        });

        it('should throw error when attaching transaction to unsupported chain', () => {
            const protocol = ActionCodesProtocol.create();
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test_pubkey',
                timestamp: Date.now(),
                signature: 'test_signature',
                chain: 'unsupported_chain' as any,
                status: 'pending',
                expiresAt: Date.now() + 120000
            });

            expect(() => {
                protocol.attachTransaction(actionCode, 'transaction_data', 'test_issuer_pubkey', 'test_params', 'payment');
            }).toThrow("Chain 'unsupported_chain' is not supported");
        });

        it('should finalize action code with transaction signature', () => {
            const protocol = ActionCodesProtocol.create();
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test_pubkey',
                timestamp: Date.now(),
                signature: 'test_signature',
                chain: 'solana',
                status: 'resolved',
                expiresAt: Date.now() + 120000,
                transaction: {
                    transaction: 'transaction_data',
                    txType: 'payment'
                }
            });

            const finalizedCode = protocol.finalizeActionCode(actionCode, 'tx_signature');

            expect(finalizedCode.transaction?.txSignature).toBe('tx_signature');
            expect(finalizedCode.status).toBe('finalized');
        });

        it('should throw error when finalizing without transaction', () => {
            const protocol = ActionCodesProtocol.create();
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test_pubkey',
                timestamp: Date.now(),
                signature: 'test_signature',
                chain: 'solana',
                status: 'pending',
                expiresAt: Date.now() + 120000
            });

            expect(() => {
                protocol.finalizeActionCode(actionCode, 'tx_signature');
            }).toThrow('Cannot finalize ActionCode without attached transaction');
        });
    });

    describe('Protocol Meta Operations', () => {
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should create protocol meta', async () => {
            const actionCode = await protocol.createActionCode('test-pubkey', async () => 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode, 'issuer-pubkey', 'params');

            expect(meta.version).toBe('1');
            expect(meta.initiator).toBe('test-pubkey');
            expect(meta.iss).toBe('issuer-pubkey');
            expect(meta.params).toBe('params');
        });

        it('should encode protocol meta', async () => {
            const actionCode = await protocol.createActionCode('test-pubkey', async () => 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);

            const encoded = protocol.encodeProtocolMeta(meta, 'mock');
            expect(encoded).toEqual({ encoded: meta });
        });

        it('should decode protocol meta', async () => {
            const actionCode = await protocol.createActionCode('test-pubkey', async () => 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);
            const encoded = { encoded: meta };

            const decoded = protocol.decodeProtocolMeta(encoded, 'mock');
            expect(decoded).toEqual(meta);
        });

        it('should validate transaction', async () => {
            const transaction = { encoded: { version: '1', prefix: 'DEFAULT' } };
            const authorities = ['authority1', 'authority2'];

            const isValid = protocol.validateTransaction(transaction, 'mock', authorities);
            expect(isValid).toBe(true);
        });

        it('should detect tampering', () => {
            const transaction = { encoded: { version: '1', prefix: 'DEFAULT', initiator: 'test', id: 'hash', iss: 'authority1' } };
            const authorities = ['authority1', 'authority2'];

            const isNotTampered = protocol.detectTampering(transaction, 'mock', authorities);
            expect(isNotTampered).toBe(true);
        });

        it('should decode protocol meta with type safety', async () => {
            const actionCode = await protocol.createActionCode('test-pubkey', async () => 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);
            const encoded = { encoded: meta };

            const decoded = protocol.decodeProtocolMetaTyped(encoded, 'mock');
            expect(decoded).toEqual(meta);
        });

        it('should validate transaction with type safety', async () => {
            const transaction = { encoded: { version: '1', prefix: 'DEFAULT' } };
            const authorities = ['authority1', 'authority2'];

            const isValid = protocol.validateTransactionTyped(transaction, 'mock', authorities);
            expect(isValid).toBe(true);
        });

        it('should throw error for unsupported chain in encode', async () => {
            const actionCode = await protocol.createActionCode('test-pubkey', async () => 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);

            expect(() => {
                protocol.encodeProtocolMeta(meta, 'unsupported');
            }).toThrow('Chain \'unsupported\' is not supported');
        });

        it('should return null for unsupported chain in decode', () => {
            const result = protocol.decodeProtocolMeta({}, 'unsupported');
            expect(result).toBeNull();
        });

        it('should return false for unsupported chain in validate', () => {
            const result = protocol.validateTransaction({}, 'unsupported', []);
            expect(result).toBe(false);
        });

        it('should return false for unsupported chain in detectTampering', () => {
            const result = protocol.detectTampering({}, 'unsupported', []);
            expect(result).toBe(false);
        });

        it('should return null for unsupported chain in decodeProtocolMetaTyped', () => {
            const result = protocol.decodeProtocolMetaTyped({}, 'unsupported');
            expect(result).toBeNull();
        });

        it('should return false for unsupported chain in validateTransactionTyped', () => {
            const result = protocol.validateTransactionTyped({}, 'unsupported', []);
            expect(result).toBe(false);
        });

        it('should throw error for unsupported chain in attachTransaction', () => {
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test-pubkey',
                timestamp: Date.now(),
                signature: 'test-signature',
                chain: 'unsupported' as any,
                expiresAt: Date.now() + 120000,
                status: 'pending'
            });

            expect(() => {
                protocol.attachTransaction(actionCode, 'transaction', 'test_issuer_pubkey', 'test_params', 'payment');
            }).toThrow('Chain \'unsupported\' is not supported');
        });
    });
}); 

describe('Sign-Only Management', () => {
  it('should handle sign-only action code lifecycle', async () => {
    const protocol = ActionCodesProtocol.create();
    const solanaAdapter = new SolanaAdapter();
    protocol.registerAdapter(solanaAdapter);

    const keypair = Keypair.generate();
    const pubkey = keypair.publicKey.toBase58();

    // 1. Create action code (pending)
    const signFn = jest.fn().mockResolvedValue('test_signature');
    jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(true);
    const actionCode = await protocol.createActionCode(pubkey, signFn, 'solana');

    // 2. Attach message (resolved)
    const message = 'Sign this message for access';
    const resolvedCode = protocol.attachMessage(actionCode, message);

    expect(resolvedCode.transaction?.message).toBe(message);
    expect(resolvedCode.status).toBe('resolved');

    // 3. Finalize with valid signature (finalized)
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signature = bs58.encode(signatureBytes);

    const finalizedCode = protocol.finalizeActionCode(resolvedCode, signature);

    expect(finalizedCode.transaction?.signedMessage).toBe(signature);
    expect(finalizedCode.status).toBe('finalized');
    expect(protocol.validateActionCode(finalizedCode)).toBe(true);
  });

  it('should fail validation with invalid signature', async () => {
    const protocol = ActionCodesProtocol.create();
    const solanaAdapter = new SolanaAdapter();
    protocol.registerAdapter(solanaAdapter);

    const keypair = Keypair.generate();
    const pubkey = keypair.publicKey.toBase58();

    const signFn = jest.fn().mockResolvedValue('test_signature');
    jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(true);
    const actionCode = await protocol.createActionCode(pubkey, signFn, 'solana');

    const message = 'Sign this message for access';
    const resolvedCode = protocol.attachMessage(actionCode, message);

    // Use a random signature
    const invalidSignature = bs58.encode(nacl.sign.detached(Buffer.from('other message'), keypair.secretKey));
    const finalizedCode = protocol.finalizeActionCode(resolvedCode, invalidSignature);

    expect(protocol.validateActionCode(finalizedCode)).toBe(false);
  });
}); 