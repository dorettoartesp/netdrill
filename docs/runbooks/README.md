# Operational Runbooks & SRE Procedures

Standard operating procedures for service deployment, health monitoring, incident mitigation, and disaster recovery.

## 1. Local Development Operations
- **Start Backing Services:** `make docker-up` (launches PostgreSQL and Valkey in detached mode).
- **View Live Logs:** `make docker-logs`.
- **Stop Services:** `make docker-down`.

## 2. Health Monitoring & Probes
- All web services must expose an operational health probe (e.g. `/api/health/` or `/healthz`).
- Probes must verify connectivity to backing dependencies (database, cache/queue) and return HTTP 200 when healthy or HTTP 503 during disruption.

## 3. Incident Management & Rollback Strategy
1. **Rollback Procedure:** Always ensure migrations are backward-compatible. In case of production failures, immediately rollback deployment pods to the previous container image release.
2. **Database Recovery:** In case of data inconsistency, restore from point-in-time recovery (PITR) snapshots.
