import { pinyin } from 'pinyin-pro'

function isSubsequence(s: string, t: string): boolean {
  if (s.length === 0) return true
  if (t.length === 0) return false

  let index = 0
  for (let i = 0; i < t.length && index < s.length; i++) {
    if (s.length - index > t.length - i) return false
    if (s[index] === t[i]) {
      index++
    }
  }
  return index === s.length
}

export function isChampionNameMatch(pattern: string, title: string, name?: string): boolean {
  if (!title) {
    return false
  }

  if (isSubsequence(pattern, title) || (name && isSubsequence(pattern, name))) {
    return true
  }

  const titlePinyin = pinyin(title, { separator: '', toneType: 'none' })

  if (isSubsequence(pattern, titlePinyin)) {
    return true
  }

  if (name) {
    const namePinyin = pinyin(name, { separator: '', toneType: 'none' })

    if (isSubsequence(pattern, namePinyin)) {
      return true
    }
  }

  const patternPinyin = pinyin(pattern, { separator: '', toneType: 'none' })

  if (isSubsequence(patternPinyin, titlePinyin)) {
    return true
  }

  return false
}
