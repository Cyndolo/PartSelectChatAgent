import fs from "node:fs";
import path from "node:path";
import { partsSeed } from "@/data/raw/partsSeed";
import { troubleshootingSeed } from "@/data/raw/troubleshootingSeed";
import { normalizeProduct, normalizeTroubleshooting } from "@/lib/catalog/normalize";

const outputPath = path.join(process.cwd(), "data", "generated", "catalog.ts");

const fileContent = `import { partsSeed } from "@/data/raw/partsSeed";
import { troubleshootingSeed } from "@/data/raw/troubleshootingSeed";
import { normalizeProduct, normalizeTroubleshooting } from "@/lib/catalog/normalize";

export const catalog = {
  products: partsSeed.map(normalizeProduct),
  troubleshooting: troubleshootingSeed.map(normalizeTroubleshooting)
};
`;

const normalizedProducts = partsSeed.map(normalizeProduct);
const normalizedTroubleshooting = troubleshootingSeed.map(normalizeTroubleshooting);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContent, "utf8");

console.log(
  JSON.stringify(
    {
      products: normalizedProducts.length,
      troubleshooting: normalizedTroubleshooting.length,
      outputPath
    },
    null,
    2
  )
);
