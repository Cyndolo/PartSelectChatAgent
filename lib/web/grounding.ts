import { createSource } from "@/lib/catalog/normalize";
import { getCache, setCache } from "@/lib/cache";
import type { Source, Product, ApplianceType } from "@/lib/types";
import { searchPartSelect } from "@/lib/web/partselectSearch";
import { fetchPartSelectPage } from "@/lib/web/partselectFetch";
import { extractPartData } from "@/lib/web/extractPartData";
import { extractRepairGuide } from "@/lib/web/extractRepairGuide";

type LivePartResult = {
  status: "verified_live" | "demo_fallback";
  product: Product | null;
  sources: Source[];
  reason?: string;
};

type LiveRepairResult = {
  status: "verified_live" | "demo_fallback";
  issue: string;
  diagnosticChecklist: string[];
  possibleCauses: string[];
  recommendedParts: Product[];
  sources: Source[];
  reason?: string;
};

function cacheKey(prefix: string, query: string) {
  return `${prefix}:${query.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

function timeoutResult<T>(value: T, timeoutMs = 1200): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), timeoutMs);
  });
}

function normalizeAvailability(value: string | null): Product["availability"] | null {
  if (!value) return null;
  if (/in stock/i.test(value)) return "In stock";
  if (/limited/i.test(value)) return "Limited stock";
  if (/out of stock/i.test(value)) return "Out of stock";
  return "In stock";
}

function buildProductFromPage(data: ReturnType<typeof extractPartData>, sourceType: Source["type"]): Product | null {
  if (!data.partNumber || data.price === null || !data.availability) return null;

  const partNumber = data.partNumber.toUpperCase();
  const manufacturerPartNumber = (data.manufacturerPartNumber ?? partNumber).toUpperCase();
  const typeSource = `${data.modelType ?? ""} ${data.category ?? ""} ${data.description ?? ""} ${data.name}`.toLowerCase();

  return {
    partNumber,
    manufacturerPartNumber,
    name: data.name,
    description: data.description ?? data.name,
    applianceType: /dishwasher/i.test(typeSource) ? "dishwasher" : "refrigerator",
    brand: data.brand ?? "PartSelect",
    price: data.price,
    availability: normalizeAvailability(data.availability) ?? "In stock",
    compatibleModels: data.compatibleModels,
    symptoms: data.symptoms,
    installationSteps: data.installationInstructions,
    sourceUrl: data.sourceUrl,
    sourceType
  };
}

function liveSources(title: string, url: string, type: Source["type"]) {
  return [createSource(title, url, type)];
}

function hasUsefulRepairGuide(guide: ReturnType<typeof extractRepairGuide>) {
  return (
    guide.diagnosticSteps.length > 0 &&
    guide.diagnosticSteps.every((step) => step.length <= 260) &&
    !guide.diagnosticSteps.some((step) =>
      /skip to main content|sign in|create account|departments|brands|price match guarantee/i.test(step)
    )
  );
}

async function lookupLivePartUnbounded(query: string): Promise<LivePartResult> {
  const key = cacheKey("live-part", query);
  const cached = getCache<LivePartResult>(key);
  if (cached) return cached;

  try {
    const exactPartNumber = query.match(/PS\d{8}/i)?.[0] ?? null;
    const variants = Array.from(
      new Set(
        [query, exactPartNumber, exactPartNumber ? `${exactPartNumber} PartSelect` : null, `${query} PartSelect`]
          .filter((value): value is string => Boolean(value))
      )
    );

    for (const variant of variants) {
      const candidates = await searchPartSelect(variant);
      for (const candidate of candidates.slice(0, 3)) {
        const html = await fetchPartSelectPage(candidate.url);
        const data = extractPartData(html, candidate.url);
        const product = buildProductFromPage(data, "product");
        if (product) {
          const result: LivePartResult = {
            status: "verified_live",
            product,
            sources: liveSources(data.name || candidate.title, candidate.url, "product")
          };
          setCache(key, result);
          return result;
        }
      }
    }
  } catch (error) {
    const result: LivePartResult = {
      status: "demo_fallback",
      product: null,
      sources: [],
      reason: error instanceof Error ? error.message : "Live lookup failed"
    };
    setCache(key, result);
    return result;
  }

  const result: LivePartResult = {
    status: "demo_fallback",
    product: null,
    sources: [],
    reason: "No verified PartSelect product page found"
  };
  setCache(key, result);
  return result;
}

export async function lookupLivePart(query: string): Promise<LivePartResult> {
  const key = cacheKey("live-part", query);
  const cached = getCache<LivePartResult>(key);
  if (cached) return cached;

  const fallback: LivePartResult = {
    status: "demo_fallback",
    product: null,
    sources: [],
    reason: "Live lookup timed out"
  };
  const result = await Promise.race([lookupLivePartUnbounded(query), timeoutResult(fallback)]);
  if (!result.product) setCache(key, result, 2 * 60 * 1000);
  return result;
}

export async function lookupLiveCompatibility(query: string, partNumber: string, modelNumber: string) {
  const live = await lookupLivePart(partNumber);
  if (!live.product) {
    return {
      status: "demo_fallback" as const,
      product: null,
      compatible: null,
      sources: [],
      reason: live.reason
    };
  }

  const compatible = live.product.compatibleModels.includes(modelNumber.toUpperCase());
  return {
    status: live.status,
    product: live.product,
    compatible,
    sources: live.sources,
    reason: live.reason
  };
}

export async function lookupLiveInstallation(query: string) {
  const live = await lookupLivePart(query);
  return live;
}

async function lookupLiveTroubleshootingUnbounded(query: string, applianceType?: ApplianceType | null) {
  const key = cacheKey("live-repair", `${applianceType ?? "unknown"}:${query}`);
  const cached = getCache<LiveRepairResult>(key);
  if (cached) return cached;

  try {
    const normalized = query.toLowerCase();
    const variants = [
      query,
      normalized.includes("ice maker") ? "not making ice" : null,
      normalized.includes("no ice") ? "not making ice" : null,
      normalized.includes("leak") ? "leaking" : null,
      normalized.includes("dirty dishes") || normalized.includes("poor cleaning") ? "not cleaning" : null,
      normalized.includes("rack") ? "rack not rolling" : null
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => `${applianceType ?? ""} ${value} repair`.trim());

    for (const variant of Array.from(new Set(variants))) {
      const candidates = await searchPartSelect(variant, applianceType);
      for (const candidate of candidates.slice(0, 3)) {
        if (!/partselect\.com\/(repair|instant-repairman)/i.test(candidate.url)) continue;
        const html = await fetchPartSelectPage(candidate.url);
        const guide = extractRepairGuide(html, candidate.url);
        if (!hasUsefulRepairGuide(guide)) continue;

        const result: LiveRepairResult = {
          status: "verified_live",
          issue: guide.title,
          diagnosticChecklist: guide.diagnosticSteps.slice(0, 5),
          possibleCauses: guide.possibleCauses.length > 0 ? guide.possibleCauses : guide.diagnosticSteps.slice(0, 3),
          recommendedParts: [],
          sources: [createSource(guide.title, guide.sourceUrl, "troubleshooting")]
        };
        setCache(key, result);
        return result;
      }
    }
  } catch (error) {
    const result: LiveRepairResult = {
      status: "demo_fallback",
      issue: "Repair guidance",
      diagnosticChecklist: [],
      possibleCauses: [],
      recommendedParts: [],
      sources: [],
      reason: error instanceof Error ? error.message : "Live repair lookup failed"
    };
    setCache(key, result);
    return result;
  }

  const result: LiveRepairResult = {
    status: "demo_fallback",
    issue: "Repair guidance",
    diagnosticChecklist: [],
    possibleCauses: [],
    recommendedParts: [],
    sources: [],
    reason: "No verified PartSelect repair guide found"
  };
  setCache(key, result);
  return result;
}

export async function lookupLiveTroubleshooting(query: string, applianceType?: ApplianceType | null) {
  const key = cacheKey("live-repair", `${applianceType ?? "unknown"}:${query}`);
  const cached = getCache<LiveRepairResult>(key);
  if (cached) return cached;

  const fallback: LiveRepairResult = {
    status: "demo_fallback",
    issue: "Repair guidance",
    diagnosticChecklist: [],
    possibleCauses: [],
    recommendedParts: [],
    sources: [],
    reason: "Live repair lookup timed out"
  };
  const result = await Promise.race([
    lookupLiveTroubleshootingUnbounded(query, applianceType),
    timeoutResult(fallback)
  ]);
  if (result.status === "demo_fallback") setCache(key, result, 2 * 60 * 1000);
  return result;
}
