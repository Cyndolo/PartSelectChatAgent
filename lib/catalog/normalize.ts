import type { Source, Product, TroubleshootingGuide, ApplianceType, Availability } from "@/lib/types";
import type { RawPartSeed } from "@/data/raw/partsSeed";
import type { RawTroubleshootingSeed } from "@/data/raw/troubleshootingSeed";

export function createSource(
  title: string,
  url: string,
  type: Source["type"]
): Source {
  return { title, url, type };
}

export function normalizeProduct(seed: RawPartSeed): Product {
  return {
    partNumber: seed.partNumber.trim().toUpperCase(),
    manufacturerPartNumber: seed.manufacturerPartNumber.trim().toUpperCase(),
    name: seed.name.trim(),
    description: seed.description.trim(),
    applianceType: seed.applianceType as ApplianceType,
    brand: seed.brand.trim(),
    price: seed.price,
    availability: seed.availability as Availability,
    compatibleModels: seed.compatibleModels.map((model) => model.trim().toUpperCase()),
    symptoms: seed.symptoms.map((symptom) => symptom.trim().toLowerCase()),
    installationSteps: seed.installationSteps.map((step) => step.trim()),
    sourceUrl: seed.sourceUrl.trim(),
    sourceType: seed.sourceType,
    imageUrl: undefined
  };
}

export function normalizeTroubleshooting(seed: RawTroubleshootingSeed): TroubleshootingGuide {
  return {
    issue: seed.issue.trim().toLowerCase(),
    keywords: seed.keywords.map((keyword) => keyword.trim().toLowerCase()),
    diagnosticFlow: seed.diagnosticFlow.map((step) => step.trim()),
    possibleCauses: seed.possibleCauses.map((cause) => cause.trim()),
    likelyParts: seed.likelyParts.map((partNumber) => partNumber.trim().toUpperCase()),
    sourceUrl: seed.sourceUrl.trim(),
    sourceType: seed.sourceType
  };
}

export function productSourceTitle(product: Product) {
  return `${product.partNumber} product data`;
}

export function installationSourceTitle(product: Product) {
  return `${product.name} installation guide`;
}

export function compatibilitySourceTitle(product: Product) {
  return `${product.partNumber} compatibility reference`;
}

export function troubleshootingSourceTitle(guideOrIssue: TroubleshootingGuide | { issue: string }) {
  return `${guideOrIssue.issue} troubleshooting guide`;
}
