# PartSelect AI Demo

This project is a local, runnable case-study demo for a domain-restricted commerce/support agent focused on refrigerator and dishwasher parts.

## Project Overview

The assistant supports:

- Refrigerator parts
- Dishwasher parts
- Part lookup by part number
- Model compatibility checks
- Installation guides
- Troubleshooting flows
- Mock add-to-cart
- Out-of-scope refusal

The MVP uses local mock data and a rule-based router. Version 2 refactors that demo into a more scalable agent architecture with explicit tool execution, session memory, evaluation, observability, and an optional LLM response composer.

## How To Run

```bash
npm install
npm run dev
```

Then open:

```bash
http://localhost:3000
```

To enable the optional LLM layer, add an `.env.local` file:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

## Example Queries

- `How can I install part number PS11752778?`
- `Is PS11752778 compatible with my WDT780SAEM1 model?`
- `The ice maker on my Whirlpool fridge is not working. How can I fix it?`
- `Can you help me find a dishwasher door gasket?`
- `What is the weather tomorrow?`

## Agent Architecture

```text
User Query
  -> Intent Detection
  -> Tool Selection
  -> Tool Execution
  -> LLM Response Composer
  -> Structured UI
```

Relevant code:

- Router: [lib/agent/router.ts](lib/agent/router.ts)
- Executor: [lib/agent/executor.ts](lib/agent/executor.ts)
- Memory: [lib/agent/memory.ts](lib/agent/memory.ts)
- Analytics: [lib/analytics.ts](lib/analytics.ts)
- LLM composer: [lib/llm.ts](lib/llm.ts)

## Tool Layer

Tools are simple local functions that return structured data only.

- [lib/agent/tools/searchProducts.ts](lib/agent/tools/searchProducts.ts)
- [lib/agent/tools/compatibility.ts](lib/agent/tools/compatibility.ts)
- [lib/agent/tools/installation.ts](lib/agent/tools/installation.ts)
- [lib/agent/tools/troubleshooting.ts](lib/agent/tools/troubleshooting.ts)
- [lib/agent/tools/cart.ts](lib/agent/tools/cart.ts)

## Memory

Memory only lives for the browser session.

Tracked fields:

- `currentModelNumber`
- `applianceType`
- `selectedPart`
- `previousTroubleshootingTopic`
- `troubleshootingContext`
- `cartItems`

The browser passes a session snapshot to the chat API, and the executor returns memory patches so the UI can stay in sync without a database.

## Evaluation

Run the routing eval with:

```bash
npm run eval
```

The test set lives in [evals/testCases.ts](evals/testCases.ts) and includes installation, compatibility, troubleshooting, part lookup, cart, and refusal cases.

## Observability

The demo logs structured agent events from [lib/analytics.ts](lib/analytics.ts).

Tracked fields:

- Query
- Detected intent
- Selected tool
- Response latency

In production, that event shape can be forwarded to OpenTelemetry, Datadog, or Segment instead of `console.log`.

## Scalability

The current and future architecture are documented in [docs/architecture.md](docs/architecture.md).

Planned production improvements:

- Replace mock data with a crawler ingestion pipeline
- Store products and compatibility in Postgres
- Store repair guides and installation instructions in a vector DB
- Add Redis cache for common compatibility and product lookup
- Add queue-based crawler/parser/embedding workers
- Add observability and an evaluation set
- Add optional LLM composition for grounded natural language responses

## Future Work

If the demo moves toward production, the next steps are:

- Incremental crawling instead of full recrawls
- Durable catalog normalization jobs
- Vector search for repair content
- Caching for frequent lookups
- Offline evaluation and monitoring loops

## Production Scaling

The design keeps the UI and tool contracts stable while the backend grows from local mock data to durable storage and asynchronous ingestion.

## Data Pipeline

The catalog layer is intentionally lightweight, but it is structured like a real ingestion pipeline.

Current demo:

```text
Local seed data
-> normalization
-> generated catalog
-> agent tools
```

In this demo, the seed files live in `data/raw/`, the normalization logic lives in `lib/catalog/`, and the generated catalog is consumed directly by the agent tools.

Production:

```text
Crawler
-> raw HTML cache
-> parser
-> normalizer
-> Postgres
-> vector index
```

That future path would let us swap the local seed files for real PartSelect catalog ingestion without changing the tool interfaces or the UI contract.

## Tradeoffs

- This demo uses mock data for speed and reliability.
- The rule-based tool flow is easy to explain and test.
- The LLM is optional and never becomes the source of truth.
- The architecture is intentionally shaped so the same interfaces can scale to the full PartSelect catalog later.
