# Audit: product-technical-writer.md

## File Info
- **Path**: agents/product-technical-writer.md
- **Agent**: Technical Writer
- **Division**: Product

## Findings

### LEGION-47-334 [P2] CAT-9: Schema contains non-standard `tools` field
**Location**: Line 6

**Issue**: Frontmatter includes `tools: [Read, Write, Edit, Grep, Glob]` which is not part of the CLAUDE.md schema specification. The schema expects `languages`, `frameworks`, `artifact_types`, and `review_strengths`.

**Problem**: This non-standard field may cause schema validation failures or be silently ignored by the recommendation engine.

**Recommendation**: Remove the `tools` field. Tool availability is determined by the CLI adapter, not agent frontmatter.

---

### LEGION-47-335 [P2] CAT-7: Absolute verification requirements
**Location**: Lines 254-256

**Issue**: "Verify all code examples work" and "Test all procedures yourself" are stated as absolutes without exception.

**Problem**: In some contexts (documenting deprecated APIs, writing migration guides for legacy systems), full verification may be impossible. The agent has no escape valve for documentation of systems the agent cannot access.

**Recommendation**: Add: "When verification is not possible (deprecated systems, external services), document the verification gap explicitly in the deliverable."

---

## Summary
- **Total findings**: 2
- **By severity**: P2: 2
- **By category**: CAT-9: 1, CAT-7: 1
