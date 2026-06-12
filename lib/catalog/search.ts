import { catalog } from "@/data/generated/catalog";
import type { ApplianceType, Product, TroubleshootingGuide } from "@/lib/types";

type SearchInput = {
  query: string;
  applianceType?: ApplianceType | null;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function searchCatalogProducts({ query, applianceType }: SearchInput): Product[] {
  const normalized = normalizeText(query);
  const exactPartNumber = catalog.products.find(
    (product) => product.partNumber === normalized.toUpperCase()
  );
  if (exactPartNumber) return [exactPartNumber];

  const exactManufacturerPart = catalog.products.find(
    (product) => product.manufacturerPartNumber === normalized.toUpperCase()
  );
  if (exactManufacturerPart) return [exactManufacturerPart];

  const queryTerms = normalized
    .split(" ")
    .filter((term) => term.length > 2 && !["with", "your", "the", "for", "part", "number", "can", "you", "help", "find", "model", "this", "that"].includes(term));

  return catalog.products.filter((product) => {
    if (applianceType && product.applianceType !== applianceType) return false;

    const haystack = [
      product.name,
      product.description,
      product.symptoms.join(" "),
      product.applianceType,
      product.brand,
      product.partNumber,
      product.manufacturerPartNumber
    ]
      .join(" ")
      .toLowerCase();

    return queryTerms.some((term) => haystack.includes(term));
  });
}

export function searchTroubleshootingGuide(query: string): TroubleshootingGuide | null {
  const normalized = normalizeText(query);
  return (
    catalog.troubleshooting.find((guide) =>
      guide.keywords.some((keyword) => normalized.includes(keyword))
    ) ?? null
  );
}
