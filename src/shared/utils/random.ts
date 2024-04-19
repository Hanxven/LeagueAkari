/**
 * Generate an integer of range [min, max]
 *
 * P.S **NOT** [min, max)
 */
export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
