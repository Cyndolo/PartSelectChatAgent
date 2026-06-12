type AgentAnalyticsEvent = {
  query: string;
  intent: string;
  selectedTool: string;
  latencyMs: number;
  validationStatus?: "valid" | "incomplete" | "missing" | "invalid";
  lookupMode?: "live" | "demo_fallback" | "skipped_invalid_input" | "skipped_context_update";
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  llmUsed: boolean;
};

export function trackAgentEvent(event: AgentAnalyticsEvent) {
  // In production, this would forward to OpenTelemetry spans, Datadog logs,
  // or Segment event tracking instead of console logging.
  console.log(
    JSON.stringify(
      {
        query: event.query,
        intent: event.intent,
        selectedTool: event.selectedTool,
        latencyMs: event.latencyMs,
        validationStatus: event.validationStatus,
        lookupMode: event.lookupMode,
        tokens: event.tokens,
        llmUsed: event.llmUsed
      },
      null,
      2
    )
  );
}
