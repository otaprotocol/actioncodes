import { ActionCodesProtocol, ProtocolConfig } from './protocol';
import { ProtocolMetaV1 } from './meta';
import { ActionCode } from './actioncode';
import { BaseChainAdapter } from './adapters/base';

// Mock chain adapter for testing
class MockChainAdapter extends BaseChainAdapter<any> {
    readonly chain = 'mock';

    encode(meta: ProtocolMetaV1): any {
        return { encoded: meta };
    }

    decode(data: any): ProtocolMetaV1 | null {
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
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should generate action code for supported chain', () => {
            const pubkey = 'test-pubkey';
            const signature = 'test-signature';
            const chain = 'mock' as any;

            const actionCode = protocol.generateActionCode(pubkey, signature, chain);

            expect(actionCode.code).toMatch(/^\d{8}$/);
            expect(actionCode.pubkey).toBe(pubkey);
            expect(actionCode.signature).toBe(signature);
            expect(actionCode.chain).toBe(chain);
            expect(actionCode.prefix).toBe('DEFAULT');
            expect(actionCode.status).toBe('pending');
        });

        it('should generate action code with custom prefix', () => {
            const pubkey = 'test-pubkey';
            const signature = 'test-signature';
            const chain = 'mock' as any;
            const prefix = 'CUSTOM';

            const actionCode = protocol.generateActionCode(pubkey, signature, chain, prefix);

            expect(actionCode.prefix).toBe(prefix);
        });

        it('should throw error for unsupported chain', () => {
            const pubkey = 'test-pubkey';
            const signature = 'test-signature';
            const chain = 'unsupported' as any;

            expect(() => {
                protocol.generateActionCode(pubkey, signature, chain);
            }).toThrow('Chain \'unsupported\' is not supported');
        });
    });

    describe('Action Code Validation', () => {
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should validate action code', () => {
            const pubkey = 'test-pubkey';
            const signature = 'test-signature';
            const chain = 'mock';

            const actionCode = protocol.generateActionCode(pubkey, signature, chain as any);
            const isValid = protocol.validateActionCode(actionCode);

            expect(isValid).toBe(true);
        });

        it('should return false for unsupported chain', () => {
            const actionCode = ActionCode.fromPayload<string>({
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

        it('should return false for expired action code', () => {
            const actionCode = ActionCode.fromPayload<string>({
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
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should attach transaction to action code', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const transaction = 'mock-transaction';

            const updatedActionCode = protocol.attachTransaction(actionCode, transaction);

            expect(updatedActionCode.transaction).toBeDefined();
            expect(updatedActionCode.transaction?.transaction).toBe(transaction);
            expect(updatedActionCode.status).toBe('resolved');
        });

        it('should finalize action code with transaction signature', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const transaction = 'mock-transaction';
            const txSignature = 'mock-signature';

            const updatedActionCode = protocol.attachTransaction(actionCode, transaction);
            const finalizedActionCode = protocol.finalizeActionCode(updatedActionCode, txSignature);

            expect(finalizedActionCode.transaction?.txSignature).toBe(txSignature);
            expect(finalizedActionCode.status).toBe('finalized');
        });

        it('should throw error when finalizing without transaction', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);

            expect(() => {
                protocol.finalizeActionCode(actionCode, 'signature');
            }).toThrow('Cannot finalize ActionCode without attached transaction');
        });
    });

    describe('Protocol Meta Operations', () => {
        beforeEach(() => {
            protocol.registerAdapter(mockAdapter);
        });

        it('should create protocol meta', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode, 'issuer-pubkey', 'params');

            expect(meta.version).toBe('1');
            expect(meta.initiator).toBe('test-pubkey');
            expect(meta.iss).toBe('issuer-pubkey');
            expect(meta.params).toBe('params');
        });

        it('should encode protocol meta', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);

            const encoded = protocol.encodeProtocolMeta(meta, 'mock');
            expect(encoded).toEqual({ encoded: meta });
        });

        it('should decode protocol meta', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);
            const encoded = { encoded: meta };

            const decoded = protocol.decodeProtocolMeta(encoded, 'mock');
            expect(decoded).toEqual(meta);
        });

        it('should validate transaction', () => {
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

        it('should decode protocol meta with type safety', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
            const meta = protocol.createProtocolMeta(actionCode);
            const encoded = { encoded: meta };

            const decoded = protocol.decodeProtocolMetaTyped(encoded, 'mock');
            expect(decoded).toEqual(meta);
        });

        it('should validate transaction with type safety', () => {
            const transaction = { encoded: { version: '1', prefix: 'DEFAULT' } };
            const authorities = ['authority1', 'authority2'];

            const isValid = protocol.validateTransactionTyped(transaction, 'mock', authorities);
            expect(isValid).toBe(true);
        });

        it('should throw error for unsupported chain in encode', () => {
            const actionCode = protocol.generateActionCode('test-pubkey', 'test-signature', 'mock' as any);
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
    });
}); 