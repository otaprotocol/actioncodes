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

import { ActionCodesProtocol } from '../../src/protocol';
import { SolanaAdapter } from '../../src/adapters/solana';
import { ActionCode } from '../../src/actioncode';
import { Transaction, Keypair, VersionedTransaction, MessageV0 } from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '@solana/spl-memo';
import * as nacl from 'tweetnacl';
import { CodeGenerator } from '../../src/codegen';
import bs58 from 'bs58';
import { Buffer } from 'buffer';

/**
 * Helper function to create a real signature for testing
 */
function createRealSignature(keypair: Keypair, message: string): string {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
    return bs58.encode(signatureBytes);
}

/**
 * Helper function to generate a valid signature for an action code
 */
function generateValidSignature(
    keypair: Keypair,
    pubkey: string,
    prefix: string = 'DEFAULT',
    timestamp?: number
): { signature: string; code: string; timestamp: number } {
    const ts = timestamp || Date.now();
    const { code } = CodeGenerator.generateCode(pubkey, prefix, ts);

    // Create the message that should be signed using the adapter
    const solanaAdapter = new SolanaAdapter();
    const message = solanaAdapter.getCodeSignatureMessage(code, ts, prefix);

    const signature = createRealSignature(keypair, message);
    return { signature, code, timestamp: ts };
}

describe('Solana Integration Tests - Real Protocol Usage', () => {
    let protocol: ActionCodesProtocol;
    let solanaAdapter: SolanaAdapter;
    let userKeypair: Keypair;
    let authorityKeypair: Keypair;
    let authorities: string[];

    beforeEach(() => {
        // Initialize protocol with Solana adapter
        protocol = ActionCodesProtocol.create();
        solanaAdapter = new SolanaAdapter();
        protocol.registerAdapter(solanaAdapter);

        // Generate test keypairs
        userKeypair = Keypair.generate();
        authorityKeypair = Keypair.generate();
        authorities = [authorityKeypair.publicKey.toBase58()];
    });

    describe('✅ Complete Protocol Workflow', () => {
        it('should handle complete action code lifecycle', async () => {
            // 1. Generate action code
            const pubkey = userKeypair.publicKey.toBase58();
            const { signature, code, timestamp } = generateValidSignature(userKeypair, pubkey, 'TEST');
            const actionCode = await protocol.createActionCode(pubkey, async () => signature, 'solana', 'TEST', timestamp);

            // Verify action code properties
            expect(actionCode.code).toHaveLength('TEST'.length + 8); // prefix + 8 digits
            expect(actionCode.code.startsWith('TEST')).toBe(true);
            expect(actionCode.pubkey).toBe(pubkey);
            expect(actionCode.chain).toBe('solana');
            expect(actionCode.prefix).toBe('TEST');
            expect(actionCode.status).toBe('pending');
            expect(actionCode.expired).toBe(false);

            // 2. Validate action code
            const isValid = actionCode.isValid(protocol);
            expect(isValid).toBe(true);

            // 3. Create protocol meta
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'payment_params'
            );

            expect(meta.version).toBe('1');
            expect(meta.initiator).toBe(pubkey);
            expect(meta.iss).toBe(authorityKeypair.publicKey.toBase58());
            expect(meta.params).toBe('payment_params');

            // 4. Encode protocol meta using adapter
            const memoInstruction = solanaAdapter.encodeMeta(meta);
            expect(memoInstruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true);

            // 5. Create transaction with protocol meta
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // 6. Decode protocol meta from transaction
            const decodedMeta = solanaAdapter.decodeMeta(transaction);
            expect(decodedMeta).toEqual(meta);

            // 7. Validate transaction using adapter
            const isTransactionValid = solanaAdapter.validate(transaction, authorities, 'TEST');
            expect(isTransactionValid).toBe(true);

            // 8. Attach transaction to action code
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');
            const updatedActionCode = protocol.attachTransaction(actionCode, serializedTx, authorityKeypair.publicKey.toBase58(), 'payment_params', 'payment');

            expect(updatedActionCode.transaction).toBeDefined();
            expect(updatedActionCode.transaction?.transaction).toBe(serializedTx);
            expect(updatedActionCode.transaction?.txType).toBe('payment');
            expect(updatedActionCode.status).toBe('resolved');

            // 9. Finalize action code
            const txSignature = 'transaction_signature_from_blockchain';
            const finalizedActionCode = protocol.finalizeActionCode(updatedActionCode, txSignature);

            expect(finalizedActionCode.transaction?.txSignature).toBe(txSignature);
            expect(finalizedActionCode.status).toBe('finalized');
        });
    });

    describe('🔐 Protocol Meta Validation', () => {
        it('should validate protocol meta in transactions', async () => {
            // Generate action code
            const { signature, timestamp } = generateValidSignature(userKeypair, userKeypair.publicKey.toBase58(), 'DEFAULT');
            const actionCode = await protocol.createActionCode(
                userKeypair.publicKey.toBase58(),
                async () => signature,
                'solana',
                'DEFAULT',
                timestamp
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create valid transaction
            const memoInstruction = solanaAdapter.encodeMeta(meta);
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // Validate using protocol
            const isValid = protocol.validateTransaction(transaction, 'solana', authorities, 'DEFAULT');
            expect(isValid).toBe(true);

            // Test with wrong authorities
            const wrongAuthorities = [Keypair.generate().publicKey.toBase58()];
            const isInvalid = protocol.validateTransaction(transaction, 'solana', wrongAuthorities, 'DEFAULT');
            expect(isInvalid).toBe(false);
        });

        it('should handle versioned transactions', async () => {
            // Generate action code
            const { signature, timestamp } = generateValidSignature(userKeypair, userKeypair.publicKey.toBase58(), 'DEFAULT');
            const actionCode = await protocol.createActionCode(
                userKeypair.publicKey.toBase58(),
                async () => signature,
                'solana',
                'DEFAULT',
                timestamp
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create versioned transaction
            const memoInstruction = solanaAdapter.encodeMeta(meta);
            const messageV0 = new MessageV0({
                header: {
                    numRequiredSignatures: 1,
                    numReadonlySignedAccounts: 0,
                    numReadonlyUnsignedAccounts: 1,
                },
                staticAccountKeys: [
                    authorityKeypair.publicKey,
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

            // Validate versioned transaction
            const isValid = protocol.validateTransaction(versionedTransaction, 'solana', authorities, 'DEFAULT');
            expect(isValid).toBe(true);
        });
    });

    describe('⚠️ Error Handling', () => {
        it('should handle unsupported chains', async () => {
            await expect(
                protocol.createActionCode('pubkey', async () => 'signature', 'unsupported' as any)
            ).rejects.toThrow('Chain \'unsupported\' is not supported');
        });

        it('should handle invalid transactions', async () => {
            const { signature, timestamp } = generateValidSignature(userKeypair, userKeypair.publicKey.toBase58(), 'DEFAULT');
            const actionCode = await protocol.createActionCode(
                userKeypair.publicKey.toBase58(),
                async () => signature,
                'solana',
                'DEFAULT',
                timestamp
            );

            // Try to finalize without transaction
            expect(() => {
                protocol.finalizeActionCode(actionCode, 'signature');
            }).toThrow('Cannot finalize ActionCode without attached transaction');
        });

        it('should handle expired action codes', async () => {
            // Create expired action code
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago
            const actionCode = ActionCode.fromPayload({
                code: '12345678',
                prefix: 'DEFAULT',
                pubkey: userKeypair.publicKey.toBase58(),
                timestamp: expiredTimestamp,
                signature: 'signature',
                chain: 'solana',
                expiresAt: expiredTimestamp + 120000, // 120 seconds TTL
                status: 'pending'
            });

            const isValid = protocol.validateActionCode(actionCode);
            expect(isValid).toBe(false);
        });
    });

    describe('🔄 Round-trip Operations', () => {
        it('should maintain data integrity through encode/decode cycle', async () => {
            // Generate action code
            const { signature, timestamp } = generateValidSignature(userKeypair, userKeypair.publicKey.toBase58(), 'CUSTOM');
            let actionCode = await protocol.createActionCode(
                userKeypair.publicKey.toBase58(),
                async () => signature,
                'solana',
                'CUSTOM',
                timestamp
            );

            // Attach a valid transaction to the action code
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'test_params'
            );
            const memoInstruction = protocol.encodeProtocolMeta(meta, 'solana');
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');
            actionCode = protocol.attachTransaction(actionCode, serializedTx, authorityKeypair.publicKey.toBase58(), 'test_params', 'payment');

            // Create protocol meta (again, for round-trip)
            const originalMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'test_params'
            );

            // Encode using protocol to get instruction
            const memoInstruction2 = protocol.encodeProtocolMeta(originalMeta, 'solana');

            // Create a proper transaction with the instruction
            const transaction2 = new Transaction();
            transaction2.add(memoInstruction2);
            transaction2.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction2.feePayer = authorityKeypair.publicKey;
            transaction2.sign(authorityKeypair);

            // Decode using protocol
            const decoded = protocol.decodeProtocolMeta(transaction2, 'solana');

            // Verify round-trip integrity
            expect(decoded).toEqual(originalMeta);
        });

        it('should handle base64 transaction serialization', async () => {
            // Generate action code
            const { signature, timestamp } = generateValidSignature(userKeypair, userKeypair.publicKey.toBase58(), 'DEFAULT');
            const actionCode = await protocol.createActionCode(
                userKeypair.publicKey.toBase58(),
                async () => signature,
                'solana',
                'DEFAULT',
                timestamp
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create transaction
            const memoInstruction = solanaAdapter.encodeMeta(meta);
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // Serialize to base64
            const serialized = transaction.serialize({ requireAllSignatures: false }).toString('base64');

            // Decode from base64
            const decodedMeta = solanaAdapter.decodeFromBase64(serialized);
            expect(decodedMeta).toEqual(meta);
        });
    });
});

describe('Sign-Only Integration', () => {
    it('should handle sign-only message signing lifecycle with Solana keypair', async () => {
        // 1. Setup
        const protocol = ActionCodesProtocol.create();
        const solanaAdapter = new SolanaAdapter();
        protocol.registerAdapter(solanaAdapter);
        const keypair = Keypair.generate();
        const pubkey = keypair.publicKey.toBase58();

        // 2. Create action code (pending)
        const signFn = jest.fn().mockResolvedValue('test_signature');
        jest.spyOn(solanaAdapter, 'verifyCodeSignature').mockReturnValue(true);
        const actionCode = await protocol.createActionCode(pubkey, signFn, 'solana');

        // 3. Attach message (resolved)
        const message = 'Sign this message for Solana integration test';
        const resolvedCode = protocol.attachMessage(actionCode, message);
        expect(resolvedCode.transaction?.message).toBe(message);
        expect(resolvedCode.status).toBe('resolved');
        expect(resolvedCode.transaction?.intentType).toBe('sign-only');

        // 4. Finalize with valid signature (finalized)
        const messageBytes = Buffer.from(message, 'utf8');
        const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
        const signature = bs58.encode(signatureBytes);
        const finalizedCode = protocol.finalizeActionCode(resolvedCode, signature);
        expect(finalizedCode.transaction?.signedMessage).toBe(signature);
        expect(finalizedCode.status).toBe('finalized');
        expect(finalizedCode.transaction?.intentType).toBe('sign-only');

        // 5. Validate the finalized action code
        expect(protocol.validateActionCode(finalizedCode)).toBe(true);
        // Check that the Solana adapter validates the signature
        expect(solanaAdapter.validateSignedMessage(message, signature, pubkey)).toBe(true);
    });
});
