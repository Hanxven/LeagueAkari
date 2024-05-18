/**
 * Generate an integer of range [min, max] or [min, max)
 */
export function randomInt(min: number, max: number, inclusive = false) {
  return Math.floor(Math.random() * (max - min + (inclusive ? 1 : 0))) + min
}
