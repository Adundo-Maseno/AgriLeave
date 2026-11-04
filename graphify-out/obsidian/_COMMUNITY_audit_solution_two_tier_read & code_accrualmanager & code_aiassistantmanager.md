---
type: community
cohesion: 0.10
members: 25
---

# audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager

**Cohesion:** 0.10 - loosely connected
**Members:** 25 nodes

## Members
- [[AIAssistantManager]] - code - Code.js
- [[AccrualManager]] - code - Code.js
- [[ApplicationsManager]] - code - Code.js
- [[Dashboard View (dashboardPage)]] - code - Index.html
- [[Data Storage & Dual Persistence Layer Spec]] - document - README.md
- [[DataManager]] - code - Code.js
- [[EnhancedCacheManager]] - code - Code.js
- [[Floating AI Assistant & Role Grounding Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[Floating AI Assistant Widget (aiChatPanel)]] - code - Index.html
- [[Google Sheets Master Mirror Database]] - document - Google Sheets: AgriLeave Master Database & Mirror
- [[Main Dashboard & Navigation Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[NotificationManager]] - code - Code.js
- [[SheetsDualStoreManager]] - code - Code.js
- [[Solution 2 Two-Tier Data File Caching (Memory + Distributed)]] - document - agrileave_performance_audit_and_optimization_blueprint.md
- [[StaffManager]] - code - Code.js
- [[System Architecture & GAS Engine]] - document - README.md
- [[apiAskLeaveAssistant]] - code - Code.js
- [[apiGetBootstrapData]] - code - Code.js
- [[apiGetDashboardData]] - code - Code.js
- [[apiSubmitLeaveApplication]] - code - Code.js
- [[apiSyncSheetsDatabase]] - code - Code.js
- [[leave_applications.json]] - document - Agri Experience Leave System/leave_applications.json
- [[leave_applications_archive.json]] - document - Agri Experience Leave System/leave_applications_archive.json
- [[rag_knowledge_base.json]] - document - Agri Experience Leave System/rag_knowledge_base.json
- [[staff_data.json]] - document - Agri Experience Leave System/staff_data.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/audit_solution_two_tier_read__code_accrualmanager__code_aiassistantmanager
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]
- 4 edges to [[_COMMUNITY_code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff]]
- 1 edge to [[_COMMUNITY_code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json]]

## Top bridge nodes
- [[System Architecture & GAS Engine]] - degree 8, connects to 1 community
- [[ApplicationsManager]] - degree 6, connects to 1 community
- [[AIAssistantManager]] - degree 5, connects to 1 community
- [[SheetsDualStoreManager]] - degree 5, connects to 1 community
- [[Dashboard View (dashboardPage)]] - degree 5, connects to 1 community