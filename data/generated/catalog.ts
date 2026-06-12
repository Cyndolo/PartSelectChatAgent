import { partsSeed } from "@/data/raw/partsSeed";
import { troubleshootingSeed } from "@/data/raw/troubleshootingSeed";
import { normalizeProduct, normalizeTroubleshooting } from "@/lib/catalog/normalize";

export const catalog = {
  products: partsSeed.map(normalizeProduct),
  troubleshooting: troubleshootingSeed.map(normalizeTroubleshooting)
};
