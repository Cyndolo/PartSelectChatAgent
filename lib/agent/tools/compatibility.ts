import { catalog } from "@/data/generated/catalog";
import type { CompatibilityResult, Product } from "@/lib/types";

export type CompatibilityInput = {
  partNumber: string;
  modelNumber: string;
};

export type CompatibilityOutput = {
  product: Product | null;
  compatibility: CompatibilityResult | null;
};

export function checkCompatibility({ partNumber, modelNumber }: CompatibilityInput): CompatibilityOutput {
  const normalizedPartNumber = partNumber.toUpperCase();
  const product =
    catalog.products.find((item) => item.partNumber === normalizedPartNumber) ??
    catalog.products.find((item) => item.manufacturerPartNumber === normalizedPartNumber) ??
    null;

  if (!product) {
    return {
      product: null,
      compatibility: null
    };
  }

  return {
    product,
    compatibility: {
      partNumber,
      modelNumber,
      isCompatible: product.compatibleModels.includes(modelNumber),
      confidence: "high"
    }
  };
}
