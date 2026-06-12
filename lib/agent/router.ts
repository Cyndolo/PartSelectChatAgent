import type {
  AgentIntent,
  AgentToolName,
  ApplianceType,
  ConversationMemory
} from "@/lib/types";
import {
  extractPossiblePartNumber,
  extractValidPartNumber,
  getPartNumberValidationStatus,
  type PartNumberValidationStatus
} from "@/lib/validation";

const scopeKeywords = [
  "refrigerator",
  "dishwasher",
  "ice maker",
  "gasket",
  "spray arm",
  "rack wheel",
  "water valve",
  "part number",
  "model",
  "install",
  "repair",
  "troubleshoot",
  "leak",
  "leaking",
  "compatible",
  "cart",
  "fridge"
];

const symptomKeywords = [
  "ice maker not working",
  "no ice",
  "ice maker",
  "dishwasher leaking",
  "leaking dishwasher",
  "water dripping",
  "poor cleaning",
  "dirty dishes",
  "not cleaning",
  "rack not rolling",
  "rack falls off track",
  "not rolling",
  "not moving"
];

const partLookupKeywords = [
  "door gasket",
  "lower spray arm",
  "rack wheel",
  "water inlet valve",
  "ice maker assembly",
  "ice maker",
  "spray arm",
  "gasket",
  "inlet valve",
  "water valve"
];

const installationKeywords = ["install", "installation", "replace", "how do i install", "change out"];

const compatibilityKeywords = ["compatible", "compatibility", "fit", "fit with", "will this work"];
const compatibilityPatterns = [
  /\bcompatible\b/,
  /\bcompatibility\b/,
  /\bfits?\b/,
  /\bwork with\b/,
  /\bmatch my model\b/,
  /\bfor my model\b/
];

const cartKeywords = ["add to cart", "cart", "remove from cart", "buy", "order"];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractPartNumber(query: string) {
  return extractValidPartNumber(query);
}

export function extractModelNumber(query: string) {
  const match = query.match(/\b(?!PS\d{6,}\b)[A-Z]{1,4}\d[A-Z0-9]{5,12}\b/i);
  return match?.[0]?.toUpperCase() ?? null;
}

export function detectApplianceType(query: string): ApplianceType | null {
  const normalized = normalizeText(query);
  if (normalized.includes("dishwasher")) return "dishwasher";
  if (normalized.includes("refrigerator") || normalized.includes("fridge")) return "refrigerator";
  return null;
}

export function detectSymptoms(query: string) {
  const normalized = normalizeText(query);
  return symptomKeywords.filter((keyword) => normalized.includes(keyword));
}

export type RoutedQuery = {
  intent: AgentIntent;
  selectedTool: AgentToolName;
  applianceType: ApplianceType | null;
  partNumber: string | null;
  modelNumber: string | null;
  symptoms: string[];
  isInScope: boolean;
  cartAction: "add" | "remove" | null;
  partNumberValidationStatus: PartNumberValidationStatus;
  possiblePartNumber: string | null;
};

function scoreIntent(query: string, memory: ConversationMemory) {
  const normalized = normalizeText(query);
  const queryPartNumber = extractPartNumber(query);
  const possiblePartNumber = extractPossiblePartNumber(query);
  const partNumberValidationStatus = getPartNumberValidationStatus(query);
  const queryModelNumber = extractModelNumber(query);
  const symptoms = detectSymptoms(query);
  const applianceType =
    detectApplianceType(query) ??
    (/\b(this|that|it|same)\b/.test(normalized) ? memory.applianceType : null) ??
    memory.applianceType;
  const partNumber = queryPartNumber ?? memory.selectedPart;
  const modelNumber = queryModelNumber ?? memory.currentModelNumber;
  const hasPartDescriptor = partLookupKeywords.some((keyword) => normalized.includes(keyword));
  const queryHasSpecifics = Boolean(queryPartNumber || queryModelNumber || symptoms.length > 0);
  const hasScope = scopeKeywords.some((keyword) => normalized.includes(keyword)) || queryHasSpecifics;
  const isFollowUpTroubleshooting =
    Boolean(memory.previousTroubleshootingTopic) &&
    /^(yes|no|yep|nope|it is|it's|still|now|not yet|kind of|sort of|maybe|i think|the freezer|water|ice|nothing)/.test(
      normalized
    );
  const cartAction = /\b(remove|delete|take out)\b/.test(normalized) ? "remove" : /\b(add|put|include)\b/.test(normalized) ? "add" : null;
  const hasInstallationIntent = installationKeywords.some((keyword) => normalized.includes(keyword));
  const hasCompatibilityIntent =
    compatibilityKeywords.some((keyword) => normalized.includes(keyword)) ||
    compatibilityPatterns.some((pattern) => pattern.test(normalized));
  const hasTroubleshootingIntent =
    symptoms.length > 0 ||
    /\b(troubleshoot|not working|leaking|leak|won't|won't work|noise|no ice|dirty dishes)\b/.test(normalized) ||
    (/\bbroken\b/.test(normalized) && !hasPartDescriptor) ||
    isFollowUpTroubleshooting;
  const hasModelContextLanguage = /\b(model|model number|my model|i have|dishwasher|refrigerator|fridge|whirlpool)\b/.test(
    normalized
  );
  const isContextUpdate = Boolean(queryModelNumber && !queryPartNumber && hasModelContextLanguage && !hasCompatibilityIntent && !hasInstallationIntent);

  if (possiblePartNumber && partNumberValidationStatus !== "valid") {
    return {
      intent: "clarification_needed",
      selectedTool: "searchProducts",
      applianceType,
      partNumber: null,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (hasInstallationIntent && !queryPartNumber && !memory.selectedPart) {
    return {
      intent: "clarification_needed",
      selectedTool: "searchProducts",
      applianceType,
      partNumber: null,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (hasCompatibilityIntent && (!partNumber || !modelNumber)) {
    return {
      intent: "clarification_needed",
      selectedTool: "searchProducts",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (!hasScope) {
    return {
      intent: "out_of_scope",
      selectedTool: "none",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: false,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (isContextUpdate) {
    return {
      intent: "context_update",
      selectedTool: "updateContext",
      applianceType,
      partNumber: null,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (cartKeywords.some((keyword) => normalized.includes(keyword)) || cartAction) {
    return {
      intent: "cart_action",
      selectedTool: "addToCart",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (hasCompatibilityIntent) {
    return {
      intent: "compatibility_check",
      selectedTool: "checkCompatibility",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (hasInstallationIntent && partNumber) {
    return {
      intent: "installation_guide",
      selectedTool: "getInstallationGuide",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (hasTroubleshootingIntent) {
    return {
      intent: "troubleshooting",
      selectedTool: "getTroubleshootingFlow",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  if (queryPartNumber || hasPartDescriptor || /\b(part number|find|lookup|look up|show me|help me find|what part)\b/.test(normalized)) {
    return {
      intent: "part_lookup",
      selectedTool: "lookupPart",
      applianceType,
      partNumber,
      modelNumber,
      symptoms,
      isInScope: true,
      cartAction,
      partNumberValidationStatus,
      possiblePartNumber
    } satisfies RoutedQuery;
  }

  const scores: Record<AgentIntent, number> = {
    part_lookup: 0,
    compatibility_check: 0,
    installation_guide: 0,
    troubleshooting: 0,
    cart_action: 0,
    context_update: 0,
    out_of_scope: 0,
    clarification_needed: 0
  };

  if (!hasScope) scores.out_of_scope += 5;
  if (partNumber) scores.part_lookup += 1;
  if (/\b(part number|find|lookup|look up|show me|help me find|what part)\b/.test(normalized)) {
    scores.part_lookup += 3;
  }
  if (hasPartDescriptor) {
    scores.part_lookup += 3;
  }
  if (queryPartNumber) {
    scores.part_lookup += 4;
  }

  if (hasCompatibilityIntent) {
    scores.compatibility_check += 4;
  }
  if (partNumber && modelNumber && hasCompatibilityIntent) {
    scores.compatibility_check += 2;
  }
  if (partNumber && !modelNumber && hasCompatibilityIntent) {
    scores.clarification_needed += 2;
  }
  if (hasCompatibilityIntent && !partNumber && !hasPartDescriptor) {
    scores.clarification_needed += 8;
  }
  if (hasCompatibilityIntent && !modelNumber) {
    scores.clarification_needed += 4;
  }

  if (hasInstallationIntent) {
    scores.installation_guide += 10;
  }
  if (partNumber && hasInstallationIntent) {
    scores.installation_guide += 2;
  }
  if (hasInstallationIntent && !partNumber && !hasPartDescriptor) {
    scores.clarification_needed += 12;
  }

  if (symptoms.length > 0) {
    scores.troubleshooting += 4;
  }
  if (/\b(troubleshoot|not working|leaking|leak|broken|won't|won't work|noise|no ice|dirty dishes)\b/.test(normalized)) {
    scores.troubleshooting += 3;
  }
  if (isFollowUpTroubleshooting) {
    scores.troubleshooting += 4;
  }

  if (cartKeywords.some((keyword) => normalized.includes(keyword))) {
    scores.cart_action += 4;
  }
  if (cartAction) {
    scores.cart_action += 2;
  }

  if (!partNumber && !modelNumber && !symptoms.length && hasScope) {
    scores.clarification_needed += 2;
  }
  if (!partNumber && !modelNumber && memory.selectedPart) {
    scores.clarification_needed += 1;
  }

  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const winner = ranked[0]?.[0] as AgentIntent | undefined;
  const intent = winner && scores[winner] > 0 ? winner : hasScope ? "clarification_needed" : "out_of_scope";

  const selectedToolByIntent: Record<AgentIntent, AgentToolName> = {
    part_lookup: "lookupPart",
    compatibility_check: "checkCompatibility",
    installation_guide: "getInstallationGuide",
    troubleshooting: "getTroubleshootingFlow",
    cart_action: "addToCart",
    context_update: "updateContext",
    out_of_scope: "none",
    clarification_needed: "searchProducts"
  };

  return {
    intent,
    selectedTool: selectedToolByIntent[intent],
    applianceType,
    partNumber,
    modelNumber,
    symptoms,
    isInScope: hasScope,
    cartAction,
    partNumberValidationStatus,
    possiblePartNumber
  } satisfies RoutedQuery;
}

export function routeQuery(query: string, memory: ConversationMemory): RoutedQuery {
  return scoreIntent(query, memory);
}
