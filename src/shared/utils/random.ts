/**
 * Generate an integer of range [min, max] or [min, max)
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive or inclusive)
 * @param inclusive - Whether the max value is inclusive default: false
 * @returns Random integer between min and max
 */
export function randomInt(min: number, max: number, inclusive = false) {
  return Math.floor(Math.random() * (max - min + (inclusive ? 1 : 0))) + min
}
