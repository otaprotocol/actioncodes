import { ProtocolMetaV1 } from '../meta';

/**
 * Base adapter class for chain-specific protocol meta operations
 * @template T - Chain-specific transaction type
 */
export abstract class BaseChainAdapter<T = any> {
    abstract readonly chain: string;

    /**
     * Encode protocol meta for this chain
     * @param meta - ProtocolMetaV1 object
     * @returns Chain-specific encoded data
     */
    abstract encode(meta: ProtocolMetaV1): any;

    /**
     * Decode protocol meta from chain-specific transaction
     * @param tx - Chain-specific transaction
     * @returns Decoded ProtocolMetaV1 or null
     */
    abstract decode(tx: T): ProtocolMetaV1 | null;

    /**
     * Validate transaction with protocol meta and authority list
     * @param tx - Chain-specific transaction
     * @param authorities - Array of valid protocol authority identifiers
     * @param expectedPrefix - Expected protocol prefix (default: 'DEFAULT')
     * @returns True if transaction is valid
     */
    abstract validate(tx: T, authorities: string[], expectedPrefix?: string): boolean;

    /**
     * Check if the issuer has signed the transaction
     * @param tx - Chain-specific transaction
     * @param issuer - Issuer public key to check
     * @returns True if issuer has signed
     */
    abstract hasIssuerSignature(tx: T, issuer: string): boolean;

    /**
     * Detect tampered transactions by cross-checking metadata
     * @param tx - Chain-specific transaction
     * @param authorities - Array of valid protocol authority identifiers
     * @param expectedPrefix - Expected protocol prefix
     * @returns True if transaction is valid and not tampered
     */
    detectTampering(tx: T, authorities: string[], expectedPrefix: string = 'DEFAULT'): boolean {
        // First, decode the protocol meta from the transaction
        const meta = this.decode(tx);
        if (!meta) {
            return false; // No protocol meta found
        }

        // Validate the meta structure
        if (meta.version !== '1') {
            return false; // Invalid version
        }

        if (meta.prefix !== expectedPrefix) {
            return false; // Wrong prefix
        }

        // Check if issuer is in the authorities list
        if (!meta.iss || !authorities.includes(meta.iss)) {
            return false; // Invalid issuer
        }

        // Verify the issuer has actually signed the transaction
        if (!this.hasIssuerSignature(tx, meta.iss)) {
            return false; // Issuer didn't sign
        }

        // Additional chain-specific validation
        return this.validateTransactionIntegrity(tx, meta);
    }

    /**
     * Chain-specific transaction integrity validation
     * Override this method for additional validation logic
     * @param tx - Chain-specific transaction
     * @param meta - Decoded protocol meta
     * @returns True if transaction integrity is valid
     */
    protected abstract validateTransactionIntegrity(tx: T, meta: ProtocolMetaV1): boolean;
} 