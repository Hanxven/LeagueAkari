/**
 * if err != nil
 */
export async function go<T, E = unknown>(fn: () => T | Promise<T>): Promise<[T, null] | [null, E]>
export async function go<T, E = unknown>(promise: Promise<T>): Promise<[T, null] | [null, E]>
export async function go<T, E = unknown>(
  input: (() => T | Promise<T>) | Promise<T>
): Promise<[T, null] | [null, E]> {
  try {
    const data = typeof input === 'function' ? await input() : await input
    return [data, null]
  } catch (err) {
    return [null, err as E]
  }
}
