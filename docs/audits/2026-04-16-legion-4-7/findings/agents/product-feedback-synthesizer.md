# Audit: product-feedback-synthesizer.md

## File Info
- **Path**: agents/product-feedback-synthesizer.md
- **Agent**: Feedback Synthesizer
- **Division**: Product

## Findings

### LEGION-47-330 [P2] CAT-7: Maximalist "Never" language without escape valves
**Location**: Lines 37-44

**Issue**: The Critical Rules section uses "Never" seven times in absolute statements:
- "Never present feedback volume as a proxy for importance"
- "Never synthesize without stating sample size"
- "Never let the loudest voice win"

**Problem**: While the guidance is sound, absolute language without exception paths can block legitimate edge cases. For example, in rapid triage situations, a quick synthesis without full sample size documentation may be necessary.

**Recommendation**: Soften to conditional language: "Avoid presenting feedback volume as a proxy for importance unless revenue/churn weighting is unavailable and acknowledged as a limitation."

---

### LEGION-47-331 [P3] CAT-4: Success metrics include unrealistic precision
**Location**: Lines 165-173

**Issue**: Success metrics specify precise targets like "90%+ validated by stakeholders" and "80% accuracy for feedback-driven feature success" without methodology for measurement.

**Problem**: These metrics are aspirational but unmeasurable within a single agent session. They risk being ignored or causing false confidence.

**Recommendation**: Either remove precise percentages or add methodology notes explaining how these metrics would be tracked across sessions.

---

## Summary
- **Total findings**: 2
- **By severity**: P2: 1, P3: 1
- **By category**: CAT-7: 1, CAT-4: 1
