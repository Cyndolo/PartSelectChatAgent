import { NextResponse } from "next/server";
import type { ChatRequest } from "@/lib/types";
import { executeAgent } from "@/lib/agent/executor";
import { EMPTY_INPUT_MESSAGE } from "@/lib/agent/prompts";

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      {
        message:
          "I can only help with refrigerator and dishwasher parts, installation, compatibility, troubleshooting, and order support.",
        intent: "out_of_scope"
      },
      { status: 400 }
    );
  }

  if (!body?.message || typeof body.message !== "string") {
    return NextResponse.json(
      {
        message: EMPTY_INPUT_MESSAGE,
        intent: "clarification_needed"
      },
      { status: 200 }
    );
  }

  if (!body.message.trim()) {
    return NextResponse.json(
      {
        message: EMPTY_INPUT_MESSAGE,
        intent: "clarification_needed"
      },
      { status: 200 }
    );
  }

  const result = await executeAgent({
    message: body.message,
    currentModelNumber: body.currentModelNumber ?? null,
    memory: body.memory ?? null
  });

  return NextResponse.json(result.response);
}
