---
source_file: "Index.html"
type: "code"
community: "code_api_batch_process_decisions & code_api_cancel_application & code_api_create_staff"
location: "line 2053"
tags:
  - graphify/code
  - graphify/EXTRACTED
  - community/code_api_batch_process_decisions__code_api_cancel_application__code_api_create_staff
---

# Reports View (#reportsPage)

## Connections
- [[AppState Global State Object]] - `shares_data_with` [EXTRACTED]
- [[navigateToPage Navigation Controller]] - `calls` [EXTRACTED]
- [[ClientCache SWR Engine_1]] - `hydrates_via_swr` [EXTRACTED]
- [[Code.js#apiGetAllStaff]] - `fetches_staff_directory` [EXTRACTED]
- [[Code.js#apiGetAllApplications]] - `fetches_applications_audit` [EXTRACTED]

#graphify/code #graphify/EXTRACTED #community/code_api_batch_process_decisions__code_api_cancel_application__code_api_create_staff