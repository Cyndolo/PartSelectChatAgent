type RepairGuide = {
  title: string;
  summary: string | null;
  diagnosticSteps: string[];
  possibleCauses: string[];
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
    .replace(/&#x2019;|&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutBoilerplate(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function pickMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function decodeTitle(value: string) {
  return stripHtml(value)
    .replace(/^["'>\s]+/, "")
    .replace(/\s*-\s*PartSelect\.com\s*$/i, "")
    .replace(/\s*\|\s*PartSelect\s*$/i, "");
}

function isUsefulLine(value: string) {
  if (value.length < 16 || value.length > 260) return false;
  return !/skip to main content|sign in|create account|departments|brands|keep typing|price match guarantee|same day shipping|repair stories|step by step videos/i.test(
    value
  );
}

function extractListItems(html: string) {
  return unique(
    [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      .map((match) => stripHtml(match[1]))
      .filter(isUsefulLine)
  );
}

function extractHeadings(html: string) {
  return unique(
    [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
      .map((match) => stripHtml(match[1]))
      .filter((heading) => {
        if (heading.length < 4 || heading.length > 90) return false;
        return !/more repair parts|related articles|popular|customer reviews/i.test(heading);
      })
  );
}

function extractParagraphs(html: string) {
  return unique(
    [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((match) => stripHtml(match[1]))
      .filter(isUsefulLine)
  );
}

export function extractRepairGuide(html: string, url: string): RepairGuide {
  const cleanHtml = withoutBoilerplate(html);
  const title =
    pickMatch(cleanHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ??
    pickMatch(cleanHtml, /<title>(.*?)<\/title>/i) ??
    "PartSelect repair guide";

  const repairBody =
    pickMatch(cleanHtml, /<main[^>]*>([\s\S]*?)<\/main>/i) ??
    pickMatch(cleanHtml, /<article[^>]*>([\s\S]*?)<\/article>/i) ??
    cleanHtml;

  const storySections = [...repairBody.matchAll(/<div class="repair-story">([\s\S]*?)<\/div>\s*<\/div>/gi)]
    .slice(0, 4)
    .map((match) => stripHtml(match[1]))
    .filter(isUsefulLine);

  const listItems = extractListItems(repairBody);
  const headings = extractHeadings(repairBody);
  const paragraphs = extractParagraphs(repairBody);

  const summary =
    pickMatch(repairBody, /id="Troubleshooting"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i) ??
    paragraphs.find((paragraph) => /check|inspect|replace|cause|fix|repair/i.test(paragraph)) ??
    storySections[0] ??
    null;

  return {
    title: decodeTitle(title),
    summary: summary ? stripHtml(summary) : null,
    diagnosticSteps: unique([...listItems, ...storySections, ...paragraphs]).slice(0, 5),
    possibleCauses: headings.filter((heading) => !/how to fix|how to check/i.test(heading)).slice(0, 5),
    sourceUrl: url
  };
}
