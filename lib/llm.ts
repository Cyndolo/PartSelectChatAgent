import type { AgentIntent, AgentToolName, ConversationMemory } from "@/lib/types";

type ComposeResponseInput = {
  query: string;
  intent: AgentIntent;
  tool: AgentToolName;
  toolResult: unknown;
  memory: ConversationMemory;
  baseMessage: string;
};

type ComposeResponseOutput = {
  message: string;
  llmUsed: boolean;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function getModelName() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-nano";
}

function isEnabled() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function cleanJson(content: string) {
  return content.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
}

function safeParseMessage(content: string) {
  try {
    const parsed = JSON.parse(cleanJson(content)) as { message?: unknown };
    if (parsed && typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message.trim();
    }
  } catch {
    // Fall through to raw text handling.
  }

  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildSystemPrompt() {
  return [
    "You are the response composer for a PartSelect commerce support assistant.",
    "Your job is to rewrite and explain tool outputs naturally.",
    "You do not search for products; product discovery must come from deterministic catalog and web tools.",
    "Never invent facts, prices, compatibility, inventory, installation steps, model support, or troubleshooting facts.",
    "Use only the supplied toolResult, memory, and baseMessage.",
    "If information is missing, ask a concise clarifying question instead of guessing.",
    "Keep the tone professional, helpful, and commerce-oriented.",
    "Return JSON only with this exact shape: {\"message\":\"...\"}.",
    "Do not include markdown fences."
  ].join(" ");
}

function buildUserPrompt(input: ComposeResponseInput) {
  return JSON.stringify(
    {
      query: input.query,
      intent: input.intent,
      tool: input.tool,
      memory: input.memory,
      baseMessage: input.baseMessage,
      toolResult: input.toolResult
    },
    null,
    2
  );
}

async function callOpenAI(input: ComposeResponseInput): Promise<ComposeResponseOutput | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: getModelName(),
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          {
            role: "user",
            content: buildUserPrompt(input)
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content ?? null;
    const message = content ? safeParseMessage(content) : null;

    if (!message) {
      return null;
    }

    return {
      message,
      llmUsed: true,
      tokens: {
        input: payload.usage?.prompt_tokens ?? 0,
        output: payload.usage?.completion_tokens ?? 0,
        total: payload.usage?.total_tokens ?? 0
      }
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function fallbackCompose(input: ComposeResponseInput): ComposeResponseOutput {
  return {
    message: input.baseMessage,
    llmUsed: false,
    tokens: {
      input: 0,
      output: 0,
      total: 0
    }
  };
}

export async function composeResponse(input: ComposeResponseInput): Promise<ComposeResponseOutput> {
  const llmResponse = await callOpenAI(input);
  return llmResponse ?? fallbackCompose(input);
}

export function isLlmEnabled() {
  return isEnabled();
}
