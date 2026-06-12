import type { Product } from "@/lib/types";

export const OUT_OF_SCOPE_MESSAGE =
  "I can only help with refrigerator and dishwasher parts, installation, compatibility, troubleshooting, and order support.";

export const CLARIFICATION_MESSAGE =
  "I can help if you share a part number, model number, appliance type, or the symptom you're seeing.";

export const EMPTY_INPUT_MESSAGE =
  "Please enter a part number, model number, or describe the appliance issue you'd like help with.";

export const PART_NOT_FOUND_MESSAGE =
  "I couldn't find that part in the catalog. Please check the part number or share a product description.";

export const UNKNOWN_PRODUCT_MESSAGE =
  "I couldn't find a matching part in the catalog. Try a part number, model number, or appliance description.";

export const INCOMPLETE_PART_NUMBER_MESSAGE =
  "That part number looks incomplete. PartSelect part numbers usually look like PS11752778. Could you provide the full part number?";

export const INSTALLATION_PART_NEEDED_MESSAGE =
  "Which part would you like installation help with? Please provide a PartSelect part number like PS11752778.";

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

export function formatProductSummary(product: Product) {
  return `${product.name} (${product.partNumber})`;
}

export function buildLookupMessage(product: Product) {
  return `I found ${product.name}. ${product.description}`;
}

export function buildCompatibilityMessage(product: Product, modelNumber: string, compatible: boolean) {
  return compatible
    ? `${product.name} is compatible with model ${modelNumber}.`
    : `${product.name} is not listed as compatible with model ${modelNumber}.`;
}

export function buildInstallationMessage(product: Product) {
  return `Here is the installation guide for ${product.name}.`;
}

export function buildTroubleshootingMessage(issue: string) {
  return `Let's diagnose the issue first. Here is a structured troubleshooting flow for ${issue}.`;
}
