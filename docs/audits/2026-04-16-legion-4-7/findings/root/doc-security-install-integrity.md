# Audit Findings — docs/security/install-integrity.md

**Audited in session:** S02b
**Rubric version:** 1.0
**File layer:** root (security reference doc)
**File length:** 33 lines
**Total findings:** 0 (clean)
**Baseline commit:** audit-v47-baseline

---

No findings. All 10 rubric categories applied; no matches crossed the finding threshold.

## Category Coverage Notes

- **CAT-1 (Open-Set Interpretation):** Three security layers (lines 12-20) are enumerated. Two recommended usage patterns (lines 23-27) are concrete commands. No open-set language.
- **CAT-2 (Ambiguous Triggers):** No triggers — doc is descriptive.
- **CAT-3 (Underspecified Dispatch):** No dispatch.
- **CAT-4 (Underspecified Intent):** The threat model (lines 6-8) states the primary risk in one sentence. Intent is explicit and scoped.
- **CAT-5 (Prohibitive Over-Reliance):** The Limits section (lines 29-33) uses positive framing ("`--verify` validates file integrity ...", "For stronger guarantees, use npm provenance/signing"). No load-bearing negatives.
- **CAT-6 (Implicit Preconditions):** Line 17 uses the heuristic "If install source appears to be a local git checkout, the installer warns ...". "Appears" is a heuristic, but the doc is describing installer behavior, not instructing an agent to perform the heuristic check. Low behavioral risk for any 4.7-literal reader.
- **CAT-7 (Maximalist Persona Language):** None.
- **CAT-8 (Unstated Acceptance Criteria):** Not a check/verify surface; it is a reference with recommended invocations.
- **CAT-9 (Response Calibration Gaps):** Not applicable — static reference.
- **CAT-10 (Authority Ambiguity):** Doc makes no authority claims beyond describing what the installer does.

The file is brief (33 lines), scoped tightly to installer integrity, and honest about its limits ("It does not provide cryptographic publisher identity by itself"). No 4.7-literalism surface to audit further.
