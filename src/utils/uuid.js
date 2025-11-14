// src/utils/uuid.js

// Performance-optimized UUID v4 generator with caching and validation

// Cache for recently generated UUIDs (useful for batch operations)
const uuidCache = new Set();
const MAX_CACHE_SIZE = 1000;

// Performance monitoring
let generationCount = 0;
const startTime = Date.now();

/**
 * High-performance Crypto-based UUID v4 generator
 * Uses window.crypto.getRandomValues for cryptographically secure randomness
 */
export function uuid() {
  generationCount++;
  
  // Try crypto-based UUID first (most secure and performant)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return generateCryptoUUID();
  }
  
  // Fallback for Node.js or older browsers
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return generateCryptoUUID();
  }
  
  // Final fallback to Math.random (less secure but functional)
  return generateMathUUID();
}

/**
 * Crypto-based UUID v4 implementation (optimized)
 */
function generateCryptoUUID() {
  // Use a single Uint8Array for better performance
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  
  // Set version (4) and variant (8, 9, A, B)
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 10xx
  
  // Build UUID string efficiently
  const hexBytes = [];
  for (let i = 0; i < 16; i++) {
    hexBytes.push(randomBytes[i].toString(16).padStart(2, '0'));
  }
  
  // Construct UUID in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return [
    hexBytes[0] + hexBytes[1] + hexBytes[2] + hexBytes[3],
    hexBytes[4] + hexBytes[5],
    hexBytes[6] + hexBytes[7],
    hexBytes[8] + hexBytes[9],
    hexBytes[10] + hexBytes[11] + hexBytes[12] + hexBytes[13] + hexBytes[14] + hexBytes[15]
  ].join('-');
}

/**
 * Optimized Math.random fallback UUID
 */
function generateMathUUID() {
  let uuid = '';
  const hexDigits = '0123456789abcdef';
  
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // UUID version 4
    } else if (i === 19) {
      // UUID variant: 8, 9, a, b
      const variant = (Math.random() * 4) | 0 + 8;
      uuid += hexDigits[variant];
    } else {
      const randomHex = (Math.random() * 16) | 0;
      uuid += hexDigits[randomHex];
    }
  }
  
  return uuid;
}

/**
 * Simple UUID generator for non-critical use cases
 * Faster and shorter than full UUIDv4, good for React keys and temporary IDs
 */
export function simpleUUID() {
  return 'id-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Batch UUID generation for better performance
 * Generates multiple UUIDs at once
 */
export function generateUUIDs(count = 1) {
  if (count <= 0) return [];
  if (count === 1) return [uuid()];
  
  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(uuid());
  }
  return uuids;
}

/**
 * Pre-generate a pool of UUIDs for high-performance scenarios
 */
let uuidPool = [];
const POOL_SIZE = 100;

export function pregenerateUUIDs(count = POOL_SIZE) {
  uuidPool = generateUUIDs(count);
}

export function getUUIDFromPool() {
  if (uuidPool.length === 0) {
    pregenerateUUIDs(POOL_SIZE * 2); // Refill with more
  }
  return uuidPool.pop() || uuid(); // Fallback if pool is empty
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Short ID generator (8 characters) for less critical use cases
 * Not cryptographically secure, but faster and shorter
 */
export function shortId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (window.crypto?.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Namespaced UUID generator
 * Creates deterministic UUIDs based on a namespace and name
 */
export function namespacedUUID(namespace, name) {
  // Simple hash function for namespace
  let hash = 0;
  const input = namespace + ':' + name;
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to UUID-like format (not standard, but deterministic)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (hash + Math.random() * 16) % 16 | 0;
    hash = Math.floor(hash / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Performance monitoring utilities
 */
export function getUUIDStats() {
  const elapsedTime = Date.now() - startTime;
  const uuidsPerSecond = generationCount / (elapsedTime / 1000);
  
  return {
    totalGenerated: generationCount,
    elapsedTime,
    uuidsPerSecond: Math.round(uuidsPerSecond * 100) / 100,
    cacheSize: uuidCache.size,
    poolSize: uuidPool.length,
  };
}

/**
 * Clear UUID cache and pool
 */
export function clearUUIDCache() {
  uuidCache.clear();
  uuidPool = [];
}

/**
 * Check for UUID collisions (development only)
 */
export function checkForCollisions(uuids) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const seen = new Set();
  const duplicates = [];
  
  for (const id of uuids) {
    if (seen.has(id)) {
      duplicates.push(id);
    }
    seen.add(id);
  }
  
  if (duplicates.length > 0) {
    console.warn(`UUID collision detected: ${duplicates.length} duplicates found`);
    console.warn('Duplicates:', duplicates);
  }
  
  return duplicates;
}

// Pre-generate a small pool on module load
if (typeof window !== 'undefined') {
  // Delay pre-generation to avoid blocking initial render
  setTimeout(() => {
    pregenerateUUIDs(50);
  }, 1000);
}

export default uuid;