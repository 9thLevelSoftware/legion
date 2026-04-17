# Audit Findings — skills/polymath-engine/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 633 lines
**Total findings:** 4 (0 P0, 1 P1, 3 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-212 — P1, Open-Set Interpretation of Closed Options (confirmed)

**Lines 81-109**

> Choice format:
> ```markdown
> [Brief context — 1-2 sentences]
>
> Which describes your situation?
> → [Option A]: [Clear description]
>   [Option B]: [Clear description]
>   [Option C]: [Clear description]
>   [Option D]: Not sure / None of these
> ```
>
> ...
>
> **Arrow keys + Enter implementation:**
> - Use adapter.ask_user with choice list

**Issue:** Decorative menu format — arrow prefix on Option A only, indented options, free-text placeholder `[Option X]` — is exactly the anti-pattern called out in S03 (explore.md L44-53 LEGION-47-019, LEGION-47-033) and is THE core output contract of the polymath engine for all four modes (crystallize/onboard/compare/debate). Every exchange in Section 4's seven-exchange pattern produces a choice in this format; under 4.7 literalism: (a) the agent renders the arrow as presented text rather than invoking AskUserQuestion; (b) the `adapter.ask_user` primitive (L101) is not defined in any adapter's conformance metadata; (c) "Option D: Not sure / None of these" is a collectively-exhaustive escape valve but L95 principle-2 also says "Include Other/Not sure for gaps" — these conflict when the engine simultaneously enforces "mutually exclusive" (L94) and "collectively exhaustive via Other" (L95). The "Anti-patterns to reject" list (L105-109) correctly bans "Open text fields" and "Tell me more" but does not ban the decorative-arrow format itself. Consumed by `/legion:explore` — the single biggest choice-heavy command in Legion; every exchange in Section 4's seven-exchange pattern inherits this defect. Peer of LEGION-47-019, LEGION-47-033, LEGION-47-043, LEGION-47-058.

**Remediation sketch:** Rewrite Section 2 choice format as: "Invoke AskUserQuestion with `options: [{id, label, description}]`. Exactly one option MUST have `id: 'other'` label: 'Not sure / None of these' when the concept space is unbounded; for bounded concept spaces (e.g., greenfield/brownfield), omit 'other'. Do NOT use arrow prefixes, indentation, or free-text placeholders — these render as literal text. Do NOT concatenate the question and options into a single string." Register `adapter.ask_user` as the structured primitive that maps to AskUserQuestion on Claude Code; add conformance metadata row in every adapter. Cross-reference LEGION-47-019 and the `adapter.prompt_free_text` primitive decision outstanding per S05/S09.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-213 — P2, Ambiguous Triggers (suspected)

**Lines 22-40, 61**

> 1. **Codebase scan** — Does this build on existing code?
>    ```bash
>    # Search for relevant files based on user's concept keywords
>    grep -r "keyword" --include="*.js" --include="*.ts" --include="*.py" --include="*.md" . 2>/dev/null | head -20
>    ```
>    - Look for: existing implementations, similar features, reusable components
> ...
> 3. **External research** — Is this a known domain?
>    - If domain-specific (e.g., "OAuth", "WebRTC", "Kubernetes"): use WebSearch or WebFetch
>    - If library/framework mentioned: check for best practices
> ...
> **Critical rule:** Research must complete in under 2 minutes.

**Issue:** Three ambiguous classifiers in one section. (a) L23-27 "user's concept keywords" — no extraction procedure; 4.7 must invent tokens from user prose and the `grep -r "keyword"` literal sample suggests ONE literal string (not a token-set loop). File extensions are hardcoded to `*.js,*.ts,*.py,*.md` — excludes `.tsx/.jsx/.rb/.go/.rs/.php/.java` etc; silent scope truncation. (b) L38 "If domain-specific (e.g., OAuth, WebRTC, Kubernetes)" — three examples are NOT a registry; "domain-specific" is unbounded per user phrasing, and the engine must decide when to burn a WebSearch call. (c) L61 "under 2 minutes" — wall-clock limit with no enforcement mechanism (no timeout wrapping, no early-exit on `command took 90s`). Peer of LEGION-47-026 (keyword substring classifier), LEGION-47-028.

**Remediation sketch:** (a) Section 1 Step 1 must describe keyword extraction: "Tokenize `raw_concept` into 3-7 noun-phrase tokens via stop-word removal and heading-keyword priority. Loop `grep -rl "$token" --include=...` per token and union the results. File-extension list MUST be derived from the project's `.planning/CODEBASE.md` languages field; if unavailable, use `find . -type f -name '*.*' | awk -F. '{print $NF}' | sort -u | head -10` to detect actual languages before pattern filtering." (b) Add `external_research_registry:` to intent-teams.yaml listing known domains (OAuth, WebRTC, k8s, GraphQL, gRPC, WebAssembly, etc.) with canonical WebSearch queries. Phrase outside registry → skip external research and declare Research gap. (c) Replace L61 with: "Set research budget: 90s wall-clock via `timeout 90` wrapper on grep/WebFetch. If budget exceeded, halt and report partial findings under ## Research Findings with `status: partial`."

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-214 — P2, Unstated Acceptance Criteria (suspected)

**Lines 157-185, 190-282**

> 1. **Track stated vs implied**
>    - User stated: captured in choices selected
>    - User implied: inferred from context
>    - What's missing: gaps = (what's needed) - (stated + implied)
> ...
> **Exchange limit:** Maximum 7 exchanges (research doesn't count as exchange).
> ...
> **Early exit conditions:**
> - User explicitly requests exit (save progress option)
> - Crystallization achieved early (offer early decision)
> - Blocker discovered (recommend park)

**Issue:** Two gaps in closure semantics. (a) L157-162 "gaps = (what's needed) - (stated + implied)" is a set-math formula with no operationalization: "what's needed" is not defined, "implied" is not a list; 4.7 under literalism will enumerate gaps non-deterministically per run — same raw_concept + same user answers → different gap sets. (b) L278-282 early-exit conditions use qualitative triggers: "Crystallization achieved early" has no measurable threshold (how many gaps resolved? how many exchanges? confidence signal?); "Blocker discovered" has no definition of blocker vs deferred (Section 3 L185 says Blocker → Park trigger but Section 3 L178-185 also allows user-selected `deferred` — overlapping categories). Net effect: the engine can run 7 exchanges or 2 exchanges with no reproducible stopping condition. Peer of LEGION-47-054, 151, 161, 196, 202, 209.

**Remediation sketch:** (a) Define "what's needed" per mode as a static checklist: crystallize requires {domain, scope-level, stack, timeline, constraints}; onboard requires {target-area, depth, conventions-seen, validation-passed}; compare requires {alternatives≥2, criteria≥3, scoring-complete}; debate requires {positions=2, evidence-for-each, counters, blind-spots}. `gaps = needed_checklist - answered_items`. (b) Operationalize early-exit: "Early crystallization: all required checklist items resolved by exchange 4 AND no open blockers → offer early decision via AskUserQuestion {Proceed now, Run remaining confirmatory exchanges}. Blocker defined as: any gap with status=blocker (Section 3 L185) OR deferred gap in Technical/Dependency categories when mode=crystallize." Add acceptance-criteria block at end of Section 5: "Exploration complete when decision != pending AND output document written AND either: (a) all required checklist items status=answered|deferred, or (b) exchange_count=7, or (c) user chose 'Park'."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** medium

---

## LEGION-47-215 — P2, Implicit Preconditions (confirmed)

**Lines 62-73**

> ### Extended Thinking Mode
>
> If `settings.json` `models.planning_reasoning` is `true` AND the active adapter's `supports_extended_thinking` is `true`:
> - Use `adapter.model_planning` (e.g., `opus`) for the research synthesis and crystallization phases
> - Extended thinking provides deeper analysis of:
>   - Cross-source pattern recognition (connecting codebase findings with external research)
>   ...
> If `models.planning_reasoning` is `false`: use `adapter.model_execution` as normal

**Issue:** Two preconditions without existence-check scaffolding. (a) `settings.json` read with no file-missing / key-missing / malformed-JSON handling; 4.7 literal-reading this section will attempt a `Read` and if settings.json does not exist or lacks `models.planning_reasoning`, behavior is undefined (silent undefined → falsy branch, or error → halt research). (b) `adapter.supports_extended_thinking` is an adapter conformance key but S09 validated only 8 adapter keys in conformance metadata — this key may not be present on every adapter. Per LEGION-47-110 the model_tier mechanism has a known wiring defect (cli-dispatch Section 3 never reads `model_tier`), so L66 "Use `adapter.model_planning`" is a declaration with no evidence the downstream substitution works on any adapter except Claude Code. Cross-cut to LEGION-47-110 which this section directly depends on. Peer of LEGION-47-054, 102, 175.

**Remediation sketch:** Rewrite L65 as: "If `.claude/settings.json` does not exist OR `models` key is absent OR `models.planning_reasoning` is not strictly true: use `adapter.model_execution`. Never halt research on settings.json read failure." Add conformance requirement: "Adapters that do not expose `supports_extended_thinking` are treated as false (defaults to `adapter.model_execution`)." Validate adapter conformance metadata includes `supports_extended_thinking` in S16; file advisory if missing. Cross-reference the model_tier wiring defect (LEGION-47-110) — this section's L66-70 extended-thinking benefits are conditional on that wiring being fixed first.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---
