import { catalog } from "@/data/generated/catalog";

function fail(message: string): never {
  throw new Error(message);
}

const seenPartNumbers = new Set<string>();

for (const product of catalog.products) {
  if (!product.partNumber) fail("Every product must have a partNumber.");
  if (!product.applianceType) fail(`Product ${product.partNumber} is missing applianceType.`);
  if (!Array.isArray(product.compatibleModels)) {
    fail(`Product ${product.partNumber} must have compatibleModels as an array.`);
  }
  if (!Array.isArray(product.installationSteps)) {
    fail(`Product ${product.partNumber} must have installationSteps as an array.`);
  }
  if (!product.sourceUrl) {
    fail(`Product ${product.partNumber} must include sourceUrl.`);
  }
  if (seenPartNumbers.has(product.partNumber)) {
    fail(`Duplicate partNumber found: ${product.partNumber}`);
  }
  seenPartNumbers.add(product.partNumber);
}

for (const guide of catalog.troubleshooting) {
  if (!guide.issue) fail("Every troubleshooting guide must have an issue.");
  if (!guide.sourceUrl) fail(`Troubleshooting guide ${guide.issue} must include sourceUrl.`);
  if (!Array.isArray(guide.diagnosticFlow)) {
    fail(`Troubleshooting guide ${guide.issue} must have diagnosticFlow as an array.`);
  }
}

console.log(
  JSON.stringify(
    {
      products: catalog.products.length,
      troubleshooting: catalog.troubleshooting.length,
      status: "ok"
    },
    null,
    2
  )
);
