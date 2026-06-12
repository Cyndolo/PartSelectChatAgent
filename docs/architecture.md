# PartSelect AI Agent Architecture

## Current Demo Architecture

```text
User
  -> Chat UI
  -> Intent Router
  -> Tool Layer
  -> Structured Data
```

In the current demo, the UI sends a user message to the chat API. The API uses the deterministic router to pick a path, calls local tools, and returns a structured response for the UI to render.

## Future Production Architecture

```text
Crawler
  -> Queue
  -> Parser
  -> Postgres
  -> Embedding Pipeline
  -> Vector Search
  -> Agent API
  -> Web App
```

This production path keeps the same high-level app shape, but replaces local seed data with an ingestion pipeline, durable storage, and retrieval systems.

## Redis Cache

Redis would cache:

- Common part lookups
- Compatibility checks
- Frequently used installation and troubleshooting results

That reduces latency and keeps repeat queries fast.

## Background Workers

Background workers would handle:

- Incremental crawling
- HTML parsing
- Data normalization
- Embedding generation
- Reindexing after catalog changes

## Incremental Crawling

Instead of recrawling the full catalog every time:

- Track when pages last changed
- Crawl only new or updated pages
- Reprocess dependent records when a part or compatibility rule changes

## Observability

The system should log:

- Query text
- Routed intent
- Selected tool
- Response latency
- Tool errors
- Clarification rate
- Refusal rate

Those events can flow to Datadog, OpenTelemetry, Segment, or a warehouse-backed analytics pipeline.
