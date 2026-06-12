import type { ChatRequest, AgentResponse } from "@/lib/types";
import { executeAgent } from "@/lib/agent/executor";

export async function generateAgentResponse(request: ChatRequest): Promise<AgentResponse> {
  return (await executeAgent(request)).response;
}

export { executeAgent };
