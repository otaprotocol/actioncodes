import { CodeGenerator } from "./codegen";
import { SUPPORTED_CHAINS } from "./constants";

export type ActionCodeStatus = 'pending' | 'resolved' | 'finalized' | 'expired' | 'error';

export interface ActionCodeMetadata {
    description?: string;
    params?: Record<string, any>;
}

export interface ActionCodeTransaction<T> {
    transaction?: T; // T = string for Solana (base64)
    txSignature?: string; // Solana signature
    txType?: string; // Transaction type for categorization
}

export interface ActionCodeFields<T> {
    code: string;
    prefix: string;
    pubkey: string;
    timestamp: number;
    signature: string;
    chain: (typeof SUPPORTED_CHAINS)[number];
    transaction?: ActionCodeTransaction<T>;
    metadata?: ActionCodeMetadata;
    expiresAt: number;
    status: ActionCodeStatus;
}

export class ActionCode<T> {
    constructor(private fields: ActionCodeFields<T>) { }

    static fromPayload<T>(input: ActionCodeFields<T>): ActionCode<T> { // TODO: rename to fromFields
        if (!input.code || !input.pubkey || !input.signature || !input.timestamp || !input.expiresAt || !input.chain || !input.status) {
            throw new Error("Missing required fields in ActionCode payload");
        }
        return new ActionCode(input);
    }

    static fromEncoded<T>(encoded: string): ActionCode<T> { // TODO: rename to fromEncoded
        const decoded = JSON.parse(atob(encoded));
        return ActionCode.fromPayload(decoded);
    }

    get encoded(): string {
        return btoa(JSON.stringify(this.fields));
    }

    get isValid(): boolean { // TODO: rename to isValid
        return CodeGenerator.validateCode(
            this.fields.code,
            this.fields.pubkey,
            this.fields.timestamp,
            this.fields.signature,
            this.fields.prefix
        );
    }

    get json(): ActionCodeFields<T> {
        return this.fields;
    }

    // UX-focused helper methods

    /**
     * Get remaining time in milliseconds until expiration
     * @returns Remaining time in milliseconds, or 0 if expired
     */
    get remainingTime(): number { // TODO: rename to remainingTime
        const now = Date.now();
        return Math.max(0, this.fields.expiresAt - now); // TODO: rename to remainingTime
    }

    /**
     * Check if the action code has expired
     * @returns True if the code has expired
     */
    get expired(): boolean {
        return this.remainingTime === 0; // TODO: rename to expired
    }

    /**
     * Get the target chain for this action code
     * @returns Chain identifier (e.g., "solana", "evm")
     */
    get chain(): string {
        return this.fields.chain;
    }

    /**
     * Get the current status of the action code
     * @returns Current status
     */
    get status(): ActionCodeStatus {
        return this.fields.status;
    }

    /**
     * Get the action code string
     * @returns The 8-character action code
     */
    get code(): string {
        return this.fields.code;
    }

    /**
     * Get the prefix used for this action code
     * @returns Normalized prefix
     */
    get prefix(): string {
        return this.fields.prefix;
    }

    /**
     * Get the user's public key
     * @returns User's public key
     */
    get pubkey(): string {
        return this.fields.pubkey;
    }

    /**
     * Get the transaction data (chain-specific)
     * @returns Transaction data or undefined
     */
    get transaction(): ActionCodeTransaction<T> | undefined {
        return this.fields.transaction;
    }

    /**
     * Get metadata associated with this action code
     * @returns Metadata object or undefined
     */
    get metadata(): ActionCodeFields<T>['metadata'] | undefined {
        return this.fields.metadata;
    }

    /**
     * Get a human-readable description of the action
     * @returns Description string or undefined
     */
    get description(): string | undefined {
        return this.fields.metadata?.description;
    }

    /**
     * Get parameters associated with this action
     * @returns Parameters object or undefined
     */
    get params(): Record<string, any> | undefined {
        return this.fields.metadata?.params;
    }

    /**
     * Get the timestamp when the code was generated
     * @returns Timestamp in milliseconds
     */
    get timestamp(): number {
        return this.fields.timestamp;
    }

    /**
     * Get the user's signature
     * @returns User's signature string
     */
    get signature(): string {
        return this.fields.signature;
    }

    /**
     * Get a human-readable display string for the action code
     * @returns Formatted display string
     */
    get displayString(): string {
        const prefix = this.fields.prefix === 'DEFAULT' ? '' : `${this.fields.prefix}-`;
        const code = this.fields.code;
        const chain = this.fields.chain;
        const status = this.fields.status;

        return `${prefix}${code} (${chain}, ${status})`;
    }

    /**
     * Get a formatted time string showing remaining time
     * @returns Human-readable time string (e.g., "1m 30s remaining")
     */
    get remainingTimeString(): string {
        const remaining = this.remainingTime;
        if (remaining === 0) {
            return 'Expired';
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s remaining`;
        } else {
            return `${seconds}s remaining`;
        }
    }

    /**
     * Get the code hash for this action code
     * it is also used in the protocol meta as the code id
     * @returns Code hash string
     */
    get codeHash(): string {
        return CodeGenerator.deriveCodeHash(this.fields.pubkey, this.fields.prefix, this.fields.timestamp);
    }
}