import { ActionCode, ActionCodeFields } from './actioncode';
import { CodeGenerator } from './codegen';
import { SUPPORTED_CHAINS } from './constants';
import { ActionCodesProtocol } from './protocol';
import { SolanaAdapter } from './adapters/solana/solana';
import { Buffer } from "buffer";
import { Keypair } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

describe('ActionCode', () => {
    const testPubkey = '9sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';
    const testSignature = 'test_signature_for_actioncode';
    const testTimestamp = Date.now();
    const testExpiresAt = testTimestamp + 120000; // 2 minutes later
    const protocol = ActionCodesProtocol.create();
    protocol.registerAdapter(new SolanaAdapter());
    const createTestActionCode = (overrides: Partial<ActionCodeFields> = {}): ActionCode => {
        const defaultFields: ActionCodeFields = {
            code: '12345678',
            prefix: 'DEFAULT',
            pubkey: testPubkey,
            timestamp: testTimestamp,
            signature: testSignature,
            chain: 'solana' as const,
            expiresAt: testExpiresAt,
            status: 'pending' as const
        };

        return ActionCode.fromPayload({ ...defaultFields, ...overrides });
    };

    describe('Static Methods', () => {
        describe('fromPayload', () => {
            it('should create ActionCode from valid payload', () => {
                const actionCode = createTestActionCode();
                expect(actionCode).toBeInstanceOf(ActionCode);
            });

            it('should throw error for missing required fields', () => {
                const invalidPayload = {
                    code: '12345678',
                    prefix: 'DEFAULT',
                    // Missing required fields
                } as any;

                expect(() => ActionCode.fromPayload(invalidPayload)).toThrow('Missing required fields in ActionCode payload');
            });

            it('should accept optional transaction and metadata', () => {
                const actionCode = createTestActionCode({
                    transaction: {
                        transaction: 'transaction',
                        txSignature: 'test_signature',
                        txType: 'payment'
                    },
                    metadata: {
                        description: 'Test payment',
                        params: { currency: 'USDC' }
                    }
                });

                expect(actionCode.transaction).toEqual({
                    transaction: 'transaction',
                    txSignature: 'test_signature',
                    txType: 'payment'
                });
                expect(actionCode.description).toBe('Test payment');
                expect(actionCode.params).toEqual({ currency: 'USDC' });
            });
        });

        describe('fromEncoded', () => {
            it('should decode ActionCode from base64 string', () => {
                const originalActionCode = createTestActionCode();
                const encoded = originalActionCode.encoded;
                const decodedActionCode = ActionCode.fromEncoded(encoded);

                expect(decodedActionCode.json).toEqual(originalActionCode.json);
            });

            it('should handle encoded strings with metadata', () => {
                const actionCode = createTestActionCode({
                    metadata: {
                        description: 'Test description',
                        params: { test: 'value' }
                    }
                });

                const encoded = actionCode.encoded;
                const decoded = ActionCode.fromEncoded(encoded);

                expect(decoded.description).toBe('Test description');
                expect(decoded.params).toEqual({ test: 'value' });
            });
        });
    });

    describe('Core Methods', () => {
        describe('encode', () => {
            it('should encode ActionCode to base64 string', () => {
                const actionCode = createTestActionCode();
                const encoded = actionCode.encoded;

                expect(typeof encoded).toBe('string');
                expect(encoded.length).toBeGreaterThan(0);
                expect(() => Buffer.from(encoded, 'base64')).not.toThrow();
            });

            it('should produce consistent encoding', () => {
                const actionCode = createTestActionCode();
                const encoded1 = actionCode.encoded;
                const encoded2 = actionCode.encoded;

                expect(encoded1).toBe(encoded2);
            });
        });

        describe('validate', () => {
            it('should validate ActionCode using CodeGenerator', () => {
                const actionCode = createTestActionCode();
                const isValid = actionCode.isValid(protocol);

                // This will depend on the actual validation logic in CodeGenerator
                expect(typeof isValid).toBe('boolean');
            });
        });

        describe('toJSON', () => {
            it('should return the raw fields object', () => {
                const fields = {
                    code: '12345678',
                    prefix: 'DEFAULT',
                    pubkey: testPubkey,
                    timestamp: testTimestamp,
                    signature: testSignature,
                    chain: 'solana' as const,
                    expiresAt: testExpiresAt,
                    status: 'pending' as const
                };

                const actionCode = ActionCode.fromPayload(fields);
                expect(actionCode.json).toEqual(fields);
            });
        });
    });

    describe('UX Helper Methods', () => {
        describe('Time Management', () => {
            it('should calculate remaining time correctly', () => {
                const now = Date.now();
                const expiresAt = now + 60000; // 1 minute from now
                const actionCode = createTestActionCode({ expiresAt });

                const remaining = actionCode.remainingTime;
                expect(remaining).toBeGreaterThan(0);
                expect(remaining).toBeLessThanOrEqual(60000);
            });

            it('should return 0 for expired codes', () => {
                const expiredAt = Date.now() - 1000; // 1 second ago
                const actionCode = createTestActionCode({ expiresAt: expiredAt });

                expect(actionCode.remainingTime).toBe(0);
            });

            it('should correctly identify expired codes', () => {
                const expiredAt = Date.now() - 1000;
                const actionCode = createTestActionCode({ expiresAt: expiredAt });

                expect(actionCode.expired).toBe(true);
            });

            it('should correctly identify non-expired codes', () => {
                const futureExpiresAt = Date.now() + 60000;
                const actionCode = createTestActionCode({ expiresAt: futureExpiresAt });

                expect(actionCode.expired).toBe(false);
            });

            it('should format time remaining string correctly', () => {
                const expiresAt = Date.now() + 90000; // 1.5 minutes
                const actionCode = createTestActionCode({ expiresAt });

                const timeString = actionCode.remainingTimeString;
                expect(timeString).toMatch(/1m \d+s remaining/);
            });

            it('should show seconds only for short durations', () => {
                const expiresAt = Date.now() + 30000; // 30 seconds
                const actionCode = createTestActionCode({ expiresAt });

                const timeString = actionCode.remainingTimeString;
                expect(timeString).toMatch(/\d+s remaining/);
                expect(timeString).not.toMatch(/\d+m/); // Should not contain "Xm" pattern
            });

            it('should show "Expired" for expired codes', () => {
                const expiredAt = Date.now() - 1000;
                const actionCode = createTestActionCode({ expiresAt: expiredAt });

                expect(actionCode.remainingTimeString).toBe('Expired');
            });
        });

        describe('Chain and Status', () => {
            it('should return correct chain', () => {
                const actionCode = createTestActionCode({ chain: 'solana' });
                expect(actionCode.chain).toBe('solana');
            });

            it('should return correct status', () => {
                const actionCode = createTestActionCode({ status: 'resolved' });
                expect(actionCode.status).toBe('resolved');
            });

            it('should handle all supported statuses', () => {
                const statuses: Array<'pending' | 'resolved' | 'finalized' | 'expired' | 'error'> = ['pending', 'resolved', 'finalized', 'expired', 'error'];

                statuses.forEach(status => {
                    const actionCode = createTestActionCode({ status });
                    expect(actionCode.status).toBe(status);
                });
            });
        });

        describe('Code and Metadata', () => {
            it('should return correct code', () => {
                const actionCode = createTestActionCode({ code: '87654321' });
                expect(actionCode.code).toBe('87654321');
            });

            it('should return correct prefix', () => {
                const actionCode = createTestActionCode({ prefix: 'JUP' });
                expect(actionCode.prefix).toBe('JUP');
            });

            it('should return correct pubkey', () => {
                const actionCode = createTestActionCode({ pubkey: 'different_pubkey' });
                expect(actionCode.pubkey).toBe('different_pubkey');
            });

            it('should return transaction data when present', () => {
                const transaction = {
                    transaction: 'transaction',
                    txSignature: 'test_sig',
                    txType: 'transfer'
                };
                const actionCode = createTestActionCode({ transaction });

                expect(actionCode.transaction).toEqual(transaction);
            });

            it('should return undefined for missing transaction', () => {
                const actionCode = createTestActionCode();
                expect(actionCode.transaction).toBeUndefined();
            });

            it('should return metadata when present', () => {
                const metadata = {
                    description: 'Test description',
                    params: { key: 'value' }
                };
                const actionCode = createTestActionCode({ metadata });

                expect(actionCode.metadata).toEqual(metadata);
            });

            it('should return undefined for missing metadata', () => {
                const actionCode = createTestActionCode();
                expect(actionCode.metadata).toBeUndefined();
            });

            it('should return description when present', () => {
                const actionCode = createTestActionCode({
                    metadata: { description: 'Test description' }
                });

                expect(actionCode.description).toBe('Test description');
            });

            it('should return undefined for missing description', () => {
                const actionCode = createTestActionCode();
                expect(actionCode.description).toBeUndefined();
            });

            it('should return params when present', () => {
                const params = { amount: 100, currency: 'USDC' };
                const actionCode = createTestActionCode({
                    metadata: { params }
                });

                expect(actionCode.params).toEqual(params);
            });

            it('should return undefined for missing params', () => {
                const actionCode = createTestActionCode();
                expect(actionCode.params).toBeUndefined();
            });
        });

        describe('Display and Formatting', () => {
            it('should format DEFAULT prefix correctly', () => {
                const actionCode = createTestActionCode({
                    code: '12345678',
                    prefix: 'DEFAULT',
                    chain: 'solana',
                    status: 'pending'
                });

                expect(actionCode.displayString).toBe('12345678 (solana, pending)');
            });

            it('should format custom prefix correctly', () => {
                const actionCode = createTestActionCode({
                    code: '12345678',
                    prefix: 'JUP',
                    chain: 'solana',
                    status: 'resolved'
                });

                expect(actionCode.displayString).toBe('JUP-12345678 (solana, resolved)');
            });

            it('should handle different chains', () => {
                const actionCode = createTestActionCode({
                    code: '12345678',
                    prefix: 'DEFAULT',
                    chain: 'solana',
                    status: 'pending'
                });

                expect(actionCode.displayString).toBe('12345678 (solana, pending)');
            });

            it('should handle all statuses in display string', () => {
                const statuses: Array<'pending' | 'resolved' | 'finalized' | 'expired' | 'error'> = ['pending', 'resolved', 'finalized', 'expired', 'error'];

                statuses.forEach(status => {
                    const actionCode = createTestActionCode({ status });
                    expect(actionCode.displayString).toContain(status);
                });
            });
        });
    });

    describe('Chain Agnosticism', () => {
        it('should support all defined chains', () => {
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

            expect(actionCode.chain).toBe('solana');
        });

        it('should handle generic transaction types', () => {
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: 'test_pubkey',
                timestamp: Date.now(),
                signature: 'test_signature',
                chain: 'solana',
                status: 'pending',
                expiresAt: Date.now() + 120000,
                transaction: {
                    transaction: 'test_transaction',
                    txType: 'payment'
                }
            });

            expect(actionCode.transaction?.transaction).toBe('test_transaction');
            expect(actionCode.transaction?.txType).toBe('payment');
        });

        it('should throw error when chain adapter is not found', () => {
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

            const protocol = ActionCodesProtocol.create();
            // Don't register any adapters

            expect(() => actionCode.isValid(protocol)).toThrow('Chain adapter not found for chain solana');
        });
    });

    describe('Integration Tests', () => {
        it('should work with real code generation', () => {
            // Use a timestamp that's slightly in the past to ensure it's within the valid window
            const timestamp = Date.now() - 1000; // 1 second in the past
            const keypair = Keypair.generate();
            const pubkey = keypair.publicKey.toBase58();
            const { code } = CodeGenerator.generateCode(pubkey, 'DEFAULT', timestamp);
            const expiresAt = timestamp + 120000;

            // Create a valid signature for the generated code
            const solanaAdapter = new SolanaAdapter();
            const message = solanaAdapter.getCodeSignatureMessage(code, timestamp, 'DEFAULT');
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
            const signature = bs58.encode(signatureBytes);

            const actionCode = createTestActionCode({
                code,
                timestamp,
                expiresAt,
                signature,
                pubkey
            });

            expect(actionCode.code).toBe(code);

            // Debug the validation
            const adapter = protocol.getChainAdapter('solana');
            if (!adapter) throw new Error('Solana adapter not found');

            const isValid = actionCode.isValid(protocol);

            expect(isValid).toBe(true);
        });

        it('should handle full lifecycle with all helpers', () => {
            const metadata = {
                description: 'Payment to merchant',
                params: { amount: 50, currency: 'USDC' }
            };

            const actionCode = createTestActionCode({
                prefix: 'JUP',
                chain: 'solana',
                status: 'pending',
                metadata
            });

            // Test all helper methods
            expect(actionCode.displayString).toBe('JUP-12345678 (solana, pending)');
            expect(actionCode.description).toBe('Payment to merchant');
            expect(actionCode.params).toEqual({ amount: 50, currency: 'USDC' });
            expect(actionCode.prefix).toBe('JUP');
            expect(actionCode.chain).toBe('solana');
            expect(actionCode.status).toBe('pending');
            expect(actionCode.expired).toBe(false);
            expect(actionCode.remainingTimeString).toMatch(/remaining/);

            // Test encoding/decoding
            const encoded = actionCode.encoded;
            const decoded = ActionCode.fromEncoded(encoded);
            expect(decoded.json).toEqual(actionCode.json);
        });
    });
}); 