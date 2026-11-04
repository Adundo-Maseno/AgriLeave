---
type: community
cohesion: 0.33
members: 6
---

# code_adminmanager & code_api_process_year_end & drive_annual_reset_logs_json

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[AdminManager]] - code - Code.js
- [[Year-End Processing & Dynamic Easter Expiry]] - document - README.md
- [[Year-End Processing & Easter Carryover Engine Spec]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[annual_reset_logs.json]] - document - Agri Experience Leave System/annual_reset_logs.json
- [[apiProcessYearEnd]] - code - Code.js
- [[system_settings.json]] - document - Agri Experience Leave System/system_settings.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/code_adminmanager__code_api_process_year_end__drive_annual_reset_logs_json
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]
- 1 edge to [[_COMMUNITY_audit_solution_two_tier_read & code_accrualmanager & code_aiassistantmanager]]
- 1 edge to [[_COMMUNITY_code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff]]

## Top bridge nodes
- [[AdminManager]] - degree 6, connects to 2 communities
- [[apiProcessYearEnd]] - degree 2, connects to 1 community