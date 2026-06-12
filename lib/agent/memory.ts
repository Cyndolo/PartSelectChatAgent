import type { ApplianceType, ConversationMemory } from "@/lib/types";

export function createConversationMemory(): ConversationMemory {
  return {
    currentModelNumber: null,
    applianceType: null,
    selectedPart: null,
    previousTroubleshootingTopic: null,
    troubleshootingContext: [],
    cartItems: []
  };
}

export function mergeConversationMemory(
  memory: ConversationMemory,
  patch: Partial<ConversationMemory> | null | undefined
): ConversationMemory {
  if (!patch) return memory;

  return {
    currentModelNumber: patch.currentModelNumber ?? memory.currentModelNumber,
    applianceType: patch.applianceType ?? memory.applianceType,
    selectedPart: patch.selectedPart ?? memory.selectedPart,
    previousTroubleshootingTopic:
      patch.previousTroubleshootingTopic ?? memory.previousTroubleshootingTopic,
    troubleshootingContext: patch.troubleshootingContext ?? memory.troubleshootingContext,
    cartItems: patch.cartItems ?? memory.cartItems
  };
}

export function updateMemoryForAppliance(memory: ConversationMemory, applianceType: ApplianceType | null) {
  return mergeConversationMemory(memory, { applianceType });
}

export function updateMemoryForPart(memory: ConversationMemory, partNumber: string | null) {
  return mergeConversationMemory(memory, { selectedPart: partNumber });
}

export function updateMemoryForModel(memory: ConversationMemory, modelNumber: string | null) {
  return mergeConversationMemory(memory, { currentModelNumber: modelNumber });
}

export function updateMemoryForTroubleshooting(
  memory: ConversationMemory,
  troubleshootingContext: string[],
  previousTroubleshootingTopic?: string | null
) {
  return mergeConversationMemory(memory, {
    previousTroubleshootingTopic:
      previousTroubleshootingTopic ?? memory.previousTroubleshootingTopic,
    troubleshootingContext: Array.from(
      new Set([...memory.troubleshootingContext, ...troubleshootingContext])
    )
  });
}

export function updateMemoryForCart(memory: ConversationMemory, cartItems: string[]) {
  return mergeConversationMemory(memory, {
    cartItems: Array.from(new Set(cartItems))
  });
}
