import { ProtocolMetaV1, ProtocolMetaParser } from './meta';
import { CodeGenerator } from './codegen';
import { PROTOCOL_VERSION, PROTOCOL_PREFIX } from './constants';

describe('ProtocolMeta', () => {
  const ISSUER = 'ISSUER';
  describe('ProtocolMetaParser.parse', () => {
    it('should parse valid protocol meta string', () => {
      const metaString = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}`;
      const result = ProtocolMetaParser.parse(metaString);

      expect(result).toEqual({
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: undefined
      });
    });

    it('should parse protocol meta with params', () => {
      const metaString = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}&p=extraParam`;
      const result = ProtocolMetaParser.parse(metaString);

      expect(result).toEqual({
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: 'extraParam'
      });
    });

    it('should return null for invalid protocol prefix', () => {
      const metaString = `invalid:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}`;
      const result = ProtocolMetaParser.parse(metaString);

      expect(result).toBeNull();
    });

    it('should return null for malformed meta string', () => {
      const metaString = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&iss=${ISSUER}`;
      const result = ProtocolMetaParser.parse(metaString);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = ProtocolMetaParser.parse('');
      expect(result).toBeNull();
    });

    it('should return null for string with wrong format', () => {
      const result = ProtocolMetaParser.parse('just some random text');
      expect(result).toBeNull();
    });

    it('should handle special characters in params', () => {
      const metaString = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}&p=param%20with%20spaces`;
      const result = ProtocolMetaParser.parse(metaString);

      expect(result).toEqual({
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: 'param%20with%20spaces'
      });
    });
  });

  describe('ProtocolMetaParser.serialize', () => {
    it('should serialize protocol meta without params', () => {
      const meta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER
      };

      const result = ProtocolMetaParser.serialize(meta);
      const expected = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}`;

      expect(result).toBe(expected);
    });

    it('should serialize protocol meta with params', () => {
      const meta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: 'extraParam'
      };

      const result = ProtocolMetaParser.serialize(meta);
      const expected = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}&p=extraParam`;

      expect(result).toBe(expected);
    });

    it('should handle special characters in params', () => {
      const meta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: 'param with spaces'
      };

      const result = ProtocolMetaParser.serialize(meta);
      const expected = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}&p=param with spaces`;

      expect(result).toBe(expected);
    });
  });

  describe('ProtocolMetaParser.fromInitiator', () => {
    it('should create protocol meta from initiator with default prefix', () => {
      const initiator = 'ABC123';
      const result = ProtocolMetaParser.fromInitiator(initiator, ISSUER);

      expect(result.version).toBe(PROTOCOL_VERSION);
      expect(result.prefix).toBe('DEFAULT');
      expect(result.initiator).toBe('ABC123');
      expect(result.id).toHaveLength(64); // SHA-256 hash length
      expect(/^[a-f0-9]{64}$/.test(result.id)).toBe(true); // Valid hex hash
      expect(result.iss).toBe(ISSUER);
      expect(result.params).toBeUndefined();
    });

    it('should create protocol meta from initiator with custom prefix', () => {
      const initiator = 'ABC123';
      const prefix = 'CUSTOM';
      const result = ProtocolMetaParser.fromInitiator(initiator, ISSUER, prefix);

      expect(result.version).toBe(PROTOCOL_VERSION);
      expect(result.prefix).toBe('CUSTOM');
      expect(result.initiator).toBe('ABC123');
      expect(result.id).toHaveLength(64); // SHA-256 hash length
      expect(/^[a-f0-9]{64}$/.test(result.id)).toBe(true); // Valid hex hash
      expect(result.iss).toBe(ISSUER);
      expect(result.params).toBeUndefined();
    });

    it('should create protocol meta with params', () => {
      const initiator = 'ABC123';
      const params = 'extraParam';
      const result = ProtocolMetaParser.fromInitiator(initiator, ISSUER, 'DEFAULT', params);

      expect(result).toEqual({
        version: PROTOCOL_VERSION,
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: CodeGenerator.deriveCodeHash(initiator, 'DEFAULT'),
        iss: ISSUER,
        params: 'extraParam'
      });
    });
  });

  describe('ProtocolMetaParser.validateCode', () => {
    it('should validate correct protocol meta', () => {
      const initiator = 'ABC123';
      const prefix = 'DEFAULT';
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const meta = ProtocolMetaParser.fromInitiator(initiator, ISSUER, prefix, undefined, timestamp);

      const result = ProtocolMetaParser.validateCode(meta, timestamp);
      expect(result).toBe(true);
    });

    it('should reject protocol meta with wrong id', () => {
      const meta: ProtocolMetaV1 = {
        version: PROTOCOL_VERSION,
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'wrongHash',
        iss: ISSUER
      };

      const result = ProtocolMetaParser.validateCode(meta);
      expect(result).toBe(false);
    });

    it('should validate meta with custom prefix', () => {
      const initiator = 'ABC123';
      const prefix = 'CUSTOM';
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const meta = ProtocolMetaParser.fromInitiator(initiator, ISSUER, prefix, undefined, timestamp);

      const result = ProtocolMetaParser.validateCode(meta, timestamp);
      expect(result).toBe(true);
    });
  });

  describe('ProtocolMetaParser.validateMetaFromString', () => {
    it('should validate correct meta string', () => {
      const initiator = 'ABC123';
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const meta = ProtocolMetaParser.fromInitiator(initiator, ISSUER, 'DEFAULT', undefined, timestamp);
      const metaString = ProtocolMetaParser.serialize(meta);

      const result = ProtocolMetaParser.validateMetaFromString(metaString, timestamp);
      expect(result).toBe(true);
    });

    it('should reject invalid meta string', () => {
      const result = ProtocolMetaParser.validateMetaFromString('invalid string');
      expect(result).toBe(false);
    });

    it('should reject meta string with wrong protocol prefix', () => {
      const metaString = `wrong:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${ISSUER}`;
      const result = ProtocolMetaParser.validateMetaFromString(metaString);
      expect(result).toBe(false);
    });

    it('should reject meta string with tampered id', () => {
      const initiator = 'ABC123';
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const meta = ProtocolMetaParser.fromInitiator(initiator, ISSUER, 'DEFAULT', undefined, timestamp);
      meta.id = 'tamperedHash';
      const metaString = ProtocolMetaParser.serialize(meta);

      const result = ProtocolMetaParser.validateMetaFromString(metaString, timestamp);
      expect(result).toBe(false);
    });
  });

  describe('Round-trip serialization', () => {
    it('should maintain data integrity through parse-serialize cycle', () => {
      const originalMeta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER,
        params: 'extraParam'
      };

      const serialized = ProtocolMetaParser.serialize(originalMeta);
      const parsed = ProtocolMetaParser.parse(serialized);

      expect(parsed).toEqual(originalMeta);
    });

    it('should maintain data integrity without params', () => {
      const originalMeta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'ABC123',
        id: 'def456',
        iss: ISSUER
      };

      const serialized = ProtocolMetaParser.serialize(originalMeta);
      const parsed = ProtocolMetaParser.parse(serialized);

      expect(parsed).toEqual(originalMeta);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty initiator', () => {
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const result = ProtocolMetaParser.fromInitiator('', ISSUER, 'DEFAULT', undefined, timestamp);
      expect(result.initiator).toBe('');
      expect(result.id).toBe(CodeGenerator.deriveCodeHash('', 'DEFAULT', timestamp));
      expect(result.iss).toBe(ISSUER);
      expect(result.prefix).toBe('DEFAULT');
      expect(result.version).toBe('1');
    });

    it('should handle DEFAULT prefix (which becomes empty)', () => {
      const result = ProtocolMetaParser.fromInitiator('ABC123', ISSUER, 'DEFAULT');
      expect(result.prefix).toBe('DEFAULT');
      expect(result.id).toHaveLength(64); // SHA-256 hash length
      expect(/^[a-f0-9]{64}$/.test(result.id)).toBe(true); // Valid hex hash
      expect(result.iss).toBe(ISSUER);
    });

    it('should handle very long initiator', () => {
      const longInitiator = 'A'.repeat(1000);
      const result = ProtocolMetaParser.fromInitiator(longInitiator, ISSUER);
      expect(result.initiator).toBe(longInitiator);
      expect(result.id).toHaveLength(64); // SHA-256 hash length
      expect(/^[a-f0-9]{64}$/.test(result.id)).toBe(true); // Valid hex hash
      expect(result.iss).toBe(ISSUER);
    });

    it('should handle special characters in initiator', () => {
      const specialInitiator = 'ABC@#$%^&*()_+{}|:"<>?[]\\;\',./';
      const timestamp = 1640995200000; // Fixed timestamp for deterministic testing
      const result = ProtocolMetaParser.fromInitiator(specialInitiator, ISSUER, 'DEFAULT', undefined, timestamp);
      expect(result.initiator).toBe(specialInitiator);
      expect(result.id).toBe(CodeGenerator.deriveCodeHash(specialInitiator, 'DEFAULT', timestamp));
      expect(result.iss).toBe(ISSUER);
    });
  });
});
