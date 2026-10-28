# Antigravity Customizations & Migration Guide

This document contains a complete inventory of all custom skills, plugins, MCP (Model Context Protocol) servers, and IDE settings configured on this computer, along with instructions and automated scripts for migrating them to another laptop.

---

## 1. Summary of Custom Items

| Category | Count | Primary Location |
| :--- | :--- | :--- |
| **Global Custom Plugins** | 3 | `C:\Users\User\.gemini\config\plugins\` (`ecc`, `rea`, `googlecloudtools.datacloud_telemetry`) |
| **Global Custom Skills** | 123 (standalone) + 299 (in ecc plugin) | `C:\Users\User\.gemini\config\skills\` & `plugins\ecc\skills\` |
| **Workspace ECC Agents** | 71 | `c:\Users\User\OneDrive - Agri Experience Limited\AgriLeave\.agents\agents\` |
| **Workspace ECC Rules & Workflows** | 219 (122 rules, 97 workflows) | `c:\Users\User\OneDrive - Agri Experience Limited\AgriLeave\.agents\` |
| **Configured MCP Servers** | 15 | `C:\Users\User\.gemini\config\mcp_config.json` |
| **Global Agent Config** | 1 | `C:\Users\User\.gemini\config\config.json` |
| **IDE User Settings** | 1 | `C:\Users\User\AppData\Roaming\Antigravity IDE\User\settings.json` |

---

## 2. Complete Skills Inventory (118 Total)

> **Note:** Antigravity includes only 3 built-in skills by default (`agy-customizations`, `antigravity_guide`, `permissioned-github`). All skills listed below represent your added environment skills.

### A. Frontend, Web Development & UI/UX Design System (75 Skills)

#### Master Design Systems & Meta Tools
* `awesome-design` — Master UI/UX design registry and multi-framework design specification system.
* `frontend-design` — Intentional aesthetic direction, typography, and component styling.
* `taste-skill` — Design curation, anti-slop frontend standards, and visual review loop.
* `emil-design-eng` — Micro-interactions, UI polish, transitions, and component feel.
* `impeccable` — Polish, simplify, audit, and elevate frontend interfaces across web and mobile.
* `agentic` — Conversational AI-first UI with delegated task flows and minimal controls.
* `animate` — Motion design from scratch, easing curves, interruptions, and layout transitions.
* `animation-performance` — Frame budget optimization, hardware acceleration, and composite-only properties.
* `review-animations` — Animation auditing and critique against UI motion standards.
* `improve-animations` — Prioritized codebase-wide motion audit and remediation roadmaps.

#### Visual Styles & Design Languages
| Style Skill | Aesthetic Description |
| :--- | :--- |
| `ant` | Enterprise-focused design system for dense data web applications |
| `artistic` | High-contrast, expressive style with creative typography |
| `basic` | Print-inspired editorial visual language with structured grids |
| `bento` | Modular grid cards with soft spacing and scannable visual hierarchy |
| `bold` | Heavyweight typography and commanding, high-contrast layouts |
| `brutalism` | Raw, functional minimalism and unadorned concrete-inspired architecture |
| `cafe` | Warm tones, cozy layouts, and soft typography |
| `claude` | Research-journal aesthetic on warm ivory paper with slate typography |
| `claymorphism` | Puffy, soft 3D rounded elements mimicking malleable clay |
| `clean` | Ample whitespace, high legibility, and uncluttered layouts |
| `codex` | Radically minimal, pure edge-to-edge dark canvas with black surfaces |
| `colorful` | High-energy, vibrant palettes and smooth modern gradients |
| `contemporary` | Bento grids, dark mode support, and accessible responsive layouts |
| `corporate` | Structured, trustworthy, brand-aligned enterprise patterns |
| `cosmic` | Futuristic sci-fi aesthetic with neon accents and spatial depth |
| `creative` | Playful, character-driven design with bold expressive graphics |
| `dithered` | Dot-pattern retro rendering simulating nostalgic halftone shades |
| `doodle` | Hand-drawn, sketch-like informal aesthetics and organic lines |
| `dramatic` | Theatrical high-contrast compositions commanding focus |
| `editorial` | Refined serif typography and magazine-inspired layouts |
| `enterprise` | Dark-themed productivity dashboards with glass panels |
| `expressive` | Vibrant personality, playful graphics, and dynamic balance |
| `fantasy` | Game-inspired rich visuals with deep thematic tones |
| `fiction` | Warm cream canvas with saturated color blocks and playful display type |
| `flat` | Modern 2D minimalist interface without 3D skeuomorphic effects |
| `friendly` | Approaching, pastel tones, and generously rounded corners |
| `futuristic` | Sleek innovation-driven tech typography and forward-looking UI |
| `geometric` | Clean mathematical precision, neutral tones, and structured forms |
| `glassmorphism` | Translucent frosted glass layers with soft blur and luminous borders |
| `gradient` | Smooth multidirectional color transitions and depth surfaces |
| `immersive` | Continuous canvas storytelling and interactive gamified flows |
| `levels` | High-conversion layout removing friction and prioritizing action |
| `lingo` | Tactile 3D borders, friendly illustrations, and vibrant accents |
| `material` | Material Design with responsive elevation surfaces and motion tokens |
| `matrix` | Cyber-slick, dark-only green terminal and digital rain aesthetic |
| `minimal` | Restrained palette, typography-focused, stripped-back presentation |
| `modern` | Polished contemporary editorial layout with serif accents |
| `mono` | Monospace-driven matrix density and hacker-chic utility |
| `neobrutalism` | Bold black borders, saturated accent colors, and offset shadows |
| `neon` | Glowing electric accents with high-contrast dark backdrops |
| `neumorphism` | Soft extruded inner and outer shadows creating tactile relief |
| `pacman` | 8-bit retro arcade pixel fonts and dotted borders |
| `paper` | Tactile paper textures, print typography, and warm off-white pages |
| `perspective` | Isometric layouts, vanishing points, and 3D spatial depth |
| `power` | High-end dark luxury aesthetic for premium brands |
| `premium` | Refined Apple-inspired precision, crisp typography, and subtle blur |
| `professional` | Trustworthy, polished enterprise structure for B2B tools |
| `pulse` | Geometric motion, thick borders, and high vitality |
| `refined` | Modern minimal layout with understated elegance |
| `retro` | Vintage typography, nostalgic palettes, and throwback elements |
| `riso` | Two-color risograph printing aesthetic on warm off-white paper |
| `roku` | Purple-accented developer dashboard with top-bar navigation |
| `sega` | 90s console arcade look with pixel fonts and chunky buttons |
| `shadcn` | Clean monochrome utility-first design inspired by shadcn/ui |
| `sketch` | Pencil illustration style on cream paper with soft teal accents |
| `skeumorphism` | Physical realism, textured materials, and tactile digital surfaces |
| `sleek` | Intentional spacing, subtle micro-interactions, and modern clean lines |
| `spacious` | Generous breathing room, wide margins, and relaxed grid flow |
| `square` | Delicate, graceful aesthetic with refined minimal structure |
| `stitch` | High-contrast data workflows and structured drag-and-drop panels |
| `storytelling` | Narrative-driven pacing and visual discovery flows |
| `terracotta` | Earthy sun-baked clay tones and display serifs on cream backgrounds |
| `tetris` | High-energy compact block arrangements and bright accents |
| `vibrant` | Lively color pairings, dynamic energy, and bold headings |
| `vintage` | 1950s–1990s retro nostalgia with textured grain and period fonts |

---

### B. Google Cloud Platform, Data Engineering & Analytics (36 Skills)

#### BigQuery & Ingestion
* `bigquery-sql` — High-efficiency SQL query optimization, partitioning, and cost tuning.
* `bigquery-ai-ml` — In-database ML, time-series forecasting, anomaly detection, and GenAI.
* `bigquery-bigframes` — BigQuery DataFrames (BigFrames) for Python data manipulation at scale.
* `bigquery-data-transfer-service` — DTS ingestion pipeline discovery and configuration.
* `bigquery-graph-author` — Graph DDL, schema relationships, and property graph authoring.
* `bigquery-graph-query` — Graph Query Language (GQL), pattern matching, and graph traversal.
* `dbt-bigquery` — Building, optimizing, and organizing dbt models and projects on BigQuery.
* `dataform-bigquery` — Dataform SQLX pipeline development and repository configuration.
* `data-autocleaning` — Automated data quality rules and transformations for BigQuery/GCS.
* `discovering-gcp-data-assets` — Fast discovery and inspection of GCP datasets, tables, and views.

#### Cloud Storage & Databases
* `google-cloud-storage-basics` — GCS bucket operations, transfers, lifecycle rules, and security.
* `google-cloud-storage-bucket-architect` — Secure-by-default architecture design for new storage buckets.
* `google-cloud-storage-fuse` — Mounting Cloud Storage buckets as POSIX file systems (gcsfuse).
* `bigtable-basics` — Row key design, column families, and Bigtable querying/provisioning.
* `federate-lakehouse-catalog` — Connecting GCP engines to Databricks Unity and AWS Glue Iceberg catalogs.

#### Orchestration, Airflow & Spark
* `gcp-data-pipelines` — Primary routing and architectural design for GCP data pipelines.
* `gcp-dataflow` — Apache Beam pipeline creation, debugging, and Flex Template packaging.
* `gcp-pipeline-orchestration` — Authoring and triggering orchestration workflows in Cloud Composer.
* `gcp-pipeline-resource-provisioning` — Declarative resource provisioning via `deployment.yaml`.
* `gcp-managed-airflow-dag-authoring` — Authoring validated Airflow DAGs for Managed Airflow / Composer.
* `gcp-managed-airflow-migrations` — Migrating DAGs across Airflow versions (Airflow 2/3).
* `gcp-managed-airflow-recommendations` — Health checks, scaling parameters, and environment tuning.
* `gcp-composer-troubleshooting` — Root cause analysis (RCA) and remediation for failed DAG runs.
* `gcp-spark` — PySpark development, interactive sessions, and Dataproc Serverless batch jobs.
* `gcp-spark-troubleshooting` — Spark log analysis, memory tuning, and OOM diagnosis.
* `gcp-managed-spark-upgrades` — Upgrading Spark/Dataproc image versions safely.

#### Governance, Security & Best Practices
* `accidental-data-loss-prevention` — Guardrail verifying destructive operations (drop, truncate, rm).
* `enforcing-resource-attribution` — Mandatory resource labeling and attribution for CLI operations.
* `gcs-security-assessment` — Security audits, public access prevention, and IAM validation for buckets.
* `google-cloud-auth-verification` — Pre-flight authentication verification for gcloud, ADC, and SDKs.
* `security-guidance` — Comprehensive security auditing for code and configuration vulnerabilities.
* `ml-best-practices` — Structured ML workflow execution, validation, and model comparison.
* `notebook-guidance` — Best practices for Jupyter notebooks with BigQuery and Python magics.
* `managing-python-dependencies` — Virtual environment handling and clean dependency management.
* `building-data-apps` — Rapid generation of React/Vite or Streamlit data applications.
* `schema-mapping` — Multi-table source-to-target mapping manifest preparation before ETL/ELT.

---

### C. Skill & Agent Development (4 Skills)
* `skill-creator` — Authoring, testing, and benchmarking custom agent skills.
* `skill-repair` — Diagnosing and repairing corrupted or failed skill installations.
* `agent-skills` — Comprehensive lifecycle management and evals for custom agent skills.
* `claude-code-setup` — Analyzing codebases and configuring agent automations.

---

### D. Reverse Engineering & Binary Analysis (5 Skills)
* `reverse-engineer-anything` — Inspect native binaries, Electron/JavaScript applications, Android APKs, firmware, and web apps with local evidence-backed analysis.
* `rea-analysis-optimization` — Performance and accuracy optimization for reverse engineering runs and decompilation passes.
* `rea-ci-tests-audit` — Auditing reverse engineering pipelines and CI test suites against target artifacts.
* `rea-tool-design` — Architecture and schema standards for reverse engineering tools.
* `rea-changelog-update` — Change tracking and version reconciliation across analyzed target builds.

---

### E. Agent Routing, Knowledge Graphs & Minimalist Engineering (3 Skills)
* `ponytail` — Lazy senior developer mode enforcing the "ladder of laziness", the smallest complete change, YAGNI, and lean diffs without over-engineering.
* `omniroute` — Multi-provider AI gateway, intelligent combo routing (`auto`, `auto/coding`, `auto/fast`), quota failover, RTK/Caveman token compression, and MCP/A2A orchestration.
* `graphify` — Deterministic AST code parsing, multi-format ingestion, and local knowledge graph generation with interactive HTML visualization and community clustering.

---

## 3. Custom Plugins (3 Total)

Located at `C:\Users\User\.gemini\config\plugins\`:
1. **`ecc`** — **Everything Claude Code / ECC Agent Harness Framework** (Global Plugin):
   * Manifest: `C:\Users\User\.gemini\config\plugins\ecc\plugin.json`
   * **71 Specialized Subagents** (`plugins\ecc\agents\`) adapted with native Antigravity IDE tools and models (`planner`, `architect`, `code-reviewer`, `security-reviewer`, `tdd-guide`, `e2e-runner`, `build-error-resolver`, etc.).
   * **122 Project Rules** (`plugins\ecc\rules\`) loaded when the plugin is active.
   * **97 Automation Workflows** (`plugins\ecc\workflows\`).
   * **299 Capability Skills** (`plugins\ecc\skills\`).
   * Registered and enabled globally in `C:\Users\User\.gemini\config\config.json`.
2. **`rea`** — **Reverse Engineer Anything (REA)** (Global Plugin):
   * Manifest: `C:\Users\User\.gemini\config\plugins\rea\plugin.json`
   * Comprehensive reverse engineering skill suite for inspecting native binaries, Electron/JavaScript applications, Android APKs, firmware, and websites.
   * Bundled Skills: `reverse-engineer-anything`, `rea-analysis-optimization`, `rea-ci-tests-audit`, `rea-tool-design`, `rea-changelog-update`.
   * Registered and enabled globally in `C:\Users\User\.gemini\config\config.json`.
3. **`googlecloudtools.datacloud_telemetry`** — Integrated GCP Data Cloud telemetry and analytics provider.

---

## 4. MCP Servers Configuration (15 Total)

Defined in `C:\Users\User\.gemini\config\mcp_config.json`:

### Local / Developer Tools
1. **`rea`**
   * Command: `cmd.exe /c npx -y rea-agents@latest mcp`
   * Function: Reverse engineer anything across binaries, applications, and runtime behavior (229 MCP tools for disassembling, memory analysis, Frida instrumentation, ADB device interaction, Electron/V8 inspection, and web execution tracing).
2. **`playwright`**
   * Command: `cmd.exe /c npx -y @playwright/mcp@latest --headless`
   * Function: Browser automation, headless testing, web scraping, and UI verification.
3. **`figma`**
   * Command: `cmd.exe /c npx -y figma-developer-mcp --stdio`
   * Environment Variable: `FIGMA_API_KEY` configured.
4. **`notebooks`**
   * Command: `node` running Datacloud proxy bundle (`notebooks-antigravityide`).
5. **`visualization`**
   * Command: `node` running Datacloud proxy bundle (`visualization-antigravityide`).
6. **`data-agent-kit`**
   * Command: `node` running Datacloud proxy bundle (`dataAgentKit-antigravityide`).

### Google Cloud Remote MCP Endpoints
All configured with `authProviderType: "google_credentials"`:
* `datacloud_bigquery_remote` (`https://bigquery.googleapis.com/mcp`)
* `datacloud_dataproc_remote` (`https://dataproc-africa-south1.googleapis.com/mcp`)
* `datacloud_gcs_remote` (`https://storage.googleapis.com/storage/mcp`)
* `datacloud_cloud-sql_remote` (`https://sqladmin.googleapis.com/mcp`)
* `datacloud_spanner_remote` (`https://spanner.googleapis.com/mcp`)
* `datacloud_alloydb_remote` (`https://alloydb.googleapis.com/mcp`)
* `datacloud_bigtable-admin_remote` (`https://bigtableadmin.googleapis.com/mcp`)
* `datacloud_bigtable-data_remote` (`https://bigtable.googleapis.com/mcp`)
* `datacloud_knowledge_catalog_remote` (`https://dataplex.googleapis.com/mcp`)

---

## 5. Workspace ECC Agent Framework (`.agents/`)

Installed directly from GitHub repository [`affaan-m/ECC`](https://github.com/affaan-m/ECC) adapted specifically for Antigravity IDE:
* **Root Location**: `c:\Users\User\OneDrive - Agri Experience Limited\AgriLeave\.agents\`
* **Installed Components**:
  * **71 Specialized Subagents** (`.agents/agents/`):
    * `planner.md` — Strategic architecture, feature breakdown, and planning.
    * `architect.md` / `code-architect.md` — System architecture and structural design decisions.
    * `code-reviewer.md` — Rigorous code quality and confidence-based linting/logic review.
    * `security-reviewer.md` — Vulnerability detection (OWASP, injection, SSRF, secret leaks).
    * `tdd-guide.md` — Test-driven development workflows and test scaffolding.
    * `e2e-runner.md` — End-to-end integration and user journey testing.
    * `build-error-resolver.md` — Diagnostic and automated resolution for build/compilation errors.
    * `performance-optimizer.md` — Runtime, network, and render bottleneck resolution.
    * `refactor-cleaner.md` / `code-simplifier.md` — Code hygiene, dead code removal, and simplification.
    * `doc-updater.md` — Automated synchronization of documentation with code changes.
  * **122 Project Rules** (`.agents/rules/`): Best practices for code health, defensive security, API design, commit conventions, and architecture.
  * **97 Workflows** (`.agents/workflows/`): Reusable agent task automation workflows.
  * **452 Specialized Skills** (`.agents/skills/`): Modular capability suites covering verification loops, story lifecycles, click path audits, and refactoring gates.

---

## 6. IDE User Settings & Configuration

### A. Antigravity IDE Settings (`settings.json`)
Location: `C:\Users\User\AppData\Roaming\Antigravity IDE\User\settings.json`
```json
{
  "google.cloud.project": "gen-lang-client-0633797359",
  "google.cloud.region": "africa-south1",
  "jupyter.jupyterLaunchTimeout": 300000,
  "google.datacloud.executeCellToolForNotebookMCP": true,
  "git.autofetch": true,
  "git.confirmSync": false,
  "python.languageServer": "Default"
}
```

### B. Global Agent Config (`config.json`)
Location: `C:\Users\User\.gemini\config\config.json`
```json
{
  "plugins": {
    "googlecloudtools.datacloud_telemetry": {
      "enabled": true
    }
  },
  "userSettings": {
    "remoteControlHostname": "desktop-1kof34o-polar-dust"
  }
}
```

---

## 7. Migration Guide (Transfer to New Laptop)

Follow these steps to migrate your entire customization ecosystem to your new machine:

### Step 1: Create Backup on This Laptop
Open PowerShell and run:
```powershell
# 1. Create a temporary staging directory
$backupDir = "$env:USERPROFILE\Desktop\Antigravity_Migration"
New-Item -ItemType Directory -Path "$backupDir\config" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\ide_settings" -Force | Out-Null

# 2. Copy global config (skills, plugins, MCP configs)
Copy-Item -Path "$env:USERPROFILE\.gemini\config\*" -Destination "$backupDir\config" -Recurse -Force

# 3. Copy IDE user settings
if (Test-Path "$env:APPDATA\Antigravity IDE\User\settings.json") {
    Copy-Item -Path "$env:APPDATA\Antigravity IDE\User\settings.json" -Destination "$backupDir\ide_settings\settings.json" -Force
}

# 4. Zip the migration folder to your Desktop
Compress-Archive -Path "$backupDir\*" -DestinationPath "$env:USERPROFILE\Desktop\Antigravity_Customizations_Backup.zip" -Force

# 5. Clean up temporary staging folder
Remove-Item -Path $backupDir -Recurse -Force

Write-Host "Backup complete! File saved at: $env:USERPROFILE\Desktop\Antigravity_Customizations_Backup.zip" -ForegroundColor Green
```

Copy `Antigravity_Customizations_Backup.zip` via flash drive, Google Drive, or OneDrive to your new laptop.

---

### Step 2: Restore on Your New Laptop
On your new laptop:
1. Install Antigravity and launch it once to initialize directories, then close it.
2. Unzip your `Antigravity_Customizations_Backup.zip`.
3. Open PowerShell on the new laptop and run:
```powershell
$extractedFolder = "C:\Path\To\Extracted_Backup" # Update this path

# Ensure target directories exist
New-Item -ItemType Directory -Path "$env:USERPROFILE\.gemini\config" -Force | Out-Null
New-Item -ItemType Directory -Path "$env:APPDATA\Antigravity IDE\User" -Force | Out-Null

# Copy global configs (skills, plugins, mcp_config.json, config.json)
Copy-Item -Path "$extractedFolder\config\*" -Destination "$env:USERPROFILE\.gemini\config" -Recurse -Force

# Copy IDE user settings
if (Test-Path "$extractedFolder\ide_settings\settings.json") {
    Copy-Item -Path "$extractedFolder\ide_settings\settings.json" -Destination "$env:APPDATA\Antigravity IDE\User\settings.json" -Force
}

Write-Host "Restoration complete! Restart Antigravity to load all customizations." -ForegroundColor Green
```

---

### Step 3: Important Post-Migration Checklist

1. **Windows Username Differences**:
   If your Windows username on the new laptop is different from `User` (e.g., `C:\Users\JohnDoe\`), open:
   `%USERPROFILE%\.gemini\config\mcp_config.json`
   Replace any hardcoded occurrences of `c:\\Users\\User\\` with your new path `c:\\Users\\JohnDoe\\` for the `notebooks`, `visualization`, and `data-agent-kit` tools.

2. **Google Cloud Authentication**:
   Log in to Google Cloud on the new machine:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Node.js & npx**:
   Make sure Node.js (which provides `npx`) is installed so MCP servers like `playwright` and `figma` run smoothly.
