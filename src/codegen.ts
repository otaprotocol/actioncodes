import { sha256 } from "js-sha256";
import { CODE_LENGTH, CODE_TTL, MAX_PREFIX_LENGTH, MIN_PREFIX_LENGTH, PROTOCOL_PREFIX } from "./constants";

export class CodeGenerator {
    static TIME_WINDOW_MS = CODE_TTL;
    static CODE_DIGITS = CODE_LENGTH;
    static MIN_PREFIX_LENGTH = MIN_PREFIX_LENGTH;
    static MAX_PREFIX_LENGTH = MAX_PREFIX_LENGTH;

    /**
     * Validate prefix format
     * @param prefix - The prefix to validate
     * @returns True if prefix is valid, false otherwise
     */
    static validatePrefix(prefix: string): boolean {
        if (prefix === "DEFAULT") return true;
        if (prefix.length < this.MIN_PREFIX_LENGTH || prefix.length > this.MAX_PREFIX_LENGTH) return false;
        return /^[A-Za-z]+$/.test(prefix);
    }

    /**
     * Normalize prefix - convert "DEFAULT" to empty string, validate others
     * @param prefix - The prefix to normalize
     * @returns Normalized prefix
     * @throws Error if prefix is invalid
     */
    static normalizePrefix(prefix: string): string {
        if (prefix === "DEFAULT") return "";
        if (!this.validatePrefix(prefix)) {
            throw new Error(`Invalid prefix: ${prefix}. Must be 3-12 letters or "DEFAULT"`);
        }
        return prefix.toUpperCase();
    }

    /**
     * Generate a deterministic 8-digit code based on public key, prefix, and timestamp
     * @param pubkey - Solana wallet public key (base58)
     * @param signature - User's signature string
     * @param prefix - Optional namespace prefix (default: "DEFAULT")
     * @param timestamp - UNIX timestamp in milliseconds (defaults to now)
     * @returns Object containing code, issuedAt, and expiresAt timestamps
     */
    static generateCode(
        pubkey: string,
        signature: string,
        prefix: string = "DEFAULT",
        timestamp: number = Date.now()
    ): { code: string; issuedAt: number; expiresAt: number } {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const input = `${normalizedPrefix}:${pubkey}:${timestamp}:${signature}`;
        const hash = sha256(input);

        const raw = parseInt(hash.slice(0, 16), 16);
        const mod = 10 ** this.CODE_DIGITS;
        const code = raw % mod;

        const issuedAt = timestamp;
        const expiresAt = issuedAt + this.TIME_WINDOW_MS;

        return {
            code: code.toString().padStart(this.CODE_DIGITS, "0"),
            issuedAt,
            expiresAt
        };
    }

    /**
     * Derive the full SHA-256 hash for storage or encryption key generation
     * @param pubkey - Solana wallet public key (base58)
     * @param prefix - Optional namespace prefix (default: "DEFAULT")
     * @param timestamp - UNIX timestamp in milliseconds (defaults to now)
     * @returns Full SHA-256 hash string
     */
    static deriveCodeHash(
        pubkey: string,
        prefix: string = "DEFAULT",
        timestamp?: number
    ): string {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const ts = timestamp ?? Date.now();
        const input = `${normalizedPrefix}:${pubkey}:${ts}`;
        const hash = sha256(input);
        return hash;
    }

    /**
     * Generate the message that should be signed for code verification
     * @param code - The generated 8-digit code
     * @param timestamp - UNIX timestamp in milliseconds
     * @returns Message string in format "actioncodes:<code>:<timestamp>"
     */
    static generateCodeSignatureMessage(code: string, timestamp: number): string {
        return `${PROTOCOL_PREFIX}:${code}:${timestamp}`;
    }

    /**
     * Get the expected code for a given public key and timestamp
     * @param pubkey - Solana wallet public key (base58)
     * @param timestamp - UNIX timestamp in milliseconds
     * @param signature - User's signature string
     * @param prefix - Optional namespace prefix (default: "DEFAULT")
     * @returns 8-digit numeric string
     */
    static getExpectedCode(
        pubkey: string,
        timestamp: number,
        signature: string,
        prefix: string = "DEFAULT"
    ): string {
        return this.generateCode(pubkey, signature, prefix, timestamp).code;
    }

    /**
     * Validate if a code matches the expected code for a given public key and timestamp
     * @param code - The code to validate
     * @param pubkey - Solana wallet public key (base58)
     * @param timestamp - UNIX timestamp in milliseconds
     * @param signature - User's signature string
     * @param prefix - Optional namespace prefix (default: "DEFAULT")
     * @returns True if code matches expected code and timestamp is valid
     */
    static validateCode(
        code: string,
        pubkey: string,
        timestamp: number,
        signature: string,
        prefix: string = "DEFAULT"
    ): boolean {
        const expectedCode = this.getExpectedCode(pubkey, timestamp, signature, prefix);
        const now = Date.now();
        const isTimeValid = timestamp >= 0 && timestamp <= now && now <= timestamp + this.TIME_WINDOW_MS;
        return code === expectedCode && isTimeValid;
    }

    /**
     * Check if a timestamp falls within a valid time window
     * @param timestamp - UNIX timestamp in milliseconds
     * @returns True if timestamp is valid
     */
    static isValidTimestamp(timestamp: number): boolean {
        return timestamp >= 0 && timestamp <= Date.now() + this.TIME_WINDOW_MS;
    }
}
