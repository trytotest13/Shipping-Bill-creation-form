export function formatAmount(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

// Fallback for display/payload strings where an empty string counts as "not set".
// Distinct from ?? so blank values still fall through, matching the historical behaviour.
export function textOr(value: string | undefined, fallback: string) {
  if (value) return value
  return fallback
}
