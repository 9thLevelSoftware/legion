---
phase: 12
plan: "12-01"
wave: 1
agents:
  - testing-qa-verification-specialist
  - engineering-senior-developer
files_modified:
  - CLAUDE.md
files_forbidden:
  - agents/
expected_artifacts:
  - path: CLAUDE.md
    provides: Updated v6.0 feature documentation
    required: true
verification_commands:
  - "node --test"
must_haves:
  truths:
    - "All existing tests pass"
---

Plan body here.
