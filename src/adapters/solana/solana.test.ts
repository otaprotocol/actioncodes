import { Transaction, Keypair, VersionedTransaction, MessageV0 } from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { SolanaAdapter } from './solana';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { PROTOCOL_PREFIX } from '../../constants';
import { Buffer } from "buffer";

describe('SolanaAdapter', () => {
  let adapter: SolanaAdapter;
  let testMeta: ProtocolMetaV1;
  let authority1: Keypair;
  let authority2: Keypair;
  let mockAuthorities: string[];
  let defaultIssuer: string;

  beforeEach(() => {
    adapter = new SolanaAdapter();
    authority1 = Keypair.generate();
    authority2 = Keypair.generate();
    mockAuthorities = [authority1.publicKey.toBase58(), authority2.publicKey.toBase58()];
    defaultIssuer = authority1.publicKey.toBase58();
    testMeta = {
      version: '1',
      prefix: 'DEFAULT',
      initiator: 'ABC123',
      id: 'def456',
      iss: defaultIssuer,
      params: 'extraParam'
    };
  });

  describe('chain property', () => {
    it('should have chain property set to solana', () => {
      expect(adapter.chain).toBe('solana');
    });
  });

  describe('encode', () => {
    it('should encode protocol meta as memo instruction', () => {
      const instruction = adapter.encode(testMeta);
      expect(instruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true);
      expect(instruction.data).toBeDefined();
    });
  });

  describe('decode', () => {
    describe('legacy transactions', () => {
      it('should decode valid protocol meta from transaction', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        const result = adapter.decode(transaction);
        expect(result).toEqual(testMeta);
      });

      it('should decode valid protocol meta from base64 string', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        
        const serialized = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.decodeFromBase64(serialized);
        expect(result).toEqual(testMeta);
      });

      it('should return null for transaction without memo instruction', () => {
        const transaction = new Transaction();
        const result = adapter.decode(transaction);
        expect(result).toBeNull();
      });

      it('should return null for memo with wrong protocol prefix', () => {
        const metaString = `wrong:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${defaultIssuer}`;
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        const result = adapter.decode(transaction);
        expect(result).toBeNull();
      });

      it('should return null for unsupported protocol version', () => {
        const metaString = `${PROTOCOL_PREFIX}:v=2&pre=DEFAULT&ini=ABC123&id=def456&iss=${defaultIssuer}`;
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        const result = adapter.decode(transaction);
        expect(result).toBeNull();
      });
    });

    describe('versioned transactions', () => {
      it('should decode valid protocol meta from versioned transaction', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        
        // Create a simple MessageV0 with memo instruction
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey,
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1, // memoInstruction.programId
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.decode(versionedTransaction);
        expect(result).toEqual(testMeta);
      });

      it('should decode valid protocol meta from base64 versioned transaction', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey,
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serialized = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.decodeFromBase64(serialized);
        expect(result).toEqual(testMeta);
      });

      it('should return null for versioned transaction without memo instruction', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.decode(versionedTransaction);
        expect(result).toBeNull();
      });

      it('should return null for unsupported message version', () => {
        // Create a mock transaction with unsupported message type
        const mockTransaction = {
          message: { version: 'unsupported' },
        } as any;
        
        const result = adapter.decode(mockTransaction);
        expect(result).toBeNull();
      });

      it('should return null for versioned transaction with empty memo data', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey,
            MEMO_PROGRAM_ID,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: new Uint8Array(0), // Empty data
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.decode(versionedTransaction);
        expect(result).toBeNull();
      });

      it('should return null for versioned transaction with invalid memo data', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey,
            MEMO_PROGRAM_ID,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: new Uint8Array([255, 255, 255]), // Invalid UTF-8 data
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.decode(versionedTransaction);
        expect(result).toBeNull();
      });

      it('should return null for versioned transaction with unsupported protocol version', () => {
        const metaString = `${PROTOCOL_PREFIX}:v=2&pre=DEFAULT&ini=ABC123&id=def456&iss=${defaultIssuer}`;
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey,
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.decode(versionedTransaction);
        expect(result).toBeNull();
      });
    });
  });

  describe('validate', () => {
    describe('legacy transactions', () => {
      it('should validate transaction with correct meta and authority signature', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(true);
      });

      it('should validate transaction with correct meta and authority signature from base64', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        transaction.sign(authority1);
        
        const serialized = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.validateFromBase64(serialized, mockAuthorities, 'DEFAULT');
        expect(result).toBe(true);
      });

      it('should reject transaction without memo instruction', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should reject transaction with missing issuer', () => {
        // Remove iss from meta string
        const metaString = `${PROTOCOL_PREFIX}:v=1&pre=DEFAULT&ini=ABC123&id=def456`;
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should reject transaction with wrong issuer', () => {
        const meta = { ...testMeta, iss: 'NOT_AUTHORITY' };
        const metaString = ProtocolMetaParser.serialize(meta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should reject transaction if no signature matches authority', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        // Sign with a random keypair not in authorities
        const randomKeypair = Keypair.generate();
        transaction.sign(randomKeypair);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should validate if issuer signature matches meta.iss', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        // Sign with the correct authority (feePayer)
        transaction.feePayer = authority1.publicKey;
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(true);
      });

      it('should reject if issuer signature does not match meta.iss', () => {
        const meta = { ...testMeta, iss: authority2.publicKey.toBase58() };
        const metaString = ProtocolMetaParser.serialize(meta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        // Sign with authority1, but meta.iss is authority2
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should reject if prefix does not match expected', () => {
        const meta = { ...testMeta, prefix: 'OTHER' };
        const metaString = ProtocolMetaParser.serialize(meta);
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.sign(authority1);
        const result = adapter.validate(transaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });
    });

    describe('versioned transactions', () => {
      it('should validate versioned transaction with correct meta and issuer in static keys', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey, // issuer
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.validate(versionedTransaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(true);
      });

      it('should validate versioned transaction from base64 with correct meta and issuer in static keys', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey, // issuer
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serialized = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.validateFromBase64(serialized, mockAuthorities, 'DEFAULT');
        expect(result).toBe(true);
      });

      it('should reject versioned transaction without issuer in static keys', () => {
        const metaString = ProtocolMetaParser.serialize(testMeta);
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            // authority1.publicKey is missing - issuer not present
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 0,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.validate(versionedTransaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });

      it('should reject versioned transaction with wrong issuer', () => {
        const meta = { ...testMeta, iss: 'NOT_AUTHORITY' };
        const metaString = ProtocolMetaParser.serialize(meta);
        const memoInstruction = createMemoInstruction(metaString);
        
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [
            authority1.publicKey, // This is not the issuer in meta
            memoInstruction.programId,
          ],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1,
            accountKeyIndexes: [],
            data: memoInstruction.data,
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.validate(versionedTransaction, mockAuthorities, 'DEFAULT');
        expect(result).toBe(false);
      });
    });
  });

  describe('hasIssuerSignature', () => {
    describe('legacy transactions', () => {
      it('should return true when issuer has signed', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        transaction.sign(authority1);
        
        const result = adapter.hasIssuerSignature(transaction, authority1.publicKey.toBase58());
        expect(result).toBe(true);
      });

      it('should return false when issuer has not signed', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        transaction.sign(authority1);
        
        const result = adapter.hasIssuerSignature(transaction, authority2.publicKey.toBase58());
        expect(result).toBe(false);
      });

      it('should return false for invalid transaction format', () => {
        const invalidTransaction = { invalid: 'format' } as any;
        const result = adapter.hasIssuerSignature(invalidTransaction, authority1.publicKey.toBase58());
        expect(result).toBe(false);
      });
    });

    describe('versioned transactions', () => {
      it('should return true when issuer is in static account keys', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.hasIssuerSignature(versionedTransaction, authority1.publicKey.toBase58());
        expect(result).toBe(true);
      });

      it('should return false when issuer is not in static account keys', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const result = adapter.hasIssuerSignature(versionedTransaction, authority2.publicKey.toBase58());
        expect(result).toBe(false);
      });

      it('should return false for unsupported message version', () => {
        const mockTransaction = {
          message: { version: 'unsupported' },
        } as any;
        
        const result = adapter.hasIssuerSignature(mockTransaction, authority1.publicKey.toBase58());
        expect(result).toBe(false);
      });
    });
  });

  describe('decodeFromBase64', () => {
    it('should return null for invalid base64 string', () => {
      const result = adapter.decodeFromBase64('invalid-base64');
      expect(result).toBeNull();
    });

    it('should return null for invalid transaction data', () => {
      const invalidData = Buffer.from('invalid-transaction-data', 'utf8').toString('base64');
      const result = adapter.decodeFromBase64(invalidData);
      expect(result).toBeNull();
    });
  });

  describe('validateFromBase64', () => {
    it('should return false for invalid base64 string', () => {
      const result = adapter.validateFromBase64('invalid-base64', mockAuthorities, 'DEFAULT');
      expect(result).toBe(false);
    });

    it('should return false for invalid transaction data', () => {
      const invalidData = Buffer.from('invalid-transaction-data', 'utf8').toString('base64');
      const result = adapter.validateFromBase64(invalidData, mockAuthorities, 'DEFAULT');
      expect(result).toBe(false);
    });
  });

  describe('validateTransactionIntegrity', () => {
    it('should return false when decoded meta does not match provided meta', () => {
      const metaString = ProtocolMetaParser.serialize(testMeta);
      const memoInstruction = createMemoInstruction(metaString);
      const transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
      
      // Create different meta for comparison
      const differentMeta = { ...testMeta, prefix: 'DIFFERENT' };
      
      // Mock the decode method to return different meta
      const originalDecode = adapter.decode.bind(adapter);
      adapter.decode = jest.fn().mockReturnValue(differentMeta);
      
      const result = (adapter as any).validateTransactionIntegrity(transaction, testMeta);
      expect(result).toBe(false);
      
      // Restore original method
      adapter.decode = originalDecode;
    });

    it('should return false when decode returns null', () => {
      const transaction = new Transaction();
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
      
      // Mock the decode method to return null
      const originalDecode = adapter.decode.bind(adapter);
      adapter.decode = jest.fn().mockReturnValue(null);
      
      const result = (adapter as any).validateTransactionIntegrity(transaction, testMeta);
      expect(result).toBe(false);
      
      // Restore original method
      adapter.decode = originalDecode;
    });
  });

  describe('decode edge cases', () => {
    it('should return null for transaction with neither message nor instructions', () => {
      const invalidTransaction = {} as any;
      const result = adapter.decode(invalidTransaction);
      expect(result).toBeNull();
    });

    it('should return null for transaction with empty message', () => {
      const invalidTransaction = { message: null } as any;
      const result = adapter.decode(invalidTransaction);
      expect(result).toBeNull();
    });

    it('should return null for transaction with non-array instructions', () => {
      const invalidTransaction = { instructions: 'not-an-array' } as any;
      const result = adapter.decode(invalidTransaction);
      expect(result).toBeNull();
    });
  });

  describe('hasIssuerSignature edge cases', () => {
    it('should return false for transaction with neither message nor signatures', () => {
      const adapter = new SolanaAdapter();
      const transaction = {} as any;
      const result = adapter.hasIssuerSignature(transaction, 'test_issuer');
      expect(result).toBe(false);
    });

    it('should return false for transaction with empty message', () => {
      const adapter = new SolanaAdapter();
      const transaction = { message: null } as any;
      const result = adapter.hasIssuerSignature(transaction, 'test_issuer');
      expect(result).toBe(false);
    });

    it('should return false for transaction with empty signatures array', () => {
      const adapter = new SolanaAdapter();
      const transaction = { signatures: [] } as any;
      const result = adapter.hasIssuerSignature(transaction, 'test_issuer');
      expect(result).toBe(false);
    });

    it('should return false for transaction with invalid structure', () => {
      const adapter = new SolanaAdapter();
      const transaction = { someOtherField: 'value' } as any;
      const result = adapter.hasIssuerSignature(transaction, 'test_issuer');
      expect(result).toBe(false);
    });
  });

  describe('validateTransactionIntegrity edge cases', () => {
    it('should return false when decode returns null', () => {
      const adapter = new SolanaAdapter();
      const transaction = new Transaction();
      
      // Mock decode to return null
      jest.spyOn(adapter, 'decode').mockReturnValue(null);
      
      const meta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'initiator',
        id: 'id',
        iss: 'authority1',
        params: undefined
      };
      
      const result = adapter['validateTransactionIntegrity'](transaction, meta);
      expect(result).toBe(false);
    });

    it('should return false when decoded meta does not match provided meta', () => {
      const adapter = new SolanaAdapter();
      const transaction = new Transaction();
      
      // Mock decode to return different meta
      jest.spyOn(adapter, 'decode').mockReturnValue({
        version: '1',
        prefix: 'DIFFERENT',
        initiator: 'different_initiator',
        id: 'different_id',
        iss: 'different_authority',
        params: undefined
      });
      
      const meta: ProtocolMetaV1 = {
        version: '1',
        prefix: 'DEFAULT',
        initiator: 'initiator',
        id: 'id',
        iss: 'authority1',
        params: undefined
      };
      
      const result = adapter['validateTransactionIntegrity'](transaction, meta);
      expect(result).toBe(false);
    });
  });

  describe('signWithProtocolKey', () => {
    let actionCode: any;
    let keypair: Keypair;
    let transaction: Transaction;

    beforeEach(() => {
      keypair = Keypair.generate();
      
      // Create a valid transaction with protocol meta where issuer matches the keypair
      const metaWithMatchingIssuer = {
        ...testMeta,
        iss: keypair.publicKey.toBase58()
      };
      const metaString = ProtocolMetaParser.serialize(metaWithMatchingIssuer);
      const memoInstruction = createMemoInstruction(metaString);
      transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
      transaction.feePayer = keypair.publicKey;

      // Create action code with transaction
      actionCode = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: keypair.publicKey.toBase58(),
        timestamp: Date.now(),
        signature: 'test-signature',
        chain: 'solana',
        transaction: {
          transaction: Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64')
        },
        expiresAt: Date.now() + 300000, // 5 minutes from now
        status: 'pending' as const
      };
    });

    it('should successfully sign a valid action code with protocol key', async () => {
      const result = await adapter.signWithProtocolKey(actionCode, keypair);
      
      expect(result).toBeDefined();
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.transaction).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(actionCode.transaction.transaction);
      
      // Verify the transaction was actually signed
      const signedTx = Transaction.from(Buffer.from(result.transaction!.transaction!, 'base64'));
      expect(signedTx.signatures.length).toBeGreaterThan(0);
    });

    it('should throw error when action code has no transaction', async () => {
      const actionCodeWithoutTx = { ...actionCode, transaction: undefined };
      
      await expect(adapter.signWithProtocolKey(actionCodeWithoutTx, keypair))
        .rejects.toThrow('No transaction found');
    });

    it('should throw error when action code transaction is missing transaction data', async () => {
      const actionCodeWithInvalidTx = { 
        ...actionCode, 
        transaction: { transaction: undefined } 
      };
      
      await expect(adapter.signWithProtocolKey(actionCodeWithInvalidTx, keypair))
        .rejects.toThrow('No transaction found');
    });

    it('should throw error when transaction has no protocol meta', async () => {
      // Create transaction without memo instruction
      const txWithoutMeta = new Transaction();
      txWithoutMeta.recentBlockhash = Keypair.generate().publicKey.toBase58();
      txWithoutMeta.feePayer = keypair.publicKey;
      
      const actionCodeWithoutMeta = {
        ...actionCode,
        transaction: {
          transaction: Buffer.from(txWithoutMeta.serialize({ requireAllSignatures: false })).toString('base64')
        }
      };
      
      await expect(adapter.signWithProtocolKey(actionCodeWithoutMeta, keypair))
        .rejects.toThrow('Invalid transaction, protocol meta not found');
    });

    it('should throw error when transaction integrity validation fails', async () => {
      // Mock validateTransactionIntegrity to return false
      jest.spyOn(adapter as any, 'validateTransactionIntegrity').mockReturnValue(false);
      
      await expect(adapter.signWithProtocolKey(actionCode, keypair))
        .rejects.toThrow('Invalid transaction, transaction integrity not valid');
      
      // Restore original method
      jest.restoreAllMocks();
    });

    it('should preserve all action code fields except transaction', async () => {
      const result = await adapter.signWithProtocolKey(actionCode, keypair);
      
      // Check that all original fields are preserved
      expect(result.code).toBe(actionCode.code);
      expect(result.prefix).toBe(actionCode.prefix);
      expect(result.pubkey).toBe(actionCode.pubkey);
      expect(result.timestamp).toBe(actionCode.timestamp);
      expect(result.signature).toBe(actionCode.signature);
      expect(result.chain).toBe(actionCode.chain);
      expect(result.status).toBe(actionCode.status);
      
      // Only transaction should be different
      expect(result.transaction?.transaction).not.toBe(actionCode.transaction.transaction);
    });

    it('should handle invalid base64 transaction data', async () => {
      const actionCodeWithInvalidBase64 = {
        ...actionCode,
        transaction: {
          transaction: 'invalid-base64-data'
        }
      };
      
      await expect(adapter.signWithProtocolKey(actionCodeWithInvalidBase64, keypair))
        .rejects.toThrow('Failed to sign transaction with protocol key');
    });

    it('should handle corrupted transaction data', async () => {
      const actionCodeWithCorruptedTx = {
        ...actionCode,
        transaction: {
          transaction: Buffer.from('corrupted-transaction-data').toString('base64')
        }
      };
      
      await expect(adapter.signWithProtocolKey(actionCodeWithCorruptedTx, keypair))
        .rejects.toThrow('Failed to sign transaction with protocol key');
    });

    it('should work with different keypairs', async () => {
      const differentKeypair = Keypair.generate();
      
      // Create a new transaction with the different keypair as fee payer and issuer
      const metaWithDifferentIssuer = {
        ...testMeta,
        iss: differentKeypair.publicKey.toBase58()
      };
      const metaString = ProtocolMetaParser.serialize(metaWithDifferentIssuer);
      const memoInstruction = createMemoInstruction(metaString);
      const newTransaction = new Transaction();
      newTransaction.add(memoInstruction);
      newTransaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
      newTransaction.feePayer = differentKeypair.publicKey;
      
      const updatedActionCode = {
        ...actionCode,
        transaction: {
          transaction: Buffer.from(newTransaction.serialize({ requireAllSignatures: false })).toString('base64')
        }
      };
      
      const result = await adapter.signWithProtocolKey(updatedActionCode, differentKeypair);
      
      expect(result).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(updatedActionCode.transaction.transaction);
    });

    it('should handle transactions with multiple instructions', async () => {
      // Create transaction with multiple instructions
      const metaWithMatchingIssuer = {
        ...testMeta,
        iss: keypair.publicKey.toBase58()
      };
      const multiInstructionTx = new Transaction();
      multiInstructionTx.add(createMemoInstruction(ProtocolMetaParser.serialize(metaWithMatchingIssuer)));
      multiInstructionTx.add(createMemoInstruction('Additional instruction'));
      multiInstructionTx.recentBlockhash = Keypair.generate().publicKey.toBase58();
      multiInstructionTx.feePayer = keypair.publicKey;
      
      const actionCodeWithMultiTx = {
        ...actionCode,
        transaction: {
          transaction: Buffer.from(multiInstructionTx.serialize({ requireAllSignatures: false })).toString('base64')
        }
      };
      
      const result = await adapter.signWithProtocolKey(actionCodeWithMultiTx, keypair);
      
      expect(result).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(actionCodeWithMultiTx.transaction.transaction);
    });

    it('should maintain transaction structure after signing', async () => {
      const result = await adapter.signWithProtocolKey(actionCode, keypair);
      
      // Verify the signed transaction can be deserialized
      const signedTx = Transaction.from(Buffer.from(result.transaction?.transaction!, 'base64'));
      
      // Verify it still has the memo instruction
      const hasMemoInstruction = signedTx.instructions.some(instruction => 
        instruction.programId.equals(MEMO_PROGRAM_ID)
      );
      expect(hasMemoInstruction).toBe(true);
      
      // Verify it has signatures
      expect(signedTx.signatures.length).toBeGreaterThan(0);
    });
  });
}); 