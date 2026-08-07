"use client";

/**
 * Client-side presigned-URL cache. Batches sign requests per call and caches
 * results until shortly before the server-side TTL (1h) expires, so a grid of
 * N media only ever costs one round-trip per album view.
 */

interface CacheEntry {
  url: string;
  expiresAt: number;
}

// Server signs GET URLs for 1h; expire our cache a little earlier to be safe.
const CLIENT_TTL_MS = 55 * 60 * 1000;

const cache = new Map<string, CacheEntry>();

/** Returns cached URLs immediately + signs any missing/expired keys in one request. */
export async function signKeys(
  keys: string[],
): Promise<Record<string, string>> {
  const now = Date.now();
  const result: Record<string, string> = {};
  const missing: string[] = [];

  for (const key of keys) {
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      result[key] = hit.url;
    } else if (!missing.includes(key)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const res = await fetch("/api/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: missing }),
    });
    if (!res.ok) {
      throw new Error("Falha ao assinar URLs");
    }
    const { urls } = (await res.json()) as { urls: Record<string, string> };
    const expiresAt = Date.now() + CLIENT_TTL_MS;
    for (const [key, url] of Object.entries(urls)) {
      cache.set(key, { url, expiresAt });
      result[key] = url;
    }
  }

  return result;
}

/** Sign a single key (used by the "download original" action). */
export async function signKey(key: string): Promise<string> {
  const urls = await signKeys([key]);
  return urls[key];
}
