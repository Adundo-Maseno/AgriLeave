import re
import subprocess
import shutil

def apply_updates():
    # Read Code.js
    with open('Code.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Add CALENDAR to SYSTEM
    target_sys = """    SHEETS_DATABASE: {
        FILE_NAME: 'AgriLeave Master Database & Mirror',
        SHEETS: {
            APPLICATIONS: 'Applications',
            STAFF_BALANCES: 'Staff_Balances',
            GAZETTED_HOLIDAYS: 'Gazetted_Holidays',
            AUDIT_LOG: 'Audit_Log'
        }
    },"""

    replacement_sys = """    SHEETS_DATABASE: {
        FILE_NAME: 'AgriLeave Master Database & Mirror',
        SHEETS: {
            APPLICATIONS: 'Applications',
            STAFF_BALANCES: 'Staff_Balances',
            GAZETTED_HOLIDAYS: 'Gazetted_Holidays',
            AUDIT_LOG: 'Audit_Log'
        }
    },

    CALENDAR: {
        PROPERTY_KEY: 'LEAVE_CALENDAR_ID',
        DEFAULT_CALENDAR_ID: '', // Custom Google Calendar ID (e.g. company-leaves@group.calendar.google.com); empty defaults to primary calendar
        SYNC_ENABLED: true
    },"""

    assert target_sys in code, "target_sys not found in Code.js!"
    code = code.replace(target_sys, replacement_sys, 1)

    # 2. Update CalendarSyncManager
    target_calsync = """const CalendarSyncManager = {
    getLeaveCalendar: function () {
        try {
            if (typeof CalendarApp === 'undefined') return null;
            const scriptProps = PropertiesService.getScriptProperties();
            const calId = scriptProps.getProperty('LEAVE_CALENDAR_ID');
            if (calId) {
                try {
                    const cal = CalendarApp.getCalendarById(calId);
                    if (cal) return cal;
                } catch (e) {
                    console.warn('Configured leave calendar not accessible, using default calendar');
                }
            }
            return CalendarApp.getDefaultCalendar();
        } catch (error) {
            console.warn('CalendarApp error in getLeaveCalendar:', error.message);
            return null;
        }
    },"""

    replacement_calsync = """const CalendarSyncManager = {
    getLeaveCalendarId: function () {
        try {
            // 1. Script Properties
            const scriptProps = PropertiesService.getScriptProperties();
            const key = (SYSTEM.CALENDAR && SYSTEM.CALENDAR.PROPERTY_KEY) ? SYSTEM.CALENDAR.PROPERTY_KEY : 'LEAVE_CALENDAR_ID';
            const propId = scriptProps.getProperty(key);
            if (propId && propId.trim()) return propId.trim();

            // 2. system_settings.json
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            if (settingsFile && settingsFile.data && settingsFile.data.calendarId && settingsFile.data.calendarId.trim()) {
                return settingsFile.data.calendarId.trim();
            }

            // 3. SYSTEM constant default
            if (SYSTEM.CALENDAR && SYSTEM.CALENDAR.DEFAULT_CALENDAR_ID && SYSTEM.CALENDAR.DEFAULT_CALENDAR_ID.trim()) {
                return SYSTEM.CALENDAR.DEFAULT_CALENDAR_ID.trim();
            }
        } catch (e) {
            console.warn('Error resolving calendar ID:', e.message);
        }
        return '';
    },

    getLeaveCalendar: function () {
        try {
            if (typeof CalendarApp === 'undefined') return null;
            const calId = this.getLeaveCalendarId();
            if (calId && calId !== 'primary') {
                try {
                    const cal = CalendarApp.getCalendarById(calId);
                    if (cal) return cal;
                    console.warn(`Configured leave calendar [${calId}] not accessible, falling back to default calendar`);
                } catch (e) {
                    console.warn(`CalendarApp.getCalendarById failed for [${calId}]:`, e.message);
                }
            }
            return CalendarApp.getDefaultCalendar();
        } catch (error) {
            console.warn('CalendarApp error in getLeaveCalendar:', error.message);
            return null;
        }
    },

    getCalendarStatus: function () {
        try {
            if (typeof CalendarApp === 'undefined') {
                return { configured: false, accessible: false, calendarId: null, calendarName: 'CalendarApp Unavailable', isDefault: false };
            }
            const configuredId = this.getLeaveCalendarId();
            const cal = this.getLeaveCalendar();
            if (!cal) {
                return { configured: Boolean(configuredId), accessible: false, calendarId: configuredId || null, calendarName: 'Inaccessible', isDefault: false };
            }
            const isDefault = !configuredId || configuredId === 'primary';
            return {
                configured: true,
                accessible: true,
                calendarId: configuredId || cal.getId(),
                calendarName: cal.getName(),
                isDefault: isDefault,
                timeZone: cal.getTimeZone ? cal.getTimeZone() : 'UTC'
            };
        } catch (e) {
            return { configured: false, accessible: false, calendarId: null, calendarName: 'Error: ' + e.message, isDefault: false };
        }
    },"""

    assert target_calsync in code, "target_calsync not found in Code.js!"
    code = code.replace(target_calsync, replacement_calsync, 1)

    # 3. Update DiagnosticsManager.getSystemHealth Integrations check
    target_diag_cal = """        // 6. Integrations check
        try {
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            const calId = settingsFile && settingsFile.data ? settingsFile.data.calendarId : null;
            diagnostics.integrations.calendar.configured = Boolean(calId);
            diagnostics.integrations.calendar.calendarId = calId;

            const webhookUrl = settingsFile && settingsFile.data ? settingsFile.data.chatWebhookUrl : null;
            diagnostics.integrations.chatWebhook.configured = Boolean(webhookUrl);
        } catch (iErr) {}"""

    replacement_diag_cal = """        // 6. Integrations check
        try {
            if (typeof CalendarSyncManager !== 'undefined') {
                diagnostics.integrations.calendar = CalendarSyncManager.getCalendarStatus();
            } else {
                diagnostics.integrations.calendar = { configured: false, accessible: false };
            }

            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            const webhookUrl = settingsFile && settingsFile.data ? settingsFile.data.chatWebhookUrl : null;
            diagnostics.integrations.chatWebhook.configured = Boolean(webhookUrl);
        } catch (iErr) {}"""

    assert target_diag_cal in code, "target_diag_cal not found in Code.js!"
    code = code.replace(target_diag_cal, replacement_diag_cal, 1)

    # 4. Add Calendar Integration APIs before end of Code.js
    target_api_end = """// =============================================
// END OF COMPLETE BACKEND CODE"""

    replacement_api_end = """// 21. Google Calendar Integration Settings APIs
function apiGetCalendarSettings() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view calendar integration settings.');
        }
        const status = CalendarSyncManager.getCalendarStatus();
        return Utils.createSuccessResponse(status, 'Calendar integration settings retrieved successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to retrieve calendar settings: ' + error.message);
    }
}

function apiSaveCalendarSettings(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can configure calendar integration.');
        }

        const rawCalId = (params && typeof params.calendarId === 'string') ? params.calendarId.trim() : '';
        const propKey = (SYSTEM.CALENDAR && SYSTEM.CALENDAR.PROPERTY_KEY) ? SYSTEM.CALENDAR.PROPERTY_KEY : 'LEAVE_CALENDAR_ID';
        const scriptProps = PropertiesService.getScriptProperties();

        if (rawCalId && rawCalId !== 'primary') {
            // Verify access
            if (typeof CalendarApp !== 'undefined') {
                try {
                    const testCal = CalendarApp.getCalendarById(rawCalId);
                    if (!testCal) {
                        return Utils.createErrorResponse(`Cannot access calendar with ID "${rawCalId}". Please verify the Calendar ID and ensure your account has edit permissions on it.`);
                    }
                } catch (calCheckErr) {
                    return Utils.createErrorResponse(`Failed to connect to calendar "${rawCalId}": ${calCheckErr.message}. Ensure the calendar is shared with edit access.`);
                }
            }
            scriptProps.setProperty(propKey, rawCalId);
        } else {
            // Revert to default
            scriptProps.deleteProperty(propKey);
        }

        // Also update system_settings.json for persistent dual-store configuration
        try {
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            settingsFile.data = settingsFile.data || {};
            settingsFile.data.calendarId = rawCalId || null;
            settingsFile.metadata = settingsFile.metadata || {};
            settingsFile.metadata.lastUpdated = new Date().toISOString();
            DataManager.writeDataFile(SYSTEM.DATA_FILES.SETTINGS, settingsFile);
        } catch (sErr) {
            console.warn('Failed to update system_settings.json for calendarId:', sErr.message);
        }

        Utils.logAction('CONFIG_CALENDAR', `Calendar integration updated to: ${rawCalId || 'Default Primary Calendar'}`, currentUser);
        const newStatus = CalendarSyncManager.getCalendarStatus();
        return Utils.createSuccessResponse(newStatus, rawCalId ? `Connected to calendar "${newStatus.calendarName}" (${rawCalId})` : 'Reverted to default primary calendar');
    } catch (error) {
        return Utils.createErrorResponse('Failed to save calendar settings: ' + error.message);
    }
}

function apiTestCalendarConnection(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized.');
        }

        const testId = (params && params.calendarId) ? params.calendarId.trim() : CalendarSyncManager.getLeaveCalendarId();
        if (typeof CalendarApp === 'undefined') {
            return Utils.createErrorResponse('CalendarApp service is not available in this environment.');
        }

        let cal = null;
        if (testId && testId !== 'primary') {
            cal = CalendarApp.getCalendarById(testId);
            if (!cal) {
                return Utils.createErrorResponse(`Could not find calendar "${testId}". Check that the ID is correct and shared with this Apps Script.`);
            }
        } else {
            cal = CalendarApp.getDefaultCalendar();
        }

        if (!cal) {
            return Utils.createErrorResponse('Default calendar is inaccessible.');
        }

        // Test event creation and deletion
        const testTitle = '🔍 [AgriLeave Connection Test]';
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const testEvent = cal.createAllDayEvent(testTitle, now, tomorrow, {
            description: 'Automated permission test by AgriLeave Leave Management System. Deleting immediately.'
        });

        if (testEvent) {
            testEvent.deleteEvent();
        }

        return Utils.createSuccessResponse({
            calendarId: cal.getId(),
            calendarName: cal.getName(),
            timeZone: cal.getTimeZone ? cal.getTimeZone() : 'UTC',
            isDefault: !testId || testId === 'primary'
        }, `Read & write permissions verified on calendar: "${cal.getName()}"`);
    } catch (error) {
        return Utils.createErrorResponse('Calendar test failed: ' + error.message);
    }
}

// =============================================
// END OF COMPLETE BACKEND CODE"""

    assert target_api_end in code, "target_api_end not found in Code.js!"
    code = code.replace(target_api_end, replacement_api_end, 1)

    with open('Code.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Code.js updated successfully.")

    # =========================================================================
    # 5. Update Index.html
    # =========================================================================
    with open('Index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # In systemDiagnosticsModal, add calendar configuration card right above triggers list
    target_modal_html = """                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="diagnosticsCardsGrid">
                            <!-- Loaded dynamically -->
                        </div>"""

    replacement_modal_html = """                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="diagnosticsCardsGrid">
                            <!-- Loaded dynamically -->
                        </div>

                        <!-- Google Calendar Integration Settings Card -->
                        <div class="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3.5 shadow-xs">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div>
                                    <h4 class="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                        <i class="far fa-calendar-alt text-emerald-600"></i> Google Calendar Synchronization
                                    </h4>
                                    <p class="text-[11px] text-gray-500">Auto-publishes all approved leaves and deletes cancelled leaves</p>
                                </div>
                                <span id="calendarStatusBadge" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Checking...</span>
                            </div>

                            <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-2">
                                <div class="flex items-center justify-between flex-wrap gap-1">
                                    <span class="text-gray-600">Active Calendar:</span>
                                    <span id="calendarActiveName" class="font-bold text-gray-900 tabular-nums">—</span>
                                </div>
                                <div class="flex items-center justify-between flex-wrap gap-1">
                                    <span class="text-gray-600">Calendar ID:</span>
                                    <code id="calendarActiveId" class="text-[11px] font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">—</code>
                                </div>
                            </div>

                            <div>
                                <label for="calendarIdInput" class="block text-xs font-semibold text-gray-700 mb-1">Company / Shared Leave Calendar ID (Optional)</label>
                                <div class="flex flex-col sm:flex-row items-stretch gap-2">
                                    <div class="relative flex-1">
                                        <i class="fas fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                        <input type="text" id="calendarIdInput" placeholder="leave-calendar@group.calendar.google.com (or blank for Primary)" class="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
                                    </div>
                                    <button type="button" onclick="handleSaveCalendarSettings()" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                                        <i class="fas fa-save text-[10px]"></i> Save ID
                                    </button>
                                    <button type="button" onclick="handleTestCalendarConnection()" class="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 active:scale-95 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                                        <i class="fas fa-vial text-emerald-600 text-[10px]"></i> Test Access
                                    </button>
                                    <button type="button" onclick="handleResetCalendarToDefault()" class="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium transition-all whitespace-nowrap" title="Reset to Primary Default Calendar">
                                        Reset
                                    </button>
                                </div>
                                <p class="text-[10px] text-gray-400 mt-1">Leave blank to use the primary calendar of the administrator. To route leaves to a shared company calendar, paste its Google Calendar ID.</p>
                            </div>
                        </div>"""

    assert target_modal_html in html, "target_modal_html not found in Index.html!"
    html = html.replace(target_modal_html, replacement_modal_html, 1)

    # In loadSystemDiagnostics, update calendar info
    target_diag_render = """                                    <div class="flex items-center justify-between">
                                        <span>Google Calendar:</span>
                                        <span class="${d.integrations.calendar.configured ? 'text-emerald-600' : 'text-gray-400'} font-semibold">${d.integrations.calendar.configured ? '✓ Configured' : 'Optional / Default'}</span>
                                    </div>"""

    replacement_diag_render = """                                    <div class="flex items-center justify-between">
                                        <span>Google Calendar:</span>
                                        <span class="${d.integrations.calendar.accessible ? 'text-emerald-600' : 'text-amber-600'} font-semibold">${d.integrations.calendar.accessible ? (d.integrations.calendar.isDefault ? '✓ Primary (Default)' : '✓ Connected') : 'Inaccessible'}</span>
                                    </div>"""

    assert target_diag_render in html, "target_diag_render not found in Index.html!"
    html = html.replace(target_diag_render, replacement_diag_render, 1)

    # In loadSystemDiagnostics JavaScript logic, update the card elements
    target_diag_js = """                        if (triggersList) {"""

    replacement_diag_js = """                        // Update Google Calendar Settings Card
                        const calBadge = document.getElementById('calendarStatusBadge');
                        const calName = document.getElementById('calendarActiveName');
                        const calId = document.getElementById('calendarActiveId');
                        const calInput = document.getElementById('calendarIdInput');

                        if (d.integrations && d.integrations.calendar) {
                            const cal = d.integrations.calendar;
                            if (calBadge) {
                                if (cal.accessible) {
                                    calBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800';
                                    calBadge.innerHTML = cal.isDefault ? '<i class="fas fa-check mr-1"></i> Default Primary' : '<i class="fas fa-check-circle mr-1"></i> Custom Calendar';
                                } else {
                                    calBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800';
                                    calBadge.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> Needs Review';
                                }
                            }
                            if (calName) calName.textContent = cal.calendarName || (cal.isDefault ? 'Primary Calendar' : 'Custom');
                            if (calId) calId.textContent = cal.calendarId || 'primary';
                            if (calInput && !calInput.value) {
                                calInput.value = (cal.isDefault || !cal.calendarId) ? '' : cal.calendarId;
                            }
                        }

                        if (triggersList) {"""

    assert target_diag_js in html, "target_diag_js not found in Index.html!"
    html = html.replace(target_diag_js, replacement_diag_js, 1)

    # Add Calendar handlers functions to Index.html
    target_handler_anchor = """            async function handleInstallSystemTriggers() {"""

    replacement_handler_anchor = """            async function handleSaveCalendarSettings() {
                const input = document.getElementById('calendarIdInput');
                const calendarId = input ? input.value.trim() : '';

                showLoading(calendarId ? 'Verifying & connecting Google Calendar...' : 'Resetting to primary default calendar...');
                try {
                    const res = await callGoogleScriptFunction('apiSaveCalendarSettings', { calendarId: calendarId });
                    hideLoading();
                    if (res.success) {
                        showToast('success', 'Calendar Configured', res.message || 'Calendar integration updated successfully');
                        loadSystemDiagnostics();
                    } else {
                        showToast('error', 'Calendar Setup Failed', res.error || 'Failed to update calendar integration');
                    }
                } catch (err) {
                    hideLoading();
                    showToast('error', 'Error', err.message);
                }
            }

            async function handleTestCalendarConnection() {
                const input = document.getElementById('calendarIdInput');
                const calendarId = input ? input.value.trim() : '';

                showLoading('Testing Google Calendar permissions...');
                try {
                    const res = await callGoogleScriptFunction('apiTestCalendarConnection', { calendarId: calendarId });
                    hideLoading();
                    if (res.success) {
                        const data = res.data || {};
                        showToast('success', 'Connection Verified', `Verified read/write access to "${data.calendarName}" (${data.timeZone})`);
                    } else {
                        showToast('error', 'Test Failed', res.error || 'Could not verify calendar permissions');
                    }
                } catch (err) {
                    hideLoading();
                    showToast('error', 'Error', err.message);
                }
            }

            async function handleResetCalendarToDefault() {
                const input = document.getElementById('calendarIdInput');
                if (input) input.value = '';
                handleSaveCalendarSettings();
            }

            async function handleInstallSystemTriggers() {"""

    assert target_handler_anchor in html, "target_handler_anchor not found in Index.html!"
    html = html.replace(target_handler_anchor, replacement_handler_anchor, 1)

    # Expose to window
    target_win_anchor = """window.handleInstallSystemTriggers = handleInstallSystemTriggers;"""
    replacement_win_anchor = """window.handleSaveCalendarSettings = handleSaveCalendarSettings;
            window.handleTestCalendarConnection = handleTestCalendarConnection;
            window.handleResetCalendarToDefault = handleResetCalendarToDefault;
            window.handleInstallSystemTriggers = handleInstallSystemTriggers;"""

    assert target_win_anchor in html, "target_win_anchor not found in Index.html!"
    html = html.replace(target_win_anchor, replacement_win_anchor, 1)

    with open('Index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Index.html updated successfully.")

if __name__ == '__main__':
    apply_updates()
