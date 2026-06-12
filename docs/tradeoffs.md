# PartSelect AI Demo Tradeoffs

## Why Deterministic Routing Was Chosen

Deterministic routing makes the demo predictable, testable, and easy to explain. It keeps the core behavior stable for a hiring demo and avoids depending on model behavior for basic classification.

## Why Structured Compatibility Checks Were Used

Compatibility is treated as data, not generated text. That makes the result auditable and prevents the system from guessing fit or inventing model coverage.

## Why Mock Data Was Used

Mock data keeps the demo local, fast, and reliable. It also allows the UI, tools, and evaluation flow to be built before a real ingestion pipeline exists.

## Why an LLM Was Not Required for the Demo

The demo does not need an LLM to prove the architecture. The core value is in the workflow, grounding, and structured UI. An LLM can be layered on later as a response composer, not a source of truth.

## How the System Could Evolve

The current shape can evolve into a production system without changing the UX contract:

- Replace mock data with crawler output
- Store normalized catalog data in Postgres
- Store guides and repair content in a vector database
- Add Redis for common lookups
- Run crawling, parsing, and embedding work in background jobs
- Add observability and offline evaluation to monitor quality over time
