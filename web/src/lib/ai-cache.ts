import "server-only";
import { createHash } from "crypto";
import { db } from "./db";

/**
 * Layer 3 of the ecosystem caching playbook: shared AI-result cache.
 * Read-through over public.t100u_ai_cache — key = sha256(model+system+prompt+params),
 * app='vitrina'. Deterministic AI work only (translations, palettes, parses);
 * never personalized output, never PII in cached values.
 */
export function aiCacheKey(parts: Record<string, unknown>): string {
  return createHash("sha256")
    .update(JSON.stringify(parts, Object.keys(parts).sort()))
    .digest("hex");
}

export async function aiCached<T>(
  kind: string,
  keyParts: Record<string, unknown>,
  model: string,
  compute: () => Promise<T>
): Promise<T> {
  const key = aiCacheKey(keyParts);
  const client = db();

  const { data: hit } = await client
    .from("t100u_ai_cache")
    .select("value, hits")
    .eq("cache_key", key)
    .maybeSingle();
  if (hit) {
    // Fire-and-forget hit counter (proves cache value; failure is harmless).
    void client
      .from("t100u_ai_cache")
      .update({ hits: (hit.hits ?? 0) + 1 })
      .eq("cache_key", key)
      .then(() => undefined);
    return hit.value as T;
  }

  const value = await compute();
  // Permanent entry (expires_at null): translations are deterministic per input.
  await client.from("t100u_ai_cache").insert({
    cache_key: key,
    app: "vitrina",
    kind,
    value: value as object,
    model,
  });
  return value;
}
