export type PartNumberValidationStatus = "valid" | "incomplete" | "missing" | "invalid";

const validPartNumberPattern = /^PS\d{6,}$/i;
const possiblePartNumberPattern = /\bPS[A-Z0-9]*\b/i;

export function isValidPartNumber(value: string): boolean {
  return validPartNumberPattern.test(value.trim());
}

export function extractValidPartNumber(text: string): string | null {
  const candidates = text.match(/\bPS\d+\b/gi) ?? [];
  const match = candidates.find(isValidPartNumber);
  return match?.toUpperCase() ?? null;
}

export function extractPossiblePartNumber(text: string): string | null {
  const match = text.match(possiblePartNumberPattern);
  return match?.[0]?.toUpperCase() ?? null;
}

export function getPartNumberValidationStatus(text: string): PartNumberValidationStatus {
  const possiblePartNumber = extractPossiblePartNumber(text);
  if (!possiblePartNumber) return "missing";
  if (isValidPartNumber(possiblePartNumber)) return "valid";
  if (/^PS\d{1,5}$/i.test(possiblePartNumber) || /^PS$/i.test(possiblePartNumber)) return "incomplete";
  return "invalid";
}
