let bootstrapComplete = false

export function isBootstrapComplete(): boolean {
  return bootstrapComplete
}

export function markBootstrapComplete(): void {
  bootstrapComplete = true
}

/** Test-only reset; production startup is deliberately one-way. */
export function resetBootstrapState(): void {
  bootstrapComplete = false
}
