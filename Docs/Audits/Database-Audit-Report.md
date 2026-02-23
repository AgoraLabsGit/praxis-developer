# Praxis Database Architecture Audit Report

**Date:** February 23, 2025  
**Scope:** Supabase schema, RLS policies, auth, multi-tenant security

---

## Executive Summary

The database architecture is **generally well-structured** with RLS enabled on all tables and a clear hierarchy (Organization → Project → Team → Agents/Workflows). However, several **critical and high-priority improvements** are needed for production-grade security, especially around multi-tenant membership, secrets handling, and policy consistency.

---

## 1. Schema Structure Assessment

### ✅ Strengths

| Area | Status | Notes |
|------|--------|-------|
| **Hierarchy** | Good | Clear: `organizations` → `projects` → `teams` → `agents`/`workflows` |
| **Foreign Keys** | Good | Proper cascading (`ON DELETE CASCADE`) where appropriate |
| **Indexes** | Good | Indexes on FKs and frequently queried columns |
| **Timestamps** | Good | `created_at`/`updated_at` with triggers |
| **Extensions** | Good | `pgcrypto` enabled (though not yet used) |

### ⚠️ Gaps

| Issue | Severity | Description |
|-------|----------|-------------|
| **Single-owner model** | High | No `organization_members` table — only `owner_id`. Cannot support team collaboration or invited users. |
| **Nullable `activity_log` FKs** | Medium | `organization_id` and `project_id` are nullable. RLS policy fails for rows where `organization_id IS NULL` (user sees nothing). |
| **No CHECK constraints** | Low | `status`, `type`, `priority` columns use free-form TEXT. Risk of invalid values. |
| **`integrations.config`** | Critical | Stores OAuth tokens (e.g. `access_token`) in plain JSONB. Sensitive data at rest. |

---

## 2. Row Level Security (RLS) Audit

### ✅ What's Working

- **RLS enabled** on all 11 tables: `organizations`, `projects`, `teams`, `workflows`, `workflow_runs`, `workflow_steps`, `agents`, `tasks`, `chat_messages`, `integrations`, `activity_log`
- **Consistent ownership chain**: Policies correctly traverse org → project → team
- **`workflow_runs` / `workflow_steps`**: Correctly scoped by `user_id` (run owner)

### ⚠️ Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **Policy role restriction** | Medium | Policies don't use `TO authenticated` — anon users get implicit deny, but explicit `TO authenticated` is clearer and recommended |
| **`auth.uid()` caching** | Low | Supabase recommends `(SELECT auth.uid())` for better plan caching. Current policies use `auth.uid()` directly. |
| **`activity_log` with NULL org** | Medium | Rows with `organization_id IS NULL` are invisible to all users (policy uses `organization_id IN (...)`). May hide system events or cause confusion. |
| **`integrations.config` exposure** | Critical | RLS allows org owners to SELECT full `config` (including tokens). If client fetches integrations, tokens could leak. Need column-level or view-based masking. |

---

## 3. Multi-Tenant & Auth Security

### Current Model

- **Single-owner per org**: `organizations.owner_id` → `auth.users(id)`
- **No membership table**: No way for multiple users to belong to one org
- **Admin client**: Used only in `onboard/actions.ts` for trusted server-side onboarding. ✅ Appropriate.

### ⚠️ Gaps for Multi-Tenant Best Practices

| Gap | Recommendation |
|-----|----------------|
| **No `organization_members`** | Add `organization_members(organization_id, user_id, role)` for future collaboration |
| **No role-based access** | When adding members, support `admin`, `member`, `viewer` roles |
| **No invite flow** | Schema doesn't support pending invites (would need `organization_invites`) |

---

## 4. Secrets & Sensitive Data

| Data | Location | Risk |
|------|----------|------|
| **OAuth tokens** | `integrations.config` JSONB | Stored in plain text. Accessible to any client with org read access. |
| **API keys** | Env vars (`.env.local`) | ✅ Not in DB |
| **User passwords** | Supabase Auth | ✅ Handled by Supabase |

**Recommendations for `integrations.config`:**

1. **Implemented**: `integrations_safe` view excludes `config`. Use `from('integrations_safe')` for client queries.
2. **Short-term**: Never `SELECT config` from client. Use server actions that fetch and use tokens server-side only.
3. **Medium-term**: Encrypt `config` at rest using `pgcrypto` (e.g. `pgp_sym_encrypt` with a key from Vault/env).
4. **Long-term**: Use Supabase Vault or external secrets manager for OAuth tokens.

---

## 5. Auth Configuration (config.toml)

| Setting | Current | Recommendation | Status |
|---------|---------|----------------|--------|
| `minimum_password_length` | 8 | **8** (NIST/OWASP) | ✅ Done |
| `password_requirements` | `lower_upper_letters_digits` | stronger | ✅ Done |
| `enable_confirmations` | false | **true** for production (verify email) | Optional |
| `secure_password_change` | false | **true** (re-auth before password change) | Optional |
| `enable_refresh_token_rotation` | true | ✅ Good | ✅ |
| `enable_anonymous_sign_ins` | false | ✅ Good | ✅ |

---

## 6. Best Practices Checklist

| Practice | Status |
|----------|--------|
| RLS on all public tables | ✅ |
| No service role in client | ✅ |
| Indexes on RLS policy columns | ✅ |
| Explicit `TO authenticated` on policies | ✅ |
| `WITH CHECK` on INSERT/UPDATE | ✅ |
| Encrypted secrets at rest | ❌ |
| Audit logging for sensitive ops | ❌ |
| CHECK constraints on enums | ❌ |

---

## 7. Recommended Actions

### Critical (Do First)

- [x] **Mask `integrations.config`** — Create a view or RPC that excludes `config` for client queries; use server-side only for token access.
- [x] **Strengthen auth** — Increase `minimum_password_length` to 8, add `password_requirements`.

### High Priority

- [ ] **Add `organization_members`** — Prepare schema for multi-user orgs.
- [x] **Fix `activity_log` RLS** — Handle `organization_id IS NULL` (e.g. allow system events for org members, or require `organization_id`).
- [x] **Add `TO authenticated`** to all RLS policies.

### Medium Priority

- [x] **Optimize policies** — Use `(SELECT auth.uid())` for caching.
- [x] **Add indexes** — `organizations(owner_id)`, ensure `organization_id` indexed on all tenant tables.
- [ ] **Add CHECK constraints** — For `status`, `type`, `priority` where applicable.

### Lower Priority

- [ ] **Encrypt `integrations.config`** — Use pgcrypto or Vault.
- [ ] **Event trigger** — Auto-enable RLS on new tables (per Supabase docs).

---

## 8. Migration Order

- [x] `20260223120000_security_audit_fixes.sql` — RLS improvements, indexes, auth hints
- [ ] Future: `organization_members`, `organization_invites`
- [ ] Future: Encrypted `integrations.config` or Vault migration
