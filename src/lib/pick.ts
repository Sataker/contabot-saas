/**
 * Copies only the allowed string fields from an untrusted request body.
 * Used by PATCH handlers so a client can never write tenantId, id or other
 * server-owned columns (mass assignment), and so non-string values are dropped.
 */
export function pickStrings<K extends string>(body: unknown, allowed: readonly K[]): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  if (!body || typeof body !== "object") return out;
  for (const key of allowed) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
