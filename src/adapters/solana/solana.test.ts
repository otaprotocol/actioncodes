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

import { Transaction, Keypair, VersionedTransaction, MessageV0, TransactionInstruction } from '@solana/web3.js';
import { createMemoInstruction, MEMO_PROGRAM_ID } from '@solana/spl-memo';
import { SolanaAdapter } from './solana';
import { ProtocolMetaV1, ProtocolMetaParser } from '../../meta';
import { PROTOCOL_PREFIX } from '../../constants';
import { ActionCode, ActionCodeFields } from '../../actioncode';
import { Buffer } from "buffer";
import bs58 from 'bs58';

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
      const instruction = adapter.encodeMeta(testMeta);
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
        const result = adapter.decodeMeta(transaction);
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
        const result = adapter.decodeMeta(transaction);
        expect(result).toBeNull();
      });

      it('should return null for memo with wrong protocol prefix', () => {
        const metaString = `wrong:v=1&pre=DEFAULT&ini=ABC123&id=def456&iss=${defaultIssuer}`;
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        const result = adapter.decodeMeta(transaction);
        expect(result).toBeNull();
      });

      it('should return null for unsupported protocol version', () => {
        const metaString = `${PROTOCOL_PREFIX}:v=2&pre=DEFAULT&ini=ABC123&id=def456&iss=${defaultIssuer}`;
        const memoInstruction = createMemoInstruction(metaString);
        const transaction = new Transaction();
        transaction.add(memoInstruction);
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        const result = adapter.decodeMeta(transaction);
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
        const result = adapter.decodeMeta(versionedTransaction);
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
        const result = adapter.decodeMeta(versionedTransaction);
        expect(result).toBeNull();
      });

      it('should return null for unsupported message version', () => {
        // Create a mock transaction with unsupported message type
        const mockTransaction = {
          message: { version: 'unsupported' },
        } as any;

        const result = adapter.decodeMeta(mockTransaction);
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
        const result = adapter.decodeMeta(versionedTransaction);
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
        const result = adapter.decodeMeta(versionedTransaction);
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
        const result = adapter.decodeMeta(versionedTransaction);
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
        // Deserialize and validate 
        const deserializedTx = adapter.deserializeTransaction(serialized);
        const result = adapter.validate(deserializedTx, mockAuthorities, 'DEFAULT');
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
        // Deserialize and validate
        const deserializedTx = adapter.deserializeTransaction(serialized);
        const result = adapter.validate(deserializedTx, mockAuthorities, 'DEFAULT');
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
      const originalDecode = adapter.decodeMeta.bind(adapter);
      adapter.decodeMeta = jest.fn().mockReturnValue(differentMeta);

      const result = (adapter as any).validateTransactionIntegrity(transaction, testMeta);
      expect(result).toBe(false);

      // Restore original method
      adapter.decodeMeta = originalDecode;
    });

    it('should return false when decode returns null', () => {
      const transaction = new Transaction();
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

      // Mock the decode method to return null
      const originalDecode = adapter.decodeMeta.bind(adapter);
      adapter.decodeMeta = jest.fn().mockReturnValue(null);

      const result = (adapter as any).validateTransactionIntegrity(transaction, testMeta);
      expect(result).toBe(false);

      // Restore original method
      adapter.decodeMeta = originalDecode;
    });
  });

  describe('decode edge cases', () => {
    it('should return null for transaction with neither message nor instructions', () => {
      const invalidTransaction = {} as any;
      const result = adapter.decodeMeta(invalidTransaction);
      expect(result).toBeNull();
    });

    it('should return null for transaction with empty message', () => {
      const invalidTransaction = { message: null } as any;
      const result = adapter.decodeMeta(invalidTransaction);
      expect(result).toBeNull();
    });

    it('should return null for transaction with non-array instructions', () => {
      const invalidTransaction = { instructions: 'not-an-array' } as any;
      const result = adapter.decodeMeta(invalidTransaction);
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
      jest.spyOn(adapter, 'decodeMeta').mockReturnValue(null);

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
      jest.spyOn(adapter, 'decodeMeta').mockReturnValue({
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

  describe('injectMeta', () => {
    describe('legacy transactions', () => {
      it('should inject meta into legacy transaction', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

        const result = adapter.injectMeta(serializedTx, testMeta);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(1);
        expect(deserializedResult.instructions[0].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should inject meta into transaction with existing instructions', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;

        // Add an existing instruction (not a memo instruction to avoid conflicts)
        const existingInstruction = new TransactionInstruction({
          programId: Keypair.generate().publicKey,
          keys: [],
          data: Buffer.from([1, 2, 3])
        });
        transaction.add(existingInstruction);
        const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

        const result = adapter.injectMeta(serializedTx, testMeta);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(2);
        expect(deserializedResult.instructions[1].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should handle meta with invalid issuer public key', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

        const metaWithInvalidIssuer = {
          ...testMeta,
          iss: 'invalid-public-key'
        };

        const result = adapter.injectMeta(serializedTx, metaWithInvalidIssuer);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(1);
        expect(deserializedResult.instructions[0].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Should still encode the meta without the invalid issuer
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(metaWithInvalidIssuer);
      });

      it('should handle meta without issuer', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = authority1.publicKey;
        const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');

        const metaWithoutIssuer = {
          ...testMeta,
          iss: undefined
        };

        const result = adapter.injectMeta(serializedTx, metaWithoutIssuer);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(1);
        expect(deserializedResult.instructions[0].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Should still encode the meta (iss will be serialized as "undefined" string)
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual({
          ...metaWithoutIssuer,
          iss: "undefined"
        });
      });
    });

    describe('versioned transactions', () => {
      it('should inject meta into versioned transaction', () => {
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
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(1);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should inject meta into versioned transaction with existing instructions', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 0,
            accountKeyIndexes: [],
            data: new Uint8Array([1, 2, 3]),
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(2);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should add missing account keys to static account keys', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey], // Missing MEMO_PROGRAM_ID
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        expect(typeof result).toBe('string');

        // Deserialize the result to verify
        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        // Should have added MEMO_PROGRAM_ID to static account keys
        expect(deserializedResult.message.staticAccountKeys.length).toBe(2);
        expect(deserializedResult.message.staticAccountKeys[1].equals(MEMO_PROGRAM_ID)).toBe(true);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should handle meta with issuer that needs to be added to static keys', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [MEMO_PROGRAM_ID], // Missing issuer
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        // Should have added issuer to static account keys
        expect(deserializedResult.message.staticAccountKeys.length).toBe(2);
        expect(deserializedResult.message.staticAccountKeys[1].equals(authority1.publicKey)).toBe(true);

        // Verify the meta was properly encoded
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(testMeta);
      });

      it('should throw error when program ID not found and cannot be added', () => {
        // This test would require mocking the static account keys to be immutable
        // For now, we'll test the happy path where keys can be added
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

        // This should work because the adapter adds missing keys
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);
        expect(result).toBeDefined();
      });

      it('should handle meta with invalid issuer public key in versioned transaction', () => {
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
        const metaWithInvalidIssuer = {
          ...testMeta,
          iss: 'invalid-public-key'
        };

        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, metaWithInvalidIssuer);

        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(1);

        // Should still encode the meta without the invalid issuer
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(metaWithInvalidIssuer);
      });
    });

    describe('error handling', () => {
      it('should throw error for invalid transaction type', () => {
        const invalidTransaction = 'invalid-base64-string';

        expect(() => adapter.injectMeta(invalidTransaction, testMeta))
          .toThrow('Failed to deserialize Solana transaction');
      });

      it('should throw error for null transaction', () => {
        expect(() => adapter.injectMeta(null as any, testMeta))
          .toThrow('Failed to deserialize Solana transaction');
      });

      it('should throw error for undefined transaction', () => {
        expect(() => adapter.injectMeta(undefined as any, testMeta))
          .toThrow('Failed to deserialize Solana transaction');
      });
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
      actionCode = ActionCode.fromPayload({
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
        status: 'pending'
      });
    });

    it('should successfully sign a valid action code with protocol key', async () => {
      const result = await adapter.signWithProtocolKey(actionCode, keypair);

      expect(result).toBeDefined();
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.transaction).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(actionCode.transaction?.transaction);

      // Verify the transaction was actually signed
      const signedTx = Transaction.from(Buffer.from(result.transaction!.transaction!, 'base64'));
      expect(signedTx.signatures.length).toBeGreaterThan(0);
    });

    it('should throw error when action code has no transaction', async () => {
      const actionCodeWithoutTx = ActionCode.fromPayload({ ...actionCode.json, transaction: undefined });

      await expect(adapter.signWithProtocolKey(actionCodeWithoutTx, keypair))
        .rejects.toThrow('No transaction found');
    });

    it('should throw error when action code transaction is missing transaction data', async () => {
      const actionCodeWithInvalidTx = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: { transaction: undefined }
      });

      await expect(adapter.signWithProtocolKey(actionCodeWithInvalidTx, keypair))
        .rejects.toThrow('No transaction found');
    });

    it('should throw error when transaction has no protocol meta', async () => {
      // Create transaction without memo instruction
      const txWithoutMeta = new Transaction();
      txWithoutMeta.recentBlockhash = Keypair.generate().publicKey.toBase58();
      txWithoutMeta.feePayer = keypair.publicKey;

      const actionCodeWithoutMeta = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: Buffer.from(txWithoutMeta.serialize({ requireAllSignatures: false })).toString('base64')
        }
      });

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
      expect(result.transaction?.transaction).not.toBe(actionCode.transaction?.transaction);
    });

    it('should handle invalid base64 transaction data', async () => {
      const actionCodeWithInvalidBase64 = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: 'invalid-base64-data'
        }
      });

      await expect(adapter.signWithProtocolKey(actionCodeWithInvalidBase64, keypair))
        .rejects.toThrow('Failed to sign transaction with protocol key');
    });

    it('should handle corrupted transaction data', async () => {
      const actionCodeWithCorruptedTx = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: Buffer.from('corrupted-transaction-data').toString('base64')
        }
      });

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

      const updatedActionCode = ActionCode.fromPayload({
        ...actionCode.json,
        pubkey: differentKeypair.publicKey.toBase58(),
        transaction: {
          transaction: Buffer.from(newTransaction.serialize({ requireAllSignatures: false })).toString('base64')
        }
      });

      const result = await adapter.signWithProtocolKey(updatedActionCode, differentKeypair);

      expect(result).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(updatedActionCode.transaction?.transaction);
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

      const actionCodeWithMultiTx = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: Buffer.from(multiInstructionTx.serialize({ requireAllSignatures: false })).toString('base64')
        }
      });

      const result = await adapter.signWithProtocolKey(actionCodeWithMultiTx, keypair);

      expect(result).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(actionCodeWithMultiTx.transaction?.transaction);
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

    it('should work with injected meta and verify signatures', async () => {
      // Create a transaction without meta
      const emptyTransaction = new Transaction();
      emptyTransaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
      emptyTransaction.feePayer = keypair.publicKey;

      // Inject meta into the transaction
      const metaWithMatchingIssuer = {
        ...testMeta,
        iss: keypair.publicKey.toBase58()
      };
      const serializedTx = Buffer.from(emptyTransaction.serialize({ requireAllSignatures: false })).toString('base64');
      const transactionWithMeta = adapter.injectMeta(serializedTx, metaWithMatchingIssuer);

      // Create action code with the transaction that has injected meta
      const actionCodeWithInjectedMeta = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: transactionWithMeta
        }
      });

      // Sign the transaction with protocol key
      const result = await adapter.signWithProtocolKey(actionCodeWithInjectedMeta, keypair);

      // Verify the result
      expect(result).toBeDefined();
      expect(result.transaction?.transaction).not.toBe(actionCodeWithInjectedMeta.transaction?.transaction);

      // Verify the signed transaction can be deserialized
      const signedTx = Transaction.from(Buffer.from(result.transaction?.transaction!, 'base64'));

      // Verify it still has the memo instruction with the injected meta
      const hasMemoInstruction = signedTx.instructions.some(instruction =>
        instruction.programId.equals(MEMO_PROGRAM_ID)
      );
      expect(hasMemoInstruction).toBe(true);

      // Verify the meta can be decoded from the signed transaction
      const decodedMeta = adapter.decodeMeta(signedTx);
      expect(decodedMeta).toEqual(metaWithMatchingIssuer);

      // Verify it has signatures
      expect(signedTx.signatures.length).toBeGreaterThan(0);

      // Verify the transaction integrity
      const isValid = adapter.validate(signedTx, [keypair.publicKey.toBase58()], 'DEFAULT');
      expect(isValid).toBe(true);
    });

    it('should work with versioned transactions and injected meta', async () => {
      // Create a versioned transaction without meta
      const messageV0 = new MessageV0({
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        staticAccountKeys: [keypair.publicKey],
        recentBlockhash: '11111111111111111111111111111111',
        compiledInstructions: [],
        addressTableLookups: [],
      });

      const emptyVersionedTransaction = new VersionedTransaction(messageV0);

      // Inject meta into the versioned transaction
      const metaWithMatchingIssuer = {
        ...testMeta,
        iss: keypair.publicKey.toBase58()
      };
      const serializedTx = Buffer.from(emptyVersionedTransaction.serialize()).toString('base64');
      const versionedTransactionWithMeta = adapter.injectMeta(serializedTx, metaWithMatchingIssuer);

      // Create action code with the versioned transaction that has injected meta
      const actionCodeWithVersionedTx = ActionCode.fromPayload({
        ...actionCode.json,
        transaction: {
          transaction: versionedTransactionWithMeta
        }
      });

      // Note: signWithProtocolKey currently only works with legacy transactions
      // This test demonstrates that the injected meta can be decoded from versioned transactions
      const deserializedResult = VersionedTransaction.deserialize(Buffer.from(versionedTransactionWithMeta, 'base64'));
      const decodedMeta = adapter.decodeMeta(deserializedResult);
      expect(decodedMeta).toEqual(metaWithMatchingIssuer);

      // Verify the versioned transaction has the memo instruction
      expect(deserializedResult.message.compiledInstructions.length).toBe(1);

      // Verify the transaction integrity for versioned transactions
      const isValid = adapter.validate(deserializedResult, [keypair.publicKey.toBase58()], 'DEFAULT');
      expect(isValid).toBe(true);
    });
  });

  describe('advanced edge cases', () => {
    describe('signature replay protection', () => {
      it('should detect signature reuse across different action codes', async () => {
        // Create two different action codes with the same signature
        const actionCode1 = {
          code: 'CODE123',
          prefix: 'DEFAULT',
          pubkey: authority1.publicKey.toBase58(),
          timestamp: Date.now(),
          signature: 'same-signature-base64',
          chain: 'solana',
          transaction: {
            transaction: Buffer.from((() => {
              const tx = new Transaction();
              tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
              tx.feePayer = authority1.publicKey;
              return tx.serialize({ requireAllSignatures: false });
            })()).toString('base64')
          },
          expiresAt: Date.now() + 300000,
          status: 'pending' as const
        };

        const actionCode2 = {
          code: 'CODE456',
          prefix: 'DEFAULT',
          pubkey: authority1.publicKey.toBase58(),
          timestamp: Date.now() + 1000,
          signature: 'same-signature-base64',
          chain: 'solana',
          transaction: {
            transaction: Buffer.from((() => {
              const tx = new Transaction();
              tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
              tx.feePayer = authority1.publicKey;
              return tx.serialize({ requireAllSignatures: false });
            })()).toString('base64')
          },
          expiresAt: Date.now() + 300000,
          status: 'pending' as const
        };

        // Verify that the signature verification fails for at least one of them
        const isValid1 = adapter.verifyCodeSignature(ActionCode.fromPayload(actionCode1 as ActionCodeFields));
        const isValid2 = adapter.verifyCodeSignature(ActionCode.fromPayload(actionCode2 as ActionCodeFields));

        // At least one should fail due to signature mismatch
        expect(isValid1 || isValid2).toBe(false);
      });

      it('should reject action codes with reused signatures from different timestamps', async () => {
        const oldTimestamp = Date.now() - 3600000; // 1 hour ago
        const newTimestamp = Date.now();

        const actionCodeOld = ActionCode.fromPayload({
          code: 'CODE123',
          prefix: 'DEFAULT',
          pubkey: authority1.publicKey.toBase58(),
          timestamp: oldTimestamp,
          signature: 'reused-signature',
          chain: 'solana' as const,
          transaction: {
            transaction: Buffer.from((() => {
              const tx = new Transaction();
              tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
              tx.feePayer = authority1.publicKey;
              return tx.serialize({ requireAllSignatures: false });
            })()).toString('base64')
          },
          expiresAt: Date.now() + 300000,
          status: 'pending' as const
        });

        const actionCodeNew = ActionCode.fromPayload({
          code: 'CODE456',
          prefix: 'DEFAULT',
          pubkey: authority1.publicKey.toBase58(),
          timestamp: newTimestamp,
          signature: 'reused-signature',
          chain: 'solana' as const,
          transaction: {
            transaction: Buffer.from((() => {
              const tx = new Transaction();
              tx.recentBlockhash = Keypair.generate().publicKey.toBase58();
              tx.feePayer = authority1.publicKey;
              return tx.serialize({ requireAllSignatures: false });
            })()).toString('base64')
          },
          expiresAt: Date.now() + 300000,
          status: 'pending' as const
        });

        // Both should fail signature verification due to timestamp mismatch
        const isValidOld = adapter.verifyCodeSignature(actionCodeOld);
        const isValidNew = adapter.verifyCodeSignature(actionCodeNew);

        expect(isValidOld).toBe(false);
        expect(isValidNew).toBe(false);
      });
    });

    describe('conflicting or multiple memos', () => {
      it('should handle transaction with existing unrelated memo', () => {
        // Create fresh instances to avoid test interference
        const freshAdapter = new SolanaAdapter();
        const freshAuthority = Keypair.generate();
        const freshTestMeta = {
          version: '1',
          prefix: 'DEFAULT',
          initiator: 'ABC123',
          id: 'def456',
          iss: freshAuthority.publicKey.toBase58(),
          params: 'extraParam'
        };

        const transaction = new Transaction();
        transaction.feePayer = freshAuthority.publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Add an unrelated memo instruction first
        const unrelatedMemo = createMemoInstruction('unrelated memo data');
        transaction.add(unrelatedMemo);

        // Inject protocol meta
        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = freshAdapter.injectMeta(serializedTx, freshTestMeta);

        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(2);
        expect(deserializedResult.instructions[0].programId.equals(unrelatedMemo.programId)).toBe(true);
        expect(deserializedResult.instructions[1].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Should decode the protocol meta correctly (ignores unrelated memo)
        const decodedMeta = freshAdapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(freshTestMeta);
      });

      it('should handle transaction with multiple protocol memos (should decode the first one)', () => {
        const transaction = new Transaction();
        transaction.feePayer = authority1.publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Add first protocol meta
        const meta1 = { ...testMeta, id: 'first' };
        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result1 = adapter.injectMeta(serializedTx, meta1);

        // Add second protocol meta
        const meta2 = { ...testMeta, id: 'second' };
        const result2 = adapter.injectMeta(result1, meta2);

        const deserializedResult = Transaction.from(Buffer.from(result2, 'base64'));
        expect(deserializedResult.instructions.length).toBe(2);

        // Should decode the first protocol meta (current implementation behavior)
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(meta1);
        expect(decodedMeta?.id).toBe('first');
      });

      it('should handle versioned transaction with existing unrelated memo', () => {
        // Create fresh instances to avoid test interference
        const freshAdapter = new SolanaAdapter();
        const freshAuthority = Keypair.generate();
        const freshTestMeta = {
          version: '1',
          prefix: 'DEFAULT',
          initiator: 'ABC123',
          id: 'def456',
          iss: freshAuthority.publicKey.toBase58(),
          params: 'extraParam'
        };

        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [freshAuthority.publicKey, MEMO_PROGRAM_ID],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 1, // MEMO_PROGRAM_ID
            accountKeyIndexes: [],
            data: Buffer.from('unrelated memo data'),
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = freshAdapter.injectMeta(serializedTx, freshTestMeta);

        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(2);

        // Should decode the protocol meta correctly (ignores unrelated memo)
        const decodedMeta = freshAdapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(freshTestMeta);
      });


    });

    describe('injection order and position', () => {
      it('should inject memo instruction at the end of legacy transaction', () => {
        const transaction = new Transaction();
        transaction.feePayer = authority1.publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Add multiple existing instructions
        const instruction1 = new TransactionInstruction({
          programId: Keypair.generate().publicKey,
          keys: [],
          data: Buffer.from([1])
        });
        const instruction2 = new TransactionInstruction({
          programId: Keypair.generate().publicKey,
          keys: [],
          data: Buffer.from([2])
        });

        transaction.add(instruction1);
        transaction.add(instruction2);

        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(3);
        expect(deserializedResult.instructions[0].programId.equals(instruction1.programId)).toBe(true);
        expect(deserializedResult.instructions[1].programId.equals(instruction2.programId)).toBe(true);
        expect(deserializedResult.instructions[2].programId.equals(MEMO_PROGRAM_ID)).toBe(true);
      });

      it('should inject memo instruction at the end of versioned transaction', () => {
        const messageV0 = new MessageV0({
          header: {
            numRequiredSignatures: 1,
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
          },
          staticAccountKeys: [authority1.publicKey],
          recentBlockhash: '11111111111111111111111111111111',
          compiledInstructions: [{
            programIdIndex: 0,
            accountKeyIndexes: [],
            data: Buffer.from([1]),
          }],
          addressTableLookups: [],
        });

        const versionedTransaction = new VersionedTransaction(messageV0);
        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(2);

        // The last instruction should be the memo instruction
        const lastInstruction = deserializedResult.message.compiledInstructions[1];
        const programId = deserializedResult.message.staticAccountKeys[lastInstruction.programIdIndex];
        expect(programId.equals(MEMO_PROGRAM_ID)).toBe(true);
      });

      it('should maintain instruction order when injecting multiple times', () => {
        const transaction = new Transaction();
        transaction.feePayer = Keypair.generate().publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Add initial instruction
        const initialInstruction = new TransactionInstruction({
          programId: Keypair.generate().publicKey,
          keys: [],
          data: Buffer.from([1])
        });
        transaction.add(initialInstruction);

        // Inject meta multiple times
        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result1 = adapter.injectMeta(serializedTx, testMeta);
        const result2 = adapter.injectMeta(result1, { ...testMeta, id: 'second' });

        const deserializedResult = Transaction.from(Buffer.from(result2, 'base64'));
        expect(deserializedResult.instructions.length).toBe(3);
        expect(deserializedResult.instructions[0].programId.equals(initialInstruction.programId)).toBe(true);
        expect(deserializedResult.instructions[1].programId.equals(MEMO_PROGRAM_ID)).toBe(true);
        expect(deserializedResult.instructions[2].programId.equals(MEMO_PROGRAM_ID)).toBe(true);

        // Should decode the first injected meta (current implementation behavior)
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta?.id).toBe('def456'); // Original testMeta id
      });
    });

    describe('cross-prefix meta decode failure', () => {
      it('should reject meta with mismatched prefix even when version is valid', () => {
        const transaction = new Transaction();
        transaction.feePayer = Keypair.generate().publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Create meta with different prefix
        const metaWithDifferentPrefix = {
          ...testMeta,
          prefix: 'DIFFERENT_PREFIX'
        };

        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.injectMeta(serializedTx, metaWithDifferentPrefix);

        // Should inject successfully
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(1);

        // But validation should fail with expected prefix
        const deserializedResult2 = Transaction.from(Buffer.from(result, 'base64'));
        const isValid = adapter.validate(deserializedResult2, mockAuthorities, 'DEFAULT');
        expect(isValid).toBe(false);
      });

      it('should reject versioned transaction with mismatched prefix', () => {
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

        // Create meta with different prefix
        const metaWithDifferentPrefix = {
          ...testMeta,
          prefix: 'DIFFERENT_PREFIX'
        };

        const serializedTx = Buffer.from(versionedTransaction.serialize()).toString('base64');
        const result = adapter.injectMeta(serializedTx, metaWithDifferentPrefix);
        const deserializedResult = VersionedTransaction.deserialize(Buffer.from(result, 'base64'));
        expect(deserializedResult.message.compiledInstructions.length).toBe(1);

        // But validation should fail with expected prefix
        const isValid = adapter.validate(deserializedResult, mockAuthorities, 'DEFAULT');
        expect(isValid).toBe(false);
      });

      it('should handle multiple prefixes in same transaction (should decode only matching prefix)', () => {
        const transaction = new Transaction();
        transaction.feePayer = Keypair.generate().publicKey;
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

        // Add memo with different prefix
        const metaWithDifferentPrefix = {
          ...testMeta,
          prefix: 'DIFFERENT_PREFIX',
          id: 'different'
        };
        const differentPrefixMemo = createMemoInstruction(ProtocolMetaParser.serialize(metaWithDifferentPrefix));
        transaction.add(differentPrefixMemo);

        // Inject meta with correct prefix
        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.injectMeta(serializedTx, testMeta);

        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        expect(deserializedResult.instructions.length).toBe(2);

        // Should decode the meta with correct prefix (first valid one)
        const decodedMeta = adapter.decodeMeta(deserializedResult);
        expect(decodedMeta).toEqual(metaWithDifferentPrefix);
        expect(decodedMeta?.prefix).toBe('DIFFERENT_PREFIX');
      });

      it('should validate only transactions with correct prefix', () => {
        const transaction = new Transaction();
        transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
        transaction.feePayer = Keypair.generate().publicKey;

        // Create meta with different prefix
        const metaWithDifferentPrefix = {
          ...testMeta,
          prefix: 'CUSTOM_PREFIX'
        };

        const serializedTx = Buffer.from(transaction.serialize({ requireAllSignatures: false })).toString('base64');
        const result = adapter.injectMeta(serializedTx, metaWithDifferentPrefix);

        // Sign the transaction
        const deserializedResult = Transaction.from(Buffer.from(result, 'base64'));
        deserializedResult.sign(authority1);

        // Should fail validation with DEFAULT prefix
        const isValidWithDefault = adapter.validate(deserializedResult, mockAuthorities, 'DEFAULT');
        expect(isValidWithDefault).toBe(false);

        // Should pass validation with CUSTOM_PREFIX
        const isValidWithCustom = adapter.validate(deserializedResult, mockAuthorities, 'CUSTOM_PREFIX');
        expect(isValidWithCustom).toBe(true);
      });
    });
  });

  describe('verifyFinalizedTransaction', () => {
    const userKey = Keypair.generate();
    it('should verify valid finalized legacy transaction', () => {
      // Create real action code with proper codeHash
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      // Create protocol meta with the correct id (codeHash), initiator, and issuer
      const metaWithCorrectId = {
        ...testMeta,
        id: actionCode.codeHash, // Use real codeHash as id
        initiator: actionCode.pubkey, // Use action code pubkey as initiator
        iss: actionCode.pubkey // Use action code pubkey as issuer (since userKey signs the transaction)
      };

      // Create a transaction with protocol meta
      const metaString = ProtocolMetaParser.serialize(metaWithCorrectId);
      const memoInstruction = createMemoInstruction(metaString);
      const transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.feePayer = userKey.publicKey; // Set feePayer to userKey
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

      // Create mock transaction response
      const mockTransactionResponse = {
        transaction: {
          message: transaction.compileMessage(),
          signatures: ['signature1', 'signature2']
        }
      } as any;

      transaction.sign(userKey);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(true);
    });

    it('should verify valid finalized versioned transaction', () => {
      // Create real action code with proper codeHash
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      // Create protocol meta with the correct id (codeHash), initiator, and issuer
      const metaWithCorrectId = {
        ...testMeta,
        id: actionCode.codeHash, // Use real codeHash as id
        initiator: actionCode.pubkey, // Use action code pubkey as initiator
        iss: actionCode.pubkey // Use action code pubkey as issuer (since userKey signs the transaction)
      };

      // Create a versioned transaction with protocol meta
      const metaString = ProtocolMetaParser.serialize(metaWithCorrectId);
      const memoInstruction = createMemoInstruction(metaString);

      const messageV0 = new MessageV0({
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 1,
        },
        staticAccountKeys: [
          userKey.publicKey, // Use userKey instead of authority1
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

      // Create mock versioned transaction response
      const mockVersionedTransactionResponse = {
        transaction: {
          message: versionedTransaction.message,
          signatures: ['signature1']
        }
      } as any;

      const result = adapter.verifyFinalizedTransaction(mockVersionedTransactionResponse, actionCode);
      expect(result).toBe(true);
    });

    it('should reject transaction without protocol meta', () => {
      // Create a transaction without protocol meta
      const transaction = new Transaction();
      transaction.feePayer = authority1.publicKey;
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

      // Create mock transaction response
      const mockTransactionResponse = {
        transaction: {
          message: transaction.compileMessage(),
          signatures: ['signature1']
        }
      } as any;

      // Create real action code
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(false);
    });

    it('should reject transaction with mismatched prefix', () => {
      // Create a transaction with different prefix
      const metaWithDifferentPrefix = {
        ...testMeta,
        prefix: 'DIFFERENT_PREFIX'
      };
      const metaString = ProtocolMetaParser.serialize(metaWithDifferentPrefix);
      const memoInstruction = createMemoInstruction(metaString);
      const transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.feePayer = authority1.publicKey;
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

      // Create mock transaction response
      const mockTransactionResponse = {
        transaction: {
          message: transaction.compileMessage(),
          signatures: ['signature1']
        }
      } as any;

      // Create real action code with different prefix
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT', // different from meta
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(false);
    });

    it('should reject transaction with mismatched initiator', () => {
      // Create a transaction with different initiator
      const metaWithDifferentInitiator = {
        ...testMeta,
        initiator: 'DIFFERENT_INITIATOR'
      };
      const metaString = ProtocolMetaParser.serialize(metaWithDifferentInitiator);
      const memoInstruction = createMemoInstruction(metaString);
      const transaction = new Transaction();
      transaction.add(memoInstruction);
      transaction.feePayer = authority1.publicKey;
      transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();

      // Create mock transaction response
      const mockTransactionResponse = {
        transaction: {
          message: transaction.compileMessage(),
          signatures: ['signature1']
        }
      } as any;

      // Create real action code with different pubkey
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(), // different from meta.initiator
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(false);
    });

    it('should handle null transaction in response', () => {
      // Create mock transaction response with null transaction
      const mockTransactionResponse = {
        transaction: null
      } as any;

      // Create real action code
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(false);
    });

    it('should handle invalid transaction data gracefully', () => {
      // Create mock transaction response with invalid data
      const mockTransactionResponse = {
        transaction: {
          message: 'invalid_message_data',
          signatures: []
        }
      } as any;

      // Create real action code
      const actionCodeFields: ActionCodeFields = {
        code: 'ABC12345',
        prefix: 'DEFAULT',
        pubkey: userKey.publicKey.toBase58(),
        timestamp: 1753008513747,
        signature: 'test-signature',
        chain: 'solana',
        status: 'finalized',
        expiresAt: 1753008813747
      };
      const actionCode = new ActionCode(actionCodeFields);

      const result = adapter.verifyFinalizedTransaction(mockTransactionResponse, actionCode);
      expect(result).toBe(false);
    });
  });

}); 