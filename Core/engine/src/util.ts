// Deterministic helpers for the offline heuristic providers. Same input →
// same output, so pipeline runs are reproducible and testable. FNV-1a is
// plenty here — this is variety, not cryptography.

export function hashInt(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Deterministic integer in [min, max] derived from (seed, salt).
export function pick(seed: string, salt: string, min: number, max: number): number {
  return min + (hashInt(`${seed}:${salt}`) % (max - min + 1));
}

export function titleWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2);
}
