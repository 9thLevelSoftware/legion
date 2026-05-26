---
name: legion:map
description: Generate, refresh, check, or query the Legion codebase map and semantic index
argument-hint: "[--check] [--refresh] [--scope <path>] [--query <text>]"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

<objective>
Create and maintain Legion's canonical codebase documentation and retrieval index. Generate `.planning/CODEBASE.md` for human-readable architecture context and `.planning/codebase/` artifacts for structured search by other Legion commands.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/codebase-mapper/SKILL.md
</execution_context>

<context>
@.planning/CODEBASE.md (if exists)
@.planning/codebase/index.jsonl (if exists)
@.planning/codebase/symbols.json (if exists)
@.planning/codebase/search.md (if exists)
@.planning/config/directory-mappings.yaml (if exists)
</context>

<process>
1. PARSE ARGUMENTS
   - Read `$ARGUMENTS`.
   - Supported flags:
     - `--check`: inspect map freshness and artifact completeness only. Do not write files.
     - `--refresh`: force a rebuild even when the current map is fresh.
     - `--scope <path>`: limit analysis to a file or directory. Scope must exist and must stay inside the current project.
     - `--query <text>`: search the existing map dataset and report matching map chunks plus source files to read next.
   - Invalid flag combinations:
     - `--check` with `--refresh`: print usage and exit.
     - `--query` with `--refresh`: print usage and exit; query uses an existing dataset only.
   - If no flags are present: run a full map only when there is no fresh complete dataset; otherwise summarize the current dataset and offer refresh via AskUserQuestion.

2. SOURCE CODE DETECTION
   - Follow codebase-mapper Section 1 Source Code Detection Heuristic.
   - Exclude Legion state/runtime folders: `.planning/`, `.claude/`, `.codex/`, `.cursor/`, `.windsurf/`, `.gemini/`, `.opencode/`, `.aider/`, `.kilo/`, `.kilocode/`, `.legion/`, `.git/`, dependency/build output directories.
   - If no source code is detected:
     - In `--query`: continue to Query Mode; query reads an existing map dataset and does not require current source detection.
     - In `--check`: report `status: absent`, `reason: no source files detected`, and exit 0.
     - In default/full map mode: display "No source code detected, so no codebase map was generated." and exit without writing files.

3. CHECK MODE
   - Inspect these required artifacts:
     - `.planning/CODEBASE.md`
     - `.planning/codebase/index.jsonl`
     - `.planning/codebase/symbols.json`
     - `.planning/codebase/search.md`
     - `.planning/config/directory-mappings.yaml`
   - Read `.planning/CODEBASE.md` metadata:
     - `map_schema_version`
     - `generated_at`
     - `analyzed_commit`
     - `source_file_count`
     - `source_fingerprint`
   - Compute current source fingerprint using codebase-mapper Section 17.
   - Status outcomes:
     - `fresh`: all required artifacts exist, schema is current, age <= 30 days, source fingerprint matches.
     - `stale`: artifacts exist but age > 30 days or fingerprint differs.
     - `partial`: one or more required artifacts are missing.
     - `absent`: no CODEBASE.md and no `.planning/codebase/` dataset.
   - Output a concise report with status, age, analyzed commit, missing artifacts, fingerprint match, and recommended action.
   - Do not write files in `--check`.

4. QUERY MODE
   - Require `.planning/codebase/index.jsonl` and `.planning/codebase/symbols.json`.
   - If missing, display: "No map index exists. Run `/legion:map` first." and exit.
   - Follow codebase-mapper Section 18 Semantic Search Protocol:
     - Normalize the query into keywords, path hints, symbol hints, and domain hints.
     - Search `index.jsonl` and `symbols.json` using Grep/Read.
     - Return the top 5 matching chunks with id, path, line range, kind, summary, and why it matched.
     - Include "Read next" source files and exact line ranges where available.
   - Never answer from the index alone when source-file evidence is required; instruct consumers to read the source paths before acting.

5. FULL MAP OR REFRESH MODE
   - Ensure `.planning/`, `.planning/codebase/`, and `.planning/config/` exist.
   - Run the full codebase-mapper protocol:
     - Architecture narrative and module structure.
     - Functionality/feature inventory.
     - Module ownership and domain boundaries.
     - Dependency/import graph and high fan-in files.
     - Route/API surface.
     - Data/config/environment map.
     - Test and coverage map.
     - Risk hotspots and dependency risk.
     - Setup/runbook.
     - Pattern library and conventions.
     - Monorepo package map, if applicable.
   - Write all required outputs:
     - `.planning/CODEBASE.md`
     - `.planning/codebase/index.jsonl`
     - `.planning/codebase/symbols.json`
     - `.planning/codebase/search.md`
     - `.planning/config/directory-mappings.yaml`
   - `--scope <path>` still writes the same artifact set, but metadata must include `scope: <path>` and the report must say that the dataset is scoped, not full-project.

6. COMPLETION REPORT
   - Show:
     - Map status: generated or refreshed.
     - Source files analyzed.
     - Languages/frameworks detected.
     - Required artifacts written.
     - Top risks or `_None detected_`.
     - Next suggested command:
       - `/legion:start` if no project exists.
       - `/legion:plan <N>` if a project exists and the map is ready.
       - `/legion:map --query "<topic>"` for targeted lookup.
</process>

<decision_matrix>
| Situation | Action |
|-----------|--------|
| Fresh complete dataset and no `--refresh` | Summarize freshness and ask whether to refresh or keep current |
| Dataset missing index artifacts but CODEBASE.md exists | Treat as `partial`; rebuild unless user chooses check-only |
| Fingerprint mismatch | Treat as `stale`; recommend `/legion:map --refresh` |
| Query requested without dataset | Do not improvise search; tell user to run `/legion:map` first |
| Scope path outside project | Block with an escalation; never analyze outside the workspace by accident |
</decision_matrix>

<completion_gate>
- `.planning/CODEBASE.md` exists and includes current map metadata.
- `.planning/codebase/index.jsonl` exists and contains one JSON object per retrievable chunk.
- `.planning/codebase/symbols.json` exists and is valid JSON.
- `.planning/codebase/search.md` documents the consumer search protocol.
- `.planning/config/directory-mappings.yaml` exists and is valid YAML.
- The final report names every artifact written and any degraded sections.
</completion_gate>
