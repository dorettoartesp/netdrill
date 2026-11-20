# API Contracts & Interface Specifications

Guidelines for designing, versioning, and managing external and internal service contracts.

## 1. Contract-First Engineering
- When building APIs (REST, GraphQL, gRPC), contracts must be specified before client integration begins.
- API definitions belong under `docs/api/` (e.g., `openapi.yaml`, `schema.graphql`, or `*.proto`).

## 2. Backward Compatibility & Evolution
- Breaking changes require a new API version path prefix (e.g., `/api/v2/`).
- Fields should be marked deprecated before removal across at least one minor release cycle.
- Schemas must strictly validate inputs at system boundaries before payload dispatch to domain services.
