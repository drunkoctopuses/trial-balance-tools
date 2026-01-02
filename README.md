# Trial Balance Tools

A pair of prototype tools for working with messy trial balance (TB) data commonly encountered in accounting and audit workflows.

- **tb-mapping/**: Clean and normalize raw TB exports into a consistent, auditable schema  
- **tb-compare/**: Compare two TB periods (e.g., year-over-year) to surface deltas and exceptions

The system is designed with **explainability and human oversight** in mind — ambiguous cases are flagged for review rather than silently resolved.

> Note: This repository contains only synthetic/sample data. No client data or secrets are included.

---

## Repository structure

### `tb-mapping/`
Prototype application for normalizing raw trial balance exports.

**Focus areas**
- Detect and standardize inconsistent column formats
- Clean account numbers and descriptions
- Produce a consistent schema suitable for downstream analysis
- Flag rows requiring manual review

### `tb-compare/`
Prototype application for comparing two normalized trial balances.

**Focus areas**
- Match accounts across periods using rule-based logic
- Compute deltas and identify new / removed / changed accounts
- Generate a summary report and exceptions list

---
---

## Processing Flow (Required Order)

This project assumes a **strict processing order**:

1. **Mapping first**  
   Raw trial balance exports are cleaned, normalized, and validated using `tb-mapping/`.

2. **Comparison second**  
   Only normalized outputs produced by the mapping step should be used as inputs to `tb-compare/`.

The comparison tool is **not designed to operate directly on raw TB exports**.  
This separation ensures consistency, explainability, and safer downstream analysis.

## How to run locally

Each folder is a standalone web prototype.

```bash
# Mapping tool
cd tb-mapping
npm install
npm run dev

# Comparison tool
cd tb-compare
npm install
npm run dev
Design principles
Explainability first: decisions should be inspectable and auditable

Human-in-the-loop: ambiguous cases are surfaced, not hidden

Robust to messy inputs: designed for real-world TB exports

Iterative by design: structured to evolve into hybrid rule + ML workflows

Limitations and next steps
Add sample input/output files for quick demonstration

Add basic tests around core normalization and comparison logic

Consolidate shared logic into a reusable core module

(Planned) Explore ML-based classification for ambiguous mappings with strict rule-based fallbacks

Author
Ting  — transitioning from regulated, rule-intensive systems into applied ML and systems work.
