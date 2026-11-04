---
type: community
cohesion: 0.15
members: 13
---

# code_adminmanager & code_api_get_system_diagnostics & code_api_process_year_end

**Cohesion:** 0.15 - loosely connected
**Members:** 13 nodes

## Members
- [[AdminManager]] - code - Code.js
- [[HolidayManager]] - code - Code.js
- [[Kenya Gazetted Public Holidays Management Spec]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[System Administration & Maintenance Portal Guide]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[System Administration View (systemAdminPage)]] - code - Index.html
- [[Year-End Processing & Dynamic Easter Expiry]] - document - README.md
- [[Year-End Processing & Easter Carryover Engine Spec]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[annual_reset_logs.json]] - document - Agri Experience Leave System/annual_reset_logs.json
- [[apiGetSystemDiagnostics]] - code - Code.js
- [[apiProcessYearEnd]] - code - Code.js
- [[apiRecalibrateOverlappingLeaves]] - code - Code.js
- [[gazetted_holidays.json]] - document - Agri Experience Leave System/gazetted_holidays.json
- [[system_settings.json]] - document - Agri Experience Leave System/system_settings.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/code_adminmanager__code_api_get_system_diagnostics__code_api_process_year_end
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]
- 2 edges to [[_COMMUNITY_audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager]]
- 2 edges to [[_COMMUNITY_code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff]]

## Top bridge nodes
- [[System Administration View (systemAdminPage)]] - degree 7, connects to 2 communities
- [[AdminManager]] - degree 6, connects to 2 communities
- [[HolidayManager]] - degree 4, connects to 1 community