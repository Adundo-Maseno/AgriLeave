# Graph Report - AgriLeave  (2026-11-04)

## Corpus Check
- 15 files · ~120,083 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 281 nodes · 295 edges · 37 communities (15 shown, 22 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- HR Governance & Availability Wallchart
- AI Assistant & Conversational Guidance
- System Administration & Statutory Policy Engine
- AI Assistant & Conversational Guidance
- System Administration & Statutory Policy Engine
- HR Governance & Availability Wallchart
- HR Governance & Availability Wallchart
- System Administration & Statutory Policy Engine
- HR Governance & Availability Wallchart
- Subsystem 9: Antigravity Customizations & M
- System Administration & Statutory Policy Engine
- Supervisor Workflow & Team Approvals
- Subsystem 12: apiAdjustCompensationLeave
- Subsystem 13: apiFixAllStaffLeaveData()
- Leave Entitlement & Accrual Engine
- AI Assistant & Conversational Guidance
- AI Assistant & Conversational Guidance
- Subsystem 17: apiExportSystemData()
- Leave Entitlement & Accrual Engine
- Subsystem 19: apiGetCurrentUser
- Subsystem 22: AgriLeave Comprehensive System
- Subsystem 23: Action Confirm Modal (#actionC
- Subsystem 24: Add Staff Modal (#addStaffModa
- Subsystem 25: Amend Leave Dates Modal (#amen
- AI Assistant & Conversational Guidance
- Subsystem 27: Archived Applications Modal (#
- Subsystem 28: Edit Staff Modal (#editStaffMo
- HR Governance & Availability Wallchart
- System Administration & Statutory Policy Engine
- Subsystem 31: System Diagnostics Modal (#sys
- Subsystem 32: Vacation Responder Modal (#vac
- Subsystem 33: AgriLeave Enterprise System Ov
- AI Assistant & Conversational Guidance
- Subsystem 35: Google Workspace Integrations 
- Subsystem 36: Role-Based Access Control Spec

## God Nodes (most connected - your core abstractions)
1. `navigateToPage Navigation Controller` - 13 edges
2. `AppState Global State Object` - 12 edges
3. `System Architecture & GAS Engine` - 8 edges
4. `System Administration View (#systemAdminPage)` - 7 edges
5. `AgriLeave Performance Audit & Optimization Blueprint` - 7 edges
6. `Apply for Leave Portal View` - 7 edges
7. `ApplicationsManager` - 6 edges
8. `AdminManager` - 6 edges
9. `Team Applications View (#teamApplicationsPage)` - 6 edges
10. `Staff Management View (#staffManagementPage)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Year-End Processing & Easter Carryover Engine Spec` --references--> `AdminManager`  [EXTRACTED]
  docs/AgriLeave_User_and_Admin_Guide.md → Code.js
- `Floating AI Assistant & Role Grounding Guide` --references--> `AIAssistantManager`  [EXTRACTED]
  docs/AgriLeave_User_and_Admin_Guide.md → Code.js
- `Statutory Leave Policies & Entitlements` --semantically_similar_to--> `Leave Policies & Statutory Entitlements Spec`  [INFERRED] [semantically similar]
  README.md → docs/AgriLeave_User_and_Admin_Guide.md
- `Year-End Processing & Dynamic Easter Expiry` --semantically_similar_to--> `Year-End Processing & Easter Carryover Engine Spec`  [INFERRED] [semantically similar]
  README.md → docs/AgriLeave_User_and_Admin_Guide.md
- `Operational Blackout Periods Management Spec` --references--> `BlackoutPeriodManager`  [EXTRACTED]
  docs/AgriLeave_User_and_Admin_Guide.md → Code.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dual-Store Real-Time Persistence Pipeline** — code_datamanager, code_sheetsdualstoremanager, drive_leave_applications_json, drive_staff_data_json, sheets_master_mirror [EXTRACTED 1.00]
- **4-Tier Statutory Leave Deduction Priority Waterfall** — guide_deduction_priority, code_applicationsmanager, drive_compensation_claims_json, drive_staff_data_json [EXTRACTED 1.00]
- **Year-End Carryover & Dynamic Easter Expiry Lifecycle Engine** — readme_year_end_lifecycle, guide_easter_carryover_engine, code_adminmanager, code_accrualmanager, drive_annual_reset_logs_json [EXTRACTED 1.00]
- **Floating RAG AI Assistant with Gemini Multi-Model Failover Chain** — index_ai_assistant_widget, code_aiassistantmanager, drive_rag_knowledge_base_json, readme_ai_assistant_spec, guide_ai_assistant_guide [EXTRACTED 1.00]
- **Multi-Tier Approval Routing Flow (Supervisor Tier-1 & HR Tier-2)** — index_view_team_applications, index_view_hr_dashboard, code_api_process_application_decision, code_applicationsmanager, code_notificationmanager [EXTRACTED 1.00]
- **Client-Side SWR and Optimistic State Navigation Architecture** — index_client_cache, index_app_state, index_navigation_controller, audit_finding_client_swr_absence [INFERRED 0.85]
- **End-to-End Leave Application and Multi-Tier Approval Workflow** — docs_screenshots_02_apply_leave_portal, docs_screenshots_05_team_approvals_view, docs_screenshots_06_hr_dashboard_endorsement_queue, docs_screenshots_04_my_applications_view [EXTRACTED 0.95]
- **Executive Availability and Liability Governance Workflow** — docs_screenshots_01_dashboard_main_view, docs_screenshots_05_team_approvals_clash_detection, docs_screenshots_06_hr_dashboard_wallchart, docs_screenshots_06_hr_dashboard_liability_pool [INFERRED 0.90]
- **Statutory Entitlement and Year-End Rollover Governance Workflow** — docs_screenshots_03_leave_balance_carryover_easter, docs_screenshots_07_system_admin_year_end_engine, docs_screenshots_07_system_admin_recalibration, docs_screenshots_01_dashboard_holidays_widget [INFERRED 0.90]
- **AI-Assisted Self-Service Interaction Workflow** — docs_screenshots_08_ai_assistant_widget, docs_screenshots_08_ai_assistant_action_chips, docs_screenshots_02_apply_leave_portal, docs_screenshots_03_leave_balance_breakdown_view [EXTRACTED 0.95]

## Communities (37 total, 22 thin omitted)

### Community 0 - "HR Governance & Availability Wallchart"
Cohesion: 0.02
Nodes (16): AbsenceDigestManager, ArchiveManager, AttachmentManager, CalendarSyncManager, CompensationManager, ConfigManager, DashboardManager, DiagnosticsManager (+8 more)

### Community 1 - "AI Assistant & Conversational Guidance"
Cohesion: 0.10
Nodes (28): apiBatchProcessDecisions, apiCancelApplication, apiCreateStaff, apiDeleteStaff, apiGetAllStaff, apiGetDashboardData, apiGetMyApplications, apiGetTeamApplications (+20 more)

### Community 2 - "System Administration & Statutory Policy Engine"
Cohesion: 0.11
Nodes (23): Leave Balance Executive Cards, Kenya Gazetted Public Holidays Widget, AgriLeave Main Dashboard View, Dashboard Quick Actions Hub, Recent Applications Activity Table, Medical Certificate & Attachment Uploader, Business Day Net Duration Calculator, Handover Colleague & Task Assignment (+15 more)

### Community 3 - "AI Assistant & Conversational Guidance"
Cohesion: 0.11
Nodes (17): Solution 2: Two-Tier Data File Caching (Memory + Distributed), AccrualManager, AIAssistantManager, apiAskLeaveAssistant, apiGetBootstrapData, apiSubmitLeaveApplication, apiSyncSheetsDatabase, ApplicationsManager (+9 more)

### Community 4 - "System Administration & Statutory Policy Engine"
Cohesion: 0.15
Nodes (10): AdminManager, apiGetSystemDiagnostics, apiProcessYearEnd, apiRecalibrateOverlappingLeaves, HolidayManager, Year-End Processing & Easter Carryover Engine Spec, Kenya Gazetted Public Holidays Management Spec, System Administration & Maintenance Portal Guide (+2 more)

### Community 5 - "HR Governance & Availability Wallchart"
Cohesion: 0.17
Nodes (12): Audit Finding D: Heavyweight RPC in Initial Bootstrap, Audit Finding B: CacheService 95KB Cliff & Missing Chunking, Audit Finding E: Cascading Post-Action RPC Waterfalls, Audit Finding F: Redundant RPC Calls & Missing Client SWR, Audit Finding A: doGet Cache Invalidation Nuclear Strike, Audit Finding C: Synchronous Google Sheets Mirroring Latency, Audit Finding G: Tailwind CDN Runtime Compilation & DOM Thrashing, AgriLeave Performance Audit & Optimization Blueprint (+4 more)

### Community 6 - "HR Governance & Availability Wallchart"
Cohesion: 0.22
Nodes (10): Supervisor Pending Alert Banner, 1-Click Decision & Batch Approvals, Department Leave Clash Detector, Handover Coverage Endorsement Status, Supervisor Team Approvals Center View, Audit & Payroll Reconciliation CSV Export, Tier-2 HR Endorsement Queue, Unconsumed Leave Financial Liability Pool (+2 more)

### Community 7 - "System Administration & Statutory Policy Engine"
Cohesion: 0.29
Nodes (6): apiDeleteBlackoutPeriod, apiGetBlackoutPeriods, apiSaveBlackoutPeriod, BlackoutPeriodManager, Operational Blackout Periods Management Spec, Blackout Period Modal (#blackoutPeriodModal)

### Community 8 - "HR Governance & Availability Wallchart"
Cohesion: 0.29
Nodes (7): apiGetHRDashboard, apiGetLeaveLiabilityReport, FinancialProvisionManager, Unconsumed Leave Liability Pool & Financial Provisioning, HR Governance Portal & Availability Wallchart Guide, Staff Availability Wallchart UI Component, HR Dashboard View (#hrDashboardPage)

### Community 9 - "Subsystem 9: Antigravity Customizations & M"
Cohesion: 0.33
Nodes (6): Antigravity Customizations & Migration Guide, ECC Agent Harness Framework Plugin (71 Agents, 122 Rules), Graphify Deterministic Knowledge Graph Skill, Configured MCP Servers Infrastructure (15 Servers), OmniRoute Intelligent Gateway & Model Routing Skill, Reverse Engineer Anything (REA) Plugin

### Community 10 - "System Administration & Statutory Policy Engine"
Cohesion: 0.50
Nodes (4): apiAddGazettedHoliday, apiDeleteGazettedHoliday, apiGetGazettedHolidays, Gazetted Holiday Modal (#gazettedHolidayModal)

### Community 11 - "Supervisor Workflow & Team Approvals"
Cohesion: 0.50
Nodes (4): apiGetMyHandoverRequests, apiRespondToHandover, apiToggleHandoverTask, Handover Requests Modal (#handoverRequestsModal)

### Community 12 - "Subsystem 12: apiAdjustCompensationLeave"
Cohesion: 0.67
Nodes (3): apiAdjustCompensationLeave, apiAwardCompensationLeave, Compensation Modal (#compensationModal)

### Community 13 - "Subsystem 13: apiFixAllStaffLeaveData()"
Cohesion: 0.67
Nodes (3): apiFixAllStaffLeaveData(), apiFixStaffLeaveData(), fixStaffLeaveData()

### Community 14 - "Leave Entitlement & Accrual Engine"
Cohesion: 0.67
Nodes (3): 4-Tier Leave Deduction Priority Waterfall Spec, Leave Policies & Statutory Entitlements Spec, Statutory Leave Policies & Entitlements

## Knowledge Gaps
- **79 isolated node(s):** `callGoogleScriptFunction RPC Invoker`, `Staff Availability Wallchart UI Component`, `Application Details Modal (#applicationDetailsModal)`, `Action Confirm Modal (#actionConfirmModal)`, `Add Staff Modal (#addStaffModal)` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `navigateToPage Navigation Controller` connect `AI Assistant & Conversational Guidance` to `HR Governance & Availability Wallchart`, `System Administration & Statutory Policy Engine`, `HR Governance & Availability Wallchart`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `callGoogleScriptFunction RPC Invoker`, `Staff Availability Wallchart UI Component`, `Application Details Modal (#applicationDetailsModal)` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `HR Governance & Availability Wallchart` be split into smaller, more focused modules?**
  _Cohesion score 0.01818181818181818 - nodes in this community are weakly interconnected._
- **Why does `System Administration View (#systemAdminPage)` connect `System Administration & Statutory Policy Engine` to `AI Assistant & Conversational Guidance`, `AI Assistant & Conversational Guidance`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `AI Assistant & Conversational Guidance` be split into smaller, more focused modules?**
  _Cohesion score 0.10052910052910052 - nodes in this community are weakly interconnected._
- **Why does `Dashboard View (#dashboardPage)` connect `AI Assistant & Conversational Guidance` to `AI Assistant & Conversational Guidance`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `System Administration & Statutory Policy Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.11067193675889328 - nodes in this community are weakly interconnected._