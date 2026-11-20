# ADR 0004: Minimalist PIN and Cookie Authentication (Ponytail & YAGNI)

## Status
Accepted

## Context
The user requested the cheapest, fastest authentication solution possible for personal learning access across mobile and desktop, avoiding third-party authentication services, recurring costs, or account setup overhead.

## Decision
Adopt a single personal **Master PIN/Password** configured via `APP_PIN` environment variable. On successful verification, a signed `HttpOnly`, `SameSite=Strict` cookie is issued, valid for 30 days.

## Consequences
- **Positive:** Zero financial cost; zero third-party dependencies; implemented in minimal code; user enters PIN once per month per device.
- **Negative:** Single-user profile per instance; multi-user profile separation is deferred to future requirements.
