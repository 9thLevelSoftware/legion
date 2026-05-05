---
phase: 7
plan: 07-02
wave: 1
files_modified:
  - tests/foo.js
expected_artifacts:
  - path: tests/foo.js
    provides: migrated artifact
    required: true
verification_commands:
  - node --test
agents:
  - testing-qa-verification-specialist
---

Pre-migration body.
