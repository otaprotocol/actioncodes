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
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should generate codes with prefix + 8 digits for custom prefixes', () => {
            const timestamp = 1640995200000;
            const prefix = 'CUSTOM';
            const { code } = CodeGenerator.generateCode(testPubkey, prefix, timestamp);

            expect(code).toHaveLength(prefix.length + 8);
            expect(code.startsWith(prefix)).toBe(true);
            expect(/^[A-Za-z]+\d{8}$/.test(code)).toBe(true);
        });

        it('should generate deterministic codes for same inputs', () => {
            const timestamp = 1640995200000;
            const { code: code1 } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            expect(code1).toBe(code2);
        });

        it('should generate different codes for different public keys', () => {
            const timestamp = 1640995200000;
            const pubkey1 = '9sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';
            const pubkey2 = '8sbZg6E3HbMdzEDXUGvXTo7WTxEfNMPkRjJ3xCTpSFLW';

            const { code: code1 } = CodeGenerator.generateCode(pubkey1, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(pubkey2, 'DEFAULT', timestamp);

            expect(code1).not.toBe(code2);
        });

        it('should generate different codes for different prefixes', () => {
            const timestamp = 1640995200000;
            const { code: code1 } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, 'CUSTOM', timestamp);

            expect(code1).not.toBe(code2);
        });

        it('should generate different codes for different timestamps', () => {
            const timestamp1 = 1640995200000;
            const timestamp2 = timestamp1 + CODE_TTL; // Next time slot equivalent

            const { code: code1 } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp1);
            const { code: code2 } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp2);

            expect(code1).not.toBe(code2);
        });

        it('should pad codes with leading zeros for DEFAULT prefix', () => {
            // This test might be flaky due to hash randomness, but it should work most of the time
            const timestamp = 1640995200000;
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            expect(code).toHaveLength(8);
            expect(/^\d{8}$/.test(code)).toBe(true);
        });

        it('should pad codes with leading zeros for custom prefix', () => {
            const timestamp = 1640995200000;
            const prefix = 'TEST';
            const { code } = CodeGenerator.generateCode(testPubkey, prefix, timestamp);

            expect(code).toHaveLength(prefix.length + 8);
            expect(code.startsWith(prefix)).toBe(true);
            expect(/^[A-Za-z]+\d{8}$/.test(code)).toBe(true);
        });

        it('should throw error for invalid prefixes', () => {
            const timestamp = 1640995200000;
            expect(() => CodeGenerator.generateCode(testPubkey, 'AB', timestamp)).toThrow();
            expect(() => CodeGenerator.generateCode(testPubkey, 'VERYLONGPREFIX', timestamp)).toThrow();
            expect(() => CodeGenerator.generateCode(testPubkey, 'ABC123', timestamp)).toThrow();
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


    describe('Canonical Prefix', () => {
        it('should always use lowercase prefix with no trailing colon', () => {
            expect(PROTOCOL_PREFIX).toBe(PROTOCOL_PREFIX.toLowerCase());
            expect(PROTOCOL_PREFIX.endsWith(":")).toBe(false);
        });
    });

    describe('Code Format Validation', () => {
        it('should validate correct 8-digit codes', () => {
            expect(CodeGenerator.validateCodeFormat('12345678')).toBe(true);
            expect(CodeGenerator.validateCodeFormat('00000000')).toBe(true);
            expect(CodeGenerator.validateCodeFormat('99999999')).toBe(true);
        });

        it('should validate correct codes with prefixes', () => {
            expect(CodeGenerator.validateCodeFormat('ABC12345678')).toBe(true);
            expect(CodeGenerator.validateCodeFormat('CUSTOM00000000')).toBe(true);
            expect(CodeGenerator.validateCodeFormat('TEST99999999')).toBe(true);
        });

        it('should reject codes with wrong length', () => {
            expect(CodeGenerator.validateCodeFormat('1234567')).toBe(false);  // 7 digits
            expect(CodeGenerator.validateCodeFormat('123456789')).toBe(false); // 9 digits
            expect(CodeGenerator.validateCodeFormat('')).toBe(false); // empty
        });

        it('should reject codes with invalid prefix length', () => {
            expect(CodeGenerator.validateCodeFormat('AB12345678')).toBe(false);  // prefix too short
            expect(CodeGenerator.validateCodeFormat('VERYLONGPREFIX12345678')).toBe(false); // prefix too long
        });

        it('should reject codes with non-letter prefixes', () => {
            expect(CodeGenerator.validateCodeFormat('ABC12345678')).toBe(true);  // valid
            expect(CodeGenerator.validateCodeFormat('AB112345678')).toBe(false); // prefix has numbers
            expect(CodeGenerator.validateCodeFormat('AB-12345678')).toBe(false); // prefix has special chars
        });

        it('should reject codes with non-numeric suffix', () => {
            expect(CodeGenerator.validateCodeFormat('ABC1234567a')).toBe(false);
            expect(CodeGenerator.validateCodeFormat('ABC1234567A')).toBe(false);
            expect(CodeGenerator.validateCodeFormat('ABC1234567-')).toBe(false);
            expect(CodeGenerator.validateCodeFormat('ABC1234567 ')).toBe(false);
        });

        it('should reject null and undefined', () => {
            expect(CodeGenerator.validateCodeFormat(null as any)).toBe(false);
            expect(CodeGenerator.validateCodeFormat(undefined as any)).toBe(false);
        });
    });

    describe('Code Digits Validation', () => {
        it('should validate exactly 8 digits', () => {
            expect(CodeGenerator.validateCodeDigits('12345678')).toBe(true);
            expect(CodeGenerator.validateCodeDigits('00000000')).toBe(true);
            expect(CodeGenerator.validateCodeDigits('99999999')).toBe(true);
        });

        it('should reject codes with wrong length', () => {
            expect(CodeGenerator.validateCodeDigits('1234567')).toBe(false);  // 7 digits
            expect(CodeGenerator.validateCodeDigits('123456')).toBe(false); // 6 digits
            expect(CodeGenerator.validateCodeDigits('')).toBe(false); // empty
        });

        it('should accept codes with exactly 8 digits (including prefixes)', () => {
            expect(CodeGenerator.validateCodeDigits('12345678')).toBe(true);  // 8 digits
            expect(CodeGenerator.validateCodeDigits('ABC12345678')).toBe(true); // prefix + 8 digits
        });

        it('should reject codes with more than 8 digits', () => {
            expect(CodeGenerator.validateCodeDigits('123456789')).toBe(false); // 9 digits
            expect(CodeGenerator.validateCodeDigits('ABC123456789')).toBe(false); // prefix + 9 digits
        });

        it('should reject codes with non-numeric characters', () => {
            expect(CodeGenerator.validateCodeDigits('1234567a')).toBe(false);
            expect(CodeGenerator.validateCodeDigits('1234567A')).toBe(false);
            expect(CodeGenerator.validateCodeDigits('1234567-')).toBe(false);
            expect(CodeGenerator.validateCodeDigits('1234567 ')).toBe(false);
            expect(CodeGenerator.validateCodeDigits('1234567.')).toBe(false);
        });

        it('should reject null and undefined', () => {
            expect(CodeGenerator.validateCodeDigits(null as any)).toBe(false);
            expect(CodeGenerator.validateCodeDigits(undefined as any)).toBe(false);
        });
    });

    describe('Enhanced Code Generation Validation', () => {
        it('should generate valid codes that pass all validation checks', () => {
            const timestamp = 1640995200000;
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            // All validation methods should pass
            expect(CodeGenerator.validateCodeFormat(code)).toBe(true);
            expect(CodeGenerator.validateCodeDigits(code)).toBe(true);
            expect(code).toHaveLength(8); // DEFAULT prefix is empty
            expect(/^[0-9]{8}$/.test(code)).toBe(true);
        });

        it('should generate valid codes for custom prefixes', () => {
            const timestamp = 1640995200000;
            const prefix = 'CUSTOM';
            const { code } = CodeGenerator.generateCode(testPubkey, prefix, timestamp);

            // All validation methods should pass
            expect(CodeGenerator.validateCodeFormat(code)).toBe(true);
            expect(CodeGenerator.validateCodeDigits(code)).toBe(true);
            expect(code).toHaveLength(prefix.length + 8);
            expect(code.startsWith(prefix)).toBe(true);
            expect(/^[A-Za-z]+\d{8}$/.test(code)).toBe(true);
        });

        it('should throw error if generated code fails validation', () => {
            // This test ensures our validation is working
            // In practice, this should never happen with the current implementation
            const timestamp = 1640995200000;
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);
            
            // The generated code should always be valid
            expect(() => {
                if (!CodeGenerator.validateCodeFormat(code)) {
                    throw new Error('Generated code failed format validation');
                }
                if (!CodeGenerator.validateCodeDigits(code)) {
                    throw new Error('Generated code failed digits validation');
                }
            }).not.toThrow();
        });
    });

    describe('Enhanced Code Validation', () => {
        it('should validate codes with proper format and digits', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);
            
            expect(CodeGenerator.validateCode(code, testPubkey, timestamp, 'DEFAULT')).toBe(true);
        });

        it('should reject codes with invalid format', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            
            // Valid code but wrong format
            expect(CodeGenerator.validateCode('1234567', testPubkey, timestamp, 'DEFAULT')).toBe(false);
            expect(CodeGenerator.validateCode('123456789', testPubkey, timestamp, 'DEFAULT')).toBe(false);
            expect(CodeGenerator.validateCode('1234567a', testPubkey, timestamp, 'DEFAULT')).toBe(false);
        });

        it('should reject codes with invalid digits', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            
            // Valid code but wrong digits
            expect(CodeGenerator.validateCode('1234567', testPubkey, timestamp, 'DEFAULT')).toBe(false);
            expect(CodeGenerator.validateCode('123456789', testPubkey, timestamp, 'DEFAULT')).toBe(false);
            expect(CodeGenerator.validateCode('1234567a', testPubkey, timestamp, 'DEFAULT')).toBe(false);
        });

        it('should still validate correct codes with proper format and digits', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);
            
            expect(CodeGenerator.validateCode(code, testPubkey, timestamp, 'DEFAULT')).toBe(true);
        });
    });

    describe('validateCode', () => {
        it('should validate correct code with DEFAULT prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, 'DEFAULT');

            expect(isValid).toBe(true);
        });

        it('should validate correct code with custom prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const prefix = 'CUSTOM';
            const { code } = CodeGenerator.generateCode(testPubkey, prefix, timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, prefix);

            expect(isValid).toBe(true);
        });

        it('should reject incorrect code', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const wrongCode = '87654321';

            const isValid = CodeGenerator.validateCode(wrongCode, testPubkey, timestamp, 'DEFAULT');

            expect(isValid).toBe(false);
        });

        it('should reject code for wrong timestamp', () => {
            const timestamp1 = Date.now() - 1000; // 1 second ago, still valid
            const timestamp2 = timestamp1 + CODE_TTL + 1000; // Outside valid window
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp1);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp2, 'DEFAULT');

            expect(isValid).toBe(false);
        });

        it('should reject code for wrong prefix', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            const isValid = CodeGenerator.validateCode(code, testPubkey, timestamp, 'CUSTOM');

            expect(isValid).toBe(false);
        });

        it('should throw error for invalid prefixes', () => {
            const timestamp = Date.now() - 1000; // 1 second ago, still valid
            const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', timestamp);

            expect(() => CodeGenerator.validateCode(code, testPubkey, timestamp, 'AB')).toThrow();
            expect(() => CodeGenerator.validateCode(code, testPubkey, timestamp, 'VERYLONGPREFIX')).toThrow();
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



    describe('Error Cases', () => {
        it('should handle invalid prefix in normalizePrefix', () => {
            expect(() => CodeGenerator.normalizePrefix('12')).toThrow('Invalid prefix: 12. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle invalid prefix in deriveCodeHash', () => {
            expect(() => CodeGenerator.deriveCodeHash('pubkey', '12')).toThrow('Invalid prefix: 12. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle invalid prefix in validateCode', () => {
            expect(() => CodeGenerator.validateCode('12345678', 'pubkey', Date.now(), '12')).toThrow('Invalid prefix: 12. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle invalid prefix in getExpectedCode', () => {
            expect(() => CodeGenerator.getExpectedCode('pubkey', Date.now(), '12')).toThrow('Invalid prefix: 12. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle invalid prefix in generateCode', () => {
            expect(() => CodeGenerator.generateCode('pubkey', '12')).toThrow('Invalid prefix: 12. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle negative timestamp in validateCode', () => {
            const result = CodeGenerator.validateCode('12345678', 'pubkey', -1000, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should handle future timestamp in validateCode', () => {
            const futureTimestamp = Date.now() + 200000; // 200 seconds in future
            const result = CodeGenerator.validateCode('12345678', 'pubkey', futureTimestamp, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should handle expired timestamp in validateCode', () => {
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago
            const result = CodeGenerator.validateCode('12345678', 'pubkey', expiredTimestamp, 'DEFAULT');
            expect(result).toBe(false);
        });

        it('should handle negative timestamp in isValidTimestamp', () => {
            const result = CodeGenerator.isValidTimestamp(-1000);
            expect(result).toBe(false);
        });

        it('should handle future timestamp beyond window in isValidTimestamp', () => {
            const futureTimestamp = Date.now() + 200000; // 200 seconds in future
            const result = CodeGenerator.isValidTimestamp(futureTimestamp);
            expect(result).toBe(false);
        });
    });

    describe('Error cases and edge conditions', () => {
        it('should throw error for invalid prefix in normalizePrefix', () => {
            // Test line 44: throw new Error for invalid prefix
            expect(() => CodeGenerator.normalizePrefix('123')).toThrow('Invalid prefix: 123. Must be 3-12 letters or "DEFAULT"');
            expect(() => CodeGenerator.normalizePrefix('ab')).toThrow('Invalid prefix: ab. Must be 3-12 letters or "DEFAULT"');
            expect(() => CodeGenerator.normalizePrefix('verylongprefix123')).toThrow('Invalid prefix: verylongprefix123. Must be 3-12 letters or "DEFAULT"');
            expect(() => CodeGenerator.normalizePrefix('test123')).toThrow('Invalid prefix: test123. Must be 3-12 letters or "DEFAULT"');
        });

        it('should handle invalid timestamps in validateCode', () => {
            const pubkey = 'test_pubkey';
            const prefix = 'TEST';
            
            // Test line 74: timestamp validation failures
            // Negative timestamp
            expect(CodeGenerator.validateCode('12345678', pubkey, -1000, prefix)).toBe(false);
            
            // Future timestamp (should be invalid according to validateCode logic)
            const futureTimestamp = Date.now() + 1000;
            expect(CodeGenerator.validateCode('12345678', pubkey, futureTimestamp, prefix)).toBe(false);
            
            // Past timestamp within window (should be valid)
            const pastTimestamp = Date.now() - 1000;
            const validCode = CodeGenerator.getExpectedCode(pubkey, pastTimestamp, prefix);
            expect(CodeGenerator.validateCode(validCode, pubkey, pastTimestamp, prefix)).toBe(true);
        });

        it('should handle code mismatch in validateCode', () => {
            const pubkey = 'test_pubkey';
            const timestamp = Date.now();
            const prefix = 'TEST';
            
            // Test lines 94-111: code validation failures
            const expectedCode = CodeGenerator.getExpectedCode(pubkey, timestamp, prefix);
            
            // Wrong code
            expect(CodeGenerator.validateCode('99999999', pubkey, timestamp, prefix)).toBe(false);
            
            // Code with wrong length
            expect(CodeGenerator.validateCode('1234567', pubkey, timestamp, prefix)).toBe(false);
            expect(CodeGenerator.validateCode('123456789', pubkey, timestamp, prefix)).toBe(false);
            
            // Valid code should pass
            expect(CodeGenerator.validateCode(expectedCode, pubkey, timestamp, prefix)).toBe(true);
        });

        it('should handle edge cases in timestamp validation', () => {
            const pubkey = 'test_pubkey';
            const prefix = 'TEST';
            
            // Test boundary conditions
            const now = Date.now();
            
            // Timestamp exactly at now (should be valid)
            const code1 = CodeGenerator.getExpectedCode(pubkey, now, prefix);
            expect(CodeGenerator.validateCode(code1, pubkey, now, prefix)).toBe(true);
            
            // Past timestamp within window (should be valid)
            const pastTimestamp = now - 1000;
            const code2 = CodeGenerator.getExpectedCode(pubkey, pastTimestamp, prefix);
            expect(CodeGenerator.validateCode(code2, pubkey, pastTimestamp, prefix)).toBe(true);
            
            // Future timestamp (should be invalid according to validateCode logic)
            const futureTimestamp = now + 1000;
            const code3 = CodeGenerator.getExpectedCode(pubkey, futureTimestamp, prefix);
            expect(CodeGenerator.validateCode(code3, pubkey, futureTimestamp, prefix)).toBe(false);
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
                const { code } = CodeGenerator.generateCode(pubkey, 'DEFAULT', timestamp);
                const isValid = CodeGenerator.validateCode(code, pubkey, timestamp, 'DEFAULT');

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
                const { code } = CodeGenerator.generateCode(pubkey, 'DEFAULT', timestamp);
                codes.add(code);
            }

            // Test different prefixes
            const prefixes = ['DEFAULT', 'CUSTOM', 'TEST', 'PROD'];
            prefixes.forEach(prefix => {
                const { code } = CodeGenerator.generateCode(testPubkey, prefix, timestamp);
                codes.add(code);
            });

            // Test different timestamps
            for (let i = 0; i < 5; i++) {
                const slotTimestamp = timestamp + (i * CODE_TTL);
                const { code } = CodeGenerator.generateCode(testPubkey, 'DEFAULT', slotTimestamp);
                codes.add(code);
            }

            // Most codes should be unique (allow for some hash collisions)
            expect(codes.size).toBeGreaterThan(15); // At least 15 unique codes
        });
    });
});