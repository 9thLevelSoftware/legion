---
phase: 99-test-phase
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/test-skill/SKILL.md
  - tests/test-skill.test.js
files_forbidden:
  - agents/
  - commands/
  - adapters/
expected_artifacts:
  - path: skills/test-skill/SKILL.md
    provides: Test skill definition
    required: true
  - path: tests/test-skill.test.js
    provides: Test coverage for the skill
    required: true
autonomous: false
agents:
  - engineering-senior-developer
requirements:
  - TEST-01
user_setup: []
verification_commands:
  - test -f skills/test-skill/SKILL.md
  - test -f tests/test-skill.test.js
  - grep -q "Section 1" skills/test-skill/SKILL.md
must_haves:
  truths:
    - "Test skill has Section 1"
  artifacts:
    - path: skills/test-skill/SKILL.md
      provides: Test skill
      min_lines: 50
      contains: "Section 1"
  key_links: []
---
