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

import { sha256 } from "js-sha256";
import { CODE_LENGTH, CODE_TTL, MAX_PREFIX_LENGTH, MIN_PREFIX_LENGTH, PROTOCOL_CODE_PREFIX } from "./constants";

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
        if (prefix === PROTOCOL_CODE_PREFIX) return true;
        if (prefix.length < this.MIN_PREFIX_LENGTH || prefix.length > this.MAX_PREFIX_LENGTH) return false;
        return /^[A-Za-z]+$/.test(prefix);
    }

    /**
     * Validate generated code format (prefix + exactly 8 digits)
     * @param code - The code to validate
     * @returns True if code is valid, false otherwise
     */
    static validateCodeFormat(code: string): boolean {
        if (!code || typeof code !== 'string') return false;
        
        // Code must be exactly prefix length + 8 digits
        if (code.length < this.CODE_DIGITS) return false;
        
        // Find where the numeric part starts (last 8 characters)
        const numericPart = code.slice(-this.CODE_DIGITS);
        const prefixPart = code.slice(0, -this.CODE_DIGITS);
        
        // Numeric part must be exactly 8 digits, no more, no less
        if (numericPart.length !== this.CODE_DIGITS) return false;
        if (!/^[0-9]{8}$/.test(numericPart)) return false;
        
        // If there's a prefix part, validate it
        if (prefixPart.length > 0) {
            // Normalize the prefix for validation
            const normalizedPrefix = prefixPart.toUpperCase();
            if (normalizedPrefix === PROTOCOL_CODE_PREFIX) {
                // DEFAULT prefix is valid but should be empty in normalized form
                return true;
            }
            
            // Check prefix length and format
            if (normalizedPrefix.length < this.MIN_PREFIX_LENGTH || 
                normalizedPrefix.length > this.MAX_PREFIX_LENGTH) {
                return false;
            }
            
            // Prefix must contain only letters
            if (!/^[A-Za-z]+$/.test(normalizedPrefix)) return false;
        }
        
        return true;
    }

    /**
     * Validate that the numeric part of a code is exactly 8 digits
     * @param code - The code to validate (can include prefix)
     * @returns True if numeric part is valid, false otherwise
     */
    static validateCodeDigits(code: string): boolean {
        if (!code || typeof code !== 'string') return false;
        if (code.length < CODE_LENGTH) return false;
        
        // For codes without prefix, the entire code must be exactly 8 digits
        if (code.length === CODE_LENGTH) {
            return /^[0-9]{8}$/.test(code);
        }
        
        // For codes with prefix, the total length must be prefix + 8 digits
        // and the last 8 characters must be digits
        const numericPart = code.slice(-CODE_LENGTH);
        
        // Check if the numeric part is exactly 8 digits
        if (!/^[0-9]{8}$/.test(numericPart)) return false;
        
        // Check if the prefix part (everything before the last 8 chars) is valid
        const prefixPart = code.slice(0, -CODE_LENGTH);
        if (prefixPart.length > 0) {
            // Validate prefix format
            const normalizedPrefix = prefixPart.toUpperCase();
            if (normalizedPrefix === PROTOCOL_CODE_PREFIX) return true;
            
            if (normalizedPrefix.length < this.MIN_PREFIX_LENGTH || 
                normalizedPrefix.length > this.MAX_PREFIX_LENGTH) {
                return false;
            }
            
            if (!/^[A-Za-z]+$/.test(normalizedPrefix)) return false;
        }
        
        return true;
    }

    /**
     * Normalize prefix - convert PROTOCOL_CODE_PREFIX to empty string, validate others
     * @param prefix - The prefix to normalize
     * @returns Normalized prefix
     * @throws Error if prefix is invalid
     */
    static normalizePrefix(prefix: string): string {
        if (prefix === PROTOCOL_CODE_PREFIX) return "";
        if (!this.validatePrefix(prefix)) {
            throw new Error(`Invalid prefix: ${prefix}. Must be 3-12 letters or "${PROTOCOL_CODE_PREFIX}"`);
        }
        return prefix.toUpperCase();
    }

    /**
     * Generate a deterministic 8-digit code based on public key, prefix, and timestamp
     * @param pubkey - Solana wallet public key (base58)
     * @param prefix - Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)
     * @param timestamp - UNIX timestamp in milliseconds (defaults to now)
     * @returns Object containing code, issuedAt, and expiresAt timestamps
     * @throws Error if generated code is invalid
     */
    static generateCode(
        pubkey: string,
        prefix: string = PROTOCOL_CODE_PREFIX,
        timestamp: number = Date.now()
    ): { code: string; issuedAt: number; expiresAt: number } {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const input = `${normalizedPrefix}:${pubkey}:${timestamp}`;
        const hash = sha256(input);

        const raw = parseInt(hash.slice(0, 16), 16);
        const mod = 10 ** this.CODE_DIGITS;
        const code = raw % mod;

        const issuedAt = timestamp;
        const expiresAt = issuedAt + this.TIME_WINDOW_MS;

        const generatedCode = code.toString().padStart(this.CODE_DIGITS, "0");
        
        // Create the full code with prefix
        const fullCode = normalizedPrefix + generatedCode;
        
        // Validate the generated code
        if (!this.validateCodeFormat(fullCode)) {
            throw new Error(`Generated code validation failed: ${fullCode}`);
        }
        
        if (!this.validateCodeDigits(fullCode)) {
            throw new Error(`Generated code must be exactly 8 digits: ${fullCode}`);
        }

        return {
            code: fullCode,
            issuedAt,
            expiresAt
        };
    }

    /**
     * Derive the full SHA-256 hash for storage or encryption key generation
     * @param pubkey - Solana wallet public key (base58)
     * @param prefix - Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)
     * @param timestamp - UNIX timestamp in milliseconds (defaults to now)
     * @returns Full SHA-256 hash string
     */
    static deriveCodeHash(
        pubkey: string,
        prefix: string = PROTOCOL_CODE_PREFIX,
        timestamp?: number
    ): string {
        const normalizedPrefix = this.normalizePrefix(prefix);
        const ts = timestamp ?? Date.now();
        const input = `${normalizedPrefix}:${pubkey}:${ts}`;
        const hash = sha256(input);
        return hash;
    }

    /**
     * Get the expected code for a given public key and timestamp
     * @param pubkey - Solana wallet public key (base58)
     * @param timestamp - UNIX timestamp in milliseconds
     * @param prefix - Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)
     * @returns Full code string with prefix + 8 digits
     */
    static getExpectedCode(
        pubkey: string,
        timestamp: number,
        prefix: string = PROTOCOL_CODE_PREFIX
    ): string {
        return this.generateCode(pubkey, prefix, timestamp).code;
    }

    /**
     * Validate if a code matches the expected code for a given public key and timestamp
     * @param code - The code to validate (can include prefix)
     * @param pubkey - Solana wallet public key (base58)
     * @param timestamp - UNIX timestamp in milliseconds
     * @param prefix - Optional namespace prefix (default: PROTOCOL_CODE_PREFIX)
     * @returns True if code matches expected code and timestamp is valid
     */
    static validateCode(
        code: string,
        pubkey: string,
        timestamp: number,
        prefix: string = PROTOCOL_CODE_PREFIX
    ): boolean {
        // First validate the code format
        if (!this.validateCodeFormat(code)) {
            return false;
        }
        
        if (!this.validateCodeDigits(code)) {
            return false;
        }
        
        const expectedCode = this.getExpectedCode(pubkey, timestamp, prefix);
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
