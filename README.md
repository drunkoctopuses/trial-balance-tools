 Trial Balance Tools

This repository contains two small web prototypes for working with messy trial balance (TB) data commonly encountered in accounting and audit workflows.

- **tb-mapping/**: Clean and normalize raw TB exports into a consistent schema
- **tb-compare/**: Compare two TB periods (e.g., year-over-year) and highlight differences

Each tool is a **standalone web app** built with React, Vite, and TypeScript.  
They are run **locally on your machine**, one at a time.

> Note: This project contains only synthetic/sample data. No client data or secrets are included.

---

## Project structure

trial-balance-tools/
├─ tb-mapping/ # Trial balance cleaning & normalization
├─ tb-compare/ # Trial balance comparison
├─ README.md

yaml
Copy code

---

## How to run locally (step by step)

### Prerequisites
- Install **Node.js** (includes npm): https://nodejs.org  
  After installation, confirm in a terminal:
node -v
npm -v

yaml
Copy code

---

### Step 1: Clone the repository

Open a terminal and run:

```bash
git clone https://github.com/drunkoctopuses/trial-balance-tools.git
cd trial-balance-tools
Step 2: Run the TB Mapping tool
bash
Copy code
cd tb-mapping
npm install
npm run dev
After running npm run dev, the terminal will print a local URL, usually:

arduino
Copy code
http://localhost:5173
Open that URL in your browser to use the TB Mapping tool.

Step 3: Run the TB Comparison tool
Stop the previous app (Ctrl + C), then:

bash
Copy code
cd ../tb-compare
npm install
npm run dev
Open the URL shown in the terminal (again, usually http://localhost:5173) to use the TB Comparison tool.

Notes
Each tool runs independently.

Only one tool should be running at a time unless you change the port.

AI-assisted features are experimental and optional; basic functionality runs without any API keys.

Author
Ting (CPA) — transitioning from regulated, rule-intensive systems into applied ML and systems work.

yaml
Copy code
