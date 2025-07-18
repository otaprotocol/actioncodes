import { CodeGenerator } from './codegen';
import { CODE_TTL, PROTOCOL_PREFIX } from './constants';

describe('CodeGenerator', () => {
    const testPubkey = '9sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';
    const testSignature = 'mock_signature';

    describe('prefix validation', () => {
        it('should accept DEFAULT as valid prefix', () => {
            expect(CodeGenerator.validatePrefix('DEFAULT')).toBe(true);
        });

        it('should accept 3-12 letter prefixes', () => {
            expect(CodeGenerator.validatePrefix('ABC')).toBe(true);
            expect(CodeGenerator.validatePrefix('ABCDEFGHIJKL')).toBe(true);
            expect(CodeGenerator.validatePrefix('Test')).toBe(true);
        });

        it('should reject prefixes shorter than 3 letters', () => {
            expect(CodeGenerator.validatePrefix('AB')).toBe(false);
            expect(CodeGenerator.validatePrefix('A')).toBe(false);
            expect(CodeGenerator.validatePrefix('')).toBe(false);
        });

        it('should reject prefixes longer than 12 letters', () => {
            expect(CodeGenerator.validatePrefix('ABCDEFGHIJKLM')).toBe(false);
            expect(CodeGenerator.validatePrefix('VERYLONGPREFIX')).toBe(false);
        });

        it('should reject prefixes with non-letters', () => {
            expect(CodeGenerator.validatePrefix('ABC123')).toBe(false);
            expect(CodeGenerator.validatePrefix('ABC-DEF')).toBe(false);
            expect(CodeGenerator.validatePrefix('ABC DEF')).toBe(false);
        });
    });

    describe('prefix normalization', () => {
        it('should convert DEFAULT to empty string', () => {
            expect(CodeGenerator.normalizePrefix('DEFAULT')).toBe('');
        });

        it('should convert valid prefixes to uppercase', () => {
            expect(CodeGenerator.normalizePrefix('abc')).toBe('ABC');
            expect(CodeGenerator.normalizePrefix('Test')).toBe('TEST');
            expect(CodeGenerator.normalizePrefix('CUSTOM')).toBe('CUSTOM');
        });

        it('should throw error for invalid prefixes', () => {
            expect(() => CodeGenerator.normalizePrefix('AB')).toThrow();
            expect(() => CodeGenerator.normalizePrefix('VERYLONGPREFIX')).toThrow();
            expect(() => CodeGenerator.normalizePrefix('ABC123')).toThrow();
        });
    });

    describe('generateCode', () => {
        it('should generate 8-digit codes for DEFAULT prefix', () => {
            const timestamp = 1640995200000;
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should generate 8-digit codes for custom prefixes', () => {
            const timestamp = 1640995200000;
            const prefix = 'CUSTOM';
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, prefix, timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should generate deterministic codes for same inputs', () => {
            const timestamp = 1640995200000;
            const { code: code1 } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            expect(code1).toBe(code2);
        });

        it('should generate different codes for different public keys', () => {
            const timestamp = 1640995200000;
            const pubkey1 = '9sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';
            const pubkey2 = '8sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';

            const { code: code1 } = CodeGenerator.generateCode(pubkey1, testSignature, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(pubkey2, testSignature, 'DEFAULT', timestamp);

            expect(code1).not.toBe(code2);
        });

        it('should generate different codes for different prefixes', () => {
            const timestamp = 1640995200000;
            const { code: code1 } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, testSignature, 'CUSTOM', timestamp);

            expect(code1).not.toBe(code2);
        });

        it('should generate different codes for different timestamps', () => {
            const timestamp1 = 1640995200000;
            const timestamp2 = timestamp1 + CODE_TTL; // Next time slot equivalent

            const { code: code1 } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp1);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp2);

            expect(code1).not.toBe(code2);
        });

        it('should pad codes with leading zeros for DEFAULT prefix', () => {
            // This test might be flaky due to hash randomness, but it should work most of the time
            const timestamp = 1640995200000;
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should pad codes with leading zeros for custom prefix', () => {
            const timestamp = 1640995200000;
            const prefix = 'TEST';
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, prefix, timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should use current time when no timestamp provided', () => {
            const { code: code1 } = CodeGenerator.generateCode(testPubkey, testSignature);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, testSignature);

            // Codes should be the same if generated within the same time slot
            expect(code1).toBe(code2);
        });

        it('should throw error for invalid prefixes', () => {
            const timestamp = 1640995200000;
            expect(() => CodeGenerator.generateCode(testPubkey, testSignature, 'AB', timestamp)).toThrow();
            expect(() => CodeGenerator.generateCode(testPubkey, testSignature, 'VERYLONGPREFIX', timestamp)).toThrow();
            expect(() => CodeGenerator.generateCode(testPubkey, testSignature, 'ABC123', timestamp)).toThrow();
        });
    });

    describe('deriveCodeHash', () => {
        it('should generate SHA-256 hash', () => {
            const timestamp = 1640995200000;
            const hash = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT', timestamp);

            expect(hash).toHaveLength(64); // SHA-256 hex string length
            expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
        });

        it('should generate deterministic hashes for same inputs', () => {
            const timestamp = 1640995200000;
            const hash1 = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT', timestamp);
            const hash2 = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT', timestamp);

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const timestamp = 1640995200000;
            const hash1 = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT', timestamp);
            const hash2 = CodeGenerator.deriveCodeHash(testPubkey, 'CUSTOM', timestamp);

            expect(hash1).not.toBe(hash2);
        });

        it('should throw error for invalid prefixes', () => {
            const timestamp = 1640995200000;
            expect(() => CodeGenerator.deriveCodeHash(testPubkey, 'AB', timestamp)).toThrow();
            expect(() => CodeGenerator.deriveCodeHash(testPubkey, 'VERYLONGPREFIX', timestamp)).toThrow();
        });

        it('should use current time when no timestamp provided', () => {
            const hash1 = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT');
            const hash2 = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT');

            // Hashes should be the same if generated within the same time slot
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64);
            expect(/^[a-f0-9]{64}$/.test(hash1)).toBe(true);
        });

        it('should return hash when timestamp is explicitly provided', () => {
            const timestamp = 1640995200000;
            const hash = CodeGenerator.deriveCodeHash(testPubkey, 'DEFAULT', timestamp);
            
            expect(hash).toHaveLength(64);
            expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);
        });
    });

    describe('generateCodeSignatureMessage', () => {
        it('should generate correct signature message format', () => {
            const code = '12345678';
            const timestamp = 1234567890;
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp);

            expect(message).toBe(`actioncodes:${code}:${timestamp}`);
        });

        it('should work with different codes, prefixes and timestamps', () => {
            const code = '87654321';
            const timestamp = 9876543210;
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp);

            expect(message).toBe(`actioncodes:${code}:${timestamp}`);
        });
    });

    describe('Canonical Prefix', () => {
        it('should always use lowercase prefix with no trailing colon', () => {
            expect(PROTOCOL_PREFIX).toBe(PROTOCOL_PREFIX.toLowerCase());
            expect(PROTOCOL_PREFIX.endsWith(":")).toBe(false);
        });
    });

    describe('validateCode', () => {
        it('should validate correct code with DEFAULT prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, testSignature, 'DEFAULT');

            expect(isValid).toBe(true);
        });

        it('should validate correct code with custom prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const prefix = 'CUSTOM';
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, prefix, timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, testSignature, prefix);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect code', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const wrongCode = '87654321';

            const isValid = CodeGenerator.validateCode(wrongCode, testPubkey, timestamp, testSignature, 'DEFAULT');

            expect(isValid).toBe(false);
        });

        it('should reject code for wrong timestamp', () => {
            const timestamp1 = Date.now() - 1000; // 1 second ago, still valid
            const timestamp2 = timestamp1 + CODE_TTL + 1000; // Outside valid window
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp1);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp2, testSignature, 'DEFAULT');

            expect(isValid).toBe(false);
        });

        it('should reject code for wrong prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, testSignature, 'CUSTOM');

            expect(isValid).toBe(false);
        });

        it('should throw error for invalid prefixes', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', timestamp);

            expect(() => CodeGenerator.validateCode(code, testPubkey, timestamp, testSignature, 'AB')).toThrow();
            expect(() => CodeGenerator.validateCode(code, testPubkey, timestamp, testSignature, 'VERYLONGPREFIX')).toThrow();
        });
    });

    describe('isValidTimestamp', () => {
      it('should return true for current timestamp', () => {
        const now = Date.now();
        const isValid = CodeGenerator.isValidTimestamp(now);
        expect(isValid).toBe(true);
      });

      it('should return true for timestamp within time window', () => {
        const future = Date.now() + CODE_TTL - 1000; // 1 second before expiry
        const isValid = CodeGenerator.isValidTimestamp(future);
        expect(isValid).toBe(true);
      });

      it('should return true for timestamp at time window boundary', () => {
        const boundary = Date.now() + CODE_TTL;
        const isValid = CodeGenerator.isValidTimestamp(boundary);
        expect(isValid).toBe(true);
      });

      it('should return false for negative timestamp', () => {
        const isValid = CodeGenerator.isValidTimestamp(-1000);
        expect(isValid).toBe(false);
      });

      it('should return false for timestamp beyond time window', () => {
        const beyond = Date.now() + CODE_TTL + 1000; // 1 second beyond expiry
        const isValid = CodeGenerator.isValidTimestamp(beyond);
        expect(isValid).toBe(false);
      });

      it('should return true for zero timestamp', () => {
        const isValid = CodeGenerator.isValidTimestamp(0);
        expect(isValid).toBe(true);
      });
    });

    describe('Integration Tests', () => {
        it('should work end-to-end with real public keys', () => {
            const pubkeys = [
                '9sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW',
                '8sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW',
                '7sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW'
            ];

            const timestamp = Date.now() - 1000; // 1 second ago, still valid

            pubkeys.forEach(pubkey => {
                const { code } = CodeGenerator.generateCode(pubkey, testSignature, 'DEFAULT', timestamp);
                const isValid = CodeGenerator.validateCode(code, pubkey, timestamp, testSignature, 'DEFAULT');

                expect(code).toHaveLength(8);
                expect(/^\d{8}$/.test(code)).toBe(true);
                expect(isValid).toBe(true);
            });
        });

        it('should generate unique codes across different parameters', () => {
            const timestamp = 1640995200000;
            const codes = new Set();

            // Test different public keys
            for (let i = 0; i < 10; i++) {
                const pubkey = `${i}sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW`;
                const { code } = CodeGenerator.generateCode(pubkey, testSignature, 'DEFAULT', timestamp);
                codes.add(code);
            }

            // Test different prefixes
            const prefixes = ['DEFAULT', 'CUSTOM', 'TEST', 'PROD'];
            prefixes.forEach(prefix => {
                const { code } = CodeGenerator.generateCode(testPubkey, testSignature, prefix, timestamp);
                codes.add(code);
            });

            // Test different timestamps
            for (let i = 0; i < 5; i++) {
                const slotTimestamp = timestamp + (i * CODE_TTL);
                const { code } = CodeGenerator.generateCode(testPubkey, testSignature, 'DEFAULT', slotTimestamp);
                codes.add(code);
            }

            // Most codes should be unique (allow for some hash collisions)
            expect(codes.size).toBeGreaterThan(15); // At least 15 unique codes
        });
    });
});