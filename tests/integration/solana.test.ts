import { ActionCodesProtocol } from '../../src/protocol';
import { SolanaAdapter } from '../../src/adapters/solana';
import { ActionCode } from '../../src/actioncode';
import { Transaction, Keypair, VersionedTransaction, MessageV0 } from '@solana/web3.js';
import { MEMO_PROGRAM_ID } from '@solana/spl-memo';

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
        it('should handle complete action code lifecycle', () => {
            // 1. Generate action code
            const pubkey = userKeypair.publicKey.toBase58();
            const signature = 'user_signature_for_validation';
            const actionCode = protocol.generateActionCode(pubkey, signature, 'solana', 'TEST');

            // Verify action code properties
            expect(actionCode.code).toHaveLength(8);
            expect(actionCode.pubkey).toBe(pubkey);
            expect(actionCode.chain).toBe('solana');
            expect(actionCode.prefix).toBe('TEST');
            expect(actionCode.status).toBe('pending');
            expect(actionCode.expired).toBe(false);

            // 2. Validate action code
            const isValid = protocol.validateActionCode(actionCode);
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
            const memoInstruction = solanaAdapter.encode(meta);
            expect(memoInstruction.programId.equals(MEMO_PROGRAM_ID)).toBe(true);

            // 5. Create transaction with protocol meta
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // 6. Decode protocol meta from transaction
            const decodedMeta = solanaAdapter.decode(transaction);
            expect(decodedMeta).toEqual(meta);

            // 7. Validate transaction using adapter
            const isTransactionValid = solanaAdapter.validate(transaction, authorities, 'TEST');
            expect(isTransactionValid).toBe(true);

            // 8. Attach transaction to action code
            const serializedTx = transaction.serialize({ requireAllSignatures: false }).toString('base64');
            const updatedActionCode = protocol.attachTransaction(actionCode, serializedTx, 'payment');

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
        it('should validate protocol meta in transactions', () => {
            // Generate action code
            const actionCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                'signature',
                'solana',
                'DEFAULT'
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create valid transaction
            const memoInstruction = solanaAdapter.encode(meta);
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

        it('should handle versioned transactions', () => {
            // Generate action code
            const actionCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                'signature',
                'solana',
                'DEFAULT'
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create versioned transaction
            const memoInstruction = solanaAdapter.encode(meta);
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
        it('should handle unsupported chains', () => {
            expect(() => {
                protocol.generateActionCode('pubkey', 'signature', 'unsupported' as any);
            }).toThrow('Chain \'unsupported\' is not supported');
        });

        it('should handle invalid transactions', () => {
            const actionCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                'signature',
                'solana'
            );

            // Try to finalize without transaction
            expect(() => {
                protocol.finalizeActionCode(actionCode, 'signature');
            }).toThrow('Cannot finalize ActionCode without attached transaction');
        });

        it('should handle expired action codes', () => {
            // Create expired action code
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago
            const actionCode = ActionCode.fromPayload<string>({
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
        it('should maintain data integrity through encode/decode cycle', () => {
            // Generate action code
            const actionCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                'signature',
                'solana',
                'CUSTOM'
            );

            // Create protocol meta
            const originalMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'test_params'
            );

            // Encode using protocol to get instruction
            const memoInstruction = protocol.encodeProtocolMeta(originalMeta, 'solana');

            // Create a proper transaction with the instruction
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // Decode using protocol
            const decoded = protocol.decodeProtocolMeta(transaction, 'solana');

            // Verify round-trip integrity
            expect(decoded).toEqual(originalMeta);
        });

        it('should handle base64 transaction serialization', () => {
            // Generate action code
            const actionCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                'signature',
                'solana'
            );

            // Create protocol meta
            const meta = protocol.createProtocolMeta(actionCode, authorityKeypair.publicKey.toBase58());

            // Create transaction
            const memoInstruction = solanaAdapter.encode(meta);
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

            // Validate from base64
            const isValid = solanaAdapter.validateFromBase64(serialized, authorities, 'DEFAULT');
            expect(isValid).toBe(true);
        });
    });
});
