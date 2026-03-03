---
name: legion:advise
description: Get read-only expert consultation from Legion's 51 agent personalities
argument-hint: <topic> (e.g., architecture, UX, marketing, testing)
allowed-tools: [Read, Grep, Glob, Agent]
---

<objective>
Select the most relevant agent for a given topic and spawn a read-only advisory session with full personality injection. The agent can explore the codebase, ask clarifying questions, and provide structured recommendations — but cannot modify any files.

Purpose: Lightweight expert consultation without the overhead of phase workflows or the risk of code changes.
Output: Structured advice from a domain expert, with optional interactive follow-up.
</objective>

<execution_context>
skills/workflow-common/SKILL.md
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

   d. Present recommendation to user as plain-text numbered choice:
      "Which agent should advise on this topic?
      1. {top_agent_id} — {specialty} (Recommended) — {brief rationale}
      2. {second_agent_id} — {specialty} — {brief rationale}
      Reply with 1 or 2 (or type an agent ID for a custom choice)."
      Wait for the user's response before proceeding.

   e. If user selects "Other": accept a custom agent ID from user input
      - Validate the ID exists in agent-registry Section 1
      - If invalid: display available agent IDs for the closest division and re-prompt

4. CONSTRUCT ADVISORY PROMPT
   a. Look up the agent's file path from agent-registry Section 1
   b. Read the agent's full personality .md file (no truncation)
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
   - Spawn via Agent tool:
     - subagent_type: "Explore"
       (Explore agents cannot Write or Edit — enforces read-only at the tool level)
     - prompt: {constructed prompt from Step 4}
     - model: "sonnet" (per cost profile: advisory = substantive analysis)
     - name: "{agent-id}-advisor"
   - Wait for the agent to complete
   - Capture the agent's response

6. DISPLAY ADVISORY RESULTS
   Output to the user:

   ## Advisory: {topic}

   **Advisor**: {agent_id} ({specialty})

   {agent's advisory response}

7. OFFER FOLLOW-UP
   Present plain-text numbered choice:
   "Continue this advisory session?
   1. Ask a follow-up question — same advisor responds
   2. Switch topic — new advisory session with a different agent
   3. End session
   Reply with 1, 2, or 3."
   Wait for the user's response before proceeding.

   a. If follow-up question (1):
      - Ask in plain text: "What's your follow-up question?"
      - Wait for the user's response
      - If user provides a question:
        Spawn the SAME agent again with updated prompt that includes:
        - Original personality
        - Original advisory context
        - "## Follow-Up Question\n{user's follow-up question}"
        - "Review your previous advice (summarized below) and address this follow-up:\n{brief summary of prior advice}"
        Use the same subagent_type: "Explore" and model: "sonnet"
      - Display results and return to Step 7

   b. If "Switch topic":
      - Return to Step 1 with new topic from user input
      - This allows a completely fresh advisory cycle

   c. If "End session":
      Display: "Advisory session ended. Run `/legion:advise <topic>` anytime for another consultation."

   Note: Advisory sessions do NOT update STATE.md, ROADMAP.md, or any project state.
   They operate entirely outside the phase workflow — pure consultation.
</process>
</output>