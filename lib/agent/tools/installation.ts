import { products } from "@/data/products";
import type { Product } from "@/lib/types";

export type InstallationInput = {
  partNumber?: string | null;
  product?: Product | null;
};

export type InstallationOutput = {
  product: Product | null;
  steps: string[];
};

export function getInstallationGuide({ partNumber, product }: InstallationInput): InstallationOutput {
  const resolvedProduct =
    product ??
    (partNumber
      ? products.find((item) => item.partNumber.toUpperCase() === partNumber.toUpperCase()) ?? null
      : null);

  return {
    product: resolvedProduct,
    steps: resolvedProduct?.installationSteps ?? []
  };
}
