---
name: legion:learn
description: Record, recall, and manage project-specific patterns, pitfalls, and preferences
argument-hint: <lesson> [--recall <topic>] [--list] [--prune]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion]
---

<objective>
Explicitly record patterns, pitfalls, and preferences to project memory. Recall relevant learnings during planning and execution.

Purpose: Build project-specific institutional knowledge that persists across sessions.
Output: Structured memory entries in .planning/memory/ files.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/memory-manager/SKILL.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<process>
1. PARSE MODE
   Read $ARGUMENTS to determine operating mode:

   - If $ARGUMENTS contains `--recall <topic>`: set MODE=recall, extract topic text
   - If $ARGUMENTS contains `--list`: set MODE=list
   - If $ARGUMENTS contains `--prune`: set MODE=prune
   - If $ARGUMENTS is non-empty (and no flags): set MODE=record, store full text as lesson
   - If $ARGUMENTS is empty or missing:
     Display:
     "Usage: `/legion:learn <lesson>`
      Record a pattern, pitfall, or preference to project memory.

      Examples:
        `/legion:learn Always run migrations in a transaction`
        `/legion:learn --recall migrations`
        `/legion:learn --list`

      Modes:
        `<lesson>`         — Record a new learning
        `--recall <topic>` — Search memory for relevant learnings
        `--list`           — Show all recorded learnings by type
        `--prune`          — Archive old, low-importance outcome records"
     Exit — do not proceed

2. LOAD PROJECT CONTEXT (optional)
   - Attempt to read .planning/PROJECT.md
   - If found: extract project name, current phase from STATE.md
   - If not found: proceed without project context
     - Learn works with or without an initialized project
   - Ensure .planning/memory/ directory exists for record/list modes
     - If MODE=record and directory does not exist: create it
     - If MODE=recall or MODE=list and directory does not exist:
       Display: "No memory directory found. Record your first learning with `/legion:learn <lesson>`."
       Exit

3. ROUTE BY MODE
   - MODE=record → go to Step 4
   - MODE=recall → go to Step 8
   - MODE=list → go to Step 9
   - MODE=prune → go to Step 10

4. CLASSIFY LESSON
   Analyze the lesson text to determine its type:

   **Pattern**: A reusable approach that works well
   - Signals: "always", "use", "prefer", "works well", "best practice", positive framing
   - Example: "Always use atomic commits for design system changes"

   **Pitfall**: A mistake or problem to avoid
   - Signals: "don't", "never", "avoid", "causes", "breaks", "watch out", negative framing
   - Example: "Don't run database migrations without a backup"

   **Preference**: A team or project convention or choice
   - Signals: "we use", "prefer X over Y", "convention", "standard", "our approach"
   - Example: "We prefer Tailwind utility classes over CSS modules"

   Present classification via adapter.ask_user:
   "I classified this as a **{type}**. Correct?"
   Options:
   - "Correct" — "Save as {type}"
   - "It's a pattern" — "Reusable approach that works"
   - "It's a pitfall" — "Mistake or problem to avoid"
   - "It's a preference" — "Team/project convention"

   Use the user's confirmed type for the next steps.

5. ENRICH
   Add contextual metadata to the learning:
   a. **Tags**: Extract relevant keywords from the lesson text
      - Technical terms (e.g., "migrations", "auth", "API", "CSS")
      - Domain terms (e.g., "testing", "deployment", "design")
      - Generate 2-5 tags
   b. **Phase context**: Note current phase/milestone from STATE.md (if available)
   c. **Summary**: Generate a one-line summary (max 80 characters)
   d. **ID**: Generate a unique ID: `{type[0:3].upper()}-{sequential_number}`
      - PAT-001, PIT-001, PRF-001
      - Read existing file to determine next sequential number

6. RECORD
   Write to the appropriate memory file based on type:
   - Pattern → .planning/memory/PATTERNS.md
   - Pitfall → .planning/memory/ERRORS.md
   - Preference → .planning/memory/PREFERENCES.md

   **If file does not exist**, create with header:
   ```
   # {Type}s

   Project-specific {type}s recorded via `/legion:learn`.
   Referenced by `/legion:plan` and `/legion:build` for context-aware execution.
   ```

   **Append entry**:
   ```
   ## {ID}: {summary}
   - **Date**: {current_date}
   - **Type**: {type}
   - **Tags**: {comma-separated tags}
   - **Phase**: {current phase or "N/A"}

   {full lesson text}

   ---
   ```

   Display:
   "{type} recorded: {ID} — {summary}
    Saved to .planning/memory/{filename}
    This learning will inform future `/legion:plan` recommendations."

7. OFFER CONTINUATION
   Present via adapter.ask_user:
   "Record another learning?"
   Options:
   - "Yes" — "Record another pattern, pitfall, or preference"
   - "Done" — "Exit learning mode"

   If "Yes": prompt for the next lesson text and return to Step 4
   If "Done": Display "Run `/legion:learn --recall <topic>` to search your learnings." → Exit

8. RECALL MODE
   Search all memory files for entries matching the topic:

   a. Define search targets:
      - .planning/memory/PATTERNS.md
      - .planning/memory/ERRORS.md
      - .planning/memory/PREFERENCES.md
      - .planning/memory/RETRO.md (if exists — cross-reference retrospective findings)
      - .planning/memory/OUTCOMES.md (if exists — cross-reference past outcomes)

   b. For each file that exists:
      - Search by tag match (exact tag match scores highest)
      - Search by summary text (substring match)
      - Search by full lesson text (substring match)
      - Score: tag match = 3 points, summary match = 2 points, body match = 1 point

   c. Rank results by score, deduplicate

   d. Display results:
      If matches found:
      # Learnings: "{topic}"

      {count} entries found:

      **{ID}** ({type}) — {summary}
      Tags: {tags}
      > {first 2 lines of lesson text}

      ...

      If no matches:
      "No learnings found for '{topic}'.
       Try `/legion:learn --list` to see all entries, or `/legion:learn <lesson>` to record a new one."

   Exit after displaying results.

9. LIST MODE
   Read all memory files and display entries grouped by type:

   a. Read .planning/memory/PATTERNS.md — extract all entries
   b. Read .planning/memory/ERRORS.md — extract all entries
   c. Read .planning/memory/PREFERENCES.md — extract all entries

   d. Display:
   # Project Learnings

   ## Patterns ({count})
   | ID | Summary | Tags | Date |
   |----|---------|------|------|
   | {ID} | {summary} | {tags} | {date} |
   ...

   ## Pitfalls ({count})
   | ID | Summary | Tags | Date |
   |----|---------|------|------|
   | {ID} | {summary} | {tags} | {date} |
   ...

   ## Preferences ({count})
   | ID | Summary | Tags | Date |
   |----|---------|------|------|
   | {ID} | {summary} | {tags} | {date} |
   ...

   **Total**: {total_count} learnings recorded

   If no files exist or all are empty:
   "No learnings recorded yet.
    Start with `/legion:learn <lesson>` to record your first pattern, pitfall, or preference."

   Exit after displaying results.

10. PRUNE MODE
    Execute the Prune Operation defined in memory-manager SKILL.md Section 7.5:

    a. Check if .planning/memory/OUTCOMES.md exists
       - If not: Display "No outcomes to prune. OUTCOMES.md does not exist." → Exit

    b. Count total records in OUTCOMES.md
       - If count <= memory.prune_threshold (default 200) from settings.json:
         Present via adapter.ask_user:
         "OUTCOMES.md has {count} records (threshold: {threshold}). Prune anyway?"
         Options:
         - "Yes" — "Prune records older than {prune_age_days} days with importance <= 3"
         - "No" — "Keep all records"
         If "No": Exit

    c. Run the Prune Operation from memory-manager Section 7.5
       - This handles: candidate identification, archive file creation, record movement, verification, and reporting

    d. Display the prune report from Step 8 of the Prune Operation

    Exit after displaying results.

IMPORTANT:
- Learn works with or without an initialized Legion project — it only needs .planning/memory/
- The memory directory is created automatically on first record if it doesn't exist
- IDs are sequential within each type file and never reused
- Tags are lowercase and derived from the lesson text, not invented
- Recall mode searches across ALL memory files, not just the three learn-specific ones
- All user-facing questions use adapter.ask_user (AskUserQuestion tool)
- Memory files are human-readable markdown — no binary state
- The command never modifies phase files, STATE.md, or ROADMAP.md
</process>
