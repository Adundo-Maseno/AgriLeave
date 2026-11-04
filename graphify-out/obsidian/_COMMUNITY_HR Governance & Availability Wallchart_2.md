---
type: community
cohesion: 0.22
members: 10
---

# HR Governance & Availability Wallchart

**Cohesion:** 0.22 - loosely connected
**Members:** 10 nodes

## Members
- [[1-Click Decision & Batch Approvals]] - image - docs/screenshots/05_team_approvals.png
- [[All Staff 31-Day Availability Wallchart]] - image - docs/screenshots/06_hr_dashboard.png
- [[Audit & Payroll Reconciliation CSV Export]] - image - docs/screenshots/06_hr_dashboard.png
- [[Department Leave Clash Detector]] - image - docs/screenshots/05_team_approvals.png
- [[HR Governance Portal View]] - image - docs/screenshots/06_hr_dashboard.png
- [[Handover Coverage Endorsement Status]] - image - docs/screenshots/05_team_approvals.png
- [[Supervisor Pending Alert Banner]] - image - docs/screenshots/01_dashboard.png
- [[Supervisor Team Approvals Center View]] - image - docs/screenshots/05_team_approvals.png
- [[Tier-2 HR Endorsement Queue]] - image - docs/screenshots/06_hr_dashboard.png
- [[Unconsumed Leave Financial Liability Pool]] - image - docs/screenshots/06_hr_dashboard.png

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/HR_Governance__Availability_Wallchart
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_System Administration & Statutory Policy Engine]]

## Top bridge nodes
- [[Supervisor Team Approvals Center View]] - degree 5, connects to 1 community
- [[Supervisor Pending Alert Banner]] - degree 2, connects to 1 community