type InferReturn =
  | { type: 'summonerId'; value: number }
  | { type: 'puuid'; value: string }
  | { type: 'name'; value: string; isWithTagLine: boolean }

// 根据输入推测可能的查询类型
export function inferType(str: string) {
  const res: InferReturn[] = []

  const numberId = Number(str)
  if (!Number.isNaN(numberId)) {
    res.push({
      type: 'summonerId',
      value: numberId
    })
  }

  if (str.includes('-')) {
    res.push({
      type: 'puuid',
      value: str
    })
  } else {
    res.push({
      type: 'name',
      value: str,
      isWithTagLine: str.includes('#')
    })
  }

  return res
}

export function resolveSummonerName(nameWithTag: string) {
  return nameWithTag.split('#', 2) as [string, string]
}
