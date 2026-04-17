---
name: legion:advise
description: Get read-only expert consultation from Legion's agent personalities
argument-hint: <topic> (e.g., architecture, UX, marketing, testing)
allowed-tools: [Read, Grep, Glob, Agent, AskUserQuestion]
---

<objective>
Select the most relevant agent for a given topic and spawn a read-only advisory session with full personality injection. The agent can explore the codebase, ask clarifying questions, and provide structured recommendations — but cannot modify any files.

Purpose: Lightweight expert consultation without the overhead of phase workflows or the risk of code changes.
Output: Structured advice from a domain expert, with optional interactive follow-up.
</objective>

<execution_context>
skills/workflow-common-core/SKILL.md
skills/agent-registry/SKILL.md
skills/agent-registry/CATALOG.md
</execution_context>

<context>
@.planning/PROJECT.md
</context>

<process>
1. PARSE TOPIC
   - Read $ARGUMENTS for the topic
   - If $ARGUMENTS is empty or missing:
     Display: "Usage: `/legion:advise <topic>`

     **Common topics:**
     | Category | Topics |
     |----------|--------|
     | Engineering | architecture, backend, frontend, API design, DevOps, mobile |
     | Design | UX, UI design, branding, accessibility, design systems |
     | Business | strategy, executive summary, operations, finance |
     | Marketing | content strategy, social media, growth, campaigns |
     | Testing | QA strategy, performance, security, test planning |
     | Product | roadmap, user research, trends, feedback synthesis |
     | Spatial | VisionOS, XR experiences, Metal optimization |

     Example: `/legion:advise architecture` — get architectural guidance from the backend architect
     Example: `/legion:advise UX` — get UX recommendations from the UX architect
     Example: `/legion:advise marketing strategy` — get campaign advice from the marketing strategist"
     Exit — do not proceed
   - Store the topic for use in subsequent steps
   - Display: "Advisory topic: {topic}"

2. LOAD PROJECT CONTEXT (optional)
   - Attempt to read .planning/PROJECT.md
   - If found: extract project name, description, tech stack, constraints, current state
     - This context helps the advisor give project-relevant recommendations
   - If not found: proceed without project context
     - Advisory works with or without an initialized project — pure domain expertise still valuable

3. SELECT ADVISOR
   Follow agent-registry Section 3 (Recommendation Algorithm) with the topic as task description:

   a. Parse Topic (Section 3, Step 1):
      - Extract key terms from the topic
      - Match terms against task_types tags in the Agent Catalog (Section 1)

   b. Match Agents (Section 3, Step 2):
      - Score agents using the weighting system:
        - Exact match on task type tag: 3 points
        - Partial match (substring in specialty): 1 point
        - Division alignment: 2 points

   c. Rank and Select (Section 3, Steps 3-4):
      - Rank by score, break ties by specificity
      - Select top 2 candidates for recommendation
      - Do NOT apply mandatory roles enforcement (advisors don't need testing/coordination)

   d. Present recommendation to user via AskUserQuestion:
      Question: "Which agent should advise on this topic?"

      **Select one option:**
      - **{top_agent_id} — {specialty}** (Recommended) — {brief rationale based on topic match}
      - **{second_agent_id} — {specialty}** — {brief rationale for alternative}
      - **Other (specify agent ID)** — pick a different agent from the registry

      Choose one of the three options above. Do not propose alternatives.

      → Use AskUserQuestion tool with these exact three options.

   e. If user selects "Other (specify agent ID)": issue a second AskUserQuestion listing
      valid agent IDs from agent-registry Section 1, paginated by division if the list
      exceeds 10 entries. Do not accept free-text input.
      - Validate the ID exists in agent-registry Section 1
      - If invalid: re-issue the AskUserQuestion with the correct division's agent IDs

4. CONSTRUCT ADVISORY PROMPT
   a. RESOLVE AGENT PATH: Follow workflow-common Agent Path Resolution Protocol to resolve AGENTS_DIR
   b. Look up the agent ID from agent-registry Section 1, then read the full personality
      .md file at {AGENTS_DIR}/{agent-id}.md (no truncation)
      If personality file is missing: error — "Agent personality file not found at {attempted path}.
      Run /legion:update to reinstall agent files, or check the agent ID."
   c. Construct the advisory prompt:
      """
      {full personality .md content}

      ---

      # Advisory Session

      **Topic**: {topic from Step 1}
      **Mode**: READ-ONLY — you cannot and must not modify any files

      ## Project Context
      {project name, description, tech stack, constraints from Step 2 — or "No project context available. Provide general domain expertise." if PROJECT.md not found}

      ## Your Role
      You are operating as a **strategic advisor**, not an implementer. Your job is to:
      - Analyze the topic through the lens of your specialist expertise
      - Explore the codebase (Read, Glob, Grep) to ground your advice in reality
      - Ask clarifying questions if the topic is broad or ambiguous
      - Provide structured, actionable recommendations

      ## Instructions
      - You are in READ-ONLY advisory mode. Do not attempt to create, modify, or delete any files.
      - Explore the codebase freely to understand the current state before advising.
      - If the topic is broad, ask 1-2 clarifying questions before diving in.
      - Structure your advice with clear sections: Assessment, Recommendations, Trade-offs, Next Steps.
      - Reference specific files and code when your recommendations relate to existing implementation.
      - Be direct about trade-offs and risks — do not sugarcoat.
      - When you have finished your advisory response, end with:
        "---
        *Advisory session complete. Ask a follow-up question, name a new topic, or end the session.*"
      """

5. SPAWN ADVISORY AGENT
   - Use adapter.spawn_agent_readonly:
     - prompt: {constructed prompt from Step 4}
     - model: adapter.model_execution
     - name: "{agent-id}-advisor"
   - On CLIs with read_only_agents (e.g., Claude Code Explore agents): platform enforces read-only
   - On CLIs without read_only_agents: the prompt's "READ-ONLY" instruction is the only guard
   - Wait for the agent to complete and capture the response

   **Dispatch specification — Advisory agent**
   | Field | Value |
   |---|---|
   | When | After agent selection (Step 3.d) and advisory prompt construction (Step 4) complete. Fires once per advisory topic. Re-fires if user asks a follow-up question under Step 6 (each follow-up = one new spawn with accumulated context). |
   | Why parallel is safe | Not parallel — `/legion:advise` is defined as a single-agent consultation by design. |
   | How many | Exactly 1 agent per advisory turn (initial consultation or follow-up). |
   | Mechanism | adapter.spawn_agent_readonly (CRITICAL: must be read-only — advisory agents MUST NOT modify files). On CLIs with platform-enforced read-only (Claude Code Explore): platform guarantees the invariant. On CLIs without: the prompt's "READ-ONLY" instruction is the only guard — verify no file-modifying tool calls in the agent's output before accepting results. Single tool call. Model: adapter.model_execution. |

6. DISPLAY ADVISORY RESULTS
   Output to the user:

   ## Advisory: {topic}

   **Advisor**: {agent_id} ({specialty})

   {agent's advisory response}

7. OFFER FOLLOW-UP
   Use adapter.ask_user:
   "Continue this advisory session?"
   Options:
   - "Ask a follow-up question"
     Description: "Continue with the same advisor on a related question"
   - "Switch topic"
     Description: "Start a new advisory session with a different topic and potentially different agent"
   - "End session"
     Description: "Close the advisory session"

   a. If "Ask a follow-up question":
      - Use adapter.ask_user with a free-text prompt:
        "What's your follow-up question?"
        Options:
        - "Type your question" (with description: "The same advisor will respond")
        - "End session" (with description: "Close the advisory session")
      - If user provides a question:
        Spawn the SAME agent again with updated prompt that includes:
        - Original personality
        - Original advisory context
        - "## Follow-Up Question\n{user's follow-up question}"
        - "Review your previous advice (summarized below) and address this follow-up:\n{brief summary of prior advice}"
        Use the same adapter.spawn_agent_readonly and adapter.model_execution
      - Display results and return to Step 7

   b. If "Switch topic":
      - Return to Step 1 with new topic from user input
      - This allows a completely fresh advisory cycle

   c. If "End session":
      - If .planning/memory/ directory exists:
        Use adapter.ask_user:
        "Was this advisory session useful?"
        Options:
        - "Yes -- record to memory" -- "Save key takeaways as a pattern for future reference"
          Description: "Advisor insights will inform future /legion:plan recommendations"
        - "No -- just end" -- "Close without recording"
          Description: "Session ends, nothing saved"

        If "Yes":
        - Use adapter.ask_user with free-text prompt:
          "Summarize the key takeaway in one sentence (or press enter to auto-generate):"
          Options:
          - "Type your summary" -- "Your words will be recorded as a pattern"
          - "Auto-generate" -- "The advisor's main recommendation will be extracted"
        - Record to .planning/memory/PATTERNS.md using the memory-manager format:
          - ID: PAT-{next_sequential}
          - Type: pattern
          - Tags: advisory, {agent_id}, {topic keywords}
          - Summary: user's takeaway or auto-generated from advisor's first recommendation
          - Full text: "Advisory from {agent_id} on {topic}: {condensed key recommendation}"
        - Display: "Takeaway recorded as {ID}. Run `/legion:learn --recall {topic}` to retrieve later."

      - If .planning/memory/ directory does not exist:
        Display: "Advisory session ended. Run `/legion:advise <topic>` anytime for another consultation."

   Note: Advisory sessions do NOT update STATE.md, ROADMAP.md, or any project state.
   They operate entirely outside the phase workflow — pure consultation.
   Memory recording (when available) is limited to advisory patterns — no state mutations.
</process>
