---
phase: 99-test-phase
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - skills/test-skill/SKILL.md
files_forbidden:
  - agents/
expected_artifacts:
  - path: skills/test-skill/SKILL.md
    provides: Test skill definition
    required: true
autonomous: false
agents:
  - engineering-senior-developer
requirements:
  - TEST-01
user_setup: []
must_haves:
  truths:
    - "Test"
  artifacts: []
  key_links: []
---
