# Trial Balance Tools

A pair of prototype tools for working with messy trial balance (TB) data commonly encountered in accounting and audit workflows.

This repository demonstrates a **two-stage, rule-driven processing pipeline** designed with **explainability, auditability, and human oversight** as first-class concerns.

---

## Overview

The system consists of two independent but **sequential** tools:

- **`tb-mapping/`**  
  Cleans and normalizes raw trial balance exports into a consistent, auditable schema.

- **`tb-compare/`**  
  Compares two **normalized** trial balances (e.g. year-over-year) to surface deltas, additions, removals, and material changes.

> ⚠️ **Important design constraint**  
> The comparison step assumes inputs have already been normalized by the mapping step.  
> **Raw trial balance data must be processed by `tb-mapping` before it can be used by `tb-compare`.**

Ambiguous or high-impact cases are intentionally **flagged for human review**, rather than silently resolved.

> **Note**  
> This repository contains only synthetic/sample data.  
> No client data or confidential information is included.

---

## Repository Structure

trial-balance-tools/
├─ tb-mapping/ # Normalize raw trial balance exports
├─ tb-compare/ # Compare normalized trial balances
├─ sample_data/ # Example Excel inputs and outputs (end-to-end)
└─ README.md


---

## Processing Flow (Required Order)

The intended usage follows this strict sequence:

1. **Raw trial balance exports**
2. **Mapping step (`tb-mapping`)**  
   → produces normalized trial balance files
3. **Comparison step (`tb-compare`)**  
   → produces a comparison report based on mapped outputs

The comparison tool is **not designed** to operate directly on raw trial balance exports.

---

## Sample Data (End-to-End Example)

The `sample_data/` folder contains a complete, realistic example of the intended workflow:

- `raw_tb_period1.xlsx`  
- `raw_tb_period2.xlsx`  
  → Example raw trial balance exports

- `mapped_tb_period1.xlsx`  
- `mapped_tb_period2.xlsx`  
  → Outputs produced by the mapping step

- `comparison_report.xlsx`  
  → Output produced by comparing the two mapped trial balances

These files illustrate the full **mapping → comparison** pipeline using Excel-based inputs and outputs.

---

## How to Run Locally (Optional)

Each tool is a standalone prototype application.

```bash
# Mapping tool
cd tb-mapping
npm install
npm run dev

# Comparison tool
cd tb-compare
npm install
npm run dev
Running the applications locally is not required to understand the system design.
This section exists only to document that the prototypes are runnable.

Design Principles
Explainability first
Decisions should be inspectable and auditable.

Human-in-the-loop
Ambiguous cases are surfaced, not hidden.

Robust to messy inputs
Designed for real-world trial balance exports.

Iterative by design
Structured to evolve into hybrid rule-based + ML workflows.

Limitations and Next Steps
Add automated tests around core normalization and comparison logic

Consolidate shared logic into a reusable core module

Improve documentation of assumptions and edge cases

(Planned) Explore ML-assisted classification for ambiguous mappings, with strict rule-based fallbacks

Author
Ting — transitioning from regulated, rule-intensive systems into applied ML and systems work, with a focus on safe, interpretable automation in high-consequence domains.


