import { products } from "@/data/products";
import type { Product } from "@/lib/types";

export type CartInput = {
  action: "add" | "remove";
  cartItems: string[];
  product?: Product | null;
  partNumber?: string | null;
};

export type CartOutput = {
  cartItems: string[];
  product: Product | null;
};

export function addToCart({ action, cartItems, product, partNumber }: CartInput): CartOutput {
  const resolvedProduct =
    product ??
    (partNumber
      ? products.find((item) => item.partNumber.toUpperCase() === partNumber.toUpperCase()) ?? null
      : null);

  if (!resolvedProduct) {
    return {
      cartItems,
      product: null
    };
  }

  if (action === "add") {
    return {
      cartItems: Array.from(new Set([...cartItems, resolvedProduct.partNumber])),
      product: resolvedProduct
    };
  }

  return {
    cartItems: cartItems.filter((item) => item !== resolvedProduct.partNumber),
    product: resolvedProduct
  };
}
