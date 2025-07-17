import { CodeGenerator } from './codegen';
import { ProtocolMetaParser, ProtocolMetaV1 } from './meta';
import { ActionCode, ActionCodeStatus, ActionCodeTransaction } from './actioncode';
import { BaseChainAdapter } from './adapters/base';
import { MAX_PREFIX_LENGTH, CODE_LENGTH, CODE_TTL, PROTOCOL_VERSION, SupportedChain, MIN_PREFIX_LENGTH, PROTOCOL_CODE_PREFIX } from './constants';

/**
 * OTA Protocol Configuration
 */
export interface ProtocolConfig {
    /** Protocol version */
    version: string;
    /** Default prefix for action codes */
    defaultPrefix: string;
    /** Code TTL in milliseconds */
    codeTTL: number;
    /** Code length in digits */
    codeLength: number;
    /** Maximum prefix length */
    maxPrefixLength: number;
    /** Minimum prefix length */
    minPrefixLength: number;
}

/**
 * OTA Protocol - Main entry point for the One-Time Action Code Protocol
 * 
 * Provides a unified interface for generating, validating, and managing
 * action codes across multiple blockchain networks.
 */
export class ActionCodesProtocol {
    private config: ProtocolConfig;
    private adapters: Map<string, BaseChainAdapter<any>> = new Map();

    constructor(config?: Partial<ProtocolConfig>) {
        this.config = {
            version: PROTOCOL_VERSION,
            defaultPrefix: PROTOCOL_CODE_PREFIX,
            codeTTL: CODE_TTL,
            codeLength: CODE_LENGTH,
            maxPrefixLength: MAX_PREFIX_LENGTH,
            minPrefixLength: MIN_PREFIX_LENGTH,
            ...config
        };
    }

    /**
     * Register a chain adapter
     * @param adapter - Chain adapter implementation
     */
    registerAdapter<T>(adapter: BaseChainAdapter<T>): void {
        this.adapters.set(adapter.chain, adapter);
    }

    /**
     * Get registered chain adapters
     * @returns Array of registered chain identifiers
     */
    getRegisteredChains(): string[] {
        return Array.from(this.adapters.keys());
    }

    /**
     * Check if a chain is supported
     * @param chain - Chain identifier
     * @returns True if chain is supported
     */
    isChainSupported(chain: string): boolean {
        return this.adapters.has(chain);
    }

    /**
     * Get chain adapter with proper typing
     * @param chain - Chain identifier
     * @returns Chain adapter or undefined
     */
    getChainAdapter<T = any>(chain: string): BaseChainAdapter<T> | undefined {
        return this.adapters.get(chain) as BaseChainAdapter<T> | undefined;
    }

    /**
     * Generate an action code for a specific chain
     * @param pubkey - User's public key
     * @param signature - User's signature
     * @param chain - Target chain
     * @param prefix - Optional prefix (defaults to config defaultPrefix)
     * @param timestamp - Optional timestamp (defaults to now)
     * @returns ActionCode object
     */
    generateActionCode(
        pubkey: string,
        signature: string,
        chain: SupportedChain,
        prefix?: string,
        timestamp?: number
    ): ActionCode<string> {
        if (!this.isChainSupported(chain)) {
            throw new Error(`Chain '${chain}' is not supported. Registered chains: ${this.getRegisteredChains().join(', ')}`);
        }

        const normalizedPrefix = prefix || this.config.defaultPrefix;
        const ts = timestamp || Date.now();

        // Generate code using CodeGenerator
        const { code, issuedAt, expiresAt } = CodeGenerator.generateCode(
            pubkey,
            signature,
            normalizedPrefix,
            ts
        );

        // Create ActionCode object
        const actionCodeFields = {
            code,
            prefix: normalizedPrefix,
            pubkey,
            timestamp: issuedAt,
            signature,
            chain,
            expiresAt,
            status: 'pending' as ActionCodeStatus
        };

        return ActionCode.fromPayload(actionCodeFields);
    }

    /**
     * Validate an action code
     * @param actionCode - ActionCode to validate
     * @returns True if valid
     */
    validateActionCode(actionCode: ActionCode<string>): boolean {
        const chain = actionCode.chain;

        if (!this.isChainSupported(chain)) {
            return false;
        }

        // Basic validation - check if expired
        if (actionCode.expired) {
            return false;
        }

        // Chain-specific validation would be done when attaching transactions
        return true;
    }

    /**
     * Attach a transaction to an action code
     * @param actionCode - ActionCode to attach transaction to
     * @param transaction - Chain-specific transaction data
     * @param txType - Optional transaction type
     * @returns Updated ActionCode
     */
    attachTransaction(
        actionCode: ActionCode<string>,
        transaction: string,
        txType?: string
    ): ActionCode<string> {
        const chain = actionCode.chain;

        if (!this.isChainSupported(chain)) {
            throw new Error(`Chain '${chain}' is not supported`);
        }

        // Create transaction object
        const txObject: ActionCodeTransaction<string> = {
            transaction,
            txType: txType || chain
        };

        // Update ActionCode
        const updatedFields = {
            ...actionCode.json,
            transaction: txObject,
            status: 'resolved' as ActionCodeStatus
        };

        return ActionCode.fromPayload(updatedFields);
    }

    /**
     * Finalize an action code with transaction signature
     * @param actionCode - ActionCode to finalize
     * @param txSignature - Transaction signature
     * @returns Updated ActionCode
     */
    finalizeActionCode(
        actionCode: ActionCode<string>,
        txSignature: string
    ): ActionCode<string> {
        const currentTransaction = actionCode.transaction;
        if (!currentTransaction) {
            throw new Error('Cannot finalize ActionCode without attached transaction');
        }

        // Update transaction with signature
        const updatedTransaction: ActionCodeTransaction<string> = {
            ...currentTransaction,
            txSignature
        };

        // Update ActionCode
        const updatedFields = {
            ...actionCode.json,
            transaction: updatedTransaction,
            status: 'finalized' as ActionCodeStatus
        };

        return ActionCode.fromPayload(updatedFields);
    }

    /**
     * Create protocol meta for a transaction
     * @param actionCode - ActionCode to create meta for
     * @param issuer - Optional issuer public key
     * @param params - Optional parameters
     * @returns ProtocolMetaV1 object
     */
    createProtocolMeta(
        actionCode: ActionCode<string>,
        issuer?: string,
        params?: string
    ): ProtocolMetaV1 {
        return ProtocolMetaParser.fromInitiator(
            actionCode.pubkey,
            issuer || actionCode.pubkey,
            actionCode.prefix,
            params
        );
    }

    /**
     * Encode protocol meta for a specific chain
     * @param meta - ProtocolMetaV1 object
     * @param chain - Target chain
     * @returns Chain-specific encoded meta
     */
    encodeProtocolMeta(meta: ProtocolMetaV1, chain: string): any {
        const adapter = this.adapters.get(chain);
        if (!adapter) {
            throw new Error(`Chain '${chain}' is not supported`);
        }

        return adapter.encode(meta);
    }

    /**
     * Decode protocol meta from a transaction
     * @param transaction - Chain-specific transaction
     * @param chain - Source chain
     * @returns Decoded ProtocolMetaV1 or null
     */
    decodeProtocolMeta(transaction: any, chain: string): ProtocolMetaV1 | null {
        const adapter = this.adapters.get(chain);
        if (!adapter) {
            return null;
        }

        return adapter.decode(transaction);
    }

    /**
     * Validate a transaction with protocol meta
     * @param transaction - Chain-specific transaction
     * @param chain - Source chain
     * @param authorities - Array of valid protocol authority identifiers
     * @param expectedPrefix - Expected protocol prefix
     * @returns True if transaction is valid
     */
    validateTransaction(
        transaction: any,
        chain: string,
        authorities: string[],
        expectedPrefix?: string
    ): boolean {
        const adapter = this.adapters.get(chain);
        if (!adapter) {
            return false;
        }

        return adapter.validate(transaction, authorities, expectedPrefix);
    }

    /**
     * Type-safe transaction validation for specific chains
     * @param transaction - Chain-specific transaction
     * @param chain - Source chain
     * @param authorities - Array of valid protocol authority identifiers
     * @param expectedPrefix - Expected protocol prefix
     * @returns True if transaction is valid
     */
    validateTransactionTyped<T>(
        transaction: T,
        chain: string,
        authorities: string[],
        expectedPrefix?: string
    ): boolean {
        const adapter = this.getChainAdapter<T>(chain);
        if (!adapter) {
            return false;
        }

        return adapter.validate(transaction, authorities, expectedPrefix);
    }

    /**
     * Detect tampered transactions with type safety
     * @param transaction - Chain-specific transaction
     * @param chain - Source chain
     * @param authorities - Array of valid protocol authority identifiers
     * @param expectedPrefix - Expected protocol prefix
     * @returns True if transaction is valid and not tampered
     */
    detectTampering<T>(
        transaction: T,
        chain: string,
        authorities: string[],
        expectedPrefix?: string
    ): boolean {
        const adapter = this.getChainAdapter<T>(chain);
        if (!adapter) {
            return false;
        }

        return adapter.detectTampering(transaction, authorities, expectedPrefix);
    }

    /**
     * Decode protocol meta with type safety
     * @param transaction - Chain-specific transaction
     * @param chain - Source chain
     * @returns Decoded ProtocolMetaV1 or null
     */
    decodeProtocolMetaTyped<T>(transaction: T, chain: string): ProtocolMetaV1 | null {
        const adapter = this.getChainAdapter<T>(chain);
        if (!adapter) {
            return null;
        }

        return adapter.decode(transaction);
    }

    /**
     * Get protocol configuration
     * @returns Current protocol configuration
     */
    getConfig(): ProtocolConfig {
        return { ...this.config };
    }

    /**
     * Update protocol configuration
     * @param updates - Configuration updates
     */
    updateConfig(updates: Partial<ProtocolConfig>): void {
        this.config = { ...this.config, ...updates };
    }

    /**
     * Create a new protocol instance with default configuration
     * @returns New protocol instance
     */
    static create(): ActionCodesProtocol {
        return new ActionCodesProtocol();
    }

    /**
     * Create a new protocol instance with custom configuration
     * @param config - Custom configuration
     * @returns New protocol instance
     */
    static createWithConfig(config: Partial<ProtocolConfig>): ActionCodesProtocol {
        return new ActionCodesProtocol(config);
    }
}

// Export types for external use
export type { ActionCode, ActionCodeStatus, ActionCodeTransaction } from './actioncode';
export type { ProtocolMetaV1 } from './meta';

// Export constants
export { SUPPORTED_CHAINS } from './constants';
export type { SupportedChain } from './constants'; 