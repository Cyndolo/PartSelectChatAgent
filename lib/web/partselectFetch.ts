import { getCache, setCache } from "@/lib/cache";

type FetchOptions = {
  timeoutMs?: number;
};

function cacheKey(url: string) {
  return `partselect:fetch:${url}`;
}

export async function fetchPartSelectPage(url: string, options: FetchOptions = {}) {
  const key = cacheKey(url);
  const cached = getCache<string>(key);
  if (cached) return cached;

  const timeoutMs = options.timeoutMs ?? 800;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!response.ok) {
      throw new Error(`PartSelect fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    setCache(key, html, 10 * 60 * 1000);
    return html;
  } finally {
    clearTimeout(timeout);
  }
}
