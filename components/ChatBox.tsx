"use client";

import { useMemo, useRef, useState } from "react";
import type { AgentResponse, ChatMessage, ConversationMemory, Product } from "@/lib/types";
import { MessageBubble } from "@/components/MessageBubble";
import { SuggestedPrompts } from "@/components/SuggestedPrompts";
import { CartPanel } from "@/components/CartPanel";
import {
  createConversationMemory,
  mergeConversationMemory,
  updateMemoryForAppliance,
  updateMemoryForModel,
  updateMemoryForPart,
  updateMemoryForTroubleshooting
} from "@/lib/agent/memory";

const suggestedPrompts = [
  "How can I install part number PS11752778?",
  "Is PS11752778 compatible with my WDT780SAEM1 model?",
  "The ice maker on my Whirlpool fridge is not working. How can I fix it?",
  "Can you help me find a dishwasher door gasket?"
];

const initialAssistantMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help with refrigerator and dishwasher parts, compatibility, installation, and troubleshooting."
};

function detectModelNumber(text: string) {
  const match = text.match(/\b(?!PS\d{8}\b)[A-Z]{1,4}\d[A-Z0-9]{5,12}\b/i);
  return match?.[0]?.toUpperCase() ?? null;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistantMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [memory, setMemory] = useState<ConversationMemory>(createConversationMemory());
  const endRef = useRef<HTMLDivElement | null>(null);

  const canSend = input.trim().length > 0;
  const quickExamples = useMemo(() => suggestedPrompts, []);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  async function sendMessage(nextMessage: string) {
    const trimmed = nextMessage.trim();
    if (!trimmed) return;

    const detectedModel = detectModelNumber(trimmed);
    const nextMemory = detectedModel ? updateMemoryForModel(memory, detectedModel) : memory;
    setMemory(nextMemory);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    scrollToBottom();

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: trimmed,
          currentModelNumber: detectedModel ?? memory.currentModelNumber,
          memory: nextMemory
        })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = (await response.json()) as AgentResponse;
      setMemory((previous) => mergeConversationMemory(previous, data.memory));

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: data.message,
          response: data
        }
      ]);

      if (data.compatibility?.modelNumber) {
        setMemory((previous) => updateMemoryForModel(previous, data.compatibility?.modelNumber ?? null));
      }

      if (data.products?.[0]) {
        const products = data.products;
        const product = products[0];
        setMemory((previous) => updateMemoryForPart(previous, product.partNumber));
        setMemory((previous) => updateMemoryForAppliance(previous, product.applianceType));
        setRecentlyViewed((previous) => {
          const next = [...products, ...previous];
          const deduped: Product[] = [];
          const seen = new Set<string>();

          for (const item of next) {
            if (seen.has(item.partNumber)) continue;
            seen.add(item.partNumber);
            deduped.push(item);
          }

          return deduped.slice(0, 6);
        });
      }

      if (data.intent === "troubleshooting" && data.sections?.length) {
        setMemory((previous) =>
          updateMemoryForTroubleshooting(
            previous,
            data.sections?.flatMap((section) => section.items) ?? []
          )
        );
      }

    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          role: "assistant",
          content: isTimeout
            ? "The live lookup took too long. Please try again, or use a more specific part number or symptom."
            : "I hit an internal demo error. Please try the request again or use one of the suggested prompts."
        }
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
      scrollToBottom();
    }
  }

  function viewInstallationGuide(product: Product) {
    void sendMessage(`How do I install ${product.partNumber}?`);
  }

  function checkCompatibility(product: Product) {
    if (memory.currentModelNumber) {
      void sendMessage(`Is ${product.partNumber} compatible with my ${memory.currentModelNumber} model?`);
      return;
    }

    void sendMessage(`Is ${product.partNumber} compatible with my model?`);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-[0_10px_30px_rgba(37,99,235,0.25)]">
              <div className="grid h-6 w-6 grid-cols-2 gap-1">
                <span className="rounded-full bg-white" />
                <span className="rounded-full bg-blue-200" />
                <span className="rounded-full bg-blue-300" />
                <span className="rounded-full bg-sky-200" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-blue-700">
                PartSelect Repair Help
              </p>
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Appliance Parts Assistant
              </h1>
            </div>
            </div>

          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Refrigerator parts
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Dishwasher parts
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_50px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                PartSelect repair support
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl">
                Find the right appliance part and get repair guidance in one place.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Scope</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Refrigerator + dishwasher</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Help</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Parts + repair guidance</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_390px]">
          <section className="glass flex min-h-[72vh] flex-col overflow-hidden rounded-[32px] border-slate-200 shadow-[0_14px_50px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Repair chat
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Ask about parts, installation, compatibility, or troubleshooting.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {loading ? "Searching PartSelect..." : "Ready to help"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,251,255,0.75),rgba(255,255,255,0.95))] px-5 py-5">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onViewInstallationGuide={viewInstallationGuide}
                  onCheckCompatibility={checkCompatibility}
                />
              ))}
              {loading && (
                <div className="flex justify-start animate-[fadeIn_0.25s_ease-out]">
                  <div className="glass max-w-[92%] rounded-[28px] px-4 py-4 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-700">
                      PartSelect
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-700" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500 [animation-delay:240ms]" />
                      <span className="ml-2">Checking the catalog...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-5">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Suggested actions
                  </p>
                  <p className="text-xs text-slate-500">Start with a common repair path</p>
                </div>
                <SuggestedPrompts prompts={quickExamples} onPromptClick={sendMessage} />
              </div>

              <form
                className="flex items-end gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage(input);
                }}
              >
                <label className="flex-1">
                  <span className="sr-only">Message</span>
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage(input);
                      }
                    }}
                    placeholder="Ask about a part number, model compatibility, a repair symptom, or installation steps..."
                    rows={3}
                    className="w-full resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex h-[54px] items-center justify-center rounded-[22px] bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  Send
                </button>
              </form>
            </div>
          </section>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <CartPanel
              recentlyViewed={recentlyViewed}
              onQuickHelp={sendMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
