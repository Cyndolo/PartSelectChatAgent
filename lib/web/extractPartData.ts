type PartData = {
  partNumber: string | null;
  manufacturerPartNumber: string | null;
  name: string;
  brand: string | null;
  modelType: string | null;
  category: string | null;
  price: number | null;
  availability: string | null;
  description: string | null;
  compatibleModels: string[];
  installationInstructions: string[];
  symptoms: string[];
  sourceUrl: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2013;|&ndash;/g, "-")
    .replace(/&#x2014;|&mdash;/g, "-")
    .replace(/&#x2019;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parsePrice(html: string) {
  const value =
    pickMatch(html, /data-price="([\d.]+)"/i) ??
    pickMatch(html, /itemprop="price"[^>]*content="([\d.]+)"/i) ??
    pickMatch(html, /\$([\d.,]+)/i);

  const parsed = value ? Number.parseFloat(value.replace(/,/g, "")) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCompatibilityModels(html: string) {
  const sectionMatch = html.match(/id="ModelCrossReference"[\s\S]*?pd__crossref__list[\s\S]*?<\/div>\s*<\/div>/i);
  const section = sectionMatch?.[0] ?? "";
  const models: string[] = [];
  for (const match of section.matchAll(/<a[^>]*>(\d{6,12})<\/a>/g)) {
    models.push(match[1]);
    if (models.length >= 12) break;
  }
  return unique(models);
}

function parseInstallationInstructions(html: string) {
  const sectionMatch = html.match(/id="InstallationInstructions"[\s\S]*?(?=id="ModelCrossReference"|<\/main>|<\/body>)/i);
  const section = sectionMatch?.[0] ?? "";
  const instructions: string[] = [];
  for (const match of section.matchAll(/<div class="repair-story__title[^>]*>([\s\S]*?)<\/div>/gi)) {
    const title = stripHtml(match[1]);
    if (title) instructions.push(title);
    if (instructions.length >= 5) break;
  }
  if (instructions.length === 0) {
    const fallback = stripHtml(section).split(". ").slice(0, 3).filter(Boolean);
    instructions.push(...fallback);
  }
  return unique(instructions);
}

function parseSymptoms(html: string) {
  const sectionMatch = html.match(/id="Troubleshooting"[\s\S]*?(?=id="CustomerReviews"|id="InstallationInstructions"|<\/main>|<\/body>)/i);
  const section = sectionMatch?.[0] ?? "";
  const symptomText =
    section.match(/This part fixes the following symptoms:\s*([\s\S]*?)This part works with the following products:/i)?.[1] ??
    section.match(/This part fixes the following symptoms:\s*([\s\S]*?)Back to Top/i)?.[1] ??
    "";

  const cleaned = stripHtml(symptomText);
  const symptoms =
    cleaned.match(/[A-Z][^A-Z]+?(?=(?: [A-Z][a-z]|$))/g)?.map((item) => item.trim()) ??
    cleaned
      .split(/[•·|]/)
      .map((item) => item.trim())
      .filter(Boolean);

  return unique(symptoms).slice(0, 8);
}

export function extractPartData(html: string, url: string): PartData {
  const partNumber =
    pickMatch(html, /itemprop="productID">([^<]+)</i) ??
    pickMatch(html, /data-inventory-id="([^"]+)"/i) ??
    null;
  const manufacturerPartNumber = pickMatch(html, /itemprop="mpn">([^<]+)</i);
  const title = pickMatch(html, /<title>(.*?)<\/title>/i) ?? "PartSelect product";
  const name = stripHtml(title.replace(/\s*[-–]\s*PartSelect\.com\s*$/i, ""));
  const brand =
    pickMatch(html, /itemprop="brand"[\s\S]*?itemprop="name">([^<]+)</i) ??
    pickMatch(html, /Manufactured by\s*<span class="bold text-teal"[\s\S]*?itemprop="name">([^<]+)</i);
  const modelType = pickMatch(html, /data-modeltype="([^"]+)"/i);
  const category = pickMatch(html, /data-category="([^"]+)"/i);
  const price = parsePrice(html);
  const availabilityRaw = pickMatch(html, /data-availability="([^"]+)"/i);
  const availability =
    availabilityRaw === "InStock"
      ? "In stock"
      : availabilityRaw === "OutOfStock"
        ? "Out of stock"
        : availabilityRaw === "LimitedStock"
          ? "Limited stock"
          : availabilityRaw;
  const description = pickMatch(html, /itemprop="description"[^>]*>([\s\S]*?)<\/div>/i);

  return {
    partNumber,
    manufacturerPartNumber,
    name,
    brand,
    modelType,
    category,
    price,
    availability,
    description: description ? stripHtml(description) : null,
    compatibleModels: parseCompatibilityModels(html),
    installationInstructions: parseInstallationInstructions(html),
    symptoms: parseSymptoms(html),
    sourceUrl: url
  };
}
