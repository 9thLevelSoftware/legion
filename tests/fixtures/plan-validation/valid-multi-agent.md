---
phase: "01-plan-schema-hardening"
plan: "01-01"
wave: 1
agents:
  - engineering-senior-developer
  - testing-qa-verification-specialist
  - project-management-project-shepherd
files_modified:
  - docs/schemas/plan-frontmatter.schema.json
expected_artifacts:
  - path: docs/schemas/plan-frontmatter.schema.json
    provides: Updated schema
verification_commands:
  - "node --test tests/plan-schema-conformance.test.js"
---

Body.
