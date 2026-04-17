# Audit Findings — skills/agent-creator/SKILL.md

**Audited in session:** S10
**Rubric version:** 1.0
**File layer:** skill
**File length:** 433 lines
**Total findings:** 5 (0 P0, 1 P1, 4 P2, 0 P3)
**Baseline commit:** audit-v47-baseline

---

## LEGION-47-229 — P1, Template Propagation Risk (confirmed)

**Lines 266-302**

> **Body content** — generate substantive prose from the conversation data. Target 80-120 lines. Structure:
>
> # {AgentName} Agent Personality
> ## 🧠 Your Identity & Memory
> {2-3 paragraphs establishing who this agent is, their background, expertise, and what drives them. Written in second person ("You are..."). Draw from Stage 2 personality traits and domain knowledge.}
> ## 🎯 Your Core Mission
> {Prose description of the agent's primary mission, followed by the capability list from Stage 2 written as detailed descriptions, not bare bullets. Each capability should be 2-3 sentences explaining what the agent does and how.}
> ## 🚨 Critical Rules You Must Follow
> {The hard rules from Stage 2, each as a numbered item with explanation of why the rule exists and what happens if violated.}

**Issue:** This is the canonical template for ALL future agent personalities. Every CAT-7 (Maximalist Language), CAT-4 (Persona Calibration), and CAT-10 (Authority Language) defect found in existing agents (50+ findings across S07-S09 agent audits) will propagate to newly-created agents unless this template enforces calibrated language. Current template has zero anti-maximalism guidance: (a) L284 "Each capability should be 2-3 sentences" encourages expansive prose — no cap on hedging, no requirement for concrete verifiable outputs. (b) L286-287 "hard rules ... explanation of why the rule exists and what happens if violated" — the "what happens if violated" slot invites catastrophizing language ("never, under any circumstances", "always block") seen in LEGION-47-125, 140, 155 etc. (c) No template slot for Authority Matrix boundaries — new agents have no guidance on in-scope vs out-of-scope decisions, recreating the LEGION-47-176 authority-carve-out defect in every custom agent. (d) Section 5 Success Metrics heading is in template L296-299 but Section 9 canonical list L45-52 ALSO lists it — template omits Rules/Deliverables/Workflow/Communication/Learning sections despite Schema L45-52 requiring them. Body template missing FOUR of the nine canonical sections. Agents generated via this flow will FAIL schema validation at Step 7 (L201-204 "body contains at least one # or ## heading") silently because only 5 of 9 required headings appear.

**Remediation sketch:** (a) Add Section 4.5 "Template Calibration Rules" before file-generation: "Body prose must follow the calibration rubric: (i) no maximalist absolutes (replace 'never/always/must' with conditional language specifying trigger and exception); (ii) Success Metrics must be observable (no 'high quality', 'excellent user experience' — use measurable criteria); (iii) Critical Rules must be testable by a reviewer reading the rule alone; (iv) Include an explicit 'Out of Scope' subsection referencing Authority Matrix system_paths_exempt_from_scope." (b) Fix template L268-300 to include ALL nine canonical sections from L45-52 — currently only 5 of 9 are templated. (c) Add linter step 9 to Section 3 validation: "Heading completeness — body must contain all nine canonical ## headings from Section 1 table L45-52." (d) Cross-reference calibrated exemplars: "Before generating body, load two agents from the current registry that match the target division — use them as calibration examples for tone and specificity, not copy-paste sources." Cross-reference LEGION-47-125, 140, 155 (maximalist in existing agents — this template must prevent propagation).

**Remediation cluster:** `persona-calibration`
**Effort estimate:** medium

---

## LEGION-47-230 — P2, Closed-Set Enforcement (confirmed)

**Lines 100-107, 125-137, 145-151, 212-220**

> **Confirm via AskUserQuestion:** "I'll create a {division} agent — '{suggested-name}'. Specialty: {description}. Correct, or would you like to adjust?"
> Options: "Looks good" / "Adjust" — let the user modify division, name, or description
> ...
> Options: "Proceed to tags" / "Adjust" — let the user modify any captured values
> ...
> "Based on capabilities, I suggest: {tag1}, {tag2}, {tag3}. These align with existing registry tags like: {example_existing_tags}. Add or remove any?"
> Options: "Use these tags" / "Adjust tags" — let the user modify the tag list
> ...
> - Present specific errors via AskUserQuestion: "Validation found {N} issue(s): Fix these before I can create the agent." Allow the user to provide corrections

**Issue:** Four user-facing prompts mix AskUserQuestion structured-options primitive with free-text escape hatches (same defect class as LEGION-47-019, 020, 033, 043, 058, 070, 092, 116, 159, 191, 198, 212, 221). (a) L103-104 "Adjust" branch needs to capture WHICH field to adjust (division, name, or description) — AskUserQuestion binary Looks-good/Adjust cannot thread into the sub-capture. (b) L134-136 same pattern — "Adjust" sub-menu undefined, 4.7 either loops back to Stage 1 losing captured state or renders free-text that the workflow cannot parse. (c) L146-150 tag editing: "Adjust tags" requires free-text tag entry; AskUserQuestion closed-set cannot collect variable-length tag lists. (d) L213-217 validation errors presented via AskUserQuestion but "Allow the user to provide corrections" implies free-text field-by-field correction — no structured path.

**Remediation sketch:** (a) L100-107 Stage 1 confirm: On Adjust, invoke nested AskUserQuestion {id=division label=Change division; id=name label=Change name; id=description label=Change description; id=back label=Back to identity}. Each nested branch has its own closed-set or explicit free-text fallback via adapter.prompt_free_text (S05/S09 outstanding primitive). (b) L125-137 Stage 2 confirm: same nested pattern with id=capabilities / id=personality / id=rules / id=back. (c) L145-151 tag editing: require exactly-N closed-set choice loop — present current tags as removable chips; new tags via adapter.prompt_free_text with regex validation `^[a-z][a-z0-9-]*$` per tag. (d) L213-220 validation: for each error, present AskUserQuestion {id=auto-fix label=Apply suggested fix; id=edit label=Edit field; id=cancel label=Cancel creation}. Cross-reference LEGION-47-019, 020, 058, 212, 221.

**Remediation cluster:** `closed-set-enforcement`
**Effort estimate:** medium

---

## LEGION-47-231 — P2, Underspecified Intent / Division Drift (confirmed)

**Lines 70-76, 97, 192-194**

> ```
> Valid divisions: Engineering, Design, Marketing, Product,
>   Project Management, Testing, Support, Spatial Computing,
>   Specialized, Custom
> ```
> ...
> - **Division** — map the specialty domain to one of the 10 divisions (engineering, design, marketing, product, project-management, testing, support, spatial-computing, specialized, custom).
> ...
> 5. Division
>    - Check: value is one of: Engineering, Design, Marketing, Product,
>      Project Management, Testing, Support, Spatial Computing, Specialized, Custom

**Issue:** Division drift — file declares 10 divisions (L70-76, L97, L192-194) but CLAUDE.md Division Index lists 9 (Engineering, Design, Marketing, Testing, Product, Project Management, Support, Spatial Computing, Specialized = 9). The 10th "Custom" is THIS skill's invention for user-created agents but is not in CLAUDE.md canonical index. (a) If user creates a custom agent and `/legion:plan` loads the CLAUDE.md index, the division table does NOT include Custom — custom agents are unreachable by recommendation engine. (b) L70-76 uses Title Case (Engineering, Design) but L97 uses kebab-case (engineering, design). These are the SAME string per user but 4.7 will treat them as distinct validation targets — validation checklist L193 Title Case vs frontmatter schema Title Case vs agent-registry tags kebab-case creates three case-conventions in one skill. (c) "Project Management" has a space in Title Case but kebab-case in L97 is "project-management" — no normalization rule. Schema validation at L190-194 will fail any frontmatter value "project-management" against the Title Case allowed-set. Peer LEGION-47-225 (portfolio-manager division drift), LEGION-47-187, 199, 052.

**Remediation sketch:** (a) Single source of truth: delete L70-76 AND L192-194 inline lists. Replace with reference: "Divisions are defined in CLAUDE.md Agent Divisions table (9 built-in + 1 custom extension). Read CLAUDE.md at runtime to get canonical list." (b) Fix case-convention split: declare one canonical form (kebab-case per filesystem slug) in Section 1 and require all downstream checks, frontmatter values, and user-facing options to use the same. Add normalization step: "Before validation, normalize user-provided division to kebab-case via .toLowerCase().replace(' ', '-')." (c) Integrate Custom into CLAUDE.md OR document "custom" as a reserved slug that does not appear in built-in division index but is a valid agent path — make this explicit in both files. Cross-reference LEGION-47-225, 187.

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** small

---

## LEGION-47-232 — P2, Implicit Preconditions (suspected)

**Lines 171-173, 307-309, 319-321, 353-355, 409-417**

> 1. Name uniqueness
>    - Search: grep -rl "^name: {proposed_name}$" agents/
>    - PASS: no output (name not found in any existing agent file)
> ...
> ### Step 4: Verify File
> After writing, verify the file exists:
> ```bash
> test -f agents/{agent-name}.md && echo "OK" || echo "FAIL"
> ```
> ...
> ### Step 1: Read agent-registry.md
> Read the current content of `skills/agent-registry/SKILL.md`.
> ...
> ### Step 5: Verify Registry Update
> Read agent-registry.md after the edit and confirm the new row appears in the correct division table.
> ...
> ```bash
> node scripts/generate-knowledge-index.js --patch
> ```
> This updates the Dynamic Knowledge Index in AGENTS.md and CLAUDE.md to include the new agent. If the script is not available (e.g., global install without scripts/), skip this step — the index can be regenerated later.

**Issue:** Multiple shell-command preconditions with unhandled failure modes. (a) L172 `grep -rl` assumes agents/ exists and is searchable; if agent-creator runs on fresh install before agents/ is created (L77-78 says it's created "on first use"), grep returns exit 2 (directory not found) not "no output" — 4.7 reads the "no output" PASS rule and proceeds, allowing name-collision never-detected. (b) L308 `test -f` assumes absolute paths work in the invoking shell on Windows; in git-bash + native Windows path mix, test -f may succeed/fail inconsistently. (c) L321 "Read the current content of `skills/agent-registry/SKILL.md`" — hardcoded relative path assumes cwd is repo root. If invoked from a sub-directory or on a global Legion install where the skill path is different (e.g., `~/.claude/skills/legion/agent-registry/SKILL.md`), Read fails silently and Section 5 proceeds without registry update. (d) L414 `node scripts/generate-knowledge-index.js --patch` silent-skip if script missing — but L11 also states "new agent appears in future planning recommendations." If index regeneration silently skips, the new agent is NOT in the Dynamic Knowledge Index used by intent-router — recommendations will not surface it until manual regen. User believes creation succeeded; agent is invisible.

**Remediation sketch:** (a) L171-173 Step 1: Pre-check `test -d agents/ || mkdir -p agents/`. Sub-classify grep exit codes: 0=match (collision), 1=no-match (pass), 2=error (abort with diagnostic). (b) L307-309 use both test -f AND stat-size > 0 to catch partial-write corruption. (c) L319-321 resolve agent-registry path via workflow-common-core Agent Path Resolution (same pattern as CLAUDE.md Dynamic Knowledge Index). Do NOT hardcode the relative path. (d) L409-417 knowledge-index regeneration: silent skip is wrong. If script unavailable, emit `<escalation severity=warning type=infrastructure>` message: "Knowledge index NOT regenerated — your new agent {name} will not appear in recommendations until you run `node scripts/generate-knowledge-index.js` manually." This is a contract violation of L11 promise; must be surfaced. Cross-reference LEGION-47-220 (precondition-verification).

**Remediation cluster:** `precondition-verification`
**Effort estimate:** small

---

## LEGION-47-233 — P2, Schema Incompleteness (confirmed)

**Lines 32-37, 245-264**

> ### Optional Frontmatter Fields
>
> | Field | Format | When to Include |
> |-------|--------|-----------------|
> | `tools` | Comma-separated list | When the agent needs specific tools beyond defaults (e.g., `WebFetch, WebSearch, Read, Write`) |
> ...
> **YAML frontmatter:**
> ```yaml
> ---
> name: {agent-name}
> description: {description}
> color: {color}
> ---
> ```
> If tools are specified:
> ```yaml
> ---
> name: {agent-name}
> description: {description}
> tools: {tool1}, {tool2}
> color: {color}
> ---
> ```

**Issue:** Agent frontmatter schema omits FOUR enriched metadata fields that CLAUDE.md explicitly declares: "Agent frontmatter includes enriched metadata: `languages`, `frameworks`, `artifact_types`, and `review_strengths` fields enable metadata-aware agent selection by the recommendation engine." Agent-registry Section 3 Layer 3 (L61-71) SCORES agents on these four fields. New agents generated by this skill LACK these fields, so Layer 3 scoring for any custom agent always returns 0 — custom agents systematically under-rank vs built-ins. (a) Stage 2 capture at L111-123 asks for capabilities/personality/rules but does NOT ask for languages, frameworks, artifact_types, review_strengths. (b) File generation template L245-264 has no slot for these fields. (c) Missing `division` field in frontmatter — CLAUDE.md Dynamic Knowledge Index lookup uses division for division-aware recommendations; portfolio-manager Section 5 uses division for allocation tracking. The canonical schema is silently absent. (d) Missing `task_types` field — agent-registry Section 3 Layer 1 (L41-43) SCORES on task_types; this skill generates them in Stage 3 (L140-146) but template writes them to the REGISTRY row not to the agent's OWN frontmatter. Registry row is not queryable at runtime by intent-router.

**Remediation sketch:** (a) Section 1 Required Frontmatter Fields: add `division` (kebab-case, allowed-set) as required. (b) Section 1 Optional Frontmatter Fields: add `languages` (list), `frameworks` (list), `artifact_types` (list), `review_strengths` (list), `task_types` (list). (c) Stage 2 questioning flow: add 4th question "What artifact types does this agent produce? (e.g., code, documentation, design, analysis)" and 5th question "What languages and frameworks does this agent specialize in?" with AskUserQuestion closed-set choices grouped by division. (d) Template generation L245-264: include all metadata fields in generated frontmatter. (e) Section 3 validation: check all required + declared-optional fields present and well-formed. Cross-reference CLAUDE.md L54 (enriched metadata declaration), agent-registry L61-71 (Layer 3 scoring), LEGION-47-225 (division drift).

**Remediation cluster:** `dispatch-specification`
**Effort estimate:** medium

---
