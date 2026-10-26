import re
import subprocess
import os

with open('Index.html', 'r', encoding='utf-8') as f:
    content = f.read()

orig_len = len(content)
print(f"Original content length: {orig_len}")

# Verify initial div balance
div_open = len(re.findall(r'<div\b', content, re.IGNORECASE))
div_close = len(re.findall(r'</div>', content, re.IGNORECASE))
assert div_open == div_close, f"Div mismatch: {div_open} vs {div_close}"
print(f"Initial div balance verified: {div_open} == {div_close}")

# ==============================================================================
# MODIFICATION 1: Leave Liability Modal Table (liabilityStaffTable)
# ==============================================================================
target_1 = """                        <!-- Detailed Staff Table -->
                        <div>
                            <h4 class="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                                <i class="fas fa-user-friends text-emerald-600"></i> Individual Staff Balances &
                                Provision
                            </h4>
                            <div class="overflow-x-auto border border-gray-200 rounded-xl max-h-72">"""

replacement_1 = """                        <!-- Detailed Staff Table -->
                        <div>
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                                <h4 class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                    <i class="fas fa-user-friends text-emerald-600"></i> Individual Staff Balances & Provision
                                </h4>
                                <div class="flex items-center gap-2">
                                    <div class="relative">
                                        <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]"></i>
                                        <input type="text" id="liabilityStaffSearchInput" placeholder="Filter staff or department..." class="pl-7 pr-6 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56 transition-colors">
                                        <button id="liabilityStaffClearSearch" class="hidden absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5" title="Clear"><i class="fas fa-times"></i></button>
                                    </div>
                                    <span id="liabilityStaffCountBadge" class="text-[11px] font-medium text-gray-500 tabular-nums"></span>
                                </div>
                            </div>
                            <div class="overflow-x-auto border border-gray-200 rounded-xl max-h-72">"""

assert target_1 in content, "Target 1 not found in content!"
content = content.replace(target_1, replacement_1, 1)

# Now update renderLiabilityReport to tag rows and wire filter
target_1b = """                if (staffTableBody) {
                    staffTableBody.innerHTML = (report.staffRecords || []).map(s => `
                    <tr class="hover:bg-gray-50/60 transition-colors">"""

replacement_1b = """                if (staffTableBody) {
                    staffTableBody.innerHTML = (report.staffRecords || []).map(s => `
                    <tr class="hover:bg-gray-50/60 transition-colors liability-staff-row" data-search="${escapeHtml(((s.name || '') + ' ' + (s.email || '') + ' ' + (s.department || '')).toLowerCase())}">"""

assert target_1b in content, "Target 1b not found in content!"
content = content.replace(target_1b, replacement_1b, 1)

target_1c = """                `).join('');
                }
            }

            function exportLeaveLiabilityCSV() {"""

replacement_1c = """                `).join('');
                    setupLiabilityStaffFilter();
                }
            }

            function setupLiabilityStaffFilter() {
                const searchInput = document.getElementById('liabilityStaffSearchInput');
                const clearBtn = document.getElementById('liabilityStaffClearSearch');
                const countBadge = document.getElementById('liabilityStaffCountBadge');
                const tbody = document.getElementById('liabilityStaffTableBody');
                if (!tbody) return;

                function applyFilter() {
                    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
                    if (clearBtn) clearBtn.classList.toggle('hidden', !q);
                    const rows = tbody.querySelectorAll('.liability-staff-row');
                    let visible = 0;
                    rows.forEach(r => {
                        const txt = r.getAttribute('data-search') || '';
                        if (!q || txt.includes(q)) {
                            r.style.display = '';
                            visible++;
                        } else {
                            r.style.display = 'none';
                        }
                    });
                    if (countBadge) countBadge.textContent = `${visible} of ${rows.length}`;

                    const existingEmpty = tbody.querySelector('#liabilityStaffEmptyRow');
                    if (visible === 0 && rows.length > 0) {
                        if (!existingEmpty) {
                            const tr = document.createElement('tr');
                            tr.id = 'liabilityStaffEmptyRow';
                            tr.innerHTML = `<td colspan="8" class="py-6 text-center text-xs text-gray-500"><i class="fas fa-search mr-1.5 text-gray-400"></i>No staff records match "${escapeHtml(q)}"</td>`;
                            tbody.appendChild(tr);
                        }
                    } else if (existingEmpty) {
                        existingEmpty.remove();
                    }
                }

                if (searchInput) {
                    searchInput.value = '';
                    const newInp = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newInp, searchInput);
                    newInp.addEventListener('input', applyFilter);
                    const newClr = document.getElementById('liabilityStaffClearSearch');
                    if (newClr) newClr.addEventListener('click', () => { newInp.value = ''; newInp.focus(); applyFilter(); });
                }
                applyFilter();
            }

            function exportLeaveLiabilityCSV() {"""

assert target_1c in content, "Target 1c not found in content!"
content = content.replace(target_1c, replacement_1c, 1)

print("Modification 1 applied successfully.")

# ==============================================================================
# MODIFICATION 2: My Applications Table
# ==============================================================================
target_2 = """          <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">"""

replacement_2 = """          <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div class="p-4 border-b border-gray-200/80 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="relative flex-1 max-w-md">
                <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input type="text" id="myAppsSearchInput" placeholder="Search applications (leave type, dates, status, period)..." class="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                <button id="myAppsClearSearch" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1" title="Clear filter"><i class="fas fa-times"></i></button>
              </div>
              <div class="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                Showing <span id="myAppsCount" class="font-semibold text-gray-800 tabular-nums">${applications.length}</span> of ${applications.length} applications
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">"""

assert target_2 in content, "Target 2 not found in content!"
content = content.replace(target_2, replacement_2, 1)

target_2b = """                  <tr class="hover:bg-gray-50/80 transition-colors my-app-row" data-status="${(app.Status || 'pending').toLowerCase()}">"""

replacement_2b = """                  <tr class="hover:bg-gray-50/80 transition-colors my-app-row" data-status="${(app.Status || 'pending').toLowerCase()}" data-search="${escapeHtml(((app.LeaveType || '') + ' ' + (app.Status || '') + ' ' + (app.StartDate || '') + ' ' + (app.EndDate || '') + ' ' + (app.Duration || '') + ' ' + (app.LeaveMode || '') + ' ' + (app.Reason || '')).toLowerCase())}">"""

assert target_2b in content, "Target 2b not found in content!"
content = content.replace(target_2b, replacement_2b, 1)

target_2c = """                        // Wire up click-to-filter on My Applications stat cards
                        const statCards = pageElement.querySelectorAll('.my-app-stat-card');
                        const appRows = pageElement.querySelectorAll('.my-app-row');
                        let currentStatusFilter = 'all';

                        statCards.forEach(card => {
                            card.addEventListener('click', function () {
                                const filter = this.getAttribute('data-status-filter') || 'all';
                                currentStatusFilter = (currentStatusFilter === filter && filter !== 'all') ? 'all' : filter;

                                statCards.forEach(c => {
                                    const cFilter = c.getAttribute('data-status-filter');
                                    if (cFilter === currentStatusFilter && currentStatusFilter !== 'all') {
                                        c.classList.add('ring-2', 'ring-emerald-500', 'shadow-md');
                                    } else {
                                        c.classList.remove('ring-2', 'ring-emerald-500', 'shadow-md');
                                    }
                                });

                                let visibleCount = 0;
                                appRows.forEach(row => {
                                    const rowStatus = row.getAttribute('data-status');
                                    if (currentStatusFilter === 'all' || rowStatus === currentStatusFilter) {
                                        row.style.display = '';
                                        visibleCount++;
                                    } else {
                                        row.style.display = 'none';
                                    }
                                });

                                const emptyFilterRow = pageElement.querySelector('#myAppsEmptyFilterRow');
                                if (visibleCount === 0) {
                                    if (!emptyFilterRow) {
                                        const tbody = pageElement.querySelector('tbody');
                                        if (tbody) {
                                            const tr = document.createElement('tr');
                                            tr.id = 'myAppsEmptyFilterRow';
                                            tr.innerHTML = `<td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500"><i class="fas fa-filter mr-2 text-gray-400"></i>No ${currentStatusFilter} applications found</td>`;
                                            tbody.appendChild(tr);
                                        }
                                    } else {
                                        emptyFilterRow.style.display = '';
                                        const td = emptyFilterRow.querySelector('td');
                                        if (td) td.innerHTML = `<i class="fas fa-filter mr-2 text-gray-400"></i>No ${currentStatusFilter} applications found`;
                                    }
                                } else if (emptyFilterRow) {
                                    emptyFilterRow.style.display = 'none';
                                }
                            });
                        });"""

replacement_2c = """                        // Wire up click-to-filter on My Applications stat cards and real-time search
                        const statCards = pageElement.querySelectorAll('.my-app-stat-card');
                        const appRows = pageElement.querySelectorAll('.my-app-row');
                        const searchInput = pageElement.querySelector('#myAppsSearchInput');
                        const clearSearchBtn = pageElement.querySelector('#myAppsClearSearch');
                        const countBadge = pageElement.querySelector('#myAppsCount');
                        let currentStatusFilter = 'all';

                        function applyMyAppsFilters() {
                            const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
                            if (clearSearchBtn) {
                                clearSearchBtn.classList.toggle('hidden', !query);
                            }
                            let visibleCount = 0;
                            appRows.forEach(row => {
                                const rowStatus = row.getAttribute('data-status') || '';
                                const rowSearch = (row.getAttribute('data-search') || row.textContent).toLowerCase();
                                const matchesStatus = (currentStatusFilter === 'all' || rowStatus === currentStatusFilter);
                                const matchesQuery = (!query || rowSearch.includes(query));

                                if (matchesStatus && matchesQuery) {
                                    row.style.display = '';
                                    visibleCount++;
                                } else {
                                    row.style.display = 'none';
                                }
                            });

                            if (countBadge) {
                                countBadge.textContent = visibleCount;
                            }

                            const emptyFilterRow = pageElement.querySelector('#myAppsEmptyFilterRow');
                            if (visibleCount === 0) {
                                const filterMsg = query 
                                    ? `No applications match "${escapeHtml(query)}"${currentStatusFilter !== 'all' ? ` in ${currentStatusFilter}` : ''}`
                                    : `No ${currentStatusFilter} applications found`;
                                if (!emptyFilterRow) {
                                    const tbody = pageElement.querySelector('tbody');
                                    if (tbody) {
                                        const tr = document.createElement('tr');
                                        tr.id = 'myAppsEmptyFilterRow';
                                        tr.innerHTML = `<td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500"><i class="fas fa-filter mr-2 text-gray-400"></i>${filterMsg}</td>`;
                                        tbody.appendChild(tr);
                                    }
                                } else {
                                    emptyFilterRow.style.display = '';
                                    const td = emptyFilterRow.querySelector('td');
                                    if (td) td.innerHTML = `<i class="fas fa-filter mr-2 text-gray-400"></i>${filterMsg}`;
                                }
                            } else if (emptyFilterRow) {
                                emptyFilterRow.style.display = 'none';
                            }
                        }

                        statCards.forEach(card => {
                            card.addEventListener('click', function () {
                                const filter = this.getAttribute('data-status-filter') || 'all';
                                currentStatusFilter = (currentStatusFilter === filter && filter !== 'all') ? 'all' : filter;

                                statCards.forEach(c => {
                                    const cFilter = c.getAttribute('data-status-filter');
                                    if (cFilter === currentStatusFilter && currentStatusFilter !== 'all') {
                                        c.classList.add('ring-2', 'ring-emerald-500', 'shadow-md');
                                    } else {
                                        c.classList.remove('ring-2', 'ring-emerald-500', 'shadow-md');
                                    }
                                });
                                applyMyAppsFilters();
                            });
                        });

                        if (searchInput) {
                            searchInput.addEventListener('input', applyMyAppsFilters);
                        }
                        if (clearSearchBtn) {
                            clearSearchBtn.addEventListener('click', function() {
                                if (searchInput) {
                                    searchInput.value = '';
                                    searchInput.focus();
                                }
                                applyMyAppsFilters();
                            });
                        }"""

assert target_2c in content, "Target 2c not found in content!"
content = content.replace(target_2c, replacement_2c, 1)

print("Modification 2 applied successfully.")

# ==============================================================================
# MODIFICATION 3: Team Leave Balances Table (teamOverviewTable)
# ==============================================================================
target_3 = """    <!-- Team Balances Table -->
    <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-emerald-100/80 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2">
          <i class="fas fa-users text-emerald-600"></i>
          Team Leave Balances
        </h3>
        <span class="text-slate-500 text-xs font-normal">Real-time team accrual view</span>
      </div>
      
      <div class="p-6">"""

replacement_3 = """    <!-- Team Balances Table -->
    <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-emerald-100/80 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2">
            <i class="fas fa-users text-emerald-600"></i>
            Team Leave Balances
          </h3>
          <span class="text-slate-500 text-xs font-normal">Real-time team accrual view</span>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input type="text" id="teamOverviewSearchInput" placeholder="Filter team by name or role..." class="pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors w-48 sm:w-56">
            <button id="teamOverviewClearSearch" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5" title="Clear filter"><i class="fas fa-times"></i></button>
          </div>
          <select id="teamOverviewQuickFilter" class="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="all">All Members</option>
            <option value="deficit">In Deficit</option>
            <option value="comp">Has Comp Balance</option>
            <option value="bf">Has Brought Forward</option>
          </select>
          <span id="teamOverviewCountBadge" class="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 tabular-nums"></span>
        </div>
      </div>
      
      <div class="p-6">"""

assert target_3 in content, "Target 3 not found in content!"
content = content.replace(target_3, replacement_3, 1)

target_3b = """                                return `
            <tr class="hover:bg-gray-50 transition-colors duration-150">"""

replacement_3b = """                                return `
            <tr class="hover:bg-gray-50 transition-colors duration-150 team-balance-row" data-name="${escapeHtml((staff.name || '').toLowerCase())}" data-role="${escapeHtml((staff.role || '').toLowerCase())}" data-deficit="${hasDeficit ? '1' : '0'}" data-comp="${compBalance > 0 ? '1' : '0'}" data-bf="${bfRemaining > 0 ? '1' : '0'}">"""

assert target_3b in content, "Target 3b not found in content!"
content = content.replace(target_3b, replacement_3b, 1)

target_3c = """                            }).join('');
                        }
                    })
                    .catch(error => {"""

replacement_3c = """                            }).join('');
                            setupTeamOverviewFilters();
                        }
                    })
                    .catch(error => {"""

assert target_3c in content, "Target 3c not found in content!"
content = content.replace(target_3c, replacement_3c, 1)

# Add setupTeamOverviewFilters function before exportTeamOverviewToCSV
target_3d = """            // Export Team Overview to CSV - FIXED
            function exportTeamOverviewToCSV() {"""

replacement_3d = """            function setupTeamOverviewFilters() {
                const searchInput = document.getElementById('teamOverviewSearchInput');
                const clearBtn = document.getElementById('teamOverviewClearSearch');
                const filterSelect = document.getElementById('teamOverviewQuickFilter');
                const countBadge = document.getElementById('teamOverviewCountBadge');
                const tbody = document.getElementById('teamBalanceTableBody');
                if (!tbody) return;

                function runFilter() {
                    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
                    const mode = filterSelect ? filterSelect.value : 'all';
                    if (clearBtn) clearBtn.classList.toggle('hidden', !query);

                    const rows = tbody.querySelectorAll('.team-balance-row');
                    let visibleCount = 0;

                    rows.forEach(r => {
                        const name = r.getAttribute('data-name') || '';
                        const role = r.getAttribute('data-role') || '';
                        const hasDeficit = r.getAttribute('data-deficit') === '1';
                        const hasComp = r.getAttribute('data-comp') === '1';
                        const hasBf = r.getAttribute('data-bf') === '1';

                        const matchesText = !query || name.includes(query) || role.includes(query);
                        let matchesCategory = true;
                        if (mode === 'deficit') matchesCategory = hasDeficit;
                        else if (mode === 'comp') matchesCategory = hasComp;
                        else if (mode === 'bf') matchesCategory = hasBf;

                        if (matchesText && matchesCategory) {
                            r.style.display = '';
                            visibleCount++;
                        } else {
                            r.style.display = 'none';
                        }
                    });

                    if (countBadge) {
                        countBadge.textContent = `${visibleCount} of ${rows.length} staff`;
                    }

                    const existingEmpty = tbody.querySelector('#teamBalanceEmptyRow');
                    if (visibleCount === 0 && rows.length > 0) {
                        if (!existingEmpty) {
                            const tr = document.createElement('tr');
                            tr.id = 'teamBalanceEmptyRow';
                            tr.innerHTML = `<td colspan="7" class="py-8 text-center text-sm text-gray-500"><i class="fas fa-search text-gray-400 mr-2"></i>No team members match the filter criteria</td>`;
                            tbody.appendChild(tr);
                        }
                    } else if (existingEmpty) {
                        existingEmpty.remove();
                    }
                }

                if (searchInput) {
                    searchInput.value = '';
                    const newInp = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newInp, searchInput);
                    newInp.addEventListener('input', runFilter);
                    const newClr = document.getElementById('teamOverviewClearSearch');
                    if (newClr) newClr.addEventListener('click', () => { newInp.value = ''; newInp.focus(); runFilter(); });
                }
                if (filterSelect) {
                    const newSel = filterSelect.cloneNode(true);
                    filterSelect.parentNode.replaceChild(newSel, filterSelect);
                    newSel.addEventListener('change', runFilter);
                }
                runFilter();
            }

            // Export Team Overview to CSV - FIXED
            function exportTeamOverviewToCSV() {"""

assert target_3d in content, "Target 3d not found in content!"
content = content.replace(target_3d, replacement_3d, 1)

print("Modification 3 applied successfully.")

# ==============================================================================
# MODIFICATION 4: Staff Leave Details Report Table (staffReportTable)
# ==============================================================================
target_4 = """    <!-- Staff Details - WITH DEFICIT & COMPENSATION COLUMNS -->
    <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-xs border border-gray-200/90 p-6">
      <h3 class="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <i class="fas fa-users-cog text-emerald-600 text-sm"></i> Staff Leave Details
      </h3>
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">"""

replacement_4 = """    <!-- Staff Details - WITH DEFICIT & COMPENSATION COLUMNS -->
    <div class="stat-card stat-card-elevated bg-white rounded-xl shadow-xs border border-gray-200/90 p-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 class="text-base font-bold text-gray-900 flex items-center gap-2">
            <i class="fas fa-users-cog text-emerald-600 text-sm"></i> Staff Leave Details
          </h3>
          <p class="text-xs text-gray-500 mt-0.5">Comprehensive audit and balance records for all employees</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input type="text" id="staffReportSearchInput" placeholder="Filter staff name, email, dept..." class="pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors w-52 sm:w-64">
            <button id="staffReportClearSearch" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5" title="Clear filter"><i class="fas fa-times"></i></button>
          </div>
          <select id="staffReportDeptFilter" class="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="all">All Departments</option>
          </select>
          <span id="staffReportCountBadge" class="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 tabular-nums"></span>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs">"""

assert target_4 in content, "Target 4 not found in content!"
content = content.replace(target_4, replacement_4, 1)

target_4b = """                    return `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-4 py-3">"""

replacement_4b = """                    return `
      <tr class="hover:bg-slate-50/70 transition-colors staff-report-row" data-name="${escapeHtml(name.toLowerCase())}" data-email="${escapeHtml(email.toLowerCase())}" data-dept="${escapeHtml(department.toLowerCase())}">
        <td class="px-4 py-3">"""

assert target_4b in content, "Target 4b not found in content!"
content = content.replace(target_4b, replacement_4b, 1)

target_4c = """      </tr>
    `;
                }).join('');
            }
            // Update charts based on report type"""

replacement_4c = """      </tr>
    `;
                }).join('');
                setupStaffReportFilters(sortedStaff);
            }

            function setupStaffReportFilters(staffList) {
                const searchInput = document.getElementById('staffReportSearchInput');
                const clearBtn = document.getElementById('staffReportClearSearch');
                const deptSelect = document.getElementById('staffReportDeptFilter');
                const countBadge = document.getElementById('staffReportCountBadge');
                const tbody = document.getElementById('staffReportTableBody');
                if (!tbody) return;

                if (deptSelect && staffList && staffList.length > 0) {
                    const depts = Array.from(new Set(staffList.map(s => s.Department || s.department).filter(Boolean))).sort();
                    const currentVal = deptSelect.value;
                    deptSelect.innerHTML = '<option value="all">All Departments</option>' + depts.map(d => `<option value="${escapeHtml(d.toLowerCase())}">${escapeHtml(d)}</option>`).join('');
                    if (currentVal) deptSelect.value = currentVal;
                }

                function runFilter() {
                    const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
                    const dept = deptSelect ? deptSelect.value : 'all';
                    if (clearBtn) clearBtn.classList.toggle('hidden', !query);

                    const rows = tbody.querySelectorAll('.staff-report-row');
                    let visibleCount = 0;

                    rows.forEach(r => {
                        const name = r.getAttribute('data-name') || '';
                        const email = r.getAttribute('data-email') || '';
                        const rDept = r.getAttribute('data-dept') || '';

                        const matchesText = !query || name.includes(query) || email.includes(query) || rDept.includes(query);
                        const matchesDept = (dept === 'all' || rDept === dept);

                        if (matchesText && matchesDept) {
                            r.style.display = '';
                            visibleCount++;
                        } else {
                            r.style.display = 'none';
                        }
                    });

                    if (countBadge) {
                        countBadge.textContent = `${visibleCount} of ${rows.length} staff`;
                    }

                    const existingEmpty = tbody.querySelector('#staffReportEmptyRow');
                    if (visibleCount === 0 && rows.length > 0) {
                        if (!existingEmpty) {
                            const tr = document.createElement('tr');
                            tr.id = 'staffReportEmptyRow';
                            tr.innerHTML = `<td colspan="15" class="py-8 text-center text-xs text-gray-500"><i class="fas fa-search text-gray-400 mr-2"></i>No staff records match filter criteria</td>`;
                            tbody.appendChild(tr);
                        }
                    } else if (existingEmpty) {
                        existingEmpty.remove();
                    }
                }

                if (searchInput) {
                    searchInput.value = '';
                    const newInp = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newInp, searchInput);
                    newInp.addEventListener('input', runFilter);
                    const newClr = document.getElementById('staffReportClearSearch');
                    if (newClr) newClr.addEventListener('click', () => { newInp.value = ''; newInp.focus(); runFilter(); });
                }
                if (deptSelect) {
                    const newSel = deptSelect.cloneNode(true);
                    deptSelect.parentNode.replaceChild(newSel, deptSelect);
                    newSel.addEventListener('change', runFilter);
                }
                runFilter();
            }

            // Update charts based on report type"""

assert target_4c in content, "Target 4c not found in content!"
content = content.replace(target_4c, replacement_4c, 1)

print("Modification 4 applied successfully.")

# ==============================================================================
# MODIFICATION 5: HR Dashboard Tables (loadHRDashboardPage)
# ==============================================================================
# 5a: HR Endorsement Queue
target_5a = """                    // ── HR Endorsement Queue (Tier-2 Sign-Off) ──────────────────────
                    const hrEndorsements = (result.data.applications && result.data.applications.hrEndorsements) ? result.data.applications.hrEndorsements : [];
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8">';
                    html += '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">';
                    html += '<div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-user-check text-amber-600"></i> HR Endorsement Queue (Tier-2 Sign-Off)</h3><p class="text-xs text-gray-500 mt-0.5">Extended leaves (> 5 days) and specialized leaves (Study, Maternity, Paternity) endorsed by supervisors awaiting final HR approval</p></div>';
                    html += '<span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">' + hrEndorsements.length + ' Pending Sign-Off</span>';
                    html += '</div>';"""

replacement_5a = """                    // ── HR Endorsement Queue (Tier-2 Sign-Off) ──────────────────────
                    const hrEndorsements = (result.data.applications && result.data.applications.hrEndorsements) ? result.data.applications.hrEndorsements : [];
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-8">';
                    html += '<div class="flex flex-wrap items-center justify-between gap-3 mb-4">';
                    html += '<div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-user-check text-amber-600"></i> HR Endorsement Queue (Tier-2 Sign-Off)</h3><p class="text-xs text-gray-500 mt-0.5">Extended leaves (> 5 days) and specialized leaves (Study, Maternity, Paternity) endorsed by supervisors awaiting final HR approval</p></div>';
                    html += '<div class="flex items-center gap-2.5">';
                    if (hrEndorsements.length > 0) {
                        html += '<div class="relative"><i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i><input type="text" id="hrEndorsementSearchInput" placeholder="Filter endorsements..." class="pl-8 pr-7 py-1 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 w-44 sm:w-52"><button id="hrEndorsementClearSearch" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"><i class="fas fa-times"></i></button></div>';
                    }
                    html += '<span id="hrEndorsementBadge" class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">' + hrEndorsements.length + ' Pending Sign-Off</span>';
                    html += '</div></div>';"""

assert target_5a in content, "Target 5a not found in content!"
content = content.replace(target_5a, replacement_5a, 1)

target_5a_row = """                            html += '<tr class="hover:bg-amber-50/30 transition-colors">';"""
replacement_5a_row = """                            var endorsementSearchText = ((app.Name || '') + ' ' + (app.Department || '') + ' ' + (app.Email || '') + ' ' + (app.LeaveType || '') + ' ' + (app.HandoverName || '') + ' ' + supName).toLowerCase();
                            html += '<tr class="hover:bg-amber-50/30 transition-colors hr-endorsement-row" data-search="' + escapeHtml(endorsementSearchText) + '">';"""

assert target_5a_row in content, "Target 5a row not found in content!"
content = content.replace(target_5a_row, replacement_5a_row, 1)

# 5b: HR Staff Leave Balances
target_5b = """                    // ── Staff Balances Table ────────────────────────────────────────
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-emerald-100/80 p-6 mb-8">';
                    html += '<div class="flex items-center justify-between mb-4"><div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-wallet text-emerald-600"></i> Staff Leave Balances</h3><p class="text-xs text-gray-500 mt-0.5">Real-time balances across annual, brought forward, comp, and sick leave</p></div></div>';"""

replacement_5b = """                    // ── Staff Balances Table ────────────────────────────────────────
                    var eligibleStaff = staffList.filter(function (s) { return s.eligibleForLeave; });
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-emerald-100/80 p-6 mb-8">';
                    html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">';
                    html += '<div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-wallet text-emerald-600"></i> Staff Leave Balances</h3><p class="text-xs text-gray-500 mt-0.5">Real-time balances across annual, brought forward, comp, and sick leave</p></div>';
                    html += '<div class="flex flex-wrap items-center gap-2.5">';
                    html += '<div class="relative"><i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i><input type="text" id="hrBalancesSearchInput" placeholder="Filter staff name or dept..." class="pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"><button id="hrBalancesClearSearch" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"><i class="fas fa-times"></i></button></div>';
                    html += '<select id="hrBalancesDeptFilter" class="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="all">All Depts</option></select>';
                    html += '<span id="hrBalancesCountBadge" class="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 tabular-nums">' + eligibleStaff.length + ' staff</span>';
                    html += '</div></div>';"""

assert target_5b in content, "Target 5b not found in content!"
content = content.replace(target_5b, replacement_5b, 1)

target_5b_row = """                        html += '<tr class="hover:bg-gray-50/80 transition-colors">';"""
replacement_5b_row = """                        var balSearchText = ((s.name || '') + ' ' + (s.email || '') + ' ' + (s.department || '')).toLowerCase();
                        html += '<tr class="hover:bg-gray-50/80 transition-colors hr-balance-row" data-search="' + escapeHtml(balSearchText) + '" data-dept="' + escapeHtml((s.department || '').toLowerCase()) + '">';"""

assert target_5b_row in content, "Target 5b row not found in content!"
content = content.replace(target_5b_row, replacement_5b_row, 1)

# 5c: HR All Leave Applications Table
target_5c = """                    // ── All Applications Table ──────────────────────────────────────
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">';
                    html += '<div class="flex items-center justify-between mb-4"><div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-list-check text-blue-600"></i> All Leave Applications</h3><p class="text-xs text-gray-500 mt-0.5">Recent organizational leave filings and audit trail</p></div></div>';"""

replacement_5c = """                    // ── All Applications Table ──────────────────────────────────────
                    html += '<div class="stat-card stat-card-elevated bg-white rounded-xl shadow-sm border border-gray-200/80 p-6">';
                    html += '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">';
                    html += '<div><h3 class="text-lg font-bold text-gray-900 flex items-center gap-2"><i class="fas fa-list-check text-blue-600"></i> All Leave Applications</h3><p class="text-xs text-gray-500 mt-0.5">Recent organizational leave filings and audit trail</p></div>';
                    html += '<div class="flex flex-wrap items-center gap-2.5">';
                    html += '<div class="relative"><i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i><input type="text" id="hrAppsSearchInput" placeholder="Filter applications..." class="pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"><button id="hrAppsClearSearch" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"><i class="fas fa-times"></i></button></div>';
                    html += '<select id="hrAppsStatusFilter" class="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">';
                    html += '<option value="all">All Statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="declined">Declined</option><option value="cancelled">Cancelled</option></select>';
                    html += '<span id="hrAppsCountBadge" class="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 tabular-nums"></span>';
                    html += '</div></div>';"""

assert target_5c in content, "Target 5c not found in content!"
content = content.replace(target_5c, replacement_5c, 1)

target_5c_row = """                        html += '<tr class="hover:bg-gray-50/80 transition-colors">';
                        html += '<td class="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">' + formatDate(app.DateApplied) + '</td>';"""

replacement_5c_row = """                        var appSearchText = ((app.Name || '') + ' ' + (app.Department || '') + ' ' + (app.LeaveType || '') + ' ' + (app.Status || '') + ' ' + (app.ProcessedBy || '')).toLowerCase();
                        html += '<tr class="hover:bg-gray-50/80 transition-colors hr-app-row" data-search="' + escapeHtml(appSearchText) + '" data-status="' + escapeHtml((app.Status || '').toLowerCase()) + '">';
                        html += '<td class="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">' + formatDate(app.DateApplied) + '</td>';"""

assert target_5c_row in content, "Target 5c row not found in content!"
content = content.replace(target_5c_row, replacement_5c_row, 1)

# 5d: Attach setupHRDashboardTableFilters call and definition
target_5d = """                    pageElement.innerHTML = html;
                    renderTeamAvailabilityWallchart('hrWallchartContainer');
                    renderBlackoutPeriodsList('blackoutPeriodsList');
                    renderGazettedHolidaysList('gazettedHolidaysListContainer');

                } catch (error) {"""

replacement_5d = """                    pageElement.innerHTML = html;
                    renderTeamAvailabilityWallchart('hrWallchartContainer');
                    renderBlackoutPeriodsList('blackoutPeriodsList');
                    renderGazettedHolidaysList('gazettedHolidaysListContainer');
                    setupHRDashboardTableFilters(staffList);

                } catch (error) {"""

assert target_5d in content, "Target 5d not found in content!"
content = content.replace(target_5d, replacement_5d, 1)

# Add setupHRDashboardTableFilters function
target_5e = """            async function openMasterSpreadsheet() {"""

replacement_5e = """            function setupHRDashboardTableFilters(staffList) {
                // 1. Endorsement Queue filter
                const endSearch = document.getElementById('hrEndorsementSearchInput');
                const endClear = document.getElementById('hrEndorsementClearSearch');
                const endBadge = document.getElementById('hrEndorsementBadge');
                if (endSearch) {
                    endSearch.addEventListener('input', function() {
                        const q = endSearch.value.trim().toLowerCase();
                        if (endClear) endClear.classList.toggle('hidden', !q);
                        const rows = document.querySelectorAll('.hr-endorsement-row');
                        let visible = 0;
                        rows.forEach(r => {
                            const txt = r.getAttribute('data-search') || '';
                            if (!q || txt.includes(q)) {
                                r.style.display = '';
                                visible++;
                            } else {
                                r.style.display = 'none';
                            }
                        });
                        if (endBadge) endBadge.textContent = `${visible} of ${rows.length} Pending Sign-Off`;
                    });
                    if (endClear) {
                        endClear.addEventListener('click', () => {
                            endSearch.value = '';
                            endSearch.focus();
                            endSearch.dispatchEvent(new Event('input'));
                        });
                    }
                }

                // 2. Staff Balances filter
                const balSearch = document.getElementById('hrBalancesSearchInput');
                const balClear = document.getElementById('hrBalancesClearSearch');
                const balDept = document.getElementById('hrBalancesDeptFilter');
                const balBadge = document.getElementById('hrBalancesCountBadge');

                if (balDept && staffList && staffList.length > 0) {
                    const depts = Array.from(new Set(staffList.map(s => s.department).filter(Boolean))).sort();
                    balDept.innerHTML = '<option value="all">All Depts</option>' + depts.map(d => `<option value="${escapeHtml(d.toLowerCase())}">${escapeHtml(d)}</option>`).join('');
                }

                function filterHRBalances() {
                    const q = (balSearch ? balSearch.value : '').trim().toLowerCase();
                    const d = (balDept ? balDept.value : 'all');
                    if (balClear) balClear.classList.toggle('hidden', !q);
                    const rows = document.querySelectorAll('.hr-balance-row');
                    let visible = 0;
                    rows.forEach(r => {
                        const txt = r.getAttribute('data-search') || '';
                        const dept = r.getAttribute('data-dept') || '';
                        const matchesText = !q || txt.includes(q);
                        const matchesDept = (d === 'all' || dept === d);
                        if (matchesText && matchesDept) {
                            r.style.display = '';
                            visible++;
                        } else {
                            r.style.display = 'none';
                        }
                    });
                    if (balBadge) balBadge.textContent = `${visible} of ${rows.length} staff`;
                }

                if (balSearch) balSearch.addEventListener('input', filterHRBalances);
                if (balClear) balClear.addEventListener('click', () => { balSearch.value = ''; balSearch.focus(); filterHRBalances(); });
                if (balDept) balDept.addEventListener('change', filterHRBalances);

                // 3. All Applications filter
                const appSearch = document.getElementById('hrAppsSearchInput');
                const appClear = document.getElementById('hrAppsClearSearch');
                const appStatus = document.getElementById('hrAppsStatusFilter');
                const appBadge = document.getElementById('hrAppsCountBadge');

                function filterHRApps() {
                    const q = (appSearch ? appSearch.value : '').trim().toLowerCase();
                    const s = (appStatus ? appStatus.value : 'all');
                    if (appClear) appClear.classList.toggle('hidden', !q);
                    const rows = document.querySelectorAll('.hr-app-row');
                    let visible = 0;
                    rows.forEach(r => {
                        const txt = r.getAttribute('data-search') || '';
                        const status = r.getAttribute('data-status') || '';
                        const matchesText = !q || txt.includes(q);
                        const matchesStatus = (s === 'all' || status === s);
                        if (matchesText && matchesStatus) {
                            r.style.display = '';
                            visible++;
                        } else {
                            r.style.display = 'none';
                        }
                    });
                    if (appBadge) appBadge.textContent = `${visible} of ${rows.length} applications`;
                }

                if (appSearch) appSearch.addEventListener('input', filterHRApps);
                if (appClear) appClear.addEventListener('click', () => { appSearch.value = ''; appSearch.focus(); filterHRApps(); });
                if (appStatus) appStatus.addEventListener('change', filterHRApps);
                filterHRApps();
            }

            async function openMasterSpreadsheet() {"""

assert target_5e in content, "Target 5e not found in content!"
content = content.replace(target_5e, replacement_5e, 1)

print("Modification 5 applied successfully.")

# ==============================================================================
# MODIFICATION 6: Compensation Awards History modal table
# ==============================================================================
target_6 = """                        html += `
                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-xs text-left">"""

replacement_6 = """                        html += `
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div class="relative flex-1 max-w-xs">
                                <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]"></i>
                                <input type="text" id="compAwardsSearchInput" placeholder="Filter awards by date, reason..." class="w-full pl-7 pr-6 py-1 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <button id="compAwardsClearSearch" class="hidden absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5"><i class="fas fa-times"></i></button>
                            </div>
                            <span id="compAwardsCountBadge" class="text-[11px] font-medium text-gray-500 tabular-nums">${awards.length} awards</span>
                        </div>
                        <div class="overflow-x-auto border border-gray-200 rounded-lg">
                            <table class="w-full text-xs text-left" id="compAwardsTable">"""

assert target_6 in content, "Target 6 not found in content!"
content = content.replace(target_6, replacement_6, 1)

target_6b = """                            html += `
                            <tr class="hover:bg-gray-50 ${isRevoked ? 'opacity-50 bg-gray-50/50' : ''}">"""

replacement_6b = """                            const awardSearchText = ((dateWorked || '') + ' ' + (reason || '') + ' ' + (awardedBy || '')).toLowerCase();
                            html += `
                            <tr class="hover:bg-gray-50 comp-award-row ${isRevoked ? 'opacity-50 bg-gray-50/50' : ''}" data-search="${escapeHtml(awardSearchText)}">"""

assert target_6b in content, "Target 6b not found in content!"
content = content.replace(target_6b, replacement_6b, 1)

target_6c = """                    }

                    container.innerHTML = html;
                } catch (err) {"""

replacement_6c = """                    }

                    container.innerHTML = html;
                    setupCompAwardsFilter();
                } catch (err) {"""

assert target_6c in content, "Target 6c not found in content!"
content = content.replace(target_6c, replacement_6c, 1)

# Add setupCompAwardsFilter function
target_6d = """            async function handleRevokeCompensationAward(email, awardIndex) {"""

replacement_6d = """            function setupCompAwardsFilter() {
                const searchInp = document.getElementById('compAwardsSearchInput');
                const clearBtn = document.getElementById('compAwardsClearSearch');
                const countBadge = document.getElementById('compAwardsCountBadge');
                if (!searchInp) return;

                function filterAwards() {
                    const q = searchInp.value.trim().toLowerCase();
                    if (clearBtn) clearBtn.classList.toggle('hidden', !q);
                    const rows = document.querySelectorAll('.comp-award-row');
                    let visible = 0;
                    rows.forEach(r => {
                        const txt = r.getAttribute('data-search') || '';
                        if (!q || txt.includes(q)) {
                            r.style.display = '';
                            visible++;
                        } else {
                            r.style.display = 'none';
                        }
                    });
                    if (countBadge) countBadge.textContent = `${visible} of ${rows.length} awards`;
                }

                searchInp.addEventListener('input', filterAwards);
                if (clearBtn) clearBtn.addEventListener('click', () => { searchInp.value = ''; searchInp.focus(); filterAwards(); });
            }

            async function handleRevokeCompensationAward(email, awardIndex) {"""

assert target_6d in content, "Target 6d not found in content!"
content = content.replace(target_6d, replacement_6d, 1)

print("Modification 6 applied successfully.")

# ==============================================================================
# VALIDATION
# ==============================================================================
# Verify div balance
div_open_new = len(re.findall(r'<div\b', content, re.IGNORECASE))
div_close_new = len(re.findall(r'</div>', content, re.IGNORECASE))
print(f"New div balance: open={div_open_new}, close={div_close_new}, diff={div_open_new - div_close_new}")
assert div_open_new == div_close_new, f"DIV MISMATCH: {div_open_new} vs {div_close_new}"

# Verify other tags
for tag in ['table', 'tbody', 'thead', 'tr', 'th', 'td']:
    o = len(re.findall(r'<' + tag + r'\b', content, re.IGNORECASE))
    c = len(re.findall(r'</' + tag + r'>', content, re.IGNORECASE))
    assert o == c, f"Tag {tag} mismatch: {o} vs {c}"
    print(f"Tag {tag} verified: {o} == {c}")

# Save to temp file for node check
temp_file = 'scratch/test_Index_filtered.html'
with open(temp_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Saved modified content to {temp_file} (length: {len(content)})")
