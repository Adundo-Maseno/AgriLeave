---
type: community
cohesion: 0.02
members: 110
---

# HR Governance & Availability Wallchart

**Cohesion:** 0.02 - loosely connected
**Members:** 110 nodes

## Members
- [[AbsenceDigestManager]] - code - Code.js
- [[ArchiveManager]] - code - Code.js
- [[AttachmentManager]] - code - Code.js
- [[CalendarSyncManager]] - code - Code.js
- [[Code.js]] - code - Code.js
- [[CompensationManager]] - code - Code.js
- [[ConfigManager]] - code - Code.js
- [[DashboardManager]] - code - Code.js
- [[DiagnosticsManager]] - code - Code.js
- [[EmailService]] - code - Code.js
- [[GmailSyncManager]] - code - Code.js
- [[HandoverManager]] - code - Code.js
- [[MaintenanceManager]] - code - Code.js
- [[SYSTEM]] - code - Code.js
- [[SetupManager]] - code - Code.js
- [[SystemManager]] - code - Code.js
- [[Utils]] - code - Code.js
- [[apiAddGazettedHoliday()]] - code - Code.js
- [[apiAdjustCompensationLeave()]] - code - Code.js
- [[apiAmendLeaveDates()]] - code - Code.js
- [[apiArchiveOldApplications()]] - code - Code.js
- [[apiAskLeaveAssistant()]] - code - Code.js
- [[apiAwardCompensationLeave()]] - code - Code.js
- [[apiBatchProcessDecisions()]] - code - Code.js
- [[apiCancelApplication()]] - code - Code.js
- [[apiCheckLeaveBalance()]] - code - Code.js
- [[apiCheckTeamLeaveClashes()]] - code - Code.js
- [[apiClearAllCaches()]] - code - Code.js
- [[apiConfigureVacationResponder()]] - code - Code.js
- [[apiCreateFirstAdmin()]] - code - Code.js
- [[apiCreateStaff()]] - code - Code.js
- [[apiDeleteBlackoutPeriod()]] - code - Code.js
- [[apiDeleteGazettedHoliday()]] - code - Code.js
- [[apiDeleteStaff()]] - code - Code.js
- [[apiGetAIAssistantStatus()]] - code - Code.js
- [[apiGetAccrualDetails()]] - code - Code.js
- [[apiGetActingSupervisor()]] - code - Code.js
- [[apiGetAllApplications()]] - code - Code.js
- [[apiGetAllCompensationRecords()]] - code - Code.js
- [[apiGetAllStaff()]] - code - Code.js
- [[apiGetApplicationById()]] - code - Code.js
- [[apiGetArchiveSummary()]] - code - Code.js
- [[apiGetArchivedApplications()]] - code - Code.js
- [[apiGetAvailableGeminiModels()]] - code - Code.js
- [[apiGetBlackoutPeriods()]] - code - Code.js
- [[apiGetBootstrapData()]] - code - Code.js
- [[apiGetCalendarSettings()]] - code - Code.js
- [[apiGetCompensationClaims()]] - code - Code.js
- [[apiGetCurrentUser()]] - code - Code.js
- [[apiGetDashboardData()]] - code - Code.js
- [[apiGetGazettedHolidays()]] - code - Code.js
- [[apiGetHRDashboard()]] - code - Code.js
- [[apiGetLeaveLiabilityReport()]] - code - Code.js
- [[apiGetMyApplications()]] - code - Code.js
- [[apiGetMyHandoverRequests()]] - code - Code.js
- [[apiGetPendingApplications()]] - code - Code.js
- [[apiGetPendingHREndorsements()]] - code - Code.js
- [[apiGetPerformanceStats()]] - code - Code.js
- [[apiGetSheetsStatus()]] - code - Code.js
- [[apiGetStaffCompensation()]] - code - Code.js
- [[apiGetSupervisorStats()]] - code - Code.js
- [[apiGetSupervisors()]] - code - Code.js
- [[apiGetSystemDiagnostics()]] - code - Code.js
- [[apiGetSystemInfo()]] - code - Code.js
- [[apiGetTeamApplications()]] - code - Code.js
- [[apiGetTeamAvailability()]] - code - Code.js
- [[apiGetTodayAbsenceDigest()]] - code - Code.js
- [[apiGetUpcomingHolidays()]] - code - Code.js
- [[apiGetUserBalance()]] - code - Code.js
- [[apiGetVacationResponderPreview()]] - code - Code.js
- [[apiInstallSystemTriggers()]] - code - Code.js
- [[apiProcessApplicationDecision()]] - code - Code.js
- [[apiProcessCompensationClaim()]] - code - Code.js
- [[apiProcessMonthlyAccrual()]] - code - Code.js
- [[apiProcessYearEnd()]] - code - Code.js
- [[apiRebuildIndexes()]] - code - Code.js
- [[apiRecalibrateAllLeaves()]] - code - Code.js
- [[apiRecalibrateOverlappingLeaves()]] - code - Code.js
- [[apiReindexKnowledgeBase()]] - code - Code.js
- [[apiRespondToHandover()]] - code - Code.js
- [[apiRestoreFromSheets()]] - code - Code.js
- [[apiRevokeCompensationAward()]] - code - Code.js
- [[apiSaveBlackoutPeriod()]] - code - Code.js
- [[apiSaveCalendarSettings()]] - code - Code.js
- [[apiSendDailyAbsenceDigest()]] - code - Code.js
- [[apiSetActingSupervisor()]] - code - Code.js
- [[apiSetGeminiApiKey()]] - code - Code.js
- [[apiSubmitCompensationClaim()]] - code - Code.js
- [[apiSubmitLeaveApplication()]] - code - Code.js
- [[apiSyncCalendar()]] - code - Code.js
- [[apiSyncSheetsDatabase()]] - code - Code.js
- [[apiTestCalendarConnection()]] - code - Code.js
- [[apiTestConnection()]] - code - Code.js
- [[apiToggleHandoverTask()]] - code - Code.js
- [[apiTriggerDailyHeartbeat()]] - code - Code.js
- [[apiUpdateStaff()]] - code - Code.js
- [[apiUploadAttachment()]] - code - Code.js
- [[checkCacheHealth()]] - code - Code.js
- [[debugCheckApplication()]] - code - Code.js
- [[doGet()]] - code - Code.js
- [[fixAccruedDaysForAllStaff()]] - code - Code.js
- [[initializeSystem()]] - code - Code.js
- [[processMonthlyAccrualAutomatically()]] - code - Code.js
- [[resetSystem()]] - code - Code.js
- [[scheduledDailyHeartbeat()]] - code - Code.js
- [[scheduledEasterExpiry()]] - code - Code.js
- [[scheduledEasterWarning()]] - code - Code.js
- [[scheduledMonthlyAccrual()]] - code - Code.js
- [[scheduledYearEnd()]] - code - Code.js
- [[setupAutomaticAccrual()]] - code - Code.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/HR_Governance__Availability_Wallchart
SORT file.name ASC
```

## Connections to other communities
- 8 edges to [[_COMMUNITY_AI Assistant & Conversational Guidance_1]]
- 3 edges to [[_COMMUNITY_Subsystem 13 apiFixAllStaffLeaveData()]]
- 2 edges to [[_COMMUNITY_System Administration & Statutory Policy Engine_1]]
- 1 edge to [[_COMMUNITY_Subsystem 17 apiExportSystemData()]]
- 1 edge to [[_COMMUNITY_System Administration & Statutory Policy Engine_2]]
- 1 edge to [[_COMMUNITY_HR Governance & Availability Wallchart_3]]
- 1 edge to [[_COMMUNITY_Leave Entitlement & Accrual Engine_1]]

## Top bridge nodes
- [[Code.js]] - degree 126, connects to 7 communities