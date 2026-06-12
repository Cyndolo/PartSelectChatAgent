import { catalog } from "@/data/generated/catalog";
import { searchCatalogProducts, searchTroubleshootingGuide } from "@/lib/catalog/search";
import type { ApplianceType, Product } from "@/lib/types";

export type TroubleshootingInput = {
  query: string;
  applianceType?: ApplianceType | null;
  selectedPart?: string | null;
  modelNumber?: string | null;
};

export type TroubleshootingOutput = {
  issue: string;
  diagnosticChecklist: string[];
  possibleCauses: string[];
  recommendedParts: Product[];
  sourceUrl: string;
  sourceType: "troubleshooting";
};

export function getTroubleshootingFlow({
  query,
  applianceType,
  selectedPart
}: TroubleshootingInput): TroubleshootingOutput {
  const guide = searchTroubleshootingGuide(query);

  if (guide) {
    const recommendedParts = guide.likelyParts
      .map((partNumber) => catalog.products.find((item) => item.partNumber === partNumber))
      .filter(Boolean) as Product[];

    return {
      issue: guide.issue,
      diagnosticChecklist: guide.diagnosticFlow,
      possibleCauses: guide.possibleCauses,
      recommendedParts,
      sourceUrl: guide.sourceUrl,
      sourceType: guide.sourceType
    };
  }

  const filteredProducts = searchCatalogProducts({ query, applianceType });

  const likelyProducts = selectedPart
    ? filteredProducts.filter((product) => product.partNumber === selectedPart)
    : filteredProducts.slice(0, 2);

  return {
    issue: "General appliance troubleshooting",
    diagnosticChecklist: [
      "Confirm the appliance has power and is running a normal cycle.",
      "Inspect visible components, hoses, filters, seals, and spray arms for damage or blockage.",
      "Match the symptom to the most likely failing assembly.",
      "Share a model number if you want compatibility narrowed down further."
    ],
    possibleCauses: [
      "Blocked water path",
      "Worn mechanical part",
      "Improperly seated component",
      "Compatibility issue with the current model"
    ],
    recommendedParts: likelyProducts,
    sourceUrl: "https://www.partselect.com/Repair/General-Appliance-Troubleshooting.htm",
    sourceType: "troubleshooting"
  };
}
