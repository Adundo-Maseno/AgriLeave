---
type: community
cohesion: 0.50
members: 4
---

# code_api_recalibrate_overlapping_leaves & code_holidaymanager & drive_gazetted_holidays_json

**Cohesion:** 0.50 - moderately connected
**Members:** 4 nodes

## Members
- [[HolidayManager]] - code - Code.js
- [[Kenya Gazetted Public Holidays Management Spec]] - document - docs/AgriLeave_User_and_Admin_Guide.md
- [[apiRecalibrateOverlappingLeaves]] - code - Code.js
- [[gazetted_holidays.json]] - document - Agri Experience Leave System/gazetted_holidays.json

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/code_api_recalibrate_overlapping_leaves__code_holidaymanager__drive_gazetted_holidays_json
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_code & code_absencedigestmanager & code_apiaddgazettedholiday]]
- 1 edge to [[_COMMUNITY_code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff]]

## Top bridge nodes
- [[HolidayManager]] - degree 4, connects to 1 community
- [[apiRecalibrateOverlappingLeaves]] - degree 2, connects to 1 community