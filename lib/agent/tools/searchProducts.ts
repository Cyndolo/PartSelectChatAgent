import { catalog } from "@/data/generated/catalog";
import { searchCatalogProducts } from "@/lib/catalog/search";
import type { ApplianceType, Product } from "@/lib/types";

export type SearchProductsInput = {
  query: string;
  applianceType?: ApplianceType | null;
  partNumber?: string | null;
  selectedPart?: string | null;
};

export type SearchProductsResult = {
  matches: Product[];
  selectedPart: Product | null;
};

export function lookupPart({ query, partNumber, applianceType, selectedPart }: SearchProductsInput): SearchProductsResult {
  const directPartNumber = partNumber ?? selectedPart ?? null;
  const directMatch = directPartNumber
    ? catalog.products.find((product) => product.partNumber === directPartNumber.toUpperCase()) ?? null
    : null;

  const directManufacturerMatch = directPartNumber
    ? catalog.products.find(
        (product) => product.manufacturerPartNumber === directPartNumber.toUpperCase()
      ) ?? null
    : null;

  if (directMatch || directManufacturerMatch) {
    const selectedPart = directMatch ?? directManufacturerMatch;
    if (!selectedPart) {
      return {
        matches: [],
        selectedPart: null
      };
    }

    return {
      matches: [selectedPart],
      selectedPart
    };
  }

  const matches = searchCatalogProducts({ query, applianceType });

  return {
    matches,
    selectedPart: matches[0] ?? null
  };
}

export function searchProducts(input: SearchProductsInput): SearchProductsResult {
  return lookupPart(input);
}
