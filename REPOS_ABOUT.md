# Brutal Design Review: Multi-Tenant Strapi + NestJS on Single VPS

Let me be direct: **this architecture has fundamental problems that will cause production incidents.** I'm going to tear it apart.

---

## The 7+ Hidden Risks Most Senior Devs Will Miss

### 1. Strapi Multi-Tenancy Is a Lie

**Failure Scenario:** You've implemented multi-tenancy in Strapi using one of these approaches: (a) row-level filtering, (b) schema-per-tenant, or (c) separate Strapi instances. All three fail differently but catastrophically.

- **Row-level filtering**: Strapi's content-type builder, GraphQL playground, and admin panel all leak tenant data because they weren't designed for isolation. One developer testing in admin sees all tenants' data.
- **Schema-per-tenant**: Strapi migrations run globally. One schema change corrupts all tenants simultaneously.
- **Multiple instances**: Now you're running N Strapi processes on a single VPS. Memory scales linearly with tenants.

**Why It's Hard to Detect Early:** Works fine with 2 tenants in dev. Breaks at 10+ tenants with real data.

**Production Damage:** Tenant data leakage (GDPR nightmare), or complete unavailability when memory is exhausted.

---

### 2. OOM Killer Will Pick the Wrong Container

**Failure Scenario:** Your VPS hits memory pressure. Linux OOM killer activates. It doesn't understand your architecture—it kills whatever looks biggest. Usually that's PostgreSQL mid-transaction, or Redis mid-persistence.

**Why It's Hard to Detect Early:** Dev environments have generous memory. You never hit swap. Production with real traffic + all tenants does.

**Production Damage:** PostgreSQL crash during write = WAL corruption possibility. Redis crash during RDB = data loss. Service restarts in wrong order = cascading failures with connection refused errors.

---

### 3. Connection Pool Exhaustion Creates Silent Deadlocks

**Failure Scenario:** 
- Strapi: opens connections for each request
- NestJS "common service": maintains its own pool
- Each tenant multiplies concurrent connections
- PostgreSQL default: `max_connections = 100`

At 5 tenants with 10 concurrent users each, you're at 50+ connections minimum. Add background jobs, admin users, and you're deadlocked waiting for connections that never free.

**Why It's Hard to Detect Early:** Dev has 1-2 concurrent connections. Load testing doesn't simulate real multi-tenant access patterns.

**Production Damage:** Requests hang indefinitely. No error, just timeouts. Health checks pass because they use existing connections. Your monitoring says "everything's fine" while users can't load pages.

---

### 4. Redis Memory Eviction Will Delete the Wrong Keys

**Failure Scenario:** You're using Redis for sessions, cache, and maybe queues. VPS memory gets tight. Redis hits `maxmemory`. Default policy is `noeviction`—Redis starts rejecting writes. If you set `volatile-lru`, it evicts keys with TTL first—that's your sessions, not your cache.

Users get logged out mid-action. Session data gone. If you're using Redis for NestJS Bull queues, jobs silently disappear.

**Why It's Hard to Detect Early:** Local Redis has plenty of memory. You never configure `maxmemory-policy` because it "just works."

**Production Damage:** Random user logouts. Lost job processing. Corrupted application state.

---

### 5. Strapi Upgrades Will Break Your Multi-Tenant Customizations

**Failure Scenario:** Strapi v4.x to v5 (or even v4.12 to v4.15) changes internal APIs. Your multi-tenant middleware hooks into `strapi.db.query` or lifecycle hooks. New version changes the signature. Your tenant isolation silently breaks—no errors, just queries returning cross-tenant data.

**Why It's Hard to Detect Early:** Unit tests pass because they mock Strapi internals. Integration tests use single-tenant fixtures.

**Production Damage:** Data breach. Legal liability. Loss of customer trust.

---

### 6. PostgreSQL Vacuum on Multi-Tenant Tables Creates Query Timeouts

**Failure Scenario:** Row-level multi-tenancy means one giant table for all tenants. Table grows to millions of rows. PostgreSQL autovacuum kicks in, locks table, query plans go bad. Simple `SELECT * FROM content WHERE tenant_id = X` that took 5ms now takes 5 seconds.

**Why It's Hard to Detect Early:** Small tables vacuum instantly. The problem only manifests at scale after months of production usage.

**Production Damage:** Cascading timeouts. NestJS requests time out waiting for Strapi. Users see 504 errors. Background jobs fail and retry, making it worse.

---

### 7. Docker Compose `depends_on` Doesn't Wait for Service Readiness

**Failure Scenario:** VPS reboots. Docker Compose starts. PostgreSQL container starts but needs 30 seconds to recover WAL. Strapi starts immediately, tries to connect, fails, crashes. NestJS does the same. Docker restarts them. Race condition loop.

**Why It's Hard to Detect Early:** Local dev PostgreSQL starts instantly. No crash recovery needed.

**Production Damage:** Extended downtime after any restart. Services flapping. Potential data corruption if services connect during PostgreSQL recovery.

---

### 8. (Bonus) Single VPS = No Blast Radius Isolation

**Failure Scenario:** A bug in your NestJS service causes a memory leak. It consumes all available RAM. PostgreSQL can't allocate memory for queries. Redis can't fork for persistence. Strapi can't handle requests. Everything dies together.

Or: A runaway cron job in Strapi spins CPU to 100%. All services compete. Nothing can respond.

**Why It's Hard to Detect Early:** Isolated resource limits in Docker require explicit configuration (`mem_limit`, `cpus`). Nobody sets these in dev.

**Production Damage:** Total system failure from any single component's bug.

---

## Assumptions You're Making Without Realizing It

### Challenged Assumption #1: "Multi-Tenant Strapi Is a Solved Problem"

**Reality:** It's not. Strapi was designed as a single-tenant headless CMS. Every multi-tenant implementation I've reviewed is a hack. The official Strapi team has explicitly said multi-tenancy is not a first-class feature. You are building on an unsupported foundation.

The people who "make it work" either:
- Have trivial tenant isolation requirements (just filtering by org_id, no real data isolation)
- Run separate Strapi instances per tenant (not multi-tenant, just multi-instance)
- Have custom forks of Strapi they maintain themselves

**What This Means:** Every Strapi upgrade, plugin install, or content-type change is a risk to your tenant isolation.

---

### Challenged Assumption #2: "A 'Common Service' in NestJS Will Cleanly Handle Shared Logic"

**Reality:** What goes in "common"? Authentication? Authorization? Tenant resolution? Billing? Logging? Notifications?

This becomes a god service. Every feature touches it. Every deploy is high-risk. Every team blocks on it. It violates single responsibility and becomes the coupling point for your entire system.

**What This Means:** Your "simplicity" of one common service creates deployment coupling, testing complexity, and a single point of failure for all cross-cutting concerns.

---

## My Verdict: Should This System Be Built This Way?

**No. This architecture should not be built this way.**

Here's why: You're combining three high-risk decisions simultaneously:
1. Multi-tenancy on a tool not designed for it (Strapi)
2. All services on single compute (VPS)
3. Shared resources with no isolation (PostgreSQL, Redis, disk)

Each is manageable alone. Together, they create compound failure modes that are nearly impossible to debug in production.

---

## Alternative Direction (If You're Committed to This Stack)

If budget is the constraint forcing single VPS:

### Option A: Accept You're Not Multi-Tenant
Use Strapi as single-tenant for your own content. Tenant-specific content lives in PostgreSQL, accessed only through NestJS. Strapi becomes your internal CMS, not a platform feature.

### Option B: Replace Strapi with Direct PostgreSQL + NestJS
Build content management into NestJS using TypeORM/Prisma. You control the multi-tenancy. You control the schema. No third-party update risk. Less moving parts.

### Option C: If Multi-Tenant CMS Is Required
Use a purpose-built multi-tenant CMS (Payload CMS with multi-tenancy plugin, or Directus with proper role-based isolation). These have multi-tenancy as a design consideration, not an afterthought.

### Non-Negotiable Changes If You Proceed Anyway

1. **Set explicit memory limits on all Docker containers** — `mem_limit` in compose, with total < 80% of VPS RAM
2. **Configure Redis `maxmemory-policy allkeys-lru`** and separate keyspaces for sessions vs cache
3. **Set PostgreSQL `max_connections` explicitly** and use PgBouncer between services
4. **Implement proper health checks with `healthcheck` in Docker Compose** — not just "is port open" but "can execute query"
5. **Set up off-VPS backups** — streaming WAL to S3, Redis RDB to S3, before any production traffic
6. **Implement tenant isolation tests that run on every PR** — queries that assert tenant A cannot see tenant B data

---

**Bottom line:** You're building a system with three separate sources of complexity (multi-tenancy, Docker colocation, Redis/PostgreSQL shared resources) and hoping none of them explode at the same time. They will. And when they do, you'll be debugging at 3 AM with no blast radius isolation and no rollback path.

What's the actual business requirement driving this architecture? That will determine if there's a better path.
