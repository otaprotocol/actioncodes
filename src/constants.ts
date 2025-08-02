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

export const PROTOCOL_VERSION = "1";
export const PROTOCOL_PREFIX = "actioncodes";
export const CODE_LENGTH = 8;
export const CODE_TTL = 1000 * 60 * 2; // 2 minutes
export const PROTOCOL_CODE_PREFIX = "DEFAULT";
export const MIN_PREFIX_LENGTH = 3;
export const MAX_PREFIX_LENGTH = 12;
export const SUPPORTED_CHAINS = ["solana"] as const;
export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];