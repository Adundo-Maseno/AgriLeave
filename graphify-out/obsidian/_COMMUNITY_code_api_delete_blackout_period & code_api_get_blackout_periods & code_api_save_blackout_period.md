---
type: community
cohesion: 0.29
members: 7
---

# code_api_delete_blackout_period & code_api_get_blackout_periods & code_api_save_blackout_period

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
TABLE source_file, type FROM #community/code_api_delete_blackout_period__code_api_get_blackout_periods__code_api_save_blackout_period
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]

## Top bridge nodes
- [[BlackoutPeriodManager]] - degree 4, connects to 1 community