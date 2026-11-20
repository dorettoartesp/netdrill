.DEFAULT_GOAL := help
SHELL := /bin/bash

# ------------------------------------------------------------------------------
# 1. Stack Detection and Override Precedence
# ------------------------------------------------------------------------------
# User/Agent explicit override via stack.mk (if present)
-include stack.mk

# Auto-detect language manifests if commands are not explicitly defined in stack.mk
ifndef CMD_TEST
  ifneq ($(wildcard *.csproj *.sln),)
    STACK_DETECTED := csharp
    CMD_DEV ?= dotnet run
    CMD_LINT ?= dotnet format --verify-no-changes
    CMD_TEST ?= dotnet test
  else ifneq ($(wildcard pom.xml),)
    STACK_DETECTED := java-maven
    CMD_DEV ?= mvn spring-boot:run
    CMD_LINT ?= mvn checkstyle:check
    CMD_TEST ?= mvn test
  else ifneq ($(wildcard build.gradle build.gradle.kts),)
    STACK_DETECTED := java-gradle
    CMD_DEV ?= ./gradlew bootRun
    CMD_LINT ?= ./gradlew check
    CMD_TEST ?= $(if $(wildcard gradlew),./gradlew test,gradle test)
  else ifneq ($(wildcard Cargo.toml),)
    STACK_DETECTED := rust
    CMD_DEV ?= cargo run
    CMD_LINT ?= cargo clippy
    CMD_TEST ?= cargo test
  else ifneq ($(wildcard package.json),)
    STACK_DETECTED := node
    CMD_DEV ?= npm run dev
    CMD_LINT ?= npm run lint
    CMD_TEST ?= npm test
  else ifneq ($(wildcard pyproject.toml),)
    STACK_DETECTED := python
    CMD_DEV ?= python -m app
    CMD_LINT ?= ruff check .
    CMD_TEST ?= pytest
  else ifneq ($(wildcard go.mod),)
    STACK_DETECTED := go
    CMD_DEV ?= go run .
    CMD_LINT ?= golangci-lint run
    CMD_TEST ?= go test ./...
  else
    STACK_DETECTED := none
    CMD_DEV ?= @echo "No stack initialized yet (run 'cargo new', 'npm init', 'dotnet new', etc.)."
    CMD_LINT ?= @echo "No stack initialized yet (skipping lint)."
    CMD_TEST ?= @echo "No stack initialized yet (skipping test)."
  endif
endif

# If CMD_LINT was not set by stack.mk, provide default fallback
CMD_LINT ?= @echo "No lint command configured (skipping lint)."

.PHONY: help dev lint test scan portability semgrep check new-project test-bootstrap docs docs-serve changelog version docker-up docker-down docker-logs

help: ## Display the list of available targets
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

dev: ## Start local development server (stack-aware)
	@$(CMD_DEV)

lint: ## Execute static analysis and linter (stack-aware)
	@$(CMD_LINT)

test: ## Run automated test suite (stack-aware)
	@$(CMD_TEST)

docker-up: ## Start local backing infrastructure via Docker Compose (PostgreSQL, Valkey)
	@docker compose up -d

docker-down: ## Stop local backing infrastructure via Docker Compose
	@docker compose down

docker-logs: ## Follow logs from local infrastructure services
	@docker compose logs -f

portability: ## Verify zero hardcoded local filesystem paths in tracked files
	@bash scripts/check-portability.sh

scan: ## Run security scan for credentials and high-entropy leaks (gitleaks)
	@bash scripts/gitleaks.sh history

semgrep: ## Run static application security testing (SAST)
	@bash scripts/semgrep.sh scan

check: lint semgrep test scan portability ## The inviolable quality gate: runs lint, SAST, tests, scans, and portability
	@git diff --check

new-project: ## Rebrand and bootstrap template for a new project
	@bash scripts/init-project.sh

test-bootstrap: ## Run automated test suite verifying bootstrap wizard
	@bash scripts/test-init-project.sh

MKDOCS ?= $(shell command -v mkdocs 2>/dev/null || echo "uvx --with mkdocs-material mkdocs")
GIT_CLIFF ?= $(shell command -v git-cliff 2>/dev/null || echo "uvx git-cliff")
CMD_DOCS ?= $(MKDOCS) build --strict
CMD_DOCS_SERVE ?= $(MKDOCS) serve

docs: ## Build static documentation (stack-adaptive, defaults to MkDocs)
	@$(CMD_DOCS)

docs-serve: ## Serve local interactive documentation portal (stack-adaptive)
	@$(CMD_DOCS_SERVE)

changelog: ## Regenerate CHANGELOG.md from Conventional Commits
	@$(GIT_CLIFF) --config cliff.toml --output CHANGELOG.md

version: ## Display base version and Git-derived build version
	@bash scripts/build-version.sh
