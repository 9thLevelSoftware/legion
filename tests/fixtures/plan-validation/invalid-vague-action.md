---
phase: 99-vague-action
plan: "99-01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/auth/session.ts
files_forbidden:
  - src/auth/oauth.ts
expected_artifacts:
  - path: src/auth/session.ts
    provides: Session helper update
    required: true
autonomous: false
agents:
  - engineering-senior-developer
requirements:
  - TEST-01
verification_commands:
  - "test -f src/auth/session.ts"
must_haves:
  truths:
    - "Session helper exists"
---

<tasks>
<task type="auto">
  <name>Task 1: Vague implementation</name>
  <files>src/auth/session.ts</files>
  <action>
Implement as appropriate. Use existing helpers. Add tests.
  </action>
</task>
</tasks>
