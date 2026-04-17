# Audit Findings — skills/marketing-workflows/SKILL.md

**Audited in session:** S09
**Rubric version:** 1.0
**File layer:** skill
**File length:** 541 lines
**Total findings:** 4 (4 P2)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-186 — P2, CAT-2 Ambiguous Triggers (confirmed)

**Lines 38-43**

> Marketing-specific decomposition activates when ANY of these signals are present:
> 1. **Requirement IDs**: Phase requirements include MKT-* IDs
> 2. **Keywords in phase description**: "campaign", "content calendar", "social media", "cross-channel", "marketing", "brand awareness", "audience", "engagement strategy", "content strategy", "channel strategy"
> 3. **Agent signal**: agent-registry recommends majority marketing-division agents for the phase

**Issue:** Canonical enumeration for MKT-* keyword triggers — but diverges from the parallel list in design-workflows and is not defined in `.planning/config/intent-teams.yaml`. Same registry-drift class as LEGION-47-181 (design). The CLAUDE.md L110-112 claim "MKT-* requirements or marketing keywords" points here; the seven-site mismatch cluster (LEGION-47-002, 004, 005, 084, 140, 160, 174, 181) adds an eighth source.

**Remediation sketch:** Apply the same remediation as LEGION-47-181: consolidate into `.planning/config/intent-teams.yaml` under `teams.marketing.keywords` using a shared schema with `teams.design`. Cross-reference CLAUDE.md, AGENTS.md, README, authority-enforcer detect_domain, review-panel detect_domain, phase-decomposer marketing-domain-detection block. Land this consolidation before S12 (marketing/design agent audits) to avoid compounding the drift.

**Remediation cluster:** `keyword-registry-consolidation`
**Effort estimate:** medium

---

## LEGION-47-187 — P2, CAT-3 Underspecified Dispatch (confirmed)

**Lines 57-68, 141-147, 198-208, 273**

> | Channel | Primary Agent | Backup Agent |
> |---------|--------------|--------------|
> | Twitter | marketing-twitter-engager | marketing-social-media-strategist |
> | Instagram | marketing-instagram-curator | marketing-content-creator |
> | TikTok | marketing-tiktok-strategist | marketing-instagram-curator |
> | Reddit | marketing-reddit-community-builder | marketing-content-creator |
> | Blog/Web | marketing-content-creator | marketing-social-media-strategist |
> | Email | marketing-content-creator | marketing-growth-hacker |
> ...
> | Strategy Lead | marketing-social-media-strategist | ... |
> | Content Lead | marketing-content-creator | ... |
> ...
> | Thread/Carousel | ... | marketing-twitter-engager | ... |
> ...
> The Strategy Lead (marketing-social-media-strategist) owns core message derivation.

**Issue:** Catastrophic non-existent-agent-ID bug. The agents/ directory contains exactly 4 marketing-division files: `marketing-app-store-optimizer.md`, `marketing-content-social-strategist.md`, `marketing-growth-hacker.md`, `marketing-social-platform-specialist.md`. This file references 6 IDs that do NOT exist: `marketing-twitter-engager`, `marketing-instagram-curator`, `marketing-tiktok-strategist`, `marketing-reddit-community-builder`, `marketing-content-creator`, `marketing-social-media-strategist`. They appear ~25 times across Sections 1 (Channel-Agent Mapping), 2.3 (Team Assembly), 3.2 (Content Type Taxonomy), 3.4 (Assignment Rules), 4.1-4.5 (Cross-Channel Coordination), 6.1 (Wave 2 agents). Every marketing phase dispatched by `/legion:plan`/`/legion:build` using these IDs will fail agent-registry lookup and fall back silently. The file also claims "8 marketing agents" in the frontmatter summary (L6) and CLAUDE.md (L77-78 — "Marketing | 4"), producing an internal contradiction. Largest single-file concentration of the non-existent-agent bug class observed so far (peers LEGION-47-052, 119, 149, 159, 199).

**Remediation sketch:** (a) Decide strategic direction: either (i) rewrite this skill to use only the 4 existing marketing agents (content-social-strategist owns Strategy+Content+Blog+Email+Reddit; social-platform-specialist owns Twitter/Instagram/TikTok; app-store-optimizer owns App Store; growth-hacker owns Growth/Funnel) OR (ii) create the 6 missing agent .md files using agent-creator before this skill can run. (b) Update CLAUDE.md frontmatter summary L6 "across 8 marketing agents" to match actual count. (c) Add agent-ID validation pre-flight to this skill: "Before Wave dispatch, verify each referenced agent-id exists as agents/<id>.md; if not, emit <escalation severity: blocker, type: dependency>." (d) The agent-ID CI validator (proposed S08 cross-cut) must cover this file. Do NOT land S12 agent audits until one of (i)/(ii) is chosen.

**Remediation cluster:** `non-existent-agent-ids`
**Effort estimate:** large

---

## LEGION-47-188 — P2, CAT-6 Implicit Preconditions (suspected)

**Lines 135, 142, 537**

> For marketing campaigns, use the agent-registry Section 4 Marketing Campaign team assembly pattern:
> ...
> | Strategy Lead | marketing-social-media-strategist | ...
> ...
> | `agent-registry.md` | Marketing Campaign team assembly pattern | Section 2.3 (team assembly) |

**Issue:** Implicit precondition: "agent-registry Section 4 Marketing Campaign team assembly pattern" (L135) — S06 audit of agent-registry (if conducted; file not yet referenced in INDEX under a findings file per the task scope) does not confirm that Section 4 defines a "Marketing Campaign team" pattern, nor that it references the 6 non-existent agent-ids (LEGION-47-187). Additionally, L537 self-reference "Section 2.3 (team assembly)" — section 2.3 is titled "Agent Team Assembly" at L133, not "Marketing Campaign team"; naming drift. 4.7 reading this precondition will try to load agent-registry.md Section 4 and apply whatever it finds, which may reference non-existent agents OR not reference marketing at all, without emitting any diagnostic.

**Remediation sketch:** (a) Before referencing "agent-registry Section 4 Marketing Campaign team" pattern, verify the anchor exists: quote the exact agent-registry.md subsection header or replace with an inline team definition. (b) Reconcile L135 "Section 4" vs. L537 "Section 2.3" — pick one. (c) Add the precondition as an explicit step: "Step 1: Read agent-registry.md. Locate the section titled 'Marketing Campaign Team' under Section 4. If the section does not exist: emit <escalation severity: blocker, type: dependency>, do not proceed." Cross-reference LEGION-47-163 (agent-registry dependency verification).

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-189 — P2, CAT-8 Unstated Acceptance Criteria (suspected)

**Lines 157-170, 416-423**

> Each campaign follows this lifecycle:
> ```
> Planning --> Active --> Measuring --> Complete
> ```
> - **Planning**: Campaign document created, content calendar drafted, agents assigned. Status in campaign doc: `Planning`
> - **Active**: Content being produced and distributed across channels. Status: `Active`
> - **Measuring**: Campaign ended, collecting metrics and learnings. Status: `Measuring`
> - **Complete**: Final report written, outcomes recorded to memory (if memory layer active). Status: `Complete`
> ...
> | Planning | Campaign document being drafted, not yet approved | During `/legion:plan` campaign questioning |
> | Active | Campaign is live, content being produced/distributed | When `/legion:build` begins marketing phase execution |
> | Measuring | Campaign ended, collecting results | After all content waves complete |
> | Complete | Final learnings captured, campaign archived | After review and outcome recording |

**Issue:** Four lifecycle states with transition triggers that reference commands — but no acceptance criteria for the transitions: (a) "Measuring → Complete: Final report written" — no path, no schema, no agent specified. Which agent writes the final report? What sections are required? (b) "Active → Measuring: Campaign ended" — "ended" is undefined; duration-based? manual-trigger? (c) No failure/rollback transitions — if Content Creator fails mid-Wave 2, can a campaign revert from Active to Planning? (d) L162 "Measuring → Complete" references memory layer but memory-manager Section 2 OUTCOMES.md schema requires task_type; the task_type for marketing campaign completion is unspecified (cross-reference LEGION-47-163 for the parallel OUTCOMES.md task_type gap).

**Remediation sketch:** (a) For each transition, add exact criteria: "Active → Measuring: triggered when all Wave 2 SUMMARY.md files in .planning/phases/{NN}/ have status: completed. Duration: Measuring runs for exactly settings.marketing.measuring_duration_days (default: 14 days) after the final Wave 2 SUMMARY.md timestamp." (b) "Measuring → Complete: Strategy Lead writes .planning/campaigns/{slug}-final-report.md using the schema in Section 5.X; outcomes recorded to OUTCOMES.md with task_type 'marketing_campaign'." (c) Add rollback transitions: "If any wave emits <escalation severity: blocker>: status reverts to Planning until escalation resolved." (d) Add settings reference: `settings.marketing.measuring_duration_days` with default. Peer of LEGION-47-054 / 151 / 161 / 202 exit-condition state-partition cluster.

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---
