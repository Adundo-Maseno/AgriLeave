---
type: community
cohesion: 0.08
members: 35
---

# code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff

**Cohesion:** 0.08 - loosely connected
**Members:** 35 nodes

## Members
- [[AppState Global State Object]] - code - Index.html
- [[Apply Leave Modal (applyLeaveModal)]] - code - Index.html
- [[Apply Leave View (applyLeavePage)]] - code - Index.html
- [[FinancialProvisionManager]] - code - Code.js
- [[HR Dashboard View (hrDashboardPage)]] - code - Index.html
- [[HR Governance Portal & Availability Wallchart Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[Leave Balance View (myBalancePage)]] - code - Index.html
- [[My Applications View (myApplicationsPage)]] - code - Index.html
- [[My Profile View (myProfilePage)]] - code - Index.html
- [[Reports View (reportsPage)]] - code - Index.html
- [[Settings View (settingsPage)]] - code - Index.html
- [[Staff Availability Wallchart UI Component]] - code - Index.html
- [[Staff Leave Application Workflow (Daily & Hourly)]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[Staff Management View (staffManagementPage)]] - code - Index.html
- [[Supervisor Review, Approvals & Acting Delegation Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[System Administration & Maintenance Portal Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[System Administration View (systemAdminPage)]] - code - Index.html
- [[Team Applications View (teamApplicationsPage)]] - code - Index.html
- [[Team Overview View (teamOverviewPage)]] - code - Index.html
- [[Tracking Applications & Detailed Balances Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[Unconsumed Leave Liability Pool & Financial Provisioning]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[apiBatchProcessDecisions]] - code - Code.js
- [[apiCancelApplication]] - code - Code.js
- [[apiCreateStaff]] - code - Code.js
- [[apiDeleteStaff]] - code - Code.js
- [[apiGetAllStaff]] - code - Code.js
- [[apiGetHRDashboard]] - code - Code.js
- [[apiGetLeaveLiabilityReport]] - code - Code.js
- [[apiGetMyApplications]] - code - Code.js
- [[apiGetSystemDiagnostics]] - code - Code.js
- [[apiGetTeamApplications]] - code - Code.js
- [[apiGetUserBalance]] - code - Code.js
- [[apiProcessApplicationDecision]] - code - Code.js
- [[apiUpdateStaff]] - code - Code.js
- [[navigateToPage Navigation Controller]] - code - Index.html

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/code_api_batch_process_decisions__code_api_cancel_application__code_api_create_staff
SORT file.name ASC
```

## Connections to other communities
- 4 edges to [[_COMMUNITY_audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager]]
- 1 edge to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]
- 1 edge to [[_COMMUNITY_audit_finding_bootstrap_rpc & audit_finding_cacheservice_cliff & audit_finding_cascading_waterfalls]]
- 1 edge to [[_COMMUNITY_code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json]]
- 1 edge to [[_COMMUNITY_code_api_recalibrate_overlapping_leaves & code_holidaymanager & drive_gazetted_holidays_json]]

## Top bridge nodes
- [[System Administration View (systemAdminPage)]] - degree 7, connects to 3 communities
- [[navigateToPage Navigation Controller]] - degree 13, connects to 2 communities
- [[AppState Global State Object]] - degree 12, connects to 1 community
- [[FinancialProvisionManager]] - degree 3, connects to 1 community
- [[Apply Leave Modal (applyLeaveModal)]] - degree 3, connects to 1 community