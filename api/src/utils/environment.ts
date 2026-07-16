export function isTestEnvironment(explicit: boolean = false): boolean {
  return explicit || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}
