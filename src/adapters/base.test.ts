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

import { BaseChainAdapter } from './base';
import { ProtocolMetaV1 } from '../meta';

// Mock adapter for testing
class MockBaseAdapter extends BaseChainAdapter {
    readonly chain = 'mock';

    encodeMeta(meta: ProtocolMetaV1): any {
        return { encoded: meta };
    }

    decodeMeta(data: any): ProtocolMetaV1 | null {
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

    verifyCodeSignature(): boolean {
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
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false for invalid version', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return invalid version
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '2',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false for wrong prefix', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return wrong prefix
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'WRONG',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false when issuer is not in authorities list', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return issuer not in authorities
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'unauthorized_issuer',
                params: undefined
            });

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false when issuer is missing from meta', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return missing issuer
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: undefined,
                params: undefined
            });

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return true for valid transaction', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return valid meta
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            // Mock hasIssuerSignature to return true
            jest.spyOn(adapter, 'hasIssuerSignature').mockReturnValue(true);

            // Mock validateTransactionIntegrity to return true
            jest.spyOn(adapter as any, 'validateTransactionIntegrity').mockReturnValue(true);

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(true);
        });

        it('should use DEFAULT prefix when not specified', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return valid meta
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            // Mock hasIssuerSignature to return true
            jest.spyOn(adapter, 'hasIssuerSignature').mockReturnValue(true);

            // Mock validateTransactionIntegrity to return true
            jest.spyOn(adapter as any, 'validateTransactionIntegrity').mockReturnValue(true);

            const result = adapter.detectTampering(transaction, authorities);
            expect(result).toBe(true);
        });

        it('should return false when validateTransactionIntegrity returns false', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return valid meta
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            // Mock hasIssuerSignature to return true
            jest.spyOn(adapter, 'hasIssuerSignature').mockReturnValue(true);

            // Mock validateTransactionIntegrity to return false
            jest.spyOn(adapter as any, 'validateTransactionIntegrity').mockReturnValue(false);

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should return false when issuer signature is missing', () => {
            const adapter = new MockBaseAdapter();
            const transaction = { data: 'test' };
            const authorities = ['authority1', 'authority2'];

            // Mock decode to return valid meta
            jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
                version: '1',
                prefix: 'DEFAULT',
                initiator: 'initiator',
                id: 'id',
                iss: 'authority1',
                params: undefined
            });

            // Mock hasIssuerSignature to return false
            jest.spyOn(adapter, 'hasIssuerSignature').mockReturnValue(false);

            const result = adapter.detectTampering(transaction, authorities, 'DEFAULT');
            expect(result).toBe(false);
        });
    });
}); 