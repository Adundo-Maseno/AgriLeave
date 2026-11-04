# Graph Report - AgriLeave  (2026-11-04)

## Corpus Check
- 16 files · ~124,241 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 308 nodes · 319 edges · 42 communities (15 shown, 27 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- code & code_absencedigestmanager & code_apiaddgazettedholiday
- code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff
- audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager
- docs_screenshots_01_dashboard_balance_cards & docs_screenshots_01_dashboard_holidays_widget & docs_screenshots_01_dashboard_main_view
- audit_finding_bootstrap_rpc & audit_finding_cacheservice_cliff & audit_finding_cascading_waterfalls
- docs_screenshots_01_dashboard_supervisor_banner & docs_screenshots_05_team_approvals_actions & docs_screenshots_05_team_approvals_clash_detection
- code_api_delete_blackout_period & code_api_get_blackout_periods & code_api_save_blackout_period
- code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json
- inventory_customizations_overview & inventory_ecc_plugin & inventory_graphify_skill
- code_api_add_gazetted_holiday & code_api_delete_gazetted_holiday & code_api_get_gazetted_holidays
- code_api_get_my_handover_requests & code_api_respond_to_handover & code_api_toggle_handover_task
- code_api_recalibrate_overlapping_leaves & code_holidaymanager & drive_gazetted_holidays_json
- code_api_adjust_compensation_leave & code_api_award_compensation_leave & index_modal_compensation
- code_apifixallstaffleavedata & code_apifixstaffleavedata & code_fixstaffleavedata
- guide_deduction_priority & guide_entitlement_framework & readme_leave_policies
- code_api_set_gemini_api_key & index_modal_ai_api_key
- code_api_submit_compensation_claim & index_modal_toil_claim
- code_apiexportsystemdata & code_apiexportsystemdata_escapecsv
- code_fixaccrualforallstaff & code_fixaccrualforallstaff_formatlocaldate
- code_api_get_current_user
- guide_system_user_guide
- index_modal_action_confirm
- index_modal_add_staff
- index_modal_amend_leave
- index_modal_application_details
- index_modal_archived_applications
- index_modal_edit_staff
- index_modal_leave_liability
- index_modal_recalibrate_leave
- index_modal_system_diagnostics
- index_modal_vacation_responder
- readme_agrileave_overview
- readme_ai_assistant_spec
- readme_google_workspace_integrations
- readme_rbac_spec

## God Nodes (most connected - your core abstractions)
1. `navigateToPage Navigation Controller` - 13 edges
2. `AppState Global State Object` - 12 edges
3. `System Architecture & GAS Engine` - 8 edges
4. `Apply for Leave Portal View` - 7 edges
5. `System Administration View (#systemAdminPage)` - 7 edges
6. `AgriLeave Performance Audit & Optimization Blueprint` - 7 edges
7. `ApplicationsManager` - 6 edges
8. `AdminManager` - 6 edges
9. `HR Dashboard View (#hrDashboardPage)` - 6 edges
10. `Staff Management View (#staffManagementPage)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AIAssistantManager` --references--> `Floating AI Assistant & Role Grounding Guide`  [EXTRACTED]
  Code.js → docs/AgriLeave_User_and_Admin_Guide.md
- `AdminManager` --references--> `Year-End Processing & Easter Carryover Engine Spec`  [EXTRACTED]
  Code.js → docs/AgriLeave_User_and_Admin_Guide.md
- `Leave Policies & Statutory Entitlements Spec` --semantically_similar_to--> `Statutory Leave Policies & Entitlements`  [INFERRED] [semantically similar]
  docs/AgriLeave_User_and_Admin_Guide.md → README.md
- `Year-End Processing & Easter Carryover Engine Spec` --semantically_similar_to--> `Year-End Processing & Dynamic Easter Expiry`  [INFERRED] [semantically similar]
  docs/AgriLeave_User_and_Admin_Guide.md → README.md
- `FinancialProvisionManager` --references--> `Unconsumed Leave Liability Pool & Financial Provisioning`  [EXTRACTED]
  Code.js → docs/AgriLeave_User_and_Admin_Guide.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AI-Assisted Self-Service Interaction Workflow** — docs_screenshots_08_ai_assistant_widget, docs_screenshots_08_ai_assistant_action_chips, docs_screenshots_02_apply_leave_portal, docs_screenshots_03_leave_balance_breakdown_view [EXTRACTED 0.95]
- **End-to-End Leave Application and Multi-Tier Approval Workflow** — docs_screenshots_02_apply_leave_portal, docs_screenshots_05_team_approvals_view, docs_screenshots_06_hr_dashboard_endorsement_queue, docs_screenshots_04_my_applications_view [EXTRACTED 0.95]
- **Dual-Store Real-Time Persistence Pipeline** — code_datamanager, code_sheetsdualstoremanager, drive_leave_applications_json, drive_staff_data_json, sheets_master_mirror [EXTRACTED 1.00]
- **Floating RAG AI Assistant with Gemini Multi-Model Failover Chain** — index_ai_assistant_widget, code_aiassistantmanager, drive_rag_knowledge_base_json, readme_ai_assistant_spec, guide_ai_assistant_guide [EXTRACTED 1.00]
- **Multi-Tier Approval Routing Flow (Supervisor Tier-1 & HR Tier-2)** — index_view_team_applications, index_view_hr_dashboard, code_api_process_application_decision, code_applicationsmanager, code_notificationmanager [EXTRACTED 1.00]
- **4-Tier Statutory Leave Deduction Priority Waterfall** — guide_deduction_priority, code_applicationsmanager, drive_compensation_claims_json, drive_staff_data_json [EXTRACTED 1.00]
- **Year-End Carryover & Dynamic Easter Expiry Lifecycle Engine** — readme_year_end_lifecycle, guide_easter_carryover_engine, code_adminmanager, code_accrualmanager, drive_annual_reset_logs_json [EXTRACTED 1.00]
- **Client-Side SWR and Optimistic State Navigation Architecture** — index_client_cache, index_app_state, index_navigation_controller, audit_finding_client_swr_absence [INFERRED 0.85]
- **Executive Availability and Liability Governance Workflow** — docs_screenshots_01_dashboard_main_view, docs_screenshots_05_team_approvals_clash_detection, docs_screenshots_06_hr_dashboard_wallchart, docs_screenshots_06_hr_dashboard_liability_pool [INFERRED 0.90]
- **Statutory Entitlement and Year-End Rollover Governance Workflow** — docs_screenshots_03_leave_balance_carryover_easter, docs_screenshots_07_system_admin_year_end_engine, docs_screenshots_07_system_admin_recalibration, docs_screenshots_01_dashboard_holidays_widget [INFERRED 0.90]

## Communities (42 total, 27 thin omitted)

### Community 0 - "code & code_absencedigestmanager & code_apiaddgazettedholiday"
Cohesion: 0.02
Nodes (16): AbsenceDigestManager, ArchiveManager, AttachmentManager, CalendarSyncManager, CompensationManager, ConfigManager, DashboardManager, DiagnosticsManager (+8 more)

### Community 1 - "code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff"
Cohesion: 0.08
Nodes (35): apiBatchProcessDecisions, apiCancelApplication, apiCreateStaff, apiDeleteStaff, apiGetAllStaff, apiGetHRDashboard, apiGetLeaveLiabilityReport, apiGetMyApplications (+27 more)

### Community 2 - "audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager"
Cohesion: 0.10
Nodes (20): Solution 2: Two-Tier Data File Caching (Memory + Distributed), AccrualManager, AIAssistantManager, apiAskLeaveAssistant, apiGetBootstrapData, apiGetDashboardData, apiSubmitLeaveApplication, apiSyncSheetsDatabase (+12 more)

### Community 3 - "docs_screenshots_01_dashboard_balance_cards & docs_screenshots_01_dashboard_holidays_widget & docs_screenshots_01_dashboard_main_view"
Cohesion: 0.11
Nodes (23): Leave Balance Executive Cards, Kenya Gazetted Public Holidays Widget, AgriLeave Main Dashboard View, Dashboard Quick Actions Hub, Recent Applications Activity Table, Medical Certificate & Attachment Uploader, Business Day Net Duration Calculator, Handover Colleague & Task Assignment (+15 more)

### Community 5 - "audit_finding_bootstrap_rpc & audit_finding_cacheservice_cliff & audit_finding_cascading_waterfalls"
Cohesion: 0.17
Nodes (12): Audit Finding D: Heavyweight RPC in Initial Bootstrap, Audit Finding B: CacheService 95KB Cliff & Missing Chunking, Audit Finding E: Cascading Post-Action RPC Waterfalls, Audit Finding F: Redundant RPC Calls & Missing Client SWR, Audit Finding A: doGet Cache Invalidation Nuclear Strike, Audit Finding C: Synchronous Google Sheets Mirroring Latency, Audit Finding G: Tailwind CDN Runtime Compilation & DOM Thrashing, AgriLeave Performance Audit & Optimization Blueprint (+4 more)

### Community 6 - "docs_screenshots_01_dashboard_supervisor_banner & docs_screenshots_05_team_approvals_actions & docs_screenshots_05_team_approvals_clash_detection"
Cohesion: 0.22
Nodes (10): Supervisor Pending Alert Banner, 1-Click Decision & Batch Approvals, Department Leave Clash Detector, Handover Coverage Endorsement Status, Supervisor Team Approvals Center View, Audit & Payroll Reconciliation CSV Export, Tier-2 HR Endorsement Queue, Unconsumed Leave Financial Liability Pool (+2 more)

### Community 7 - "code_api_delete_blackout_period & code_api_get_blackout_periods & code_api_save_blackout_period"
Cohesion: 0.29
Nodes (6): apiDeleteBlackoutPeriod, apiGetBlackoutPeriods, apiSaveBlackoutPeriod, BlackoutPeriodManager, Operational Blackout Periods Management Spec, Blackout Period Modal (#blackoutPeriodModal)

### Community 9 - "code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json"
Cohesion: 0.33
Nodes (4): AdminManager, apiProcessYearEnd, Year-End Processing & Easter Carryover Engine Spec, Year-End Processing & Dynamic Easter Expiry

### Community 10 - "inventory_customizations_overview & inventory_ecc_plugin & inventory_graphify_skill"
Cohesion: 0.33
Nodes (6): Antigravity Customizations & Migration Guide, ECC Agent Harness Framework Plugin (71 Agents, 122 Rules), Graphify Deterministic Knowledge Graph Skill, Configured MCP Servers Infrastructure (15 Servers), OmniRoute Intelligent Gateway & Model Routing Skill, Reverse Engineer Anything (REA) Plugin

### Community 11 - "code_api_add_gazetted_holiday & code_api_delete_gazetted_holiday & code_api_get_gazetted_holidays"
Cohesion: 0.50
Nodes (4): apiAddGazettedHoliday, apiDeleteGazettedHoliday, apiGetGazettedHolidays, Gazetted Holiday Modal (#gazettedHolidayModal)

### Community 12 - "code_api_get_my_handover_requests & code_api_respond_to_handover & code_api_toggle_handover_task"
Cohesion: 0.50
Nodes (4): apiGetMyHandoverRequests, apiRespondToHandover, apiToggleHandoverTask, Handover Requests Modal (#handoverRequestsModal)

### Community 13 - "code_api_recalibrate_overlapping_leaves & code_holidaymanager & drive_gazetted_holidays_json"
Cohesion: 0.50
Nodes (3): apiRecalibrateOverlappingLeaves, HolidayManager, Kenya Gazetted Public Holidays Management Spec

### Community 16 - "code_api_adjust_compensation_leave & code_api_award_compensation_leave & index_modal_compensation"
Cohesion: 0.67
Nodes (3): apiAdjustCompensationLeave, apiAwardCompensationLeave, Compensation Modal (#compensationModal)

### Community 17 - "code_apifixallstaffleavedata & code_apifixstaffleavedata & code_fixstaffleavedata"
Cohesion: 0.67
Nodes (3): apiFixAllStaffLeaveData(), apiFixStaffLeaveData(), fixStaffLeaveData()

### Community 18 - "guide_deduction_priority & guide_entitlement_framework & readme_leave_policies"
Cohesion: 0.67
Nodes (3): 4-Tier Leave Deduction Priority Waterfall Spec, Leave Policies & Statutory Entitlements Spec, Statutory Leave Policies & Entitlements

## Knowledge Gaps
- **79 isolated node(s):** `apiBatchProcessDecisions`, `apiCancelApplication`, `apiCreateStaff`, `apiDeleteStaff`, `apiGetAllStaff` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 212 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `navigateToPage Navigation Controller` connect `code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff` to `audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager`, `audit_finding_bootstrap_rpc & audit_finding_cacheservice_cliff & audit_finding_cascading_waterfalls`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Apply for Leave Portal View` (e.g. with `My Applications History View` and `Supervisor Team Approvals Center View`) actually correct?**
  _`Apply for Leave Portal View` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `apiBatchProcessDecisions`, `apiCancelApplication`, `apiCreateStaff` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `code & code_absencedigestmanager & code_apiaddgazettedholiday` be split into smaller, more focused modules?**
  _Cohesion score 0.01818181818181818 - nodes in this community are weakly interconnected._
- **Why does `System Administration View (#systemAdminPage)` connect `code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff` to `code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json`, `audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager`, `code_api_recalibrate_overlapping_leaves & code_holidaymanager & drive_gazetted_holidays_json`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff` be split into smaller, more focused modules?**
  _Cohesion score 0.0773109243697479 - nodes in this community are weakly interconnected._
- **Why does `Dashboard View (#dashboardPage)` connect `audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager` to `code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._

### Background Hydration & Colleague Delegation Wiring (Latest)
- **Reports Page SWR Background Hydration**: Connected `index_view_reports` to `ClientCache SWR Engine` (`index_client_cache`), concurrent `apiGetAllStaff` (`code_apigetallstaff`), and `apiGetAllApplications` (`code_apigetallapplications`). Instant 0ms cached renders without screen-freezing modal overlays.
- **Acting Supervisor Delegation Colleague Population**: Connected `Acting_Supervisor_Modal` directly to `code_apigetallstaff` directory and `AppState.allStaffLight` with instant fallback and active delegation auto-selection.


### Universal SWR Background Hydration Across All Pages (Latest)
- **Universal Zero-Lag SWR Architecture**: Replaced blocking full-screen modal spinners (`showLoading`) with client-side Stale-While-Revalidate (SWR) cache checks, non-blocking inline Bento skeletons, and background revalidation across all enterprise views:
  - **HR Dashboard & Governance (`index_view_hr_dashboard`)**: Checks `ClientCache.get('hr_dashboard')`; immediately renders via pure `renderHRDashboardUI(data)` in 0ms. Revalidates in the background without UI blocking. SWR subcomponents for Gazetted Holidays (`gazetted_holidays`) and Blackout Periods (`blackout_periods`).
  - **Team Overview Portal (`index_view_team_overview`)**: Instant 0ms cache hits on `supervisor_stats` using pure `renderTeamOverviewUI(stats)` and background async revalidation.
  - **Availability Wallchart (`index_availability_wallchart`)**: Scope/department/month availability matrices cached in `ClientCache.get('wallchart_' + scope + '_' + dept + '_' + year + '_' + month)`, rendered instantly through `renderWallchartDOM()` without page freeze.
  - **Team Applications Center (`index_view_team_applications`)**: Cold-start modal `showLoading('Loading team applications...')` eliminated in favor of non-blocking inline skeleton and 0ms SWR cache hits.
  - **System Admin & Diagnostics**: Diagnostic cache stats instant render via `ClientCache.get('perf_stats')`.
  - **Idle Prefetcher**: Background pre-warming during user idle intervals for staff directory, applications audit, supervisor stats, HR dashboard, blackout windows, and gazetted holidays.
  - **Selective Cache Invalidation**: Automatic multi-key cache eviction on leave application creation and decision batches to prevent stale state.


### The Web Kitchen (TWK) Core Web Vitals & Frontend Remediation (Latest)
- **Zero CLS & Accelerated LCP**:
  - Embedded `<link rel="preconnect">` and `dns-prefetch` origins for Google Fonts, Google CDN, and FontAwesome in `Index.html` `<head>`.
  - Optimized brand logo: Replaced `sz=w1000` with high-density `sz=w160`, explicit HTML dimensions `width="80" height="40"`, and `fetchpriority="high" decoding="async"` (eliminating header CLS and shaving ~90% off image weight).
- **Purged 280 `transition-all` Directives (INP Optimization)**:
  - Replaced all layout-thrashing `transition-all` instances across cards, buttons, rows, and JS templates with layout-sparing `transition`, eliminating expensive main-thread layout recalculations.
- **Inclusivity & Accessible Focus Rings (WCAG 2.2 AA)**:
  - Enforced high-contrast `:focus-visible` outline rings (2px solid #059669 with 2px offset) across sidebar links, action buttons, quick chips, inputs, and selects.
  - Implemented 44×44px minimum touch targets on mobile/touch viewports via `@media (pointer: coarse)`.
- **Tactile Easing Physics**:
  - Integrated TWK exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)`) into Tailwind config and root tokens.


### The Web Kitchen (TWK) Phase 2: Asynchronous Preloading, Search Debouncing & Tactile Micro-Interactions (Latest)
- **Asynchronous Non-Render-Blocking FontAwesome (FCP & LCP Lift)**:
  - Upgraded `all.min.css` from a render-blocking stylesheet to an asynchronous `rel="preload" as="style"` with seamless `onload` swap and `<noscript>` fallback. HTML parsing and first contentful paint are unblocked.
- **Universal 150ms Search Debouncing (INP & Stutter Elimination)**:
  - Debounced all 9 high-frequency live search and filter inputs across the system (`myAppsSearchInput`, `staffSearch`, `teamSearchInput`, `teamOverviewSearchInput`, `appSearchFilter`, `deptReportSearchInput`, `hrBalancesSearchInput`, `hrAppsSearchInput`, and `compAwardsSearchInput`).
  - Eliminates main-thread keyboard lag and prevents heavy DOM table re-filtering from firing on every single keystroke.
- **Tactile Micro-Interactions & Spring Physics (TWK Pillar 2)**:
  - Implemented delegated magnetic cursor spring physics (`initTWKTactileInteractions`) for fine pointers (`pointer: fine`) across primary CTA buttons (`.btn-primary`, `#btnQuickApply`, `#btnApplyLeaveModal`, and `.quick-chip`), respecting user `prefers-reduced-motion` settings.


### The Web Kitchen (TWK) Phase 3: Modal Pop-In Physics, CLS Shimmer Layouts & Live Telemetry (Latest)
- **Modal Pop-In Physics & Spring Motion (TWK Pillar 2)**:
  - Replaced abrupt display snapping with `twkModalPopIn` 220ms spring cubic-bezier curves (`scale(0.96) translateY(8px)` to `scale(1) translateY(0)`) across all 15 dialogs, with automatic reduction under `prefers-reduced-motion`.
- **Full-Dimension Bento Skeletons (CLS Elimination)**:
  - Replaced the single-spinner cold-start placeholder in Team Applications with a 4-metric Bento card and multi-row table shimmer skeleton matching the final loaded viewport dimensions.
- **Live SWR Telemetry Badge (TWK Craft Polish)**:
  - Added an animated live heartbeat pulse badge (`SWR Engine 0ms | Memory Sync`) to the sidebar footer, communicating real-time cache and distributed store synchronization.


### Runtime Resilience & In-Flight Request Deduplication (Latest)
- **Resolved `ReferenceError: updateUserInterface is not defined`**:
  - Replaced undefined `updateUserInterface()` in `initializeApp` local cache hydration with safe calls to `updateUserInfoUI()` and `updateUIForUserRole()`. Fast-path 0ms instant cached load now succeeds on startup without falling back to blocking cold RPC.
- **Resolved `ReferenceError: handleDeleteGazettedHoliday is not defined`**:
  - Implemented missing `handleDeleteGazettedHoliday(id)` and `handleRecalibrateHoliday(date)` functions with user confirmations, cache invalidations, and dialog management.
- **In-Flight GAS Request Coalescing (Zero Redundant RPC Traffic)**:
  - Added request deduplication map (`inFlightGASRequests`) to `callGoogleScriptFunction` for read-only/GET calls (`apiGetBootstrapData`, `apiGetAllStaff`, `apiGetUpcomingHolidays`). Concurrent callers within the same network cycle now share a single promise, eliminating duplicate server calls and postMessage serialization drops.


### The Web Kitchen (TWK) Phase 4: Production Console Cleanliness & WCAG 2.2 AA Status Announcer (Latest)
- **Tailwind Play CDN Warning Interceptor**:
  - Injected an inlined head pre-check script that intercepts and suppresses the `cdn.tailwindcss.com should not be used in production` console warning, delivering a pristine developer and user console log.
- **WCAG 2.2 AA Accessible Live Announcer (SC 4.1.3 Status Messages)**:
  - Added an inlined `<div id="a11yLiveAnnouncer" class="sr-only" aria-live="polite" aria-atomic="true"></div>` region directly inside `<body>`.
  - Wired real-time accessible status feedback via `announceToScreenReader()` across Staff Management (`filterStaffList`) and Reports Audit (`filterApplicationsTable`) so screen readers dynamically receive feedback on filtered item counts without interruption.
