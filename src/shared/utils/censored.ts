export interface Word {
  word: string
  replaceBy?: string
}

/**
 * 用于敏感词替换的工具，避免发送聊天时被屏蔽。
 * @param words 初始化的单词列表
 * @returns 一个用于替换的函数实例
 */
export function createSensitiveWordsReplacer(words: Word[]) {
  const map = new Map<string, string | undefined>()
  words.forEach((w) => map.set(w.word, w.replaceBy))
  const regexpRaw = words.map((w) => w.word).join('|')
  const regexp = new RegExp(`(${regexpRaw})`, 'g')

  return (str: string) => {
    return str.replaceAll(regexp, (s) => map.get(s) ?? '*'.repeat(s.length))
  }
}

// 占位用途，暂未实装
export const sensitiveWordsReplacer = createSensitiveWordsReplacer([
  { word: '萝莉', replaceBy: '罗利' },
  { word: '泉此方', replaceBy: 'Izumi Konata' },
  { word: '柊镜', replaceBy: 'Hiiragi Kagami' }
])
