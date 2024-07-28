import { pinyin } from 'pinyin-pro'

function isSubsequence(s: string, t: string, caseSensitive = false): boolean {
  if (s.length === 0) return true
  if (t.length === 0) return false

  if (!caseSensitive) {
    s = s.toLowerCase()
    t = t.toLowerCase()
  }

  let index = 0
  for (let i = 0; i < t.length && index < s.length; i++) {
    if (s.length - index > t.length - i) return false
    if (s[index] === t[i]) {
      index++
    }
  }
  return index === s.length
}

export function isChampionNameMatch(pattern: string, title: string): boolean {
  if (!title) {
    return false
  }

  if (isSubsequence(pattern, title)) {
    return true
  }

  const titlePinyin = pinyin(title, { separator: '', toneType: 'none' })

  if (isSubsequence(pattern, titlePinyin)) {
    return true
  }

  const patternPinyin = pinyin(pattern, { separator: '', toneType: 'none' })

  if (isSubsequence(patternPinyin, titlePinyin)) {
    return true
  }

  return false
}

export function isChampionNameMatchKeywords(pattern: string, keywords: string[] | string): boolean {
  if (keywords.length === 0) {
    return false
  }

  if (typeof keywords === 'string') {
    return isChampionNameMatch(pattern, keywords)
  }

  if (keywords.some((keyword) => isChampionNameMatch(pattern, keyword))) {
    return true
  }

  return false
}
