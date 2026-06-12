import { gunzipSync } from "node:zlib";
import { getCache, setCache } from "@/lib/cache";
import type { ApplianceType } from "@/lib/types";

export type PartSelectSearchCandidate = {
  title: string;
  url: string;
};

function normalizeUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl, "https://www.partselect.com");
    const redirected = parsed.searchParams.get("uddg");
    return redirected ? decodeURIComponent(redirected) : parsed.toString();
  } catch {
    return rawUrl;
  }
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function slugToTitle(url: string) {
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(slug).replace(/[-_]/g, " ").replace(/\.htm$/i, "").trim();
  } catch {
    return url;
  }
}

function buildQuery(query: string) {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

function cacheKey(query: string) {
  return `partselect:search:${query.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

function sharedHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
  };
}

async function fetchText(url: string, timeoutMs = 800) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(url, { headers: sharedHeaders(), signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new Error(`fetch failed with status ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (url.endsWith(".gz")) {
    return gunzipSync(buffer).toString("utf8");
  }
  return buffer.toString("utf8");
}

async function getSitemapUrls() {
  const key = "partselect:sitemap-master";
  const cached = getCache<string[]>(key);
  if (cached) return cached;

  const xml = await fetchText("https://www.partselect.com/sitemaps/PartSelect.com_Sitemap_Master.xml");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  setCache(key, urls, 24 * 60 * 60 * 1000);
  return urls;
}

function tokenize(query: string) {
  return query
    .split(/[^a-zA-Z0-9]+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 2 && !["with", "your", "the", "for", "part", "number", "can", "you", "help", "find", "model", "this", "that", "how"].includes(term));
}

function scoreCandidate(url: string, terms: string[], exactPartNumber: string | null) {
  const normalized = url.toLowerCase();
  const path = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return normalized;
    }
  })();
  let score = 0;
  for (const term of terms) {
    if (normalized.includes(term)) score += 3;
  }
  if (exactPartNumber && normalized.includes(exactPartNumber)) score += 8;
  if (/repair/i.test(normalized)) score += 2;
  if (/\/repair\/[^/]+\/[^/]+\.htm/i.test(path)) score += 4;
  if (/\/repair\/[^/]+\/?$/.test(path) || path === "/repair/") score -= 4;
  return score;
}

async function searchSitemapForCandidates(
  sitemapUrl: string,
  query: string,
  limit = 6,
  applianceType?: ApplianceType | null
) {
  const xml = await fetchText(sitemapUrl);
  const terms = tokenize(query);
  const queryLower = buildQuery(query);
  const exactPartNumber = query.match(/PS\d{8}/i)?.[0]?.toLowerCase() ?? null;
  const candidates: Array<PartSelectSearchCandidate & { score: number }> = [];

  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = match[1];
    const normalizedUrl = url.toLowerCase();
    let matched = false;

    if (exactPartNumber) {
      matched = normalizedUrl.includes(exactPartNumber);
    } else if (queryLower && normalizedUrl.includes(queryLower)) {
      matched = true;
    } else if (terms.length > 0) {
      matched = terms.every((term) => normalizedUrl.includes(term)) || scoreCandidate(url, terms, exactPartNumber) >= 5;
    }

    if (matched && applianceType) {
      const appliancePath = applianceType.toLowerCase();
      if (sitemapUrl.toLowerCase().includes("repair")) {
        matched = normalizedUrl.includes(`/repair/${appliancePath}/`);
      }
    }

    if (!matched) continue;

    const score = scoreCandidate(url, terms, exactPartNumber);
    candidates.push({
      title: slugToTitle(url),
      url,
      score
    });
  }

  return candidates
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ score: _score, ...candidate }) => candidate);
}

async function searchSearchEngineFallback(query: string) {
  const normalizedQuery = `site:partselect.com ${query}`.trim();
  const results: PartSelectSearchCandidate[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 800);
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(normalizedQuery)}`, {
      headers: sharedHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (response.ok) {
      const html = await response.text();
      const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      for (const match of html.matchAll(pattern)) {
        const href = normalizeUrl(match[1]);
        const title = stripHtml(match[2]);
        if (!/partselect\.com/i.test(href) || !title) continue;
        results.push({ title, url: href });
        if (results.length >= 6) break;
      }
    }
  } catch {
    // Ignore and try Bing below.
  }

  if (results.length < 3) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);
      const response = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(normalizedQuery)}`, {
        headers: sharedHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (response.ok) {
        const html = await response.text();
        const pattern = /<li class="b_algo"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        for (const match of html.matchAll(pattern)) {
          const href = normalizeUrl(match[1]);
          const title = stripHtml(match[2]);
          if (!/partselect\.com/i.test(href) || !title) continue;
          results.push({ title, url: href });
          if (results.length >= 6) break;
        }
      }
    } catch {
      // Ignore search engine fallback errors and return what we already have.
    }
  }

  return results.filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);
}

export async function searchPartSelect(
  query: string,
  applianceType?: ApplianceType | null
): Promise<PartSelectSearchCandidate[]> {
  const normalizedQuery = buildQuery(query);
  const key = cacheKey(normalizedQuery);
  const cached = getCache<PartSelectSearchCandidate[]>(key);
  if (cached) return cached;

  const sitemapUrls = await getSitemapUrls();
  const lower = normalizedQuery.toLowerCase();
  const hasRepairIntent = /repair|troubleshoot|not working|leaking|ice maker|no ice|noise|dirty dishes|broken/i.test(lower);
  const candidateSitemaps = sitemapUrls.filter((url) => {
    if (hasRepairIntent) return /Repairs/i.test(url) || /CategoryPages/i.test(url) || /Blogs/i.test(url);
    return /PartDetail/i.test(url) || /Models/i.test(url) || /CategoryPages/i.test(url);
  });

  const results: PartSelectSearchCandidate[] = [];
  for (const sitemapUrl of candidateSitemaps.slice(0, 4)) {
    try {
      const matches = await searchSitemapForCandidates(sitemapUrl, normalizedQuery, 6, applianceType);
      results.push(...matches);
      if (results.length >= 6) break;
    } catch {
      // Try the next sitemap shard.
    }
  }

  const uniqueResults = results.filter(
    (item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index
  );

  if (uniqueResults.length === 0) {
    const fallback = await searchSearchEngineFallback(normalizedQuery);
    setCache(key, fallback);
    return fallback;
  }

  setCache(key, uniqueResults);
  return uniqueResults;
}
