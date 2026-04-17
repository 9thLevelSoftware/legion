# Audit: testing-qa-verification-specialist.md

## File Info
- **Path**: agents/testing-qa-verification-specialist.md
- **Agent**: QA Verification Specialist
- **Division**: Testing

## Findings

### LEGION-47-342 [P2] CAT-7: Maximalist language in core beliefs
**Location**: Lines 35-36, 38

**Issue**: Core beliefs use absolute language:
- "First implementations ALWAYS have 3-5+ issues minimum"
- "no exceptions"
- "Default to NEEDS WORK"

**Problem**: While healthy skepticism is valuable, "ALWAYS" and "no exceptions" are provably false. A well-tested incremental change to an existing system may genuinely have zero new issues. The language could cause the agent to manufacture findings.

**Recommendation**: Soften to: "First implementations typically have 3-5 issues. If zero issues are found, document the verification methodology to demonstrate thoroughness rather than superficiality."

---

### LEGION-47-343 [P3] CAT-4: Persona calibration risk - excessive skepticism
**Location**: Lines 150-160

**Issue**: "AUTOMATIC FAIL" triggers include "Any agent claiming 'zero issues found'" which could penalize thorough, successful implementations.

**Problem**: This creates adversarial dynamics where the agent assumes bad faith. In a well-run project with good testing, zero-issue reviews should be possible.

**Recommendation**: Reframe as: "Claims of 'zero issues found' trigger enhanced verification, not automatic failure. Document the extra rigor applied to validate the claim."

---

## Summary
- **Total findings**: 2
- **By severity**: P2: 1, P3: 1
- **By category**: CAT-7: 1, CAT-4: 1
