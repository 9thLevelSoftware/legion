---
name: legion:workflow-common-domains
description: Optional cross-domain conventions for design/marketing/specialized workflows
triggers: [design, marketing, domain, campaign, brief]
token_cost: low
summary: "Shared optional conventions for domain workflows that are not always loaded in core execution."
---

# Workflow Common Domain Extension

Use for domain-specific workflows only.

## Rules

### Activation trigger (concrete — no "when relevant")

Activate this extension ONLY when at least one of the following conditions holds for the current phase. Keyword-based detection in prose is NOT a trigger — use it only as a hint to prompt the user.

1. A requirement ID in ROADMAP.md or REQUIREMENTS.md matches `^(MKT|DSN)-\d+`
2. The phase's CONTEXT.md YAML frontmatter declares `workflow_type: marketing` or `workflow_type: design`
3. The user passed `--domain=marketing` or `--domain=design` to `/legion:plan`

If none of the above hold: DO NOT activate this extension. Fall back to standard phase decomposition.

### Operational rules

- Marketing workflows produce campaign artifacts under `.planning/campaigns/`.
- Design workflows produce design artifacts under `.planning/designs/`.
- Domain extensions refine execution; they never replace core phase/state flow.
- Canonical phase-detection rules live in `workflow-common/SKILL.md` § Marketing Phase Detection and § Design Phase Detection. This file references them — do not re-implement detection here.
