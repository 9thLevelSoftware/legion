# Audit Findings — skills/intent-router/SKILL.md

**Audited in session:** S07
**Rubric version:** 1.0
**File layer:** skill
**File length:** 1348 lines
**Total findings:** 7 (7 P2)
**Baseline commit:** audit-v47-baseline

**Context:** Intent-router is the natural-language routing and intent-flag validation engine consumed by `/legion:build`, `/legion:review`, `/legion:status`, and (indirectly via context suggestions) most other commands. CAT-1 / CAT-2 hotspot per Task 10 guidance.

---

## LEGION-47-138 — P2, Open-Set Interpretation of Closed Options (confirmed)

**Lines 931-949**

> if (result.confidence >= 0.5) {
>     // MEDIUM: confirm with user
>     const confirmed = adapter.ask_user(
>       `Did you mean: ${result.fallbackSuggestion}?`,
>       ['Yes, proceed', 'No, show other options', 'Cancel']
>     );
>     if (confirmed === 'Yes, proceed') {
>       return executeWithFlags(result.flags);
>     }
>   }
>
>   // LOW: show suggestions
>   console.log(result.fallbackSuggestion);
>   // Let user pick or type a different command
> }

**Issue:** The MEDIUM-confidence confirmation uses a bounded 3-option AskUserQuestion equivalent — which is *good* and adopts the mandate correctly. But the LOW-confidence branch (confidence < 0.5) abandons the structured interaction and falls through to `console.log` + comment "Let user pick or type a different command". Three problems: (1) `console.log` is not a user-interaction primitive; it is output-only. The adapter has no idea the user is being asked anything. (2) "Let user pick" assumes the user will respond in some subsequent turn, but the invocation in handleNLResult returns from the function — there is no continuation; the conversation just stops. (3) "Type a different command" is unbounded free-text inheriting S03 AskUserQuestion contract defect. The LOW path is where the user needs the most guidance yet gets the least structure. CAT-1 peer to LEGION-47-122 (plan-critique PASS asymmetry) and LEGION-47-133 (questioning-flow Stage 3 wrapping gap).

**Remediation sketch:** (a) Replace `console.log(result.fallbackSuggestion)` with `adapter.ask_user` call: question='Your input was ambiguous. Pick a command:' options=[top-3 suggestions from fallbackSuggestion, 'None — enter a different command', 'Cancel']. (b) 'None — enter a different command' routes through the same `adapter.prompt_free_text` primitive referenced in S03 remediation (blocked until that lands). (c) On 'Cancel', return a documented `{ command: null, cancelled: true }` shape so callers can distinguish "no match found" from "user cancelled".

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-139 — P2, Ambiguous Triggers (confirmed)

**Lines 780-796**

> ### 7.2 Pattern Matching Strategy
>
> Two-tier matching system for balancing speed and accuracy:
>
> **Tier 1: Keyword Cluster Matching** (fast, pattern-based)
> - Each intent/command has a set of weighted keywords (word to weight, 0.0-1.0)
> - Tokenize user input into words
> - Score = sum of matched keyword weights / total possible weight for that cluster
> - Fast O(n*m) lookup, good for single-word or multi-word queries
>
> **Tier 2: Phrase Template Matching** (structured, higher confidence)
> - Regex-like templates for common expressions
> - Templates use `{option1|option2}` syntax for alternation and `{word}?` for optional words
>
> **Scoring Formula:**
> ```
> final_score = keyword_score * 0.6 + template_match_bonus + exact_name_bonus
> ```

**Issue:** Scoring formula is described at the spec level but has two calibration defects when mapped against the confidence thresholds (L914-917). (1) Maximum possible score: keyword_score max 1.0 × 0.6 = 0.6; template_bonus 0.3; exact_name_bonus 0.1. Sum: 1.0 — but only achievable when ALL keyword weights match AND a phrase template matches AND exact name is present. For realistic inputs matching 2-3 keywords out of 7-10 in a pattern, keyword_score is ~0.3, keyword_score × 0.6 = 0.18, + template_bonus 0.3 + exact_name 0.1 = 0.58 — barely MEDIUM. The HIGH tier (>= 0.8) is practically unreachable without keyword-exhaustive input, but the adjacent command_routes pattern for `/legion:start` has 7 keywords — a user typing "start" (single word) hits keyword_score 1.0/4.7 = 0.21, × 0.6 = 0.13, no template, exact_name 0.1 = 0.23 → LOW confidence for a single exact-match word. (2) "Routes via `nl_patterns`" vs "routes via `command_routes`" — L884 says two configs but both run through `scoreCandidate()` without a tie-break rule. Peer CAT-2 class to S02c keyword-registry cross-cut; inherits intent-teams.yaml schema gaps (S02c LEGION-47-011, 013, 018).

**Remediation sketch:** (a) Re-derive the weights so that HIGH is achievable with realistic input: consider `final_score = max(keyword_score, template_match) + 0.1 * exact_name` or normalize keyword_score by "top-K matched weights" not "sum of all weights". (b) Add a tie-break spec: "If a candidate matches both `nl_patterns` and `command_routes` with scores within 0.1: prefer intent-flag (more specific) per existing edge-case note at L952 — surface this in Section 7.2 not just 7.4." (c) Provide calibration examples in a new sub-section: show computed scores for 5-10 representative user inputs and the resulting confidence tier. Validate empirically rather than by nominal formula.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** medium

---

## LEGION-47-140 — P2, Implicit Preconditions (confirmed)

**Lines 233-241, 959-983**

> function loadIntentTeams() {
>   const configPath = '.planning/config/intent-teams.yaml';
>   const content = fs.readFileSync(configPath, 'utf8');
>   return parseYaml(content);
> }
>
> [L979-983]
> **Graceful degradation**: If `nl_patterns` or `command_routes` sections are missing from the config file (e.g., older version of `intent-teams.yaml`), the function returns empty objects and `parseNaturalLanguage()` will return a LOW confidence result with no suggestions. The system falls back to standard flag parsing via Section 1.

**Issue:** Two precondition gaps converge. (1) `loadIntentTeams` reads `.planning/config/intent-teams.yaml` directly with `fs.readFileSync` — no existence check, no schema validation, no error path for malformed YAML. S05 LEGION-47-084 documented that `intent-teams.yaml` has a live schema drift between `validate.md` expectations and the file contents; any workflow invoking intent-router will hit this drift through an uncaught exception at file-read time. (2) "Graceful degradation" claim at L979 is aspirational — the code path at L233-237 throws if the file is absent; `loadNLPatterns()` at L959 inherits that throw. A 4.7-literal reader sees "graceful degradation" as a documented guarantee but the code does not implement it. CAT-6 peer to LEGION-47-084 (schema drift) and S02d intent-teams.schema.json reference. Pre-existing bug.

**Remediation sketch:** (a) Wrap `fs.readFileSync` in try/catch; on ENOENT, return `{ intents: {}, nl_patterns: {}, command_routes: {}, context_rules: {} }`. On YAML parse error, return same empty shape with a logged warning. (b) Add schema validation: after parse, check against `.planning/config/intent-teams.schema.json` (S02d); on validation failure, log and return partial with only the valid subset. (c) Cross-link to LEGION-47-084 — schema drift resolution must land before this remediation is trustworthy. (d) Update L979-983 graceful-degradation claim to match actual behavior once implemented.

**Remediation cluster:** `precondition-verification`
**Effort estimate:** medium

---

## LEGION-47-141 — P2, Underspecified Dispatch

**Lines 361-425**

> detectExecutionMode(intent)
>
> ...
> filter_plans: {
>       description: 'Filter plans to matching intent domains',
>       steps: [
>         'Load all plans for current phase',
>         'Apply task type filters from intent',
>         'Apply file pattern exclusions',
>         'Remove plans matching exclude criteria',
>         'Execute remaining plans with standard wave executor'
>       ],
>       parallel: false,  // Uses wave executor
>       agentCount: 'from filtered plans'
>     },

**Issue:** Execution mode dispatch specification has two dispatch-specification gaps. (1) `parallel: false, // Uses wave executor` contradicts S06 LEGION-47-101 wave-executor findings — wave-executor IS parallel when adapter supports it (that is its main purpose). The comment conflates "this mode does not manage its own fan-out" with "the downstream execution is sequential". A 4.7-literal reader may disable parallel spawning in wave-executor based on `parallel: false` here, defeating the fan-out mechanism. (2) "agentCount: 'from filtered plans'" is not a specification, it is a deferral. How does the caller know fan-out size for budget planning? For plan `filter_plans`, the caller cannot compute adapter-max-parallel-agents without loading plans first — chicken-and-egg if the filter itself requires plan loading. Peer to S06 LEGION-47-102, 112.

**Remediation sketch:** (a) Rename `parallel` to `manages_own_fanout` — the semantic intent. Set `false` to mean "delegates to wave-executor whose parallel behavior depends on adapter". Add a note: "filter_plans does not disable wave-executor parallelism; it only filters the input plan set." (b) Replace `agentCount: 'from filtered plans'` with a two-phase specification: "Phase 1 (pre-count): load plans, apply filters, count remaining; Phase 2 (dispatch): invoke wave-executor with pre-counted plan set." Expose the count at Phase 1 end so callers can budget. (c) Add same-response fan-out contract cross-reference: "For parallel dispatch, wave-executor Section 4 governs; see S06 LEGION-47-101 remediation."

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-142 — P2, Unstated Acceptance Criteria

**Lines 996-1040**

> function getContextSuggestions(statePath = '.planning/STATE.md') {
>   try {
>     // 1. Read and parse STATE.md
>     const stateData = parseStateMd(statePath);
>
>     // 2. Detect lifecycle position
>     const position = detectLifecyclePosition(stateData);
>
>     // 3. Map position to suggestions (from intent-teams.yaml context_rules)
>     const suggestions = mapPositionToSuggestions(position, stateData);
>
>     return {
>       currentPosition: { ... },
>       suggestions,
>       rawState: stateData
>     };
>   } catch (error) {
>     // Graceful degradation — never throw
>     return {
>       currentPosition: { phase: null, status: 'unknown', lastActivity: null },
>       suggestions: [
>         { command: '/legion:start', description: 'Initialize a new project', priority: 1, reason: 'Unable to read project state' },
>         { command: '/legion:status', description: 'Check project status', priority: 2, reason: 'Retry after resolving state issues' }
>       ],
>       ...
>     };
>   }
> }

**Issue:** The try/catch defines the skill's done-state ("never throw") but swallows all errors uniformly. A 4.7-literal reader cannot distinguish: (a) STATE.md missing (legitimate no-project state) from (b) STATE.md present but corrupt (drift signal — user needs to investigate) from (c) parseStateMd bug (must escalate). All three collapse to "Unable to read project state". The caller (e.g., `/legion:status`) has no way to emit actionable diagnostic output — the user sees "Unable to read" without knowing what. CAT-8 peer to LEGION-47-130 soft-acceptance class.

**Remediation sketch:** (a) Distinguish error types: catch ENOENT separately from parse errors separately from schema mismatches; return different `errorClass` field in the result. (b) Update suggestions to reflect error class: ENOENT → "Initialize with /legion:start"; parse error → "Run /legion:validate to repair STATE.md"; schema mismatch → "STATE.md schema drift — see /legion:validate output". (c) Define done-state explicitly: "getContextSuggestions is complete when it returns an object with non-null `suggestions` (≥1 entry) AND `errorClass` is one of {none, no_state, parse_error, schema_drift, unknown}; callers MAY surface errorClass for user guidance."

**Remediation cluster:** `acceptance-criteria`
**Effort estimate:** small

---

## LEGION-47-143 — P2, Maximalist Persona Language

**Lines 1257-1268**

> ### 8.4 Graceful Degradation
>
> Context-aware suggestions must never cause errors or block the status dashboard. The system degrades through multiple levels:
>
> | Failure Mode | Behavior | Result |
> |-------------|----------|--------|
> | STATE.md does not exist | Return `position: 'no_project'` | Suggests `/legion:start` |
> | STATE.md is malformed (no parseable fields) | Return `position: 'unknown'` | Generic safe defaults |
> | intent-teams.yaml missing `context_rules` | Use hardcoded fallback suggestions | `/legion:status` + `/legion:start` |
> | ...
>
> **Key invariant**: `getContextSuggestions()` always returns a valid object with a non-empty `suggestions` array. Callers never need to null-check the response.

**Issue:** Maximalist invariant ("never cause errors", "always returns", "never need to null-check") asserts behavior the implementation does not fully honor. The guarantee "never cause errors or block the status dashboard" contradicts LEGION-47-140 — `fs.readFileSync` at `loadIntentTeams()` (called transitively from `mapPositionToSuggestions → loadContextRules → loadIntentTeams`) does throw on ENOENT or read errors. The outer `getContextSuggestions()` catches, but the per-level degradation table (intent-teams.yaml missing context_rules → Use hardcoded fallback) is documented in prose but not verified by the code — `loadContextRules()` returns `config.context_rules || {}` at L1213, which is correct, but the "intent-teams.yaml missing entirely" case is not tested anywhere in this file. Claim-reality gap. Peer CAT-7 class to S06 LEGION-47-089 "compatibility shim" mislabeling.

**Remediation sketch:** (a) Qualify the invariant: "never throw FROM THE OUTER CALL `getContextSuggestions()`; inner helpers may throw and are caught." (b) Add tests or verification commands for each row of the Failure Mode table; cite results. (c) Remove "Callers never need to null-check the response" — always defend the caller; defensive null-checks are cheap and guard against future drift.

**Remediation cluster:** `authority-language`
**Effort estimate:** small

---

## LEGION-47-144 — P2, Ambiguous Triggers

**Lines 22-70**

> ### parseIntentFlags(arguments)
>
> ...
> **Parsing Rules:**
>
> 1. **Equals syntax supported**: `--just-harden=true` or `--just-harden`
> 2. **Multiple --just-* flags detected**: Flag as conflict (only one primary intent allowed)
> 3. **Case insensitive**: `--JUST-HARDEN` normalizes to `--just-harden`
> 4. **Unknown flags**: Log warning but don't fail (forward compatibility)
> 5. **Duplicate flags**: Deduplicate, use first occurrence

**Issue:** Rule 4 "Unknown flags: Log warning but don't fail" is a permissive-parsing design that creates ambiguous-trigger drift. A user typo `--just-hardne` for `--just-harden` is silently warned and dropped, leading to the build proceeding WITHOUT security-audit mode despite the user's clear intent. "Forward compatibility" is the stated rationale but is not justified — Legion does not have a staged-rollout mechanism that introduces new `--just-*` flags in non-breaking ways; if a new flag is added, it is added to intent-teams.yaml and immediately valid. The forward-compatibility story is hypothetical while the typo-silent-failure is concrete and frequent. Triggers are ambiguous because "which flags are valid" is defined solely by intent-teams.yaml contents, and the parser neither validates against it nor fails when the user typoed.

**Remediation sketch:** (a) Replace Rule 4 with: "Unknown flags trigger a VALIDATION error, not a silent warning. Suggest the closest valid flag using Levenshtein distance against intent-teams.yaml `intents` keys. Allow a `--unsafe-unknown-flags` escape hatch for genuine forward-compat scenarios." (b) Cross-reference validateFlagCombination (L130) — both unknown-flag and combination-validation should share the fail-fast behavior. (c) Log the warning only when `--unsafe-unknown-flags` is set; log as INFO not WARN because the user opted in.

**Remediation cluster:** `trigger-explicitness`
**Effort estimate:** small

---

## Category Coverage Notes

- **CAT-1** (Open-Set Interpretation): 1 finding (LEGION-47-138). LOW-confidence fallback uses console.log instead of AskUserQuestion; free-text continuation unbounded. Confirmed peer.
- **CAT-2** (Ambiguous Triggers): 2 findings (LEGION-47-139 confirmed, 144). Scoring formula calibration + intent-teams.yaml registry gap peer; permissive unknown-flag parsing invites typo-silent-drop.
- **CAT-3** (Underspecified Dispatch): 1 finding (LEGION-47-141). `parallel: false` contradicts wave-executor behavior; agentCount deferral hides caller budget needs.
- **CAT-4** (Underspecified Intent): 0 findings. Intent is well-front-loaded — Section 7 preamble states purpose, Sections 2/3/4 each declare input/output contracts.
- **CAT-5** (Prohibitive Over-Reliance): 0 findings. No blanket prohibitions dominate.
- **CAT-6** (Implicit Preconditions): 1 finding (LEGION-47-140). loadIntentTeams reads .yaml without guarded error paths; "graceful degradation" claim not implemented. Confirmed peer to LEGION-47-084.
- **CAT-7** (Maximalist Persona Language): 1 finding (LEGION-47-143). "Never throw", "always returns", "never need to null-check" invariants exceed implementation guarantees. Peer to LEGION-47-089.
- **CAT-8** (Unstated Acceptance Criteria): 1 finding (LEGION-47-142). getContextSuggestions errors collapse to single uninformative message; no errorClass for caller.
- **CAT-9** (Response Calibration Gaps): 0 findings — scoring calibration is addressed under CAT-2 (LEGION-47-139) because the gap is about trigger-weights not response output.
- **CAT-10** (Authority Ambiguity): 0 findings. Section boundaries and delegation to `adapter.ask_user`, authority-matrix, wave-executor all clearly declared.

**Severity summary:** 7 findings total — 0 P0, 0 P1, 7 P2, 0 P3.
**Confirmed count:** 3 of 7 (LEGION-47-138 CAT-1 peer; 139 CAT-2 peer to S02c registry cross-cut; 140 CAT-6 peer to LEGION-47-084 intent-teams.yaml schema). 141, 142, 143, 144 unconfirmed — single-instance or claim-reality gap class.
