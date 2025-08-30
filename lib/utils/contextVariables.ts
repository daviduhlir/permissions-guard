export function mergeVariables(...vars: Record<string, string[]>[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const varSet of vars) {
    if (!varSet) {
      continue
    }
    for (const key of Object.keys(varSet)) {
      if (!result[key]) {
        result[key] = []
      }
      result[key].push(...varSet[key])
    }
  }
  return result
}
