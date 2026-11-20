# Domain Model and Ubiquitous Language (.agents/context/domain-model.md)

This document defines the core domain concepts, ubiquitous language, and system boundaries for AI agents and developers.

## 1. DDD Modeling Principles

- **Domain Entities:** Must encapsulate business state and behavior, isolated from persistence annotations when strict domain boundaries are required.
- **Value Objects:** Immutable, without conceptual identity, validated upon instantiation (e.g., addresses, monetary amounts, composite identifiers).
- **Domain Services:** Pure business logic operations that do not naturally belong to a single entity.
- **Application Services:** Use-case orchestrators (orchestrating aggregate retrieval, domain rule execution, and event/notification publication).
- **Infrastructure Adapters:** Components implementing data access interfaces/protocols, external third-party integrations, and messaging.

## 2. Ubiquitous Language Glossary

| Term | Definition |
|---|---|
| **Quality Gate** | Mandatory automated compliance and integrity check suite (`make check`). |
| **Portability Gate** | Verification that zero host-specific filesystem paths leak into the codebase (`scripts/check-portability.sh`). |
| **Viewable Prototype** | Standalone interactive UI screen artifact used for prior approval before production code (`prototypes/<screen-slug>/`). |
| **Double-Submission Prevention** | UI interaction rule disabling submission elements immediately upon trigger with a `try...finally` lifecycle. |
