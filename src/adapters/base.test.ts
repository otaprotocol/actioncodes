import { BaseChainAdapter } from './base';
import { ProtocolMetaV1 } from '../meta';

// Mock adapter for testing
class MockBaseAdapter extends BaseChainAdapter<any> {
    readonly chain = 'mock';

    encode(meta: ProtocolMetaV1): any {
        return { encoded: meta };
    }

    decode(data: any): ProtocolMetaV1 | null {
        return data.encoded || null;
    }

    validate(): boolean {
        return true;
    }

    hasIssuerSignature(): boolean {
        return true;
    }

    protected validateTransactionIntegrity(): boolean {
        return true;
    }
}

describe('BaseChainAdapter', () => {
    let adapter: MockBaseAdapter;
    let validMeta: ProtocolMetaV1;

    beforeEach(() => {
        adapter = new MockBaseAdapter();
        validMeta = {
            version: '1',
            prefix: 'DEFAULT',
            initiator: 'test-initiator',
            id: 'test-id',
            iss: 'test-issuer',
            params: 'test-params'
        };
    });

    describe('detectTampering', () => {
        it('should return false when no protocol meta is found', () => {
            const mockData = { encoded: null };
            const result = adapter.detectTampering(mockData, ['test-issuer'], 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false for invalid version', () => {
            const invalidMeta = { ...validMeta, version: '2' };
            const mockData = { encoded: invalidMeta };
            const result = adapter.detectTampering(mockData, ['test-issuer'], 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false for wrong prefix', () => {
            const wrongPrefixMeta = { ...validMeta, prefix: 'WRONG' };
            const mockData = { encoded: wrongPrefixMeta };
            const result = adapter.detectTampering(mockData, ['test-issuer'], 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false when issuer is not in authorities list', () => {
            const mockData = { encoded: validMeta };
            const result = adapter.detectTampering(mockData, ['other-authority'], 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false when issuer is missing from meta', () => {
            const noIssuerMeta = { ...validMeta };
            delete noIssuerMeta.iss;
            const mockData = { encoded: noIssuerMeta };
            const result = adapter.detectTampering(mockData, ['test-issuer'], 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return true for valid transaction', () => {
            const mockData = { encoded: validMeta };
            const result = adapter.detectTampering(mockData, ['test-issuer'], 'DEFAULT');
            expect(result).toBe(true);
        });

        it('should use DEFAULT prefix when not specified', () => {
            const mockData = { encoded: validMeta };
            const result = adapter.detectTampering(mockData, ['test-issuer']);
            expect(result).toBe(true);
        });
    });
}); 