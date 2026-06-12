export type AgentIntent =
  | "part_lookup"
  | "compatibility_check"
  | "installation_guide"
  | "troubleshooting"
  | "cart_action"
  | "context_update"
  | "out_of_scope"
  | "clarification_needed";

export type AgentToolName =
  | "searchProducts"
  | "lookupPart"
  | "checkCompatibility"
  | "getInstallationGuide"
  | "getTroubleshootingFlow"
  | "addToCart"
  | "updateContext"
  | "none";

export type ApplianceType = "refrigerator" | "dishwasher";

export type Availability = "In stock" | "Limited stock" | "Out of stock";

export type Product = {
  partNumber: string;
  manufacturerPartNumber: string;
  name: string;
  description: string;
  applianceType: ApplianceType;
  brand: string;
  price: number;
  availability: Availability;
  compatibleModels: string[];
  symptoms: string[];
  installationSteps: string[];
  sourceUrl: string;
  sourceType: Source["type"];
  imageUrl?: string;
};

export type ConversationMemory = {
  currentModelNumber: string | null;
  applianceType: ApplianceType | null;
  selectedPart: string | null;
  previousTroubleshootingTopic: string | null;
  troubleshootingContext: string[];
  cartItems: string[];
};

export type CompatibilityResult = {
  partNumber: string;
  modelNumber: string;
  isCompatible: boolean;
  confidence: "high" | "low";
};

export type ResponseSection = {
  title: string;
  items: string[];
};

export type Source = {
  title: string;
  url: string;
  type: "product" | "installation" | "troubleshooting" | "compatibility";
};

export type AgentResponse = {
  message: string;
  intent: AgentIntent;
  tool: AgentToolName;
  groundingStatus?: "verified_live" | "demo_fallback" | "unverified" | "searching";
  llmUsed?: boolean;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  products?: Product[];
  steps?: string[];
  compatibility?: CompatibilityResult;
  sections?: ResponseSection[];
  memory?: Partial<ConversationMemory>;
  responseTimeMs?: number;
  sources?: Source[];
};

export type ChatRequest = {
  message: string;
  currentModelNumber?: string | null;
  memory?: Partial<ConversationMemory> | null;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AgentResponse;
};

export type TroubleshootingGuide = {
  issue: string;
  keywords: string[];
  diagnosticFlow: string[];
  possibleCauses: string[];
  likelyParts: string[];
  sourceUrl: string;
  sourceType: "troubleshooting";
};
