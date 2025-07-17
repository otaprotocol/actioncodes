import { Transaction, Keypair, VersionedTransaction, MessageV0 } from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { SolanaAdapter } from './solana';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { PROTOCOL_PREFIX } from '../../constants';

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
        
        const serialized = btoa(String.fromCharCode(...transaction.serialize({ requireAllSignatures: false })));
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
        const serialized = btoa(String.fromCharCode(...versionedTransaction.serialize()));
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
        
        const serialized = btoa(String.fromCharCode(...transaction.serialize({ requireAllSignatures: false })));
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
        const serialized = btoa(String.fromCharCode(...versionedTransaction.serialize()));
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
}); 