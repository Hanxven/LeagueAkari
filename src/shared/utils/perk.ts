export function eogPerkStat(template: string, vars: Record<string, string>): string {
  const placeholderPattern = /@(\w+)@/g

  const result = template.replace(placeholderPattern, (_, varName) => {
    return vars[varName] !== undefined ? vars[varName] : `@${varName}@`
  })

  return result
}
