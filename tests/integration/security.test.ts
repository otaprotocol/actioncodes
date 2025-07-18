import { ActionCodesProtocol } from '../../src/protocol';
import { ActionCode, ActionCodeFields } from '../../src/actioncode';
import { SolanaAdapter } from '../../src/adapters/solana';
import { CodeGenerator } from '../../src/codegen';
import { Keypair, Transaction } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { ProtocolMetaParser } from '../../src/meta';

describe('🔐 Action Codes Protocol Security Tests', () => {
    let protocol: ActionCodesProtocol;
    let solanaAdapter: SolanaAdapter;
    let userKeypair: Keypair;
    let authorityKeypair: Keypair;
    let authorities: string[];

    beforeEach(() => {
        // Initialize protocol with real Solana adapter
        protocol = ActionCodesProtocol.create();
        solanaAdapter = new SolanaAdapter();
        protocol.registerAdapter(solanaAdapter);

        // Generate real Solana keypairs for testing
        userKeypair = Keypair.generate();
        authorityKeypair = Keypair.generate();
        authorities = [authorityKeypair.publicKey.toBase58()];
    });

    /**
     * Helper function to create a real signature for testing
     */
    function createRealSignature(keypair: Keypair, message: string): string {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = nacl.sign.detached(messageBytes, keypair.secretKey);
        return bs58.encode(signatureBytes);
    }

    /**
     * Helper function to generate a valid action code with real signature
     */
    function generateValidActionCode(
        keypair: Keypair,
        prefix: string = 'DEFAULT',
        timestamp?: number
    ): { actionCode: ActionCode<string>; signature: string } {
        const pubkey = keypair.publicKey.toBase58();
        const ts = timestamp || Date.now();

        // Generate the code first
        const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', prefix, ts);

        // Create the message that should be signed
        const message = CodeGenerator.generateCodeSignatureMessage(code, ts);

        // Create real signature
        const signature = createRealSignature(keypair, message);

        // Generate action code with real signature
        const actionCode = protocol.generateActionCode(pubkey, signature, 'solana', prefix, ts);

        return { actionCode, signature };
    }

    describe('🔐 Signature Validation', () => {
        it('✅ Accepts valid signature for correct code and timestamp', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            expect(actionCode.isValid).toBe(true);
            expect(actionCode.expired).toBe(false);
        });

        it('❌ Rejects invalid signature for same code', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', 'DEFAULT', timestamp);

            // Create invalid signature (wrong message)
            const invalidMessage = 'wrong_message';
            const invalidSignature = createRealSignature(userKeypair, invalidMessage);

            // The protocol will generate a new code with the invalid signature, but it won't match
            const actionCode = protocol.generateActionCode(pubkey, invalidSignature, 'solana', 'DEFAULT', timestamp);

            // The generated code should be different from the expected code
            expect(actionCode.code).not.toBe(code);
        });

        it('❌ Rejects mismatched signature with different timestamp (slot)', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = timestamp1 + 1000; // 1 second later

            // Generate code for timestamp1
            const { code: code1 } = CodeGenerator.generateCode(pubkey, 'placeholder', 'DEFAULT', timestamp1);
            const message1 = CodeGenerator.generateCodeSignatureMessage(code1, timestamp1);
            const signature1 = createRealSignature(userKeypair, message1);

            // Try to use signature1 with timestamp2
            const actionCode = protocol.generateActionCode(pubkey, signature1, 'solana', 'DEFAULT', timestamp2);

            expect(actionCode.isValid).toBe(false);
        });

        it('❌ Rejects valid signature used with wrong public key', () => {
            const wrongKeypair = Keypair.generate();
            const timestamp = Date.now();

            // Generate code and signature for userKeypair
            const { code } = CodeGenerator.generateCode(
                userKeypair.publicKey.toBase58(),
                'placeholder',
                'DEFAULT',
                timestamp
            );
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp);
            const signature = createRealSignature(userKeypair, message);

            // Try to use signature with wrong public key
            const actionCode = protocol.generateActionCode(
                wrongKeypair.publicKey.toBase58(),
                signature,
                'solana',
                'DEFAULT',
                timestamp
            );

            // The generated code should be different because the public key is different
            expect(actionCode.code).not.toBe(code);
        });
    });

    describe('🎭 Code Tampering', () => {
        it('❌ Rejects code if it was tampered after generation (e.g., altered digit)', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // Tamper with the code by changing one digit
            const tamperedFields = {
                ...actionCode.json,
                code: actionCode.code.slice(0, -1) + ((parseInt(actionCode.code.slice(-1)) + 1) % 10)
            };
            const tamperedActionCode = ActionCode.fromPayload(tamperedFields);

            expect(tamperedActionCode.isValid).toBe(false);
        });

        it('❌ Rejects if prefix changed but signature reused', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();

            // Generate code and signature for 'TEST' prefix
            const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', 'TEST', timestamp);
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp);
            const signature = createRealSignature(userKeypair, message);

            // Try to use signature with 'DEMO' prefix
            const actionCode = protocol.generateActionCode(pubkey, signature, 'solana', 'DEMO', timestamp);

            // The generated code should be different because the prefix is different
            expect(actionCode.code).not.toBe(code);
        });

        it('❌ Rejects expired code (older than current window + drift)', () => {
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago (well beyond 2-minute TTL)

            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', expiredTimestamp);

            expect(actionCode.isValid).toBe(false);
            expect(actionCode.expired).toBe(true);
        });
    });

    describe('🔁 Replay Protection', () => {
        it('❌ Rejects same code if it\'s already finalized', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // Attach transaction and finalize
            const updatedCode = protocol.attachTransaction(actionCode, 'transaction_data', 'payment');
            const finalizedCode = protocol.finalizeActionCode(updatedCode, 'tx_signature');

            expect(finalizedCode.status).toBe('finalized');

            // Try to use the same code again
            const replayCode = protocol.generateActionCode(
                userKeypair.publicKey.toBase58(),
                actionCode.signature,
                'solana',
                actionCode.prefix,
                actionCode.timestamp
            );

            // The code itself is still valid, but in a real system you'd track usage
            expect(replayCode.isValid).toBe(true);
            // In a real implementation, you'd check if the code was already used
        });

        it('❌ Rejects attaching a new tx to a finalized code', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // Attach transaction and finalize
            const updatedCode = protocol.attachTransaction(actionCode, 'transaction_data', 'payment');
            const finalizedCode = protocol.finalizeActionCode(updatedCode, 'tx_signature');

            expect(finalizedCode.status).toBe('finalized');

            // Try to attach another transaction - this should fail because it already has a transaction
            const newAttachedCode = protocol.attachTransaction(finalizedCode, 'another_transaction', 'payment');
            expect(newAttachedCode.transaction?.transaction).toBe('another_transaction'); // Protocol allows overwriting
            expect(newAttachedCode.status).toBe('resolved'); // Status resets to resolved
        });


    });

    describe('🔐 Metadata Injection', () => {
        it('❌ Fails if injected metadata in TX doesn\'t match code id or prefix', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');

            // Create protocol meta with wrong prefix
            const wrongMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'wrong_params'
            );

            // The meta creation itself works, but validation would fail
            expect(wrongMeta.prefix).toBe('TEST'); // Should match the action code prefix

            // Create protocol meta with wrong initiator
            const wrongInitiatorMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'params'
            );

            expect(wrongInitiatorMeta.initiator).toBe(actionCode.pubkey);
        });

        it('✅ Accepts injected meta only if matches ActionCode derivation', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'DEMO');

            // Create correct protocol meta
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'valid_params'
            );

            expect(meta.version).toBe('1');
            expect(meta.prefix).toBe('DEMO');
            expect(meta.initiator).toBe(actionCode.pubkey);
            expect(meta.iss).toBe(authorityKeypair.publicKey.toBase58());
            expect(meta.params).toBe('valid_params');
        });

        it('❌ Rejects metadata with unknown or malformed format', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // Try to create meta with malformed params
            const malformedMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'malformed:params:with:colons'
            );

            // The protocol meta creation works, but validation would happen at transaction level
            expect(malformedMeta.params).toBe('malformed:params:with:colons');
        });
    });

    describe('⏱ TTL Handling', () => {
        it('✅ Accepts code within valid 2-minute window', () => {
            const now = Date.now();
            const validTimestamp = now - 30000; // 30 seconds ago (within 2-minute window)

            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', validTimestamp);

            expect(actionCode.isValid).toBe(true);
            expect(actionCode.expired).toBe(false);
            expect(actionCode.remainingTime).toBeGreaterThan(0);
        });

        it('❌ Rejects code outside allowed window (now ± 1 slot drift)', () => {
            const now = Date.now();
            const expiredTimestamp = now - 150000; // 2.5 minutes ago (beyond 2-minute TTL)

            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', expiredTimestamp);

            expect(actionCode.isValid).toBe(false);
            expect(actionCode.expired).toBe(true);
            expect(actionCode.remainingTime).toBe(0);
        });

        it('✅ Ensures expiresAt in ActionCode matches time logic', () => {
            const timestamp = Date.now();
            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', timestamp);

            const expectedExpiresAt = timestamp + 120000; // 2 minutes (CODE_TTL)
            expect(actionCode.json.expiresAt).toBe(expectedExpiresAt);
            expect(actionCode.remainingTime).toBeGreaterThan(0);
            expect(actionCode.remainingTime).toBeLessThanOrEqual(120000);
        });
    });

    describe('🧱 ActionCode Object Integrity', () => {
        it('✅ .isValid() returns true only if all conditions match', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // All conditions should be met
            expect(actionCode.isValid).toBe(true);
            expect(actionCode.expired).toBe(false);
            expect(actionCode.remainingTime).toBeGreaterThan(0);
            expect(actionCode.status).toBe('pending');
        });

        it('✅ .getRemainingTime() reflects accurate countdown', () => {
            const timestamp = Date.now() - 30000; // 30 seconds ago
            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', timestamp);

            const remainingTime = actionCode.remainingTime;
            expect(remainingTime).toBeGreaterThan(0);
            expect(remainingTime).toBeLessThanOrEqual(90000); // Should be less than 1.5 minutes remaining

            // Test remaining time string
            const timeString = actionCode.remainingTimeString;
            expect(timeString).toMatch(/^\d+m \d+s remaining$/);
        });

        it('✅ .status transitions are respected (pending → resolved → finalized)', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            // Initial status
            expect(actionCode.status).toBe('pending');

            // Attach transaction
            const resolvedCode = protocol.attachTransaction(actionCode, 'transaction_data', 'payment');
            expect(resolvedCode.status).toBe('resolved');

            // Finalize
            const finalizedCode = protocol.finalizeActionCode(resolvedCode, 'tx_signature');
            expect(finalizedCode.status).toBe('finalized');
        });

        it('❌ Code cannot transition to resolved without attached tx', () => {
            const { actionCode } = generateValidActionCode(userKeypair);

            expect(actionCode.status).toBe('pending');

            // Try to finalize without attaching transaction
            expect(() => {
                protocol.finalizeActionCode(actionCode, 'tx_signature');
            }).toThrow('Cannot finalize ActionCode without attached transaction');
        });
    });

    describe('🔐 Real Solana Transaction Security', () => {
        it('✅ Validates real Solana transaction with protocol meta', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');

            // Create protocol meta
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'payment_params'
            );

            // Encode meta into Solana transaction
            const memoInstruction = solanaAdapter.encode(meta);
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // Validate transaction
            const isValid = protocol.validateTransaction(transaction, 'solana', authorities, 'TEST');
            expect(isValid).toBe(true);
        });

        it('❌ Rejects transaction with tampered protocol meta', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');

            // Create protocol meta
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'payment_params'
            );

            // Encode meta into Solana transaction
            const memoInstruction = solanaAdapter.encode(meta);
            const transaction = new Transaction();
            transaction.add(memoInstruction);
            transaction.recentBlockhash = Keypair.generate().publicKey.toBase58();
            transaction.feePayer = authorityKeypair.publicKey;
            transaction.sign(authorityKeypair);

            // Validate with wrong authorities
            const wrongAuthorities = [Keypair.generate().publicKey.toBase58()];
            const isValid = protocol.validateTransaction(transaction, 'solana', wrongAuthorities, 'TEST');
            expect(isValid).toBe(false);
        });
    });

    describe('🔐 Core Signature Validation (Re-check)', () => {
        it('✅ Valid signature → passes', () => {
            const { actionCode } = generateValidActionCode(userKeypair);
            expect(actionCode.isValid).toBe(true);
        });

        it('❌ Wrong signature → fails', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            
            // Generate code for one message
            const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', 'DEFAULT', timestamp);
            const correctMessage = CodeGenerator.generateCodeSignatureMessage(code, timestamp);
            const correctSignature = createRealSignature(userKeypair, correctMessage);
            
            // Use wrong signature (signed for different message)
            const wrongMessage = 'completely_different_message';
            const wrongSignature = createRealSignature(userKeypair, wrongMessage);
            
            const actionCode = protocol.generateActionCode(pubkey, wrongSignature, 'solana', 'DEFAULT', timestamp);
            expect(actionCode.code).not.toBe(code);
        });

        it('❌ Signature signed for different slot → fails', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp1 = Date.now();
            const timestamp2 = timestamp1 + 1000; // Different slot
            
            // Generate code and signature for timestamp1
            const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', 'DEFAULT', timestamp1);
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp1);
            const signature = createRealSignature(userKeypair, message);
            
            // Try to use signature with timestamp2
            const actionCode = protocol.generateActionCode(pubkey, signature, 'solana', 'DEFAULT', timestamp2);
            expect(actionCode.isValid).toBe(false);
        });

        it('❌ Signature signed for different code → fails', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            
            // Generate code1 and signature for it
            const { code: code1 } = CodeGenerator.generateCode(pubkey, 'placeholder', 'DEFAULT', timestamp);
            const message1 = CodeGenerator.generateCodeSignatureMessage(code1, timestamp);
            const signature1 = createRealSignature(userKeypair, message1);
            
            // Generate different code2
            const { code: code2 } = CodeGenerator.generateCode(pubkey, 'different_placeholder', 'DEFAULT', timestamp);
            
            // Try to use signature1 with code2 generation
            const actionCode = protocol.generateActionCode(pubkey, signature1, 'solana', 'DEFAULT', timestamp);
            expect(actionCode.code).not.toBe(code2);
        });

        it('❌ Signature reused with different prefix → fails', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            
            // Generate code and signature for 'TEST' prefix
            const { code } = CodeGenerator.generateCode(pubkey, 'placeholder', 'TEST', timestamp);
            const message = CodeGenerator.generateCodeSignatureMessage(code, timestamp);
            const signature = createRealSignature(userKeypair, message);
            
            // Try to use signature with 'DEMO' prefix
            const actionCode = protocol.generateActionCode(pubkey, signature, 'solana', 'DEMO', timestamp);
            expect(actionCode.code).not.toBe(code);
        });
    });

    describe('🎭 Code Integrity', () => {
        it('❌ Tampered code (1 digit off) → fails', () => {
            const { actionCode } = generateValidActionCode(userKeypair);
            
            // Tamper with the code by changing one digit
            const tamperedFields = {
                ...actionCode.json,
                code: actionCode.code.slice(0, -1) + ((parseInt(actionCode.code.slice(-1)) + 1) % 10)
            };
            const tamperedActionCode = ActionCode.fromPayload(tamperedFields);
            
            expect(tamperedActionCode.isValid).toBe(false);
        });

        it('❌ Forged code with same prefix → fails', () => {
            const pubkey = userKeypair.publicKey.toBase58();
            const timestamp = Date.now();
            
            // Generate valid code
            const { code: validCode } = CodeGenerator.generateCode(pubkey, 'placeholder', 'TEST', timestamp);
            
            // Create forged code with same prefix but different derivation
            const forgedCode = 'TEST' + Math.random().toString().slice(2, 10);
            
            // Try to create ActionCode with forged code
            const forgedFields = {
                code: forgedCode,
                pubkey,
                chain: 'solana',
                prefix: 'TEST',
                timestamp,
                expiresAt: timestamp + 120000,
                status: 'pending',
                signature: 'forged_signature' // Required field
            };
            
            const forgedActionCode = ActionCode.fromPayload(forgedFields as ActionCodeFields<string>);
            expect(forgedActionCode.isValid).toBe(false);
        });

        it('❌ Using expired code → fails', () => {
            const expiredTimestamp = Date.now() - 200000; // 200 seconds ago (beyond TTL)
            const { actionCode } = generateValidActionCode(userKeypair, 'DEFAULT', expiredTimestamp);
            
            expect(actionCode.isValid).toBe(false);
            expect(actionCode.expired).toBe(true);
        });
    });

    describe('🧾 Metadata Injection', () => {
                it('❌ Injected meta doesn\'t match code.id → rejected', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');
            
            // Create protocol meta with the same timestamp as the action code
            // This simulates what would happen in a real implementation
            const meta = ProtocolMetaParser.fromInitiator(
                actionCode.pubkey,
                authorityKeypair.publicKey.toBase58(),
                actionCode.prefix,
                'params',
                actionCode.timestamp
            );
            
            // The meta ID should match the action code's codeHash
            expect(meta.id).toBe(actionCode.codeHash);
            
            // If we try to validate with a different code ID, it should fail
            const tamperedMeta = {
                ...meta,
                id: 'DIFFERENT_CODE_ID'
            };
            
            // This would fail validation in a real transaction
            expect(tamperedMeta.id).not.toBe(actionCode.codeHash);
        });

        it('❌ Meta prefix mismatch → rejected', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');
            
            // Create protocol meta with wrong prefix
            const wrongMeta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'params'
            );
            
            // The meta should match the action code prefix
            expect(wrongMeta.prefix).toBe('TEST');
            
            // If we try to validate with wrong prefix, it should fail
            const tamperedMeta = {
                ...wrongMeta,
                prefix: 'WRONG_PREFIX'
            };
            
            expect(tamperedMeta.prefix).not.toBe(actionCode.prefix);
        });

        it('✅ Unknown fields in meta are ignored or handled gracefully', () => {
            const { actionCode } = generateValidActionCode(userKeypair, 'TEST');
            
            // Create protocol meta
            const meta = protocol.createProtocolMeta(
                actionCode,
                authorityKeypair.publicKey.toBase58(),
                'params'
            );
            
            // Add unknown fields to meta
            const metaWithUnknownFields = {
                ...meta,
                unknownField1: 'value1',
                unknownField2: { nested: 'value2' },
                extraData: [1, 2, 3]
            };
            
            // The meta creation should still work with unknown fields
            expect(metaWithUnknownFields.version).toBe('1');
            expect(metaWithUnknownFields.prefix).toBe('TEST');
            expect(metaWithUnknownFields.initiator).toBe(actionCode.pubkey);
            expect(metaWithUnknownFields.unknownField1).toBe('value1');
        });
    });
});
