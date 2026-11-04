---
type: community
cohesion: 0.29
members: 7
---

# System Administration & Statutory Policy Engine

**Cohesion:** 0.29 - loosely connected
**Members:** 7 nodes

## Members
- [[Blackout Period Modal (blackoutPeriodModal)]] - code - Index.html
- [[BlackoutPeriodManager]] - code - Code.js
- [[Operational Blackout Periods Management Spec]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[apiDeleteBlackoutPeriod]] - code - Code.js
- [[apiGetBlackoutPeriods]] - code - Code.js
- [[apiSaveBlackoutPeriod]] - code - Code.js
- [[blackout_periods.json]] - document - Agri Experience Leave System/blackout_periods.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/System_Administration__Statutory_Policy_Engine
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_HR Governance & Availability Wallchart]]

## Top bridge nodes
- [[BlackoutPeriodManager]] - degree 4, connects to 1 community