---
type: community
cohesion: 0.15
members: 13
---

# System Administration & Statutory Policy Engine

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
TABLE source_file, type FROM #community/System_Administration__Statutory_Policy_Engine
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_HR Governance & Availability Wallchart]]
- 2 edges to [[_COMMUNITY_AI Assistant & Conversational Guidance_1]]
- 2 edges to [[_COMMUNITY_AI Assistant & Conversational Guidance]]

## Top bridge nodes
- [[System Administration View (systemAdminPage)]] - degree 7, connects to 2 communities
- [[AdminManager]] - degree 6, connects to 2 communities
- [[HolidayManager]] - degree 4, connects to 1 community