function escapeRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

class TextReplacer {
  private replacements: { [key: string]: string }
  private regex: RegExp

  constructor(replacements: { [key: string]: string }) {
    this.replacements = replacements
    const keys = Object.keys(replacements).sort((a, b) => b.length - a.length)
    const pattern = keys.map(escapeRegex).join('|')
    this.regex = new RegExp(pattern, 'g')
  }

  replace(text: string): string {
    return text.replace(this.regex, (match: string) => this.replacements[match])
  }
}

export const defaultReplacer = new TextReplacer({
  暴走萝莉: '金克斯'
})
