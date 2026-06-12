import type { AgentResponse, ChatRequest, ConversationMemory, Product } from "@/lib/types";
import { trackAgentEvent } from "@/lib/analytics";
import {
  buildCompatibilityMessage,
  buildInstallationMessage,
  buildLookupMessage,
  buildTroubleshootingMessage,
  CLARIFICATION_MESSAGE,
  EMPTY_INPUT_MESSAGE,
  INCOMPLETE_PART_NUMBER_MESSAGE,
  INSTALLATION_PART_NEEDED_MESSAGE,
  OUT_OF_SCOPE_MESSAGE,
  PART_NOT_FOUND_MESSAGE,
  UNKNOWN_PRODUCT_MESSAGE,
  formatProductSummary
} from "@/lib/agent/prompts";
import { routeQuery } from "@/lib/agent/router";
import { addToCart } from "@/lib/agent/tools/cart";
import { checkCompatibility } from "@/lib/agent/tools/compatibility";
import { getInstallationGuide } from "@/lib/agent/tools/installation";
import { lookupPart, searchProducts } from "@/lib/agent/tools/searchProducts";
import { getTroubleshootingFlow } from "@/lib/agent/tools/troubleshooting";
import {
  createConversationMemory,
  mergeConversationMemory,
  updateMemoryForAppliance,
  updateMemoryForCart,
  updateMemoryForModel,
  updateMemoryForPart,
  updateMemoryForTroubleshooting
} from "@/lib/agent/memory";
import { composeResponse } from "@/lib/llm";
import type { AgentToolName, Source } from "@/lib/types";
import {
  compatibilitySourceTitle,
  createSource,
  installationSourceTitle,
  productSourceTitle,
  troubleshootingSourceTitle
} from "@/lib/catalog/normalize";
import {
  lookupLiveCompatibility,
  lookupLiveInstallation,
  lookupLivePart,
  lookupLiveTroubleshooting
} from "@/lib/web/grounding";

type ExecutorInput = ChatRequest & {
  memory?: Partial<ConversationMemory> | null;
};

type ExecutorOutput = {
  response: AgentResponse;
  memory: ConversationMemory;
};

type ToolResult = Record<string, unknown> | null;

function createBaseResponse(
  intent: AgentResponse["intent"],
  tool: AgentToolName,
  message: string
): AgentResponse {
  return {
    intent,
    tool,
    message
  };
}

function buildProducts(products: Product[]) {
  return products.length > 0 ? products : undefined;
}

function createFallbackClarification(message = CLARIFICATION_MESSAGE) {
  return createBaseResponse("clarification_needed", "searchProducts", message);
}

function productSource(product: Product, type: Source["type"] = "product"): Source {
  return createSource(
    type === "installation"
      ? installationSourceTitle(product)
      : type === "compatibility"
        ? compatibilitySourceTitle(product)
        : productSourceTitle(product),
    product.sourceUrl,
    type
  );
}

function troubleshootingSource(issue: string, url: string): Source {
  return createSource(troubleshootingSourceTitle({ issue }), url, "troubleshooting");
}

function notFoundMessage(query: string, partNumber: string | null) {
  return partNumber || /PS\d{8}/i.test(query) ? PART_NOT_FOUND_MESSAGE : UNKNOWN_PRODUCT_MESSAGE;
}

function withFallbackNote(message: string) {
  return message;
}

function lookupModeFromGrounding(status: AgentResponse["groundingStatus"]) {
  if (status === "verified_live") return "live" as const;
  if (status === "unverified") return "skipped_invalid_input" as const;
  return "demo_fallback" as const;
}

function contextUpdateMessage(modelNumber: string) {
  return `Got it — I'll use ${modelNumber} for compatibility checks.`;
}

function isCompatibilityQuestion(query: string) {
  return /\b(compatible|compatibility|fits?|work with|match my model|for my model)\b/i.test(query);
}

function isInstallationQuestion(query: string) {
  return /\b(install|installation|replace|how do i install|change out)\b/i.test(query);
}

export async function executeAgent(input: ExecutorInput): Promise<ExecutorOutput> {
  const startedAt = Date.now();
  const incomingMemory = mergeConversationMemory(createConversationMemory(), input.memory);
  const query = input.message.trim();

  if (!query) {
    const response = {
      ...createBaseResponse("clarification_needed", "searchProducts", EMPTY_INPUT_MESSAGE),
      sources: []
    };
    const latencyMs = Date.now() - startedAt;
    response.responseTimeMs = latencyMs;
    response.llmUsed = false;
    response.tokens = { input: 0, output: 0, total: 0 };
    trackAgentEvent({
      query,
      intent: response.intent,
      selectedTool: response.tool,
      latencyMs,
      tokens: response.tokens,
      llmUsed: false
    });
    return {
      response,
      memory: incomingMemory
    };
  }

  const route = routeQuery(query, incomingMemory);

  let memory = incomingMemory;
  let response: AgentResponse;
  let toolResult: ToolResult = null;

  if (route.possiblePartNumber && route.partNumberValidationStatus !== "valid") {
    response = {
      ...createBaseResponse("clarification_needed", "searchProducts", INCOMPLETE_PART_NUMBER_MESSAGE),
      groundingStatus: "unverified",
      sources: []
    };
    const latencyMs = Date.now() - startedAt;
    response.responseTimeMs = latencyMs;
    response.llmUsed = false;
    response.tokens = { input: 0, output: 0, total: 0 };
    trackAgentEvent({
      query,
      intent: response.intent,
      selectedTool: response.tool,
      latencyMs,
      validationStatus: route.partNumberValidationStatus,
      lookupMode: "skipped_invalid_input",
      tokens: response.tokens,
      llmUsed: false
    });
    return {
      response,
      memory
    };
  }

  if (route.intent === "out_of_scope") {
    response = {
      ...createBaseResponse("out_of_scope", "none", OUT_OF_SCOPE_MESSAGE),
      sources: []
    };
    const latencyMs = Date.now() - startedAt;
    response.responseTimeMs = latencyMs;
    response.llmUsed = false;
    response.tokens = { input: 0, output: 0, total: 0 };
    trackAgentEvent({
      query,
      intent: response.intent,
      selectedTool: response.tool,
      latencyMs,
      validationStatus: route.partNumberValidationStatus,
      lookupMode: "skipped_invalid_input",
      tokens: response.tokens,
      llmUsed: false
    });
    return {
      response,
      memory
    };
  }

  if (route.intent === "context_update" && route.modelNumber) {
    memory = updateMemoryForModel(memory, route.modelNumber);
    if (route.applianceType) {
      memory = updateMemoryForAppliance(memory, route.applianceType);
    }

    response = {
      ...createBaseResponse("context_update", "updateContext", contextUpdateMessage(route.modelNumber)),
      groundingStatus: "unverified",
      memory: {
        currentModelNumber: route.modelNumber,
        applianceType: route.applianceType ?? memory.applianceType
      },
      sources: []
    };
    const latencyMs = Date.now() - startedAt;
    response.responseTimeMs = latencyMs;
    response.llmUsed = false;
    response.tokens = { input: 0, output: 0, total: 0 };
    trackAgentEvent({
      query,
      intent: response.intent,
      selectedTool: response.tool,
      latencyMs,
      validationStatus: route.partNumberValidationStatus,
      lookupMode: "skipped_context_update",
      tokens: response.tokens,
      llmUsed: false
    });
    return {
      response,
      memory
    };
  }

  if (route.intent === "clarification_needed") {
    const message =
      isCompatibilityQuestion(query) && route.partNumber
        ? `I can check compatibility for ${route.partNumber}, but I need your appliance model number first.`
        : isInstallationQuestion(query)
          ? INSTALLATION_PART_NEEDED_MESSAGE
          : CLARIFICATION_MESSAGE;

    response = {
      ...createFallbackClarification(message),
      groundingStatus: "unverified",
      sources: []
    };
    const latencyMs = Date.now() - startedAt;
    response.responseTimeMs = latencyMs;
    response.llmUsed = false;
    response.tokens = { input: 0, output: 0, total: 0 };
    trackAgentEvent({
      query,
      intent: response.intent,
      selectedTool: response.tool,
      latencyMs,
      validationStatus: route.partNumberValidationStatus,
      lookupMode: "skipped_invalid_input",
      tokens: response.tokens,
      llmUsed: false
    });
    return {
      response,
      memory
    };
  }

  if (route.selectedTool === "checkCompatibility") {
    const partNumber = route.partNumber ?? memory.selectedPart;
    const modelNumber = route.modelNumber ?? memory.currentModelNumber;

    if (!partNumber || !modelNumber) {
      response = createFallbackClarification(
        partNumber
          ? `I can check compatibility for ${partNumber}, but I need your appliance model number first.`
          : modelNumber
            ? "Please share the part number so I can check compatibility."
            : "Please share the part number and model number you want to check."
      );
      toolResult = {
        missing: {
          partNumber: !partNumber,
          modelNumber: !modelNumber
        }
      };
    } else {
      const liveResult = await lookupLiveCompatibility(query, partNumber, modelNumber);

      if (liveResult.product && liveResult.compatible !== null) {
        memory = updateMemoryForPart(memory, liveResult.product.partNumber);
        memory = updateMemoryForModel(memory, modelNumber);
        memory = updateMemoryForAppliance(memory, liveResult.product.applianceType);
        response = {
          ...createBaseResponse(
            "compatibility_check",
            "checkCompatibility",
            liveResult.compatible
              ? `Yes, ${liveResult.product.name} appears compatible with model ${modelNumber}.`
              : `The retrieved PartSelect data does not list ${modelNumber} as compatible with ${liveResult.product.name}.`
          ),
          products: [liveResult.product],
          compatibility: {
            partNumber,
            modelNumber,
            isCompatible: liveResult.compatible,
            confidence: "high"
          },
          sources: liveResult.sources,
          groundingStatus: liveResult.status,
          memory: {
            currentModelNumber: modelNumber,
            applianceType: liveResult.product.applianceType,
            selectedPart: liveResult.product.partNumber
          }
        };
        toolResult = {
          verified: true,
          product: {
            partNumber: liveResult.product.partNumber,
            name: liveResult.product.name,
            brand: liveResult.product.brand,
            applianceType: liveResult.product.applianceType
          },
          compatibility: {
            partNumber,
            modelNumber,
            isCompatible: liveResult.compatible,
            confidence: "high"
          }
        };
      } else {
        const result = checkCompatibility({ partNumber, modelNumber });

        if (!result.product || !result.compatibility) {
          response = createBaseResponse("clarification_needed", "checkCompatibility", PART_NOT_FOUND_MESSAGE);
          toolResult = { found: false, partNumber, modelNumber };
        } else {
          memory = updateMemoryForPart(memory, result.product.partNumber);
          memory = updateMemoryForModel(memory, modelNumber);
          memory = updateMemoryForAppliance(memory, result.product.applianceType);
          response = {
            ...createBaseResponse(
              "compatibility_check",
              "checkCompatibility",
              withFallbackNote(buildCompatibilityMessage(result.product, modelNumber, result.compatibility.isCompatible))
            ),
            products: [result.product],
            compatibility: result.compatibility,
            sources: [
              productSource(result.product, "compatibility"),
              productSource(result.product, "product")
            ],
            groundingStatus: "demo_fallback",
            memory: {
              currentModelNumber: modelNumber,
              applianceType: result.product.applianceType,
              selectedPart: result.product.partNumber
            }
          };
          toolResult = {
            verified: false,
            product: {
              partNumber: result.product.partNumber,
              name: result.product.name,
              brand: result.product.brand,
              applianceType: result.product.applianceType
            },
            compatibility: result.compatibility
          };
        }
      }
    }
  } else if (route.selectedTool === "getInstallationGuide") {
    if (!route.partNumber && !memory.selectedPart) {
      response = createFallbackClarification(INSTALLATION_PART_NEEDED_MESSAGE);
      toolResult = {
        missing: {
          partNumber: true
        }
      };
    } else {
    const live = await lookupLiveInstallation(query);
    const product = live.product ?? lookupPart({
      query,
      applianceType: route.applianceType,
      partNumber: route.partNumber,
      selectedPart: memory.selectedPart
    }).selectedPart;

    if (!product) {
      response = createFallbackClarification(notFoundMessage(query, route.partNumber));
      toolResult = {
        found: false,
        query
      };
    } else if (live.status === "verified_live" && live.product) {
      memory = updateMemoryForPart(memory, product.partNumber);
      memory = updateMemoryForAppliance(memory, product.applianceType);
      response = {
        ...createBaseResponse(
          "installation_guide",
          "getInstallationGuide",
          buildInstallationMessage(product)
        ),
        products: [product],
        steps: product.installationSteps.slice(0, 5),
        sources: live.sources,
        groundingStatus: "verified_live",
        memory: {
          selectedPart: product.partNumber,
          applianceType: product.applianceType
        }
      };
      toolResult = {
        verified: true,
        product: {
          partNumber: product.partNumber,
          name: product.name,
          applianceType: product.applianceType
        },
        steps: product.installationSteps.slice(0, 5)
      };
    } else {
      const guide = getInstallationGuide({ product });
      memory = updateMemoryForPart(memory, product.partNumber);
      memory = updateMemoryForAppliance(memory, product.applianceType);
      response = {
        ...createBaseResponse(
          "installation_guide",
          "getInstallationGuide",
          withFallbackNote(buildInstallationMessage(product))
        ),
        products: [product],
        steps: guide.steps,
        sources: [productSource(product, "installation")],
        groundingStatus: "demo_fallback",
        memory: {
          selectedPart: product.partNumber,
          applianceType: product.applianceType
        }
      };
      toolResult = {
        verified: false,
        product: {
          partNumber: product.partNumber,
          name: product.name,
          applianceType: product.applianceType
        },
        steps: guide.steps
      };
    }
    }
  } else if (route.selectedTool === "getTroubleshootingFlow") {
    const live = await lookupLiveTroubleshooting(query, route.applianceType ?? memory.applianceType);
    const flow = getTroubleshootingFlow({
      query,
      applianceType: route.applianceType ?? memory.applianceType,
      selectedPart: memory.selectedPart,
      modelNumber: route.modelNumber ?? memory.currentModelNumber
    });

    const liveVerified = live.status === "verified_live" && live.diagnosticChecklist.length > 0;
    const selectedProduct = liveVerified
      ? null
      : flow.recommendedParts[0] ?? null;

    if (selectedProduct) {
      memory = updateMemoryForPart(memory, selectedProduct.partNumber);
      memory = updateMemoryForAppliance(memory, selectedProduct.applianceType);
    }
    memory = updateMemoryForTroubleshooting(
      memory,
      liveVerified ? [live.issue, ...live.possibleCauses] : [flow.issue, ...flow.possibleCauses],
      liveVerified ? live.issue : flow.issue
    );

    response = liveVerified
      ? {
          ...createBaseResponse(
            "troubleshooting",
            "getTroubleshootingFlow",
            buildTroubleshootingMessage(live.issue)
          ),
          sections: [
            { title: "Diagnostic Checklist", items: live.diagnosticChecklist },
            { title: "Possible Causes", items: live.possibleCauses }
          ],
          products: undefined,
          sources: live.sources,
          groundingStatus: "verified_live",
          memory: {
            troubleshootingContext: memory.troubleshootingContext,
            previousTroubleshootingTopic: live.issue,
            selectedPart: memory.selectedPart,
            applianceType: memory.applianceType
          }
        }
      : {
          ...createBaseResponse(
            "troubleshooting",
            "getTroubleshootingFlow",
            withFallbackNote(buildTroubleshootingMessage(flow.issue))
          ),
          sections: [
            { title: "Diagnostic Checklist", items: flow.diagnosticChecklist },
            { title: "Possible Causes", items: flow.possibleCauses },
            { title: "Recommended Parts", items: flow.recommendedParts.map(formatProductSummary) }
          ],
          products: buildProducts(flow.recommendedParts),
          sources: [
            troubleshootingSource(flow.issue, flow.sourceUrl),
            ...flow.recommendedParts.slice(0, 3).map((item) => productSource(item, "product"))
          ],
          groundingStatus: "demo_fallback",
          memory: {
            troubleshootingContext: memory.troubleshootingContext,
            previousTroubleshootingTopic: flow.issue,
            selectedPart: selectedProduct?.partNumber ?? memory.selectedPart,
            applianceType: selectedProduct?.applianceType ?? memory.applianceType
          }
        };
    toolResult = liveVerified
      ? {
          verified: true,
          issue: live.issue,
          diagnosticChecklist: live.diagnosticChecklist,
          possibleCauses: live.possibleCauses
        }
      : {
          verified: false,
          issue: flow.issue,
          diagnosticChecklist: flow.diagnosticChecklist,
          possibleCauses: flow.possibleCauses,
          recommendedParts: flow.recommendedParts.map((item) => ({
            partNumber: item.partNumber,
            name: item.name,
            applianceType: item.applianceType,
            brand: item.brand
          }))
        };
  } else if (route.selectedTool === "addToCart") {
    const live = await lookupLivePart(query);
    const productLookup = live.product
      ? { selectedPart: live.product }
      : lookupPart({
          query,
          applianceType: route.applianceType,
          partNumber: route.partNumber,
          selectedPart: memory.selectedPart
        });
    const cart = addToCart({
      action: route.cartAction ?? "add",
      cartItems: memory.cartItems,
      product: productLookup.selectedPart,
      partNumber: route.partNumber
    });

    if (!cart.product) {
      response = createFallbackClarification(notFoundMessage(query, route.partNumber));
      toolResult = { found: false };
    } else if (live.product) {
      memory = updateMemoryForPart(memory, cart.product.partNumber);
      memory = updateMemoryForAppliance(memory, cart.product.applianceType);
      memory = updateMemoryForCart(memory, cart.cartItems);
      response = {
        ...createBaseResponse(
          "cart_action",
          "addToCart",
          route.cartAction === "remove"
            ? `I removed ${cart.product.name} from your demo cart.`
            : `I found ${cart.product.name} and added it to your demo cart.`
        ),
        products: [cart.product],
        sources: live.sources,
        groundingStatus: "verified_live",
        memory: {
          cartItems: cart.cartItems,
          selectedPart: cart.product.partNumber,
          applianceType: cart.product.applianceType
        }
      };
      toolResult = {
        verified: true,
        action: route.cartAction ?? "add",
        cartItems: cart.cartItems,
        product: {
          partNumber: cart.product.partNumber,
          name: cart.product.name,
          applianceType: cart.product.applianceType
        }
      };
    } else {
      memory = updateMemoryForPart(memory, cart.product.partNumber);
      memory = updateMemoryForAppliance(memory, cart.product.applianceType);
      memory = updateMemoryForCart(memory, cart.cartItems);
      response = {
        ...createBaseResponse(
          "cart_action",
          "addToCart",
          route.cartAction === "remove"
            ? `I removed ${cart.product.name} from your demo cart.`
            : `I found ${cart.product.name} and added it to your demo cart.`
        ),
        products: [cart.product],
        sources: [productSource(cart.product, "product")],
        groundingStatus: "demo_fallback",
        memory: {
          cartItems: cart.cartItems,
          selectedPart: cart.product.partNumber,
          applianceType: cart.product.applianceType
        }
      };
      toolResult = {
        verified: false,
        action: route.cartAction ?? "add",
        cartItems: cart.cartItems,
        product: {
          partNumber: cart.product.partNumber,
          name: cart.product.name,
          applianceType: cart.product.applianceType
        }
      };
    }
  } else if (route.selectedTool === "lookupPart") {
    const live = await lookupLivePart(query);
    const lookup = live.product
      ? { selectedPart: live.product }
      : lookupPart({
          query,
          applianceType: route.applianceType,
          partNumber: route.partNumber,
          selectedPart: memory.selectedPart
        });

    if (lookup.selectedPart) {
      memory = updateMemoryForPart(memory, lookup.selectedPart.partNumber);
      memory = updateMemoryForAppliance(memory, lookup.selectedPart.applianceType);
    }

    response = lookup.selectedPart
      ? {
          ...createBaseResponse("part_lookup", "lookupPart", buildLookupMessage(lookup.selectedPart)),
          products: [lookup.selectedPart],
          sources: live.product ? live.sources : [productSource(lookup.selectedPart, "product")],
          groundingStatus: live.product ? "verified_live" : "demo_fallback",
          memory: {
            selectedPart: lookup.selectedPart.partNumber,
            applianceType: lookup.selectedPart.applianceType
          }
        }
      : createFallbackClarification(notFoundMessage(query, route.partNumber));
    toolResult = lookup.selectedPart
      ? {
          verified: Boolean(live.product),
          found: true,
          product: {
            partNumber: lookup.selectedPart.partNumber,
            name: lookup.selectedPart.name,
            applianceType: lookup.selectedPart.applianceType,
            brand: lookup.selectedPart.brand
          }
        }
      : {
          found: false,
          query
        };
  } else {
    const live = await lookupLivePart(query);
    const search = live.product
      ? { matches: [live.product], selectedPart: live.product }
      : searchProducts({
          query,
          applianceType: route.applianceType,
          partNumber: route.partNumber,
          selectedPart: memory.selectedPart
        });

    response = search.matches.length
      ? {
          ...createBaseResponse("part_lookup", "searchProducts", buildLookupMessage(search.matches[0])),
          products: search.matches,
          sources: live.product
            ? live.sources
            : search.matches.slice(0, 3).map((item) => productSource(item, "product")),
          groundingStatus: live.product ? "verified_live" : "demo_fallback",
          memory: {
            selectedPart: search.selectedPart?.partNumber ?? memory.selectedPart,
            applianceType: search.selectedPart?.applianceType ?? memory.applianceType
          }
        }
      : createFallbackClarification(withFallbackNote(UNKNOWN_PRODUCT_MESSAGE));
    toolResult = {
      verified: Boolean(live.product),
      matches: search.matches.map((item) => ({
        partNumber: item.partNumber,
        name: item.name,
        applianceType: item.applianceType,
        brand: item.brand
      }))
    };
  }

  const composed = await composeResponse({
    query,
    intent: response.intent,
    tool: response.tool,
    toolResult,
    memory,
    baseMessage: response.message
  });

  response.message = composed.message;
  response.llmUsed = composed.llmUsed;
  response.tokens = composed.tokens;
  const latencyMs = Date.now() - startedAt;
  response.responseTimeMs = latencyMs;

  trackAgentEvent({
    query,
    intent: response.intent,
    selectedTool: response.tool,
    latencyMs,
    validationStatus: route.partNumberValidationStatus,
    lookupMode: lookupModeFromGrounding(response.groundingStatus),
    tokens: composed.tokens,
    llmUsed: composed.llmUsed
  });

  return {
    response,
    memory
  };
}
