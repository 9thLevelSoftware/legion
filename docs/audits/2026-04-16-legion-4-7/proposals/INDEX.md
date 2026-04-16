# Proposals Index — Model-Tier Configuration Cluster

**Created:** 2026-04-16
**Cluster:** model-tier configuration (LEGION-47-076, 077, 078)
**Target milestone:** TBD (next milestone after S05 close)
**Total phases:** 6 (Phase 0 + Phase A through E)

---

## Phase Roadmap

| # | File | Resolves | Dependency | Effort | Risk |
|---|------|----------|------------|--------|------|
| 0 | `phase-0-orphan-cost-profile.md` | LEGION-47-076 | none | small | Low |
| A | `phase-a-skill-diff.md` | LEGION-47-077 | none | medium | Medium |
| B | `phase-b-per-command-model.md` | LEGION-47-078 | Phase A | medium | Medium |
| C | `phase-c-inline-warning.md` | LEGION-47-078 (UX) | Phase B | small | Low |
| D | `phase-d-deprecate-planning-reasoning.md` | cleanup | Phase B | small | Low |
| E | `phase-e-agent-frontmatter-migration.md` | optional consolidation | Phase A | large | Medium |

## Sequencing

```
       Phase 0 (independent)
            │
            ▼
       Phase A ──────────────┐
            │                │
            ▼                ▼
       Phase B          Phase E (optional)
            │
            ├────────┐
            ▼        ▼
       Phase C   Phase D
```

**Critical path:** A → B → C+D (parallel)
**Optional branch:** A → E (defer until after C/D land)
**Independent:** Phase 0 can ship first or last

## Acceptance criteria for the milestone

- [ ] All 3 findings (LEGION-47-076, 077, 078) marked `status: closed` in FINDINGS-DB.jsonl
- [ ] User can run `/legion:plan` on opus and `/legion:quick` on haiku in the same project without per-session `/model` toggling
- [ ] `/legion:validate` checks tier-table coverage against agent inventory
- [ ] Backward compat: existing projects with no model overrides see zero behavior change
- [ ] Documentation updated in `README.md` with "How to bake in a lower model" section

## Related design docs

- `findings/cross-cutting/model-tier-configuration.md` — original 3 findings
- `per-command-model-override.md` — high-level design (predecessor to phase-A through phase-D specs)

## Open governance questions

1. Phase E (per-agent frontmatter migration) — keep optional or mandate? Recommend: optional, depends on whether other agent metadata (`languages`, `frameworks`, etc.) ever needs per-file lookup performance
2. Phase D — when to fully remove `models.planning_reasoning` vs. just deprecate? Recommend: deprecate in Phase D, remove in next major version (v8.0)
3. Should the per-command `model:` field accept session-model-aware tokens like `same-as-session` or `cheaper-than-session`? Recommend: defer to Phase F if user demand emerges
