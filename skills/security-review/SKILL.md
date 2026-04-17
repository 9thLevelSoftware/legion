---
name: legion:security-review
description: OWASP Top 10 and STRIDE threat modeling security review for code and architecture
triggers: [security, owasp, threat-model, vulnerability, cso]
token_cost: high
summary: "Structured security review using OWASP Top 10 checklist and STRIDE threat modeling. Activates on --security flag or when security-sensitive files are modified."
---

# Security Review

Structured security review skill for Legion. Provides OWASP Top 10 checklist evaluation and STRIDE threat modeling for code and architecture review. Activates automatically when security-sensitive files are modified, or explicitly via the `--security` / `--just-security` intent flag.

Agent: `engineering-security-engineer`

---

## Section 1: Activation

This skill activates when ANY of these conditions are met. All filename globs reference the canonical registry in `.planning/config/intent-teams.yaml` under `teams.security.file_patterns[]` — do not inline divergent lists in consumers.

### Explicit Activation
- `--security` or `--just-security` intent flag on `/legion:review`
- `/legion:plan --auto` includes security scan (and `--skip-security` is NOT set)

### Automatic Activation — file-pattern globs

Authoritative glob list: `.planning/config/intent-teams.yaml` → `teams.security.file_patterns[]`. Canonical set (mirror; edit the YAML first when adding):

- `**/*auth*`, `**/*login*`, `**/*session*`, `**/*token*`, `**/*jwt*`
- `**/*password*`, `**/*credential*`, `**/*secret*`, `**/*encrypt*`, `**/*crypto*`
- `**/*permission*`, `**/*rbac*`, `**/*acl*`, `**/*role*`
- `**/*middleware*`, `**/*guard*`, `**/*policy*`

Word-boundary rule: a file qualifies only if the glob matches the filename AND the matched token is separated by `[._/\-]` from alphabetic characters on both sides (so `authorized_users_export.md` → matches `auth` token; `token_generator_template.md` → matches `token` token). If your runtime's glob engine cannot enforce word boundaries, fall back to substring match but flag the finding as confidence: medium rather than high.

Restricted to source-file extensions: `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.rb`, `.go`, `.rs`, `.java`, `.cs`, `.php`, `.swift`, `.kt`, `.scala`, `.cpp`, `.c`, `.h`.

Configuration files qualify ONLY when the extension is `.env`, `.env.*`, `.yaml`, `.yml`, `.toml`, `.ini`, or `.json` AND the file content matches the secret-token grep in Section 6.1.

### Automatic Activation — authentication-decorator detection

Activate when a diff-modified file contains any of these authentication decorators/middleware markers. This list is enumerated — no generic "authentication decorators" prose trigger:

| Framework | Markers (word-boundary regex) |
|-----------|-------------------------------|
| Flask | `@login_required`, `@fresh_login_required`, `@roles_required`, `@permissions_required`, `current_user\.is_authenticated` |
| FastAPI | `Depends\(get_current_user\)`, `Depends\(get_current_active_user\)`, `OAuth2PasswordBearer`, `APIKeyHeader`, `HTTPBearer` |
| Django | `@login_required`, `@permission_required`, `@user_passes_test`, `LoginRequiredMixin`, `PermissionRequiredMixin` |
| Django REST Framework | `permission_classes`, `authentication_classes`, `IsAuthenticated`, `IsAdminUser`, `DjangoModelPermissions` |
| Express (Node) | `passport\.authenticate`, `ensureAuthenticated`, `requireAuth`, `requireRole`, `jwt\(\{` |
| NestJS | `@UseGuards\(`, `@Roles\(`, `@PermissionGuard`, `AuthGuard`, `JwtAuthGuard` |
| Spring (Java) | `@PreAuthorize`, `@PostAuthorize`, `@Secured`, `@RolesAllowed`, `SecurityContextHolder` |
| Rails (Ruby) | `before_action :authenticate`, `authenticate_user!`, `authorize!`, `cancan`, `pundit` |
| ASP.NET | `\[Authorize\]`, `\[AllowAnonymous\]`, `ClaimsPrincipal`, `RoleManager`, `UserManager` |
| Go (Gin/Echo/Chi) | `jwtauth\.Verifier`, `middleware\.Auth`, `AuthMiddleware`, `RequireAuth` |

### Codebase-Aware Activation
- When `.planning/CODEBASE.md` exists and its Risk Areas section identifies security-critical files
- When the phase type is `api` or `security` in CONTEXT.md frontmatter

### Secret-token grep catalog (used by configuration-file activation)

See Section 6.1 for the authoritative grep patterns used to decide whether a configuration file with a generic extension qualifies as security-sensitive. Non-matching configs MUST NOT trigger activation by filename alone.

### When NOT to activate
- Non-code phases (documentation, design, marketing)
- Phases that only modify test files or configuration comments
- When `--skip-security` is explicitly set

---

## Section 2: OWASP Top 10 Checklist

Structured pass/fail evaluation for each OWASP category. The `engineering-security-engineer` agent evaluates each category against the code under review.

### 2.1: Checklist

| # | Category | Severity | Check Items |
|---|----------|----------|-------------|
| 1 | **Injection** | CRITICAL | SQL queries use parameterized statements (not string concatenation). NoSQL queries use typed operators. OS commands use allowlists, not user input. LDAP queries are escaped. Template engines auto-escape output. |
| 2 | **Broken Authentication** | CRITICAL | Passwords hashed with bcrypt/scrypt/argon2 (not MD5/SHA1). Session tokens are cryptographically random. Session invalidation on logout. MFA available for sensitive operations. Rate limiting on login attempts. Account lockout after N failures. |
| 3 | **Sensitive Data Exposure** | HIGH | Data encrypted in transit (TLS 1.2+). Sensitive data encrypted at rest. No secrets in source code or logs. API responses don't leak internal details. PII handling follows minimum necessary principle. Proper key management (no hardcoded keys). |
| 4 | **XML External Entities (XXE)** | HIGH | XML parsers disable external entity processing. DTD processing disabled. If XML not used: N/A (mark as PASS). |
| 5 | **Broken Access Control** | CRITICAL | Resource-level authorization enforced (not just route-level). RBAC/ABAC consistently applied. No IDOR vulnerabilities (direct object references validated). Admin endpoints require elevated privileges. CORS configured restrictively. |
| 6 | **Security Misconfiguration** | MEDIUM | No default credentials in production. Unnecessary features/endpoints disabled. Error messages don't expose stack traces or internal paths. Security headers set (CSP, X-Frame-Options, HSTS). Debug mode disabled in production. |
| 7 | **Cross-Site Scripting (XSS)** | HIGH | Output encoding applied in templates. Content Security Policy (CSP) headers configured. User input sanitized before rendering. DOM manipulation uses safe APIs (textContent, not innerHTML). |
| 8 | **Insecure Deserialization** | HIGH | Untrusted data is not deserialized without validation. Type checking enforced on deserialized objects. Integrity checks (signatures/HMACs) on serialized data. |
| 9 | **Known Vulnerabilities** | MEDIUM | Dependencies scanned for known CVEs. No critically vulnerable packages. Patch currency: dependencies updated within reasonable timeframe. Lock files committed (package-lock.json, yarn.lock). **See Section 5 (Dependency Vulnerability Scan) for automated scanning procedure and Section 7 (Supply Chain Security Checks) for integrity verification.** |
| 10 | **Insufficient Logging** | MEDIUM | Authentication events logged (login, logout, failed attempts). Authorization failures logged. Input validation failures logged. Logs don't contain sensitive data (passwords, tokens, PII). Alerting configured for suspicious patterns. |

### 2.2: Evaluation Process

```
For each OWASP category:

Step 1: Determine applicability
  - Is this category relevant to the files under review?
  - If not applicable (e.g., no XML parsing → XXE is N/A): mark PASS with note "N/A"

Step 2: Check each item
  - For each check item in the category:
    - Search the codebase for relevant patterns
    - Evaluate against the check criteria
    - Mark as PASS, FAIL, or WARN (partial compliance)

Step 3: Produce category verdict
  - All items PASS → Category: PASS
  - Any item FAIL with CRITICAL severity → Category: FAIL (blocker)
  - Any item FAIL with HIGH severity → Category: FAIL (must fix before ship)
  - Any item WARN → Category: WARN (recommend fixing)

Step 4: Record findings
  - For each FAIL or WARN: produce a structured finding (Section 8)
```

---

## Section 3: STRIDE Threat Model

Apply STRIDE threat categories to each system boundary identified in the code under review.

### 3.1: Threat Categories

| Category | Question | Mitigation Pattern |
|----------|----------|--------------------|
| **Spoofing** | Can an attacker impersonate a legitimate user or system? | Strong authentication, token validation, certificate pinning |
| **Tampering** | Can data be modified in transit or at rest without detection? | Integrity checks (HMAC, signatures), input validation, checksums |
| **Repudiation** | Can a user deny performing an action? | Audit logging, non-repudiation signatures, timestamps |
| **Information Disclosure** | Can sensitive data be accessed by unauthorized parties? | Encryption, access control, data minimization, secure error handling |
| **Denial of Service** | Can the system be made unavailable? | Rate limiting, resource quotas, input size limits, circuit breakers |
| **Elevation of Privilege** | Can a user gain unauthorized capabilities? | Least privilege, RBAC enforcement, input validation, sandboxing |

### 3.2: Threat Modeling Process

```
For each system boundary (API endpoint, data store, external integration):

Step 1: Identify the boundary
  - What enters and exits this boundary?
  - Who/what are the actors?
  - What data flows through?

Step 2: Apply STRIDE
  - For each of the 6 threat categories:
    - Is this threat applicable to this boundary?
    - What specific attack vectors exist?
    - What mitigations are in place?
    - Are mitigations sufficient?

Step 3: Produce threat table
  | Boundary | Threat | Category | Attack Vector | Mitigation | Status |
  |----------|--------|----------|---------------|------------|--------|
  | /api/auth/login | Brute force | DoS | Repeated login attempts | Rate limiting at 5/min | MITIGATED |
  | /api/auth/login | Credential stuffing | Spoofing | Leaked credentials | MFA + breach detection | PARTIAL |

Step 4: Flag gaps
  - MITIGATED: threat has adequate countermeasure
  - PARTIAL: countermeasure exists but incomplete
  - UNMITIGATED: no countermeasure — produce finding
```

---

## Section 4: Attack Surface Mapping

Read from `.planning/CODEBASE.md` (if exists) to identify security-relevant surfaces.

### 4.1: Surface Categories

| Surface | What to Look For | Risk Level |
|---------|-----------------|------------|
| **API Endpoints** | Authentication requirements, input validation, rate limiting | HIGH |
| **Authentication Boundaries** | Login flows, token generation, session management | CRITICAL |
| **Data Storage** | Encryption at rest, access controls, backup security | HIGH |
| **External Integrations** | API keys, webhook validation, trust boundaries | MEDIUM |
| **File Upload Handlers** | Type validation, size limits, storage location, execution prevention | HIGH |
| **Admin Interfaces** | Elevated privilege paths, access controls, audit logging | CRITICAL |
| **Client-Side Storage** | localStorage/sessionStorage usage, cookie security flags | MEDIUM |
| **Error Handling** | Information leakage in error messages, stack trace exposure | MEDIUM |

### 4.2: Mapping Process

```
Step 1: Read codebase context
  - If .planning/CODEBASE.md exists: extract Risk Areas, Detected Stack, Conventions
  - If not: scan project files for security-relevant patterns

Step 2: Enumerate surfaces
  - List all API endpoints (from route files, controller files)
  - Identify authentication entry points
  - Find data storage access patterns (database queries, file I/O)
  - Map external integrations (HTTP clients, webhook handlers)

Step 3: Classify risk
  - For each surface: assign risk level from the table above
  - CRITICAL surfaces get full OWASP + STRIDE treatment
  - HIGH surfaces get OWASP checklist
  - MEDIUM surfaces get targeted checks based on surface type

Step 4: Produce attack surface map
  Structured output showing all identified surfaces with risk levels
```

---

## Section 5: Dependency Vulnerability Scan

Automated scanning for known CVEs in project dependencies. Corresponds to OWASP A06:2021 (Vulnerable and Outdated Components).

### 5.1: Detection — Which Package Manager

Detect the project's package ecosystem by checking for lock files:

| Lock File | Ecosystem |
|-----------|-----------|
| `package-lock.json` or `yarn.lock` or `pnpm-lock.yaml` | npm / Node.js |
| `requirements.txt` or `Pipfile.lock` or `poetry.lock` | Python |
| `composer.lock` | PHP / Composer |
| `Gemfile.lock` | Ruby |
| `go.sum` | Go |
| `Cargo.lock` | Rust |

If multiple ecosystems are detected, scan all of them.

### 5.2: Scan Procedure

For each detected ecosystem, run the appropriate audit command:

```
Node.js:
  npm audit --json 2>/dev/null

Python:
  pip audit --format=json 2>/dev/null || safety check --json 2>/dev/null

PHP:
  composer audit --format=json 2>/dev/null

Go:
  govulncheck ./... 2>/dev/null

Ruby:
  bundle audit check --format=json 2>/dev/null

Rust:
  cargo audit --json 2>/dev/null
```

Parse output for each ecosystem. Extract: severity (critical/high/moderate/low), package name, vulnerable version range, patched version, and advisory URL.

If the audit command is not installed or not available, record a finding: "Dependency audit tool not installed for {ecosystem} — cannot verify dependency security." Severity: MEDIUM.

### 5.3: Output Format

```markdown
### Dependency Vulnerability Findings

| Severity | Package | Current Version | Patched Version | Advisory |
|----------|---------|-----------------|-----------------|----------|
| CRITICAL | lodash | 4.17.20 | 4.17.21 | [CVE-2021-23337](url) |
| HIGH | express | 4.17.1 | 4.17.3 | [CVE-2022-24999](url) |

**Summary**: {critical_count} critical, {high_count} high, {moderate_count} moderate, {low_count} low
**Recommendation**: {action — e.g., "Update lodash and express immediately. Run `npm audit fix` for automated patching."}
```

### 5.4: Severity Mapping to Review Verdicts

| Condition | Review Verdict |
|-----------|---------------|
| Any CRITICAL vulnerability | FAIL (blocker) |
| 3+ HIGH vulnerabilities | FAIL (blocker) |
| 1-2 HIGH vulnerabilities | CAUTION |
| Only MODERATE or LOW | PASS with advisory note |
| Audit tool not available | CAUTION (cannot verify) |

---

## Section 6: Secret Detection Scan

Scan committed code for accidentally committed secrets, API keys, tokens, and credentials.

### 6.1: Patterns

Scan all files in the diff (or full codebase if `--full-scan`) for these patterns:

**API Keys and Tokens:**

| Pattern Name | Regex |
|-------------|-------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` |
| AWS Secret Key | `(?i)aws_secret_access_key\s*[=:]\s*[A-Za-z0-9/+=]{40}` |
| GitHub Token | `gh[pousr]_[A-Za-z0-9_]{36,255}` |
| GitHub Classic Token | `ghp_[A-Za-z0-9]{36}` |
| Slack Token | `xox[baprs]-[A-Za-z0-9-]+` |
| Stripe Key | `[sr]k_(live\|test)_[A-Za-z0-9]{20,}` |
| Google API Key | `AIza[0-9A-Za-z\-_]{35}` |
| Generic Bearer Token | `(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*` |

**Credentials:**

| Pattern Name | Regex |
|-------------|-------|
| Database URL with password | `(?i)(postgres\|mysql\|mongodb)://[^:]+:[^@]+@` |
| Generic password assignment | `(?i)(password\|passwd\|pwd\|secret)\s*[=:]\s*['"][^'"]{8,}['"]` |
| Private key header | `-----BEGIN (RSA \|EC \|DSA \|OPENSSH )?PRIVATE KEY-----` |
| JWT Secret | `(?i)(jwt_secret\|jwt_key\|signing_key)\s*[=:]\s*['"][^'"]+['"]` |

**Environment and Configuration:**

| Pattern Name | Check |
|-------------|-------|
| .env file committed | `.env` (not `.env.example`) present in the diff or tracked by git |
| Hardcoded IP with port | `\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}` (flag for review, not auto-fail) |

### 6.2: Scan Procedure

```
Step 1: Determine scan scope
  - Default: files modified in the current phase (from PLAN.md files_modified)
  - With --full-scan: all tracked files in the repository

Step 2: For each file in scope
  - Skip binary files
  - Skip files matching: *.min.js, *.map, node_modules/*, vendor/*, .git/*
  - Skip files named: .env.example, .env.template, .env.sample
  - Apply each pattern regex
  - For each match: record file path, line number, pattern name,
    matched text (REDACTED — show only first 8 and last 4 characters)

Step 3: Cross-reference with .gitignore
  - If .env is NOT in .gitignore: flag as HIGH finding even if .env is not in the diff
  - If secrets directories are not gitignored: flag as advisory

Step 4: False positive filtering
  - Pattern match in test fixtures with obviously fake values
    (e.g., "test-key-123", "password": "changeme") → FALSE POSITIVE, skip
  - Pattern match inside comments referencing documentation → FALSE POSITIVE, skip
  - Log all skipped matches for manual review if --verbose
```

### 6.3: Output Format

```markdown
### Secret Detection Findings

| Severity | File | Line | Type | Preview |
|----------|------|------|------|---------|
| CRITICAL | src/config.js | 42 | AWS Access Key | `AKIA****WXYZ` |
| HIGH | .env | — | Environment file committed | `.env` is tracked in git |
| MEDIUM | docker-compose.yml | 15 | Database URL with password | `postgres://us****@db` |

**Summary**: {critical_count} secrets detected
**Recommendation**: {action — e.g., "Rotate the AWS key immediately. Add .env to .gitignore. Use environment variables or a secrets manager."}
```

### 6.4: Severity Mapping

| Condition | Severity |
|-----------|----------|
| Any secret pattern match in committed code | CRITICAL (immediate rotation required) |
| .env file committed or not in .gitignore | HIGH |
| Hardcoded IPs/ports | LOW (review for internal-only services) |
| Pattern match in test fixtures with obviously fake values | FALSE POSITIVE, skip |
| Any CRITICAL secret finding | Review verdict override to FAIL |

---

## Section 7: Supply Chain Security Checks

Verify the integrity and health of the project's dependency supply chain.

### 7.1: Checks

**Lock File Presence:**

| Condition | Severity |
|-----------|----------|
| No lock file exists for detected package manager | HIGH — builds are non-reproducible |
| Lock file exists but is outdated (modified date older than package manifest) | MEDIUM |
| Lock file present and current | PASS |

**Lock File Integrity:**

```
For npm:
  Run `npm ls --json 2>/dev/null`
  Check output for "missing" or "invalid" entries
  Any missing/invalid entries → MEDIUM finding

For pip:
  Scan requirements.txt for unpinned dependencies (lines with >= or no version specifier)
  Any unpinned dependency → MEDIUM finding

For other ecosystems:
  Verify lock file parses without errors
  Check that all manifest entries have corresponding lock file entries
```

**Dependency Freshness:**

```
Run ecosystem-appropriate outdated check:
  npm:   npm outdated --json 2>/dev/null
  pip:   pip list --outdated --format=json 2>/dev/null
  cargo: cargo outdated --format=json 2>/dev/null

Flag dependencies more than 2 major versions behind → MEDIUM
Flag dependencies with no updates in 2+ years → INFO (potentially unmaintained)
```

**Known Malicious Package Detection (best-effort):**

```
Step 1: Extract all dependency names from the manifest file
Step 2: Check for common typosquat patterns:
  - Single character substitutions (e.g., "lod-ash" instead of "lodash")
  - Missing or extra hyphens (e.g., "cross-env" is legitimate, "crossenv" was malicious)
  - Scope confusion (e.g., "@user/package" vs "package" in npm)
Step 3: Flag suspicious names for human review — severity: MEDIUM
  This check is best-effort and advisory only. Always recommend using
  tools like Socket.dev or Snyk for comprehensive supply chain analysis.
```

### 7.2: Output Format

```markdown
### Supply Chain Findings

| Check | Status | Details |
|-------|--------|---------|
| Lock file present | PASS | package-lock.json found |
| Lock file integrity | WARN | 3 packages in package.json not reflected in lock file |
| Dependency freshness | WARN | 5 packages 2+ major versions behind |
| Unmaintained packages | INFO | `left-pad` last published 3 years ago |
| Typosquat check | PASS | No suspicious package names detected |

**Summary**: {pass_count} passed, {warn_count} warnings, {fail_count} failures
```

### 7.3: Severity Mapping to Review Verdicts

| Condition | Review Verdict |
|-----------|---------------|
| No lock file for any detected ecosystem | CAUTION |
| Lock file integrity failures | CAUTION |
| Suspected malicious/typosquatted package | FAIL (blocker, pending human review) |
| Only freshness or unmaintained advisories | PASS with advisory note |

---

## Section 8: Finding Format

All security findings follow this structured format:

```markdown
| ID | OWASP Cat | Severity | Finding | File(s) | Remediation | Status |
|----|-----------|----------|---------|---------|-------------|--------|
| SEC-001 | A1:Injection | CRITICAL | SQL query uses string concatenation with user input | src/api/users.js:45 | Use parameterized queries via ORM or prepared statements | OPEN |
```

### Severity Definitions

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| CRITICAL | Actively exploitable vulnerability with high impact | Immediate fix before any deployment |
| HIGH | Exploitable vulnerability or missing critical control | Fix before ship (/legion:ship will block) |
| MEDIUM | Security weakness that increases risk | Fix soon — track in next phase |
| LOW | Minor security improvement opportunity | Track for future improvement |
| INFO | Security observation, no action needed | Note for awareness |

---

## Section 9: Integration with Review Evaluators

Security review plugs into the review-evaluators skill as the 5th evaluator type.

### 9.1: Evaluator Registration

```
Evaluator: Security Evaluator
Phase Types: security, api, full-stack
Dispatch Target: Internal (engineering-security-engineer agent)
Pass Count: 13 (10 OWASP categories + dependency scan + secret detection + supply chain checks)
Activation: Section 1 triggers (explicit or automatic)
```

### 9.2: Review Evaluator Integration

When selected by review-evaluators Section 1.2:

```
1. Run OWASP Top 10 Checklist (Section 2)
2. Run STRIDE Threat Model (Section 3) on identified boundaries
3. Run Attack Surface Mapping (Section 4) if CODEBASE.md available
4. Run Dependency Vulnerability Scan (Section 5)
5. Run Secret Detection Scan (Section 6)
6. Run Supply Chain Security Checks (Section 7)
7. Produce structured findings (Section 8)
8. Apply verdict overrides (Section 9.4)
9. Merge findings with other evaluator results in REVIEW.md
10. CRITICAL findings are added to fix cycle (same as review-loop)
11. HIGH findings block /legion:ship pre-ship gate
12. MEDIUM and LOW findings are reported but don't block
```

### 9.3: Standalone Mode

When invoked via `--just-security` on `/legion:review`:
- Only the Security Evaluator runs (no other evaluators)
- Full OWASP + STRIDE + attack surface mapping + dependency scan + secret detection + supply chain checks
- Verdict overrides (Section 9.4) apply in standalone mode
- Results written to REVIEW.md with security-specific section

### 9.4: Verdict Overrides

The following conditions override the overall review verdict to FAIL regardless of other category results:

| Source | Condition | Override |
|--------|-----------|----------|
| Dependency Vulnerability Scan (Section 5) | Any CRITICAL CVE in dependencies | FAIL (blocker) |
| Dependency Vulnerability Scan (Section 5) | 3+ HIGH CVEs in dependencies | FAIL (blocker) |
| Secret Detection Scan (Section 6) | Any CRITICAL secret finding (committed key, token, or credential) | FAIL (blocker) |
| Supply Chain Checks (Section 7) | Suspected malicious or typosquatted package | FAIL (blocker) |

These overrides are non-negotiable. Even if all OWASP categories pass, a committed secret or a critical dependency vulnerability makes the build unshippable. The rationale:

- **Committed secrets** are already exposed in git history and require immediate rotation, not just removal.
- **Critical CVEs** in dependencies are publicly known and actively exploited; shipping with them is accepting known compromise.
- **Malicious packages** indicate supply chain compromise; the build artifact cannot be trusted.

Overrides are logged in REVIEW.md with the prefix `[VERDICT-OVERRIDE]` for audit trail visibility.

---

## Section 10: Graceful Degradation

Follows the standard Legion degradation pattern:

1. If security-review skill is referenced but no security-sensitive files detected: skip silently
2. If CODEBASE.md doesn't exist: perform security review without attack surface mapping context
3. If engineering-security-engineer agent personality file is missing: fall back to engineering-senior-developer
4. Never error, never block non-security workflows
5. Security findings are always advisory unless severity is CRITICAL (which blocks ship)
6. If dependency audit tool is not installed: log advisory and continue (do not block)
7. If no lock file exists: log supply chain finding and continue (dependency scan runs best-effort)
8. If secret detection patterns match only false positives: report clean scan, do not inflate findings

---

## References

This skill is consumed by:

| Consumer | Operation | Section |
|----------|-----------|---------|
| `review.md` | Security review during /legion:review | Sections 2-8 |
| `review-evaluators.md` | 5th evaluator type | Section 9 |
| `plan.md` | Security surface scan during --auto pipeline | Section 4 |
| `ship-pipeline.md` | Pre-ship gate checks for unresolved security findings | Section 8 |
| `ship-pipeline.md` | Verdict overrides for dependency/secret/supply chain findings | Section 9.4 |

Security review is an optional integration — all workflows function identically without it.

## Completion Gate

This skill completes when ALL conditions are met (only when security review is enabled for the phase; when disabled, this skill no-ops and returns immediately):
1. Security surface scan executed per Section 4 (dependencies, secrets, authN/authZ, input validation, crypto use, supply chain) and findings written to `.planning/phases/{NN}/SECURITY-REVIEW.md`
2. Each finding carries required fields: `id`, `severity` (one of: blocker / critical / high / medium / low / info), `category`, `file`, `line`, `evidence`, `remediation`
3. Per-finding verdict assigned — `must-fix`, `should-fix`, or `informational` — with a documented severity-to-verdict mapping
4. All `blocker`-severity findings either resolved in-phase or explicitly escalated via `<escalation>` block with `type: quality`
5. Pre-ship gate inputs populated per Section 8: unresolved-blocker count exposed for `ship-pipeline` to consume
6. Verdict override rules (Section 9.4 — dependency / secret / supply chain) applied before the final verdict is returned

If ANY condition is unmet, the skill is NOT complete — continue working or escalate via `<escalation>` block.
