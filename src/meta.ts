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

import { CodeGenerator } from './codegen';
import { PROTOCOL_VERSION, PROTOCOL_PREFIX } from './constants';

/**
 * Protocol meta structure for code verification
 */
export interface ProtocolMetaV1 {
  version: string;
  prefix: string;
  initiator: string;
  id: string;
  iss?: string; // issuer (protocol authority)
  params?: string;
}

/**
 * Protocol meta parser for structured memo/message parsing
 */
export class ProtocolMetaParser {
  private static readonly PROTOCOL_REGEX = /^([^:]+):v=(\d+)&pre=([^&]*)&ini=([^&]*)&id=([^&]*)&iss=([^&]+)(?:&p=([^&]+))?$/;

  /**
   * Parse protocol meta from string
   * @param metaString - The protocol meta string to parse
   * @returns Parsed ProtocolMeta object or null if invalid
   */
  static parse(metaString: string): ProtocolMetaV1 | null {
    const match = metaString.match(this.PROTOCOL_REGEX);
    if (!match) {
      return null;
    }

    const [, protocolPrefix, version, prefix, initiator, id, iss, params] = match;

    // Validate protocol prefix
    if (protocolPrefix !== PROTOCOL_PREFIX) {
      return null;
    }

    return {
      version,
      prefix,
      initiator,
      id,
      iss,
      params: params || undefined
    };
  }

  /**
   * Serialize ProtocolMeta to string
   * @param meta - The protocol meta to serialize
   * @returns Serialized protocol meta string
   */
  static serialize(meta: ProtocolMetaV1): string {
    let result = `${PROTOCOL_PREFIX}:v=${meta.version}&pre=${meta.prefix}&ini=${meta.initiator}&id=${meta.id}&iss=${meta.iss}`;

    if (meta.params) {
      result += `&p=${meta.params}`;
    }

    return result;
  }

  /**
   * Create protocol meta from code and parameters
   * @param initiator - The initiator public key
   * @param iss - The issuer (protocol authority)
   * @param prefix - The prefix (default: "DEFAULT")
   * @param params - Optional parameters
   * @param timestamp - Optional timestamp
   * @returns ProtocolMeta object
   */
  static fromInitiator(
    initiator: string,
    iss: string,
    prefix: string = "DEFAULT",
    params?: string,
    timestamp?: number
  ): ProtocolMetaV1 {
    const codeHash = CodeGenerator.deriveCodeHash(initiator, prefix, timestamp);

    return {
      version: PROTOCOL_VERSION,
      prefix,
      initiator,
      id: codeHash,
      iss,
      params
    };
  }

  /**
   * Validate if a code matches the protocol meta
   * @param meta - The protocol meta to validate against
   * @param timestamp - Optional timestamp for validation (if not provided, uses current time)
   * @returns True if the meta is valid
   */
  static validateCode(meta: ProtocolMetaV1, timestamp?: number): boolean {
    const expectedHash = CodeGenerator.deriveCodeHash(meta.initiator, meta.prefix, timestamp);
    return meta.id === expectedHash;
  }

  /**
   * Validate if a code matches the protocol meta by parsing from string
   * @param metaString - The protocol meta string to validate against
   * @param timestamp - Optional timestamp for validation (if not provided, uses current time)
   * @returns True if the code matches the meta
   */
  static validateMetaFromString(metaString: string, timestamp?: number): boolean {
    const meta = this.parse(metaString);
    if (!meta) {
      return false;
    }
    return this.validateCode(meta, timestamp);
  }
}
