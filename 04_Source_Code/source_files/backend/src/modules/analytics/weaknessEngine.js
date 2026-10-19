const clamp = (value) => Math.max(0, Math.min(100, value))

export function calculateWeaknessComponents({
  attempted,
  solved,
  failed,
  unsolved,
  wrongAnswerCount,
  timeLimitCount,
  runtimeErrorCount,
  daysSincePractice,
}) {
  const safeAttempted = Math.max(attempted, 1)
  const acRate = attempted ? (solved / attempted) * 100 : 0
  const conversionPenalty = attempted ? 100 - acRate : 0
  const retryPenalty = clamp((failed / (safeAttempted * 3)) * 100)
  const unsolvedPenalty = clamp((unsolved / safeAttempted) * 100)
  const weightedVerdicts = wrongAnswerCount + timeLimitCount * 1.5 + runtimeErrorCount * 1.2
  const verdictPenalty = clamp((weightedVerdicts / (safeAttempted * 2)) * 100)
  const recencyPenalty = clamp(((daysSincePractice ?? 0) / 30) * 100)

  return {
    conversionPenalty: Math.round(conversionPenalty),
    retryPenalty: Math.round(retryPenalty),
    unsolvedPenalty: Math.round(unsolvedPenalty),
    verdictPenalty: Math.round(verdictPenalty),
    recencyPenalty: Math.round(recencyPenalty),
  }
}

export function calculateWeaknessScore(input) {
  const components = calculateWeaknessComponents(input)
  const score =
    components.conversionPenalty * 0.35 +
    components.retryPenalty * 0.2 +
    components.unsolvedPenalty * 0.25 +
    components.verdictPenalty * 0.1 +
    components.recencyPenalty * 0.1

  return { score: Math.round(clamp(score)), components }
}
