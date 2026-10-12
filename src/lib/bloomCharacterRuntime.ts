import { version } from '@oxy.so/bloom/package.json';

// Version the whole directory: the engine loads sibling modules and geometry on demand.
export const BLOOM_CHARACTER_BASE = `/bloom-character/${version}/`;
export const BLOOM_CHARACTER_RUNTIME_URL = `${BLOOM_CHARACTER_BASE}runtime.mjs`;
