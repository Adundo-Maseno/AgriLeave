// =============================================
// AGRI EXPERIENCE LEAVE MANAGEMENT SYSTEM
// COMPLETE BACKEND CODE - VERSION 3.4.0
// CRYSTAL CLEAR NAMING - NO AMBIGUOUS FIELDS
// =============================================

// =============================================
// CONFIGURATION (Loads First)
// =============================================

const SYSTEM = {
    NAME: 'Agri Experience Leave Management System',
    VERSION: '3.4.0',
    ORGANIZATION: 'Agri Experience',
    ADMIN_EMAIL: 'info@agri-experience.com',
    FOLDER_NAME: 'Agri Experience Leave System',

    ROLES: {
        ADMIN: 'admin',
        HR: 'hr',
        SUPERVISOR: 'supervisor',
        STAFF: 'staff'
    },

    STATUS: {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        DECLINED: 'Declined',
        CANCELLED: 'Cancelled'
    },

    LEAVE_TYPES: {
        ANNUAL: 'Annual Leave',
        SICK: 'Sick Leave',
        COMPENSATION: 'Compensation Leave',
        MATERNITY: 'Maternity Leave',
        PATERNITY: 'Paternity Leave',
        COMPASSIONATE: 'Compassionate Leave',
        STUDY: 'Study Leave'
    },

    CATEGORIES: {
        ANNUAL: 'annual',
        SICK: 'sick',
        BROUGHT_FORWARD: 'broughtForward',
        COMPENSATION: 'compensation'
    },

    LEAVE_POLICY: {
        ANNUAL_ALLOCATION: 21,
        MONTHLY_ACCRUAL_RATE: 1.75,
        SICK_LEAVE: 7,
        MAX_CARRY_FORWARD: 21,
        WORKING_HOURS_PER_DAY: 8,
        MIN_LEAVE_DURATION: 0.5,
        MIN_LEAVE_HOURS: 1,
        MAX_LEAVE_HOURS: 8
    },

    DATA_FILES: {
        STAFF: 'staff_data.json',
        APPLICATIONS: 'leave_applications.json',
        ARCHIVE: 'leave_applications_archive.json',
        SETTINGS: 'system_settings.json',
        LOGS: 'system_logs.json',
        ANNUAL_RESET: 'annual_reset_logs.json',
        COMPENSATION_CLAIMS: 'compensation_claims.json',
        BLACKOUT_PERIODS: 'blackout_periods.json',
        GAZETTED_HOLIDAYS: 'gazetted_holidays.json'
    },

    SHEETS_DATABASE: {
        FILE_NAME: 'AgriLeave Master Database & Mirror',
        SHEETS: {
            APPLICATIONS: 'Applications',
            STAFF_BALANCES: 'Staff_Balances',
            GAZETTED_HOLIDAYS: 'Gazetted_Holidays',
            AUDIT_LOG: 'Audit_Log'
        }
    },

    CACHE_KEYS: {
        ALL_STAFF: 'all_staff_data',
        ALL_APPLICATIONS: 'all_applications_data',
        SYSTEM_SETTINGS: 'system_settings_data',
        STAFF_BALANCE_PREFIX: 'staff_balance_',
        DASHBOARD_PREFIX: 'dashboard_',
        SUPERVISOR_STATS_PREFIX: 'supervisor_stats_',
        PERFORMANCE_STATS: 'performance_stats'
    },

    PERFORMANCE: {
        CACHE_TTL: {
            STAFF: 300,
            APPLICATIONS: 60,
            BALANCE: 120,
            DASHBOARD: 60,
            SETTINGS: 1800,
            FILE_CACHE: 5,
            INDEXES: 300
        },
        FILE_CACHE: {
            MAX_SIZE: 50,
            MAX_AGE: 5000
        },
        INDEXES: {
            AUTO_REBUILD: true,
            ENABLED: true
        },
        MONITORING: {
            SLOW_OPERATION_THRESHOLD: 1000,
            LOG_SLOW_OPERATIONS: true,
            STATS_INTERVAL: 300000
        }
    }
};

// =============================================
// UTILITY FUNCTIONS (Loads First)
// =============================================

const Utils = {
    createSuccessResponse: function (data, message = 'Operation successful') {
        return {
            success: true,
            data: data,
            message: message,
            timestamp: new Date().toISOString()
        };
    },

    createErrorResponse: function (message, error = null) {
        console.error('❌ Error:', message, error);
        return {
            success: false,
            error: message,
            details: error ? error.toString() : null,
            timestamp: new Date().toISOString()
        };
    },

    logAction: function (action, details, performedBy = null) {
        try {
            const logFile = DataManager.readDataFile(SYSTEM.DATA_FILES.LOGS);
            const logEntry = {
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                performedBy: performedBy || Session.getActiveUser().getEmail()
            };
            logFile.data.push(logEntry);
            DataManager.writeDataFile(SYSTEM.DATA_FILES.LOGS, logFile);
        } catch (error) {
            console.error('Error logging action:', error);
        }
    },

    isValidEmail: function (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    formatDateForDisplay: function (dateInput) {
        if (!dateInput) return '';
        const d = this.parseLocalDate(dateInput);
        if (!d || isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    formatLocalDate: function (dateInput) {
        if (!dateInput) return '';
        const d = this.parseLocalDate(dateInput);
        if (!d || isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    parseLocalDate: function (dateInput) {
        if (!dateInput) return null;
        if (dateInput instanceof Date) {
            return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
        }
        if (typeof dateInput === 'string') {
            if (!dateInput.includes('T')) {
                const parts = dateInput.split(/[-/]/);
                if (parts.length === 3) {
                    const y = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10) - 1;
                    const d = parseInt(parts[2], 10);
                    return new Date(y, m, d);
                }
            }
        }
        const d = new Date(dateInput);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    },

    getPublicHolidayDetails: function (date) {
        const d = this.parseLocalDate(date);
        if (!d || isNaN(d.getTime())) return null;

        const year = d.getFullYear();
        const month = d.getMonth();
        const dateNum = d.getDate();

        // 1. Dynamic Easter Holidays (Good Friday = Easter - 2 days, Easter Monday = Easter + 1 day)
        const easter = this.calculateEasterDate(year);
        const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2);
        const easterMonday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + 1);

        if (month === goodFriday.getMonth() && dateNum === goodFriday.getDate()) {
            return { name: 'Good Friday', isHoliday: true };
        }
        if (month === easterMonday.getMonth() && dateNum === easterMonday.getDate()) {
            return { name: 'Easter Monday', isHoliday: true };
        }

        // 2. Fixed Kenya Public Holidays [month (0-11), day (1-31)]
        const fixedHolidays = [
            { month: 0, day: 1, name: "New Year's Day" },
            { month: 4, day: 1, name: "Labour Day" },
            { month: 5, day: 1, name: "Madaraka Day" },
            { month: 9, day: 10, name: "Utamaduni / Mazingira Day" },
            { month: 9, day: 20, name: "Mashujaa Day" },
            { month: 11, day: 12, name: "Jamhuri Day" },
            { month: 11, day: 25, name: "Christmas Day" },
            { month: 11, day: 26, name: "Boxing Day" }
        ];

        for (const h of fixedHolidays) {
            if (month === h.month && dateNum === h.day) {
                return { name: h.name, isHoliday: true };
            }
            // Sunday carryover rule: in Kenya (Public Holidays Act, Cap 110, Section 4),
            // if a public holiday falls on a Sunday, it is carried forward to Monday.
            // If Christmas Day (Dec 25) falls on Sunday, then Boxing Day is Monday Dec 26,
            // and Christmas Day is observed on the next succeeding business day: Tuesday Dec 27.
            const hDate = new Date(year, h.month, h.day);
            if (hDate.getDay() === 0) {
                let carryDays = 1;
                if (h.month === 11 && h.day === 25) {
                    carryDays = 2; // Tuesday Dec 27 because Monday Dec 26 is already Boxing Day
                }
                const obsDate = new Date(year, h.month, h.day + carryDays);
                if (month === obsDate.getMonth() && dateNum === obsDate.getDate()) {
                    return { name: `${h.name} (Observed)`, isHoliday: true };
                }
            }
        }

        // 3. Custom HR-Gazetted Public Holidays (from gazetted_holidays.json)
        try {
            if (typeof HolidayManager !== 'undefined' && HolidayManager.getAllCustomHolidays) {
                const dateStr = this.formatLocalDate(d);
                const customHols = HolidayManager.getAllCustomHolidays();
                const matched = customHols.find(ch => ch.date === dateStr);
                if (matched) {
                    return { name: matched.name, isHoliday: true, isCustom: true };
                }
            }
        } catch (e) {
            // Non-fatal if storage not yet initialized
        }

        return null;
    },

    isPublicHoliday: function (date) {
        return this.getPublicHolidayDetails(date) !== null;
    },

    getHolidaysInRange: function (startDate, endDate) {
        const start = this.parseLocalDate(startDate);
        const end = this.parseLocalDate(endDate);
        if (!start || !end || start > end) return [];

        const holidays = [];
        const current = new Date(start.getTime());

        while (current <= end) {
            const hol = this.getPublicHolidayDetails(current);
            if (hol) {
                const day = current.getDay();
                holidays.push({
                    date: this.formatLocalDate(current),
                    name: hol.name,
                    dayOfWeek: day,
                    isWeekend: day === 0 || day === 6
                });
            }
            current.setDate(current.getDate() + 1);
        }
        return holidays;
    },

    getBusinessDays: function (startDate, endDate) {
        const start = this.parseLocalDate(startDate);
        const end = this.parseLocalDate(endDate);
        if (!start || !end || start > end) return 0;

        let count = 0;
        const current = new Date(start.getTime());

        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6 && !this.isPublicHoliday(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    },

    getCalendarDays: function (startDate, endDate) {
        const start = this.parseLocalDate(startDate);
        const end = this.parseLocalDate(endDate);
        if (!start || !end || start > end) return 0;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },

    calculateEasterDate: function (year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    },

    getEasterExpiryDate: function (bfOrYear) {
        if (typeof bfOrYear === 'number') {
            return this.calculateEasterDate(bfOrYear);
        }
        if (bfOrYear && typeof bfOrYear === 'object') {
            if (bfOrYear instanceof Date) {
                return new Date(bfOrYear.getFullYear(), bfOrYear.getMonth(), bfOrYear.getDate());
            }
            // Year of acquisition is yearEarned. Easter of next year after year of acquisition:
            if (bfOrYear.yearEarned) {
                return this.calculateEasterDate(parseInt(bfOrYear.yearEarned, 10) + 1);
            }
            if (bfOrYear.yearExpires) {
                return this.calculateEasterDate(parseInt(bfOrYear.yearExpires, 10));
            }
            if (bfOrYear.expiryDate) {
                const parsed = this.parseLocalDate(bfOrYear.expiryDate);
                if (parsed && !isNaN(parsed.getTime())) return parsed;
            }
        }
        const currentYear = new Date().getFullYear();
        return this.calculateEasterDate(currentYear);
    },

    generateNameFromEmail: function (email) {
        if (!email || typeof email !== 'string') return '';
        return email.split('@')[0]
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    },

    checkPermission: function (requiredRoles, userRole = null) {
        try {
            const currentUserRole = userRole || StaffManager.getUserRole();
            if (!currentUserRole) return false;
            if (Array.isArray(requiredRoles)) {
                return requiredRoles.includes(currentUserRole);
            }
            return currentUserRole === requiredRoles;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    },

    getCurrentYear: function () {
        return new Date().getFullYear();
    }
};

// =============================================
// ENHANCED CACHE MANAGER WITH PERFORMANCE OPTIMIZATIONS
// =============================================

const EnhancedCacheManager = {
    memory: new Map(),
    timestamps: new Map(),
    statistics: {
        hits: 0,
        misses: 0,
        sets: 0,
        evictions: 0,
        byType: new Map()
    },
    fileCache: new Map(),
    fileCacheTimestamps: new Map(),
    fileCacheOrder: [],

    indexes: {
        staffByEmail: new Map(),
        applicationsByEmail: new Map(),
        applicationsBySupervisor: new Map(),
        applicationsByStatus: new Map(),
        applicationsByEmailStatus: new Map(),
        lastRebuilt: new Map()
    },

    balanceCache: new Map(),
    balanceCacheTimestamps: new Map(),
    performanceLog: [],
    fileCacheStats: { hits: 0, misses: 0 },

    initialize: function () {
        console.log('🚀 Initializing Enhanced Cache Manager...');
        this.clearAll();
        this.warmCache();
        this.startCleanupInterval();
        this.startPerformanceMonitoring();
    },

    getDistributedCache: function (key) {
        try {
            if (typeof CacheService === 'undefined' || !CacheService.getScriptCache) return null;
            const cache = CacheService.getScriptCache();
            const val = cache.get(key);
            if (val) {
                return JSON.parse(val);
            }
        } catch (e) {
            console.warn(`Distributed cache read error for ${key}:`, e.message);
        }
        return null;
    },

    setDistributedCache: function (key, value, ttlSeconds) {
        try {
            if (typeof CacheService === 'undefined' || !CacheService.getScriptCache) return false;
            const cache = CacheService.getScriptCache();
            const str = JSON.stringify(value);
            // CacheService allows max 100KB per key
            if (str.length < 95000) {
                const ttl = Math.min(Math.max(ttlSeconds || 300, 1), 21600); // 1s to 6 hours
                cache.put(key, str, ttl);
                return true;
            }
        } catch (e) {
            console.warn(`Distributed cache write error for ${key}:`, e.message);
        }
        return false;
    },

    removeDistributedCache: function (key) {
        try {
            if (typeof CacheService === 'undefined' || !CacheService.getScriptCache) return;
            CacheService.getScriptCache().remove(key);
        } catch (e) {
            console.warn(`Distributed cache remove error for ${key}:`, e.message);
        }
    },

    get: function (key, useFileCache = false) {
        const cacheType = this.getCacheType(key);
        if (useFileCache) return this.getFileCache(key);

        // Tier 1: Local RAM Memory Map (0ms)
        const item = this.memory.get(key);
        const timestamp = this.timestamps.get(key);
        const ttl = this.getTTLForKey(key);
        if (item && timestamp) {
            const age = Date.now() - timestamp;
            if (age < ttl * 1000) {
                this.statistics.hits++;
                this.incrementTypeStat(cacheType, 'hits');
                return item;
            }
            this.memory.delete(key);
            this.timestamps.delete(key);
            this.statistics.evictions++;
            this.incrementTypeStat(cacheType, 'evictions');
        }

        // Tier 2: Google CacheService across concurrent user sessions (~15ms)
        const distItem = this.getDistributedCache(key);
        if (distItem !== null && distItem !== undefined) {
            this.memory.set(key, distItem);
            this.timestamps.set(key, Date.now());
            this.statistics.hits++;
            this.incrementTypeStat(cacheType, 'hits');
            return distItem;
        }

        this.statistics.misses++;
        this.incrementTypeStat(cacheType, 'misses');
        return null;
    },

    set: function (key, value, ttl = null) {
        const cacheType = this.getCacheType(key);
        this.memory.set(key, value);
        this.timestamps.set(key, Date.now());
        const effectiveTtl = ttl || this.getTTLForKey(key);
        this.setDistributedCache(key, value, effectiveTtl);
        this.statistics.sets++;
        this.incrementTypeStat(cacheType, 'sets');
        return true;
    },

    getFileCache: function (fileName) {
        this.fileCacheStats.misses++;
        const item = this.fileCache.get(fileName);
        const timestamp = this.fileCacheTimestamps.get(fileName);
        if (item && timestamp) {
            const age = Date.now() - timestamp;
            if (age < SYSTEM.PERFORMANCE.FILE_CACHE.MAX_AGE) {
                this.fileCacheStats.hits++;
                this.fileCacheStats.misses--;
                this.updateFileCacheOrder(fileName);
                return item;
            }
            this.fileCache.delete(fileName);
            this.fileCacheTimestamps.delete(fileName);
            this.removeFromFileCacheOrder(fileName);
        }
        return null;
    },

    setFileCache: function (fileName, data) {
        if (this.fileCache.size >= SYSTEM.PERFORMANCE.FILE_CACHE.MAX_SIZE) {
            const lruKey = this.fileCacheOrder.shift();
            if (lruKey) {
                this.fileCache.delete(lruKey);
                this.fileCacheTimestamps.delete(lruKey);
            }
        }
        this.fileCache.set(fileName, data);
        this.fileCacheTimestamps.set(fileName, Date.now());
        this.updateFileCacheOrder(fileName);
        return true;
    },

    updateFileCacheOrder: function (fileName) {
        this.removeFromFileCacheOrder(fileName);
        this.fileCacheOrder.push(fileName);
    },

    removeFromFileCacheOrder: function (fileName) {
        const index = this.fileCacheOrder.indexOf(fileName);
        if (index > -1) this.fileCacheOrder.splice(index, 1);
    },

    getTTLForKey: function (key) {
        if (key.includes(SYSTEM.CACHE_KEYS.ALL_STAFF) || key.includes(SYSTEM.CACHE_KEYS.STAFF_BALANCE_PREFIX)) {
            return SYSTEM.PERFORMANCE.CACHE_TTL.STAFF;
        } else if (key.includes(SYSTEM.CACHE_KEYS.ALL_APPLICATIONS)) {
            return SYSTEM.PERFORMANCE.CACHE_TTL.APPLICATIONS;
        } else if (key.includes(SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS)) {
            return SYSTEM.PERFORMANCE.CACHE_TTL.SETTINGS;
        } else if (key.includes(SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX)) {
            return SYSTEM.PERFORMANCE.CACHE_TTL.DASHBOARD;
        }
        return 300;
    },

    getCacheType: function (key) {
        if (key.includes(SYSTEM.CACHE_KEYS.ALL_STAFF)) return 'staff';
        if (key.includes(SYSTEM.CACHE_KEYS.STAFF_BALANCE_PREFIX)) return 'balance';
        if (key.includes(SYSTEM.CACHE_KEYS.ALL_APPLICATIONS)) return 'applications';
        if (key.includes(SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS)) return 'settings';
        if (key.includes(SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX)) return 'dashboard';
        return 'general';
    },

    incrementTypeStat: function (type, stat) {
        if (!this.statistics.byType.has(type)) {
            this.statistics.byType.set(type, { hits: 0, misses: 0, sets: 0, evictions: 0 });
        }
        const typeStats = this.statistics.byType.get(type);
        typeStats[stat]++;
    },

    getBalance: function (email) {
        const cacheKey = `balance_${email}`;
        const cached = this.balanceCache.get(cacheKey);
        const timestamp = this.balanceCacheTimestamps.get(cacheKey);
        if (cached && timestamp) {
            const age = Date.now() - timestamp;
            if (age < SYSTEM.PERFORMANCE.CACHE_TTL.BALANCE * 1000) return cached;
            this.balanceCache.delete(cacheKey);
            this.balanceCacheTimestamps.delete(cacheKey);
        }
        // Tier 2: Check distributed CacheService
        const distCached = this.getDistributedCache(cacheKey);
        if (distCached) {
            this.balanceCache.set(cacheKey, distCached);
            this.balanceCacheTimestamps.set(cacheKey, Date.now());
            return distCached;
        }
        return null;
    },

    setBalance: function (email, balanceData) {
        const cacheKey = `balance_${email}`;
        this.balanceCache.set(cacheKey, balanceData);
        this.balanceCacheTimestamps.set(cacheKey, Date.now());
        this.setDistributedCache(cacheKey, balanceData, SYSTEM.PERFORMANCE.CACHE_TTL.BALANCE);
        return true;
    },

    clearBalance: function (email) {
        const cacheKey = `balance_${email}`;
        this.balanceCache.delete(cacheKey);
        this.balanceCacheTimestamps.delete(cacheKey);
        this.removeDistributedCache(cacheKey);
    },

    warmCache: function () {
        console.log('🔥 Warming cache...');
        try {
            const settings = ConfigManager.getSettings();
            this.set(SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS, settings);
            console.log('✅ Cache warmed successfully');
        } catch (error) {
            console.error('❌ Cache warming failed:', error);
        }
    },

    clear: function (key) {
        this.memory.delete(key);
        this.timestamps.delete(key);
        this.removeDistributedCache(key);
        if (key.includes('staff') || key === SYSTEM.CACHE_KEYS.ALL_STAFF) {
            this.clearPattern('balance_');
            this.clearBalanceIndexes();
        }
        if (key.includes('file_')) {
            this.fileCache.clear();
            this.fileCacheTimestamps.clear();
            this.fileCacheOrder = [];
        }
        return true;
    },

    clearPattern: function (pattern) {
        for (const key of this.memory.keys()) {
            if (key.includes(pattern)) {
                this.memory.delete(key);
                this.timestamps.delete(key);
                this.removeDistributedCache(key);
            }
        }
        for (const key of this.balanceCache.keys()) {
            if (key.includes(pattern)) {
                this.balanceCache.delete(key);
                this.balanceCacheTimestamps.delete(key);
                this.removeDistributedCache(key);
            }
        }
    },

    clearAll: function () {
        this.memory.clear();
        this.timestamps.clear();
        this.fileCache.clear();
        this.fileCacheTimestamps.clear();
        this.fileCacheOrder = [];
        this.balanceCache.clear();
        this.balanceCacheTimestamps.clear();
        this.clearAllIndexes();
        try {
            if (typeof CacheService !== 'undefined' && CacheService.getScriptCache) {
                const sc = CacheService.getScriptCache();
                if (typeof sc.clear === 'function') {
                    sc.clear();
                } else {
                    const knownKeys = [
                        SYSTEM.CACHE_KEYS.ALL_STAFF,
                        SYSTEM.CACHE_KEYS.ALL_APPLICATIONS,
                        SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS,
                        SYSTEM.CACHE_KEYS.PERFORMANCE_STATS
                    ];
                    sc.removeAll(knownKeys);
                }
            }
        } catch (e) {
            console.warn('Error clearing distributed cache:', e.message);
        }
        this.statistics = { hits: 0, misses: 0, sets: 0, evictions: 0, byType: new Map() };
        this.fileCacheStats = { hits: 0, misses: 0 };
        console.log('🧹 All caches cleared');
        return true;
    },

    buildIndexes: function () {
        if (!SYSTEM.PERFORMANCE.INDEXES.ENABLED) return;
        const startTime = Date.now();
        try {
            const staffData = StaffManager.getAllStaffData();
            this.indexes.staffByEmail.clear();
            staffData.forEach(staff => {
                if (staff.Email) this.indexes.staffByEmail.set(staff.Email.toLowerCase(), staff);
            });

            const applications = ApplicationsManager.getAllApplicationsData({});
            this.indexes.applicationsByEmail.clear();
            this.indexes.applicationsBySupervisor.clear();
            this.indexes.applicationsByStatus.clear();
            this.indexes.applicationsByEmailStatus.clear();

            applications.forEach(app => {
                if (app.Email) {
                    const emailKey = app.Email.toLowerCase();
                    if (!this.indexes.applicationsByEmail.has(emailKey)) {
                        this.indexes.applicationsByEmail.set(emailKey, []);
                    }
                    this.indexes.applicationsByEmail.get(emailKey).push(app);

                    const emailStatusKey = `${emailKey}_${app.Status}`;
                    if (!this.indexes.applicationsByEmailStatus.has(emailStatusKey)) {
                        this.indexes.applicationsByEmailStatus.set(emailStatusKey, []);
                    }
                    this.indexes.applicationsByEmailStatus.get(emailStatusKey).push(app);
                }
                if (app.SupervisorEmail) {
                    const supervisorKey = app.SupervisorEmail.toLowerCase();
                    if (!this.indexes.applicationsBySupervisor.has(supervisorKey)) {
                        this.indexes.applicationsBySupervisor.set(supervisorKey, []);
                    }
                    this.indexes.applicationsBySupervisor.get(supervisorKey).push(app);
                }
                if (app.Status) {
                    if (!this.indexes.applicationsByStatus.has(app.Status)) {
                        this.indexes.applicationsByStatus.set(app.Status, []);
                    }
                    this.indexes.applicationsByStatus.get(app.Status).push(app);
                }
            });

            this.indexes.lastRebuilt.set('staff', Date.now());
            this.indexes.lastRebuilt.set('applications', Date.now());
            this.logOperation('buildIndexes', startTime, { duration: Date.now() - startTime });
        } catch (error) {
            console.error('❌ Error building indexes:', error);
        }
    },

    clearAllIndexes: function () {
        this.indexes.staffByEmail.clear();
        this.indexes.applicationsByEmail.clear();
        this.indexes.applicationsBySupervisor.clear();
        this.indexes.applicationsByStatus.clear();
        this.indexes.applicationsByEmailStatus.clear();
        this.indexes.lastRebuilt.clear();
    },

    clearBalanceIndexes: function () {
        this.balanceCache.clear();
        this.balanceCacheTimestamps.clear();
    },

    getUserByEmail: function (email) {
        if (!email) return null;
        if (SYSTEM.PERFORMANCE.INDEXES.ENABLED) {
            const indexedUser = this.indexes.staffByEmail.get(email.toLowerCase());
            if (indexedUser) return indexedUser;
        }
        const staffData = StaffManager.getAllStaffData();
        return staffData.find(member =>
            member.Email && member.Email.toLowerCase().trim() === email.toLowerCase().trim()
        ) || null;
    },

    getApplicationsByEmail: function (email, filters = {}) {
        console.log('getApplicationsByEmail called with:', { email, filters });

        if (!email) {
            console.log('No email provided');
            return [];
        }

        const emailKey = email.toLowerCase().trim();
        console.log('Normalized email key:', emailKey);

        let applications = [];

        // Try to get from indexes first
        if (SYSTEM.PERFORMANCE.INDEXES.ENABLED) {
            console.log('Using indexes to find applications');

            if (filters.status) {
                const emailStatusKey = `${emailKey}_${filters.status}`;
                applications = this.indexes.applicationsByEmailStatus.get(emailStatusKey) || [];
                console.log(`Found ${applications.length} applications via email+status index`);
            } else {
                applications = this.indexes.applicationsByEmail.get(emailKey) || [];
                console.log(`Found ${applications.length} applications via email index`);
            }

            // If indexes return empty but we know there should be data, rebuild and try again
            if (applications.length === 0) {
                console.log('Indexes returned empty, checking if rebuild needed...');

                // Quick check if file has data
                const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
                const fileMatches = appsFile.data.filter(app =>
                    app.Email && app.Email.toLowerCase().trim() === emailKey
                );

                if (fileMatches.length > 0) {
                    console.log(`Found ${fileMatches.length} applications in file but not in index. Rebuilding...`);
                    this.buildIndexes();

                    // Try again after rebuild
                    if (filters.status) {
                        const emailStatusKey = `${emailKey}_${filters.status}`;
                        applications = this.indexes.applicationsByEmailStatus.get(emailStatusKey) || [];
                    } else {
                        applications = this.indexes.applicationsByEmail.get(emailKey) || [];
                    }
                    console.log(`After rebuild: found ${applications.length} applications`);
                }
            }

            applications = this.applyApplicationFilters(applications, filters);
        } else {
            // Fallback to scanning all applications
            console.log('Indexes disabled, scanning all applications');
            const allApplications = ApplicationsManager.getAllApplicationsData({});
            applications = allApplications.filter(app => {
                const appEmail = (app.Email || '').toLowerCase().trim();
                return appEmail === emailKey;
            });
            applications = this.applyApplicationFilters(applications, filters);
        }

        return applications;
    },
    getPendingApplications: function (supervisorEmail) {
        if (!supervisorEmail) return [];
        const supKey = supervisorEmail.toLowerCase().trim();
        let applications = [];
        const allPending = SYSTEM.PERFORMANCE.INDEXES.ENABLED
            ? (this.indexes.applicationsByStatus.get(SYSTEM.STATUS.PENDING) || [])
            : ApplicationsManager.getAllApplicationsData({ status: SYSTEM.STATUS.PENDING });

        // Include applications where supervisorEmail is direct supervisor OR acting supervisor
        const delegatedSupervisors = new Set([supKey]);
        try {
            const staffData = StaffManager.getAllStaffData();
            const today = Utils.parseLocalDate(new Date());

            staffData.forEach(s => {
                if (s.ActingSupervisor && s.ActingSupervisor.active) {
                    const actEmail = (s.ActingSupervisor.actingEmail || s.ActingSupervisor.email || '').toLowerCase().trim();
                    if (actEmail && actEmail === supKey) {
                        const from = Utils.parseLocalDate(s.ActingSupervisor.startDate || s.ActingSupervisor.fromDate);
                        const to = Utils.parseLocalDate(s.ActingSupervisor.endDate || s.ActingSupervisor.toDate);
                        if (from && to && today >= from && today <= to) {
                            if (s.Email) delegatedSupervisors.add(s.Email.toLowerCase().trim());
                        }
                    }
                }
            });
        } catch (e) {
            console.warn('Error evaluating acting supervisor delegations:', e.message);
        }

        applications = allPending.filter(app =>
            app.SupervisorEmail && delegatedSupervisors.has(app.SupervisorEmail.toLowerCase().trim())
        );
        return applications;
    },

    applyApplicationFilters: function (applications, filters) {
        let filtered = [...applications];
        if (filters.leaveType) filtered = filtered.filter(app => app.LeaveType === filters.leaveType);
        if (filters.year) {
            filtered = filtered.filter(app => {
                if (!app.DateApplied) return false;
                return new Date(app.DateApplied).getFullYear().toString() === filters.year.toString();
            });
        }
        if (filters.startDate && filters.endDate) {
            const filterStart = new Date(filters.startDate);
            const filterEnd = new Date(filters.endDate);
            filtered = filtered.filter(app => {
                if (!app.StartDate) return false;
                const appStart = new Date(app.StartDate);
                return appStart >= filterStart && appStart <= filterEnd;
            });
        }
        filtered.sort((a, b) => {
            const dateA = new Date(a.DateApplied || 0);
            const dateB = new Date(b.DateApplied || 0);
            return dateB - dateA;
        });
        return filtered;
    },

    logOperation: function (operation, startTime, details = {}) {
        const duration = Date.now() - startTime;
        const logEntry = { operation, duration, timestamp: new Date().toISOString(), details };
        this.performanceLog.push(logEntry);
        if (this.performanceLog.length > 1000) this.performanceLog.shift();
        if (SYSTEM.PERFORMANCE.MONITORING.LOG_SLOW_OPERATIONS &&
            duration > SYSTEM.PERFORMANCE.MONITORING.SLOW_OPERATION_THRESHOLD) {
            console.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`, details);
        }
        return duration;
    },

    getPerformanceStats: function () {
        const totalCacheAccess = this.statistics.hits + this.statistics.misses;
        const totalFileCacheAccess = this.fileCacheStats.hits + this.fileCacheStats.misses;
        return {
            cache: {
                hitRate: totalCacheAccess > 0 ? Math.round((this.statistics.hits / totalCacheAccess) * 100) : 0,
                hits: this.statistics.hits,
                misses: this.statistics.misses,
                sets: this.statistics.sets,
                evictions: this.statistics.evictions,
                byType: Object.fromEntries(this.statistics.byType)
            },
            fileCache: {
                size: this.fileCache.size,
                hitRate: totalFileCacheAccess > 0 ? Math.round((this.fileCacheStats.hits / totalFileCacheAccess) * 100) : 0,
                hits: this.fileCacheStats.hits,
                misses: this.fileCacheStats.misses
            },
            indexes: {
                staffSize: this.indexes.staffByEmail.size,
                applicationsByEmailSize: this.indexes.applicationsByEmail.size,
                applicationsBySupervisorSize: this.indexes.applicationsBySupervisor.size,
                applicationsByStatusSize: this.indexes.applicationsByStatus.size
            },
            recentOperations: this.performanceLog.slice(-10),
            memoryUsage: {
                memorySize: this.memory.size,
                balanceCacheSize: this.balanceCache.size,
                fileCacheSize: this.fileCache.size
            }
        };
    },

    startCleanupInterval: function () {
        if (typeof setInterval !== 'undefined') {
            setInterval(() => this.cleanupExpiredEntries(), 300000);
        }
    },

    startPerformanceMonitoring: function () {
        if (typeof setInterval !== 'undefined') {
            setInterval(() => {
                const stats = this.getPerformanceStats();
                console.log('📊 Performance Stats:', {
                    cacheHitRate: `${stats.cache.hitRate}%`,
                    cacheHits: stats.cache.hits,
                    cacheMisses: stats.cache.misses,
                    fileCacheHitRate: `${stats.fileCache.hitRate}%`,
                    fileCacheSize: stats.fileCache.size,
                    indexSizes: stats.indexes
                });
            }, SYSTEM.PERFORMANCE.MONITORING.STATS_INTERVAL);
        }
    },

    cleanupExpiredEntries: function () {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, timestamp] of this.timestamps.entries()) {
            const age = now - timestamp;
            const ttl = this.getTTLForKey(key) * 1000;
            if (age > ttl) {
                this.memory.delete(key);
                this.timestamps.delete(key);
                cleaned++;
            }
        }
        for (const [key, timestamp] of this.fileCacheTimestamps.entries()) {
            const age = now - timestamp;
            if (age > SYSTEM.PERFORMANCE.FILE_CACHE.MAX_AGE) {
                this.fileCache.delete(key);
                this.fileCacheTimestamps.delete(key);
                this.removeFromFileCacheOrder(key);
                cleaned++;
            }
        }
        for (const [key, timestamp] of this.balanceCacheTimestamps.entries()) {
            const age = now - timestamp;
            if (age > SYSTEM.PERFORMANCE.CACHE_TTL.BALANCE * 1000) {
                this.balanceCache.delete(key);
                this.balanceCacheTimestamps.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
};

// =============================================
// CONFIGURATION MANAGER
// =============================================

const ConfigManager = {
    getSettings: function () {
        const cacheKey = SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS;
        const cached = EnhancedCacheManager.get(cacheKey);
        if (cached) return cached;

        try {
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            const settings = {};
            if (settingsFile && settingsFile.data) {
                settingsFile.data.forEach(setting => {
                    settings[setting.key] = setting.value;
                });
            }
            settings.monthly_accrual_rate = settings.monthly_accrual_rate || '1.75';
            settings.accrual_system_enabled = settings.accrual_system_enabled || 'true';
            settings.annual_allocation = settings.annual_allocation || '21';
            settings.sick_leave_days = settings.sick_leave_days || SYSTEM.LEAVE_POLICY.SICK_LEAVE.toString();
            settings.max_carry_forward = settings.max_carry_forward || SYSTEM.LEAVE_POLICY.MAX_CARRY_FORWARD.toString();
            settings.working_hours_per_day = settings.working_hours_per_day || SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY.toString();

            EnhancedCacheManager.set(cacheKey, settings);
            return settings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    },

    getMonthlyAccrualRate: function () {
        const settings = this.getSettings();
        return parseFloat(settings.monthly_accrual_rate) || 1.75;
    },

    isAccrualSystemEnabled: function () {
        const settings = this.getSettings();
        return settings.accrual_system_enabled === 'true';
    },

    getAnnualAllocation: function () {
        return 21;
    },

    getSickLeaveAllocation: function () {
        const settings = this.getSettings();
        return parseFloat(settings.sick_leave_days) || SYSTEM.LEAVE_POLICY.SICK_LEAVE;
    },

    getMaxCarryForward: function () {
        const settings = this.getSettings();
        return parseFloat(settings.max_carry_forward) || SYSTEM.LEAVE_POLICY.MAX_CARRY_FORWARD;
    },

    getWorkingHoursPerDay: function () {
        const settings = this.getSettings();
        return parseFloat(settings.working_hours_per_day) || SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY;
    }
};

// =============================================
// OPTIMIZED DATA MANAGEMENT
// =============================================

const DataManager = {
    getSystemFolder: function () {
        try {
            const scriptProps = PropertiesService.getScriptProperties();
            const cachedId = scriptProps.getProperty('SYSTEM_FOLDER_ID');
            if (cachedId) {
                try {
                    const f = DriveApp.getFolderById(cachedId);
                    if (f && !f.isTrashed()) return f;
                } catch (e) {
                    console.warn('Cached folder ID invalid, falling back to search');
                }
            }
            const folderName = SYSTEM.FOLDER_NAME;
            const folders = DriveApp.getFoldersByName(folderName);
            let folder;
            if (folders.hasNext()) {
                folder = folders.next();
            } else {
                folder = DriveApp.createFolder(folderName);
                folder.setDescription(`Leave Management System for ${SYSTEM.ORGANIZATION}`);
            }
            if (folder) {
                scriptProps.setProperty('SYSTEM_FOLDER_ID', folder.getId());
            }
            return folder;
        } catch (error) {
            console.error('Error in getSystemFolder:', error);
            const folders = DriveApp.getFoldersByName('Agri Experience Leave System');
            if (folders.hasNext()) return folders.next();
            return DriveApp.createFolder('Agri Experience Leave System');
        }
    },

    getDataFileObject: function (filename) {
        try {
            const scriptProps = PropertiesService.getScriptProperties();
            const propKey = 'DATA_FILE_ID_' + filename;
            const cachedId = scriptProps.getProperty(propKey);
            if (cachedId) {
                try {
                    const f = DriveApp.getFileById(cachedId);
                    if (f && !f.isTrashed()) return f;
                } catch (e) {
                    console.warn(`Cached ID for ${filename} invalid, falling back to search`);
                }
            }
            const folder = this.getSystemFolder();
            const files = folder.getFilesByName(filename);
            if (files.hasNext()) {
                const f = files.next();
                scriptProps.setProperty(propKey, f.getId());
                return f;
            }
            return null;
        } catch (err) {
            console.error(`Error resolving file object for ${filename}:`, err);
            return null;
        }
    },

    readDataFile: function (filename) {
        const startTime = Date.now();
        const cached = EnhancedCacheManager.getFileCache(filename);
        if (cached) {
            EnhancedCacheManager.logOperation(`readDataFile(cached): ${filename}`, startTime, { cacheHit: true });
            return cached;
        }
        try {
            const file = this.getDataFileObject(filename);
            if (file) {
                const content = file.getBlob().getDataAsString();
                const data = JSON.parse(content);
                EnhancedCacheManager.setFileCache(filename, data);
                EnhancedCacheManager.logOperation(`readDataFile: ${filename}`, startTime, { cacheHit: false, size: content.length });
                return data;
            }
            const defaultData = this.createDefaultDataStructure(filename);
            EnhancedCacheManager.setFileCache(filename, defaultData);
            EnhancedCacheManager.logOperation(`readDataFile(default): ${filename}`, startTime);
            return defaultData;
        } catch (error) {
            console.error(`Error reading ${filename}:`, error);
            EnhancedCacheManager.logOperation(`readDataFile(error): ${filename}`, startTime, { error: error.message });
            return this.createDefaultDataStructure(filename);
        }
    },

    writeDataFile: function (filename, data) {
        const startTime = Date.now();
        const lock = LockService.getScriptLock();
        let hasLock = false;
        try {
            hasLock = lock.tryLock(20000); // Wait up to 20 seconds for concurrency safety
            if (!hasLock) {
                console.warn(`Lock timeout waiting to write ${filename}. Proceeding with caution.`);
            }

            // Merge metadata — preserve any fields callers set (e.g. recordCount)
            // before calling writeDataFile. Do NOT replace the whole object.
            data.metadata = Object.assign({}, data.metadata || {}, {
                lastUpdated: new Date().toISOString(),
                updatedBy: Session.getActiveUser().getEmail(),
                version: SYSTEM.VERSION
            });

            // Convert to JSON
            const jsonContent = JSON.stringify(data, null, 2);

            // Update cache
            EnhancedCacheManager.setFileCache(filename, data);
            this.clearCacheForFile(filename);

            // Write to Google Drive using cached file ID or search
            const file = this.getDataFileObject(filename);
            if (file) {
                file.setContent(jsonContent);
            } else {
                const folder = this.getSystemFolder();
                const newFile = folder.createFile(filename, jsonContent);
                PropertiesService.getScriptProperties().setProperty('DATA_FILE_ID_' + filename, newFile.getId());
            }

            // CRITICAL: Always rebuild indexes for applications immediately
            if (filename === SYSTEM.DATA_FILES.APPLICATIONS) {
                console.log('📝 Applications file updated - rebuilding indexes NOW');
                EnhancedCacheManager.buildIndexes(); // No delay, do it immediately
            }
            // Rebuild for staff if auto-rebuild is enabled
            else if (filename === SYSTEM.DATA_FILES.STAFF && SYSTEM.PERFORMANCE.INDEXES.AUTO_REBUILD) {
                console.log('👥 Staff file updated - rebuilding indexes');
                EnhancedCacheManager.buildIndexes();
            }

            // Auto-mirror to Master Google Sheet database in project folder
            try {
                if (typeof SheetsDualStoreManager !== 'undefined' && SheetsDualStoreManager.syncOnChange) {
                    SheetsDualStoreManager.syncOnChange(filename, data);
                }
            } catch (mirrorErr) {
                console.warn('⚠️ Google Sheets mirror sync deferred/warn:', mirrorErr.message);
            }

            EnhancedCacheManager.logOperation(`writeDataFile: ${filename}`, startTime, {
                size: jsonContent.length
            });

            return { success: true, fileId: 'deferred_write' };

        } catch (error) {
            console.error(`❌ Error writing ${filename}:`, error);
            throw error;
        } finally {
            if (hasLock) {
                try {
                    lock.releaseLock();
                } catch (e) {
                    console.warn('Error releasing script lock:', e);
                }
            }
        }
    },
    clearCacheForFile: function (filename) {
        const startTime = Date.now();
        switch (filename) {
            case SYSTEM.DATA_FILES.STAFF:
                EnhancedCacheManager.clear(SYSTEM.CACHE_KEYS.ALL_STAFF);
                EnhancedCacheManager.clearPattern(SYSTEM.CACHE_KEYS.STAFF_BALANCE_PREFIX);
                EnhancedCacheManager.clearPattern(SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX);
                EnhancedCacheManager.clearPattern(SYSTEM.CACHE_KEYS.SUPERVISOR_STATS_PREFIX);
                EnhancedCacheManager.clearBalanceIndexes();
                break;
            case SYSTEM.DATA_FILES.APPLICATIONS:
                EnhancedCacheManager.clear(SYSTEM.CACHE_KEYS.ALL_APPLICATIONS);
                EnhancedCacheManager.clearPattern(SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX);
                break;
            case SYSTEM.DATA_FILES.SETTINGS:
                EnhancedCacheManager.clear(SYSTEM.CACHE_KEYS.SYSTEM_SETTINGS);
                break;
        }
        EnhancedCacheManager.logOperation('clearCacheForFile', startTime, { filename: filename });
    },

    createDefaultDataStructure: function (filename) {
        const currentYear = Utils.getCurrentYear();
        const defaults = {
            [SYSTEM.DATA_FILES.STAFF]: { data: [], metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION, recordCount: 0 } },
            [SYSTEM.DATA_FILES.APPLICATIONS]: { data: [], metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION, recordCount: 0 } },
            [SYSTEM.DATA_FILES.SETTINGS]: {
                data: [
                    { key: 'organization', value: SYSTEM.ORGANIZATION },
                    { key: 'system_name', value: SYSTEM.NAME },
                    { key: 'version', value: SYSTEM.VERSION },
                    { key: 'annual_allocation', value: SYSTEM.LEAVE_POLICY.ANNUAL_ALLOCATION.toString() },
                    { key: 'sick_leave_days', value: SYSTEM.LEAVE_POLICY.SICK_LEAVE.toString() },
                    { key: 'max_carry_forward', value: SYSTEM.LEAVE_POLICY.MAX_CARRY_FORWARD.toString() },
                    { key: 'working_hours_per_day', value: SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY.toString() },
                    { key: 'current_leave_year', value: currentYear.toString() },
                    { key: 'next_reset_date', value: `${currentYear + 1}-01-01` },
                    { key: 'monthly_accrual_rate', value: '1.75' },
                    { key: 'accrual_system_enabled', value: 'true' }
                ],
                metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION }
            },
            [SYSTEM.DATA_FILES.LOGS]: { data: [], metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION, recordCount: 0 } },
            [SYSTEM.DATA_FILES.ANNUAL_RESET]: { data: [], metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION, recordCount: 0 } }
        };
        return defaults[filename] || { data: [], metadata: { created: new Date().toISOString(), version: SYSTEM.VERSION } };
    }
};

// =============================================
// STAFF MANAGEMENT
// =============================================

const StaffManager = {
    getAllStaffData: function () {
        const startTime = Date.now();
        const cacheKey = SYSTEM.CACHE_KEYS.ALL_STAFF;
        const cached = EnhancedCacheManager.get(cacheKey);
        if (cached) {
            EnhancedCacheManager.logOperation('getAllStaffData(cached)', startTime, { cacheHit: true });
            return cached;
        }
        try {
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffData = staffFile.data || [];
            EnhancedCacheManager.set(cacheKey, staffData);
            EnhancedCacheManager.logOperation('getAllStaffData', startTime, { cacheHit: false, count: staffData.length });
            return staffData;
        } catch (error) {
            console.error('Error in getAllStaffData:', error);
            EnhancedCacheManager.logOperation('getAllStaffData(error)', startTime, { error: error.message });
            return [];
        }
    },

    getUserData: function (email) {
        return EnhancedCacheManager.getUserByEmail(email);
    },

    getUserRole: function (email = null) {
        try {
            const userEmail = email || Session.getActiveUser().getEmail();
            const user = this.getUserData(userEmail);
            return user ? user.Role : null;
        } catch (error) {
            console.error('Error in getUserRole:', error);
            return null;
        }
    },

    getSupervisorsData: function () {
        const staffData = this.getAllStaffData();
        return staffData.filter(member =>
            member.Role === SYSTEM.ROLES.SUPERVISOR && member.Metadata?.active !== false
        );
    },

    getStaffBySupervisor: function (supervisorEmail) {
        const staffData = this.getAllStaffData();
        const supEmail = (supervisorEmail || '').toLowerCase().trim();
        const supUser = this.getUserData(supervisorEmail);
        const supName = (supUser?.Name || '').toLowerCase().trim();
        return staffData.filter(member => {
            if (!member.Supervisor || member.Metadata?.active === false) return false;
            const mSup = member.Supervisor.toLowerCase().trim();
            return mSup === supEmail || (supName && mSup === supName);
        });
    },

    createStaff: function (staffData) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = this.getUserRole(currentUser);

            if (userRole !== SYSTEM.ROLES.ADMIN) {
                return Utils.createErrorResponse('Only administrators can create staff');
            }

            if (!staffData.Email || !staffData.Name || !staffData.Role) {
                return Utils.createErrorResponse('Email, Name, and Role are required');
            }

            if (!Utils.isValidEmail(staffData.Email)) {
                return Utils.createErrorResponse('Invalid email format');
            }

            const existingStaff = this.getAllStaffData();
            const existingUser = existingStaff.find(staff =>
                staff.Email.toLowerCase().trim() === staffData.Email.toLowerCase().trim()
            );

            if (existingUser) {
                return Utils.createErrorResponse('User with this email already exists');
            }

            const currentYear = Utils.getCurrentYear();
            const today = new Date();
            const currentMonth = today.getMonth();

            // Calculate join date
            let joinDate = staffData.JoinDate || today.toISOString().split('T')[0];
            const joinDateTime = new Date(joinDate);
            const joinYear = joinDateTime.getFullYear();
            const joinMonth = joinDateTime.getMonth();

            // =============================================
            // CORRECT ACCRUAL CALCULATION
            // =============================================
            let currentYearAccrued = 0;

            if (joinYear === currentYear) {
                for (let month = joinMonth; month <= currentMonth; month++) {
                    currentYearAccrued += 1.75;
                }
            } else {
                for (let month = 0; month <= currentMonth; month++) {
                    currentYearAccrued += 1.75;
                }
            }

            // =============================================
            // ACCRUAL DATES
            // =============================================
            const firstOfCurrentMonth = new Date(currentYear, currentMonth, 1);
            const firstOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

            function formatLocalDate(date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            const lastAccrualDateStr = formatLocalDate(firstOfCurrentMonth);
            const nextAccrualDateStr = formatLocalDate(firstOfNextMonth);

            console.log(`Creating staff ${staffData.Email}:`);
            console.log(`  - Join date: ${joinDate}`);
            console.log(`  - Current year accrued: ${currentYearAccrued} days`);

            const eligibleForLeave = staffData.eligibleForLeave !== false;

            // =============================================
            // NEW: Get initial deficit (can be negative)
            // =============================================
            const initialDeficit = parseFloat(staffData.initialDeficit) || 0;

            // Compensation days (awarded for extra work, never expire)
            const initialCompensationDays = Math.max(0, parseFloat(staffData.compensationDays) || 0);

            // Determine brought forward - ONLY if explicitly provided
            let leaveBroughtForward = null;
            if (eligibleForLeave && staffData.daysCarriedFromPreviousYear && parseFloat(staffData.daysCarriedFromPreviousYear) > 0) {
                const carriedDays = Math.min(
                    Math.max(0, parseFloat(staffData.daysCarriedFromPreviousYear)),
                    ConfigManager.getMaxCarryForward()
                );

                leaveBroughtForward = {
                    daysCarriedFromPreviousYear: carriedDays,
                    expiryDate: Utils.getEasterExpiryDate().toISOString().split('T')[0],
                    yearEarned: currentYear - 1,
                    yearExpires: currentYear,
                    isExpired: false,
                    note: `${carriedDays} days carried forward from ${currentYear - 1}`
                };
            }

            const newStaff = {
                Email: staffData.Email.trim(),
                Name: staffData.Name.trim(),
                Role: staffData.Role,
                Department: staffData.Department || 'Unassigned',
                Supervisor: staffData.Supervisor || '',
                WorkingHoursPerDay: staffData.WorkingHoursPerDay || ConfigManager.getWorkingHoursPerDay(),
                JoinDate: joinDate,
                EligibleForLeave: eligibleForLeave,

                LeaveAccrual: {
                    eligible: eligibleForLeave,
                    monthlyRate: 1.75,
                    accruedYearToDate: currentYearAccrued,
                    usedYearToDate: 0,

                    // ✅ CHANGED: Set initial deficit from staffData
                    annualDeficit: {
                        amount: initialDeficit,
                        fromYear: initialDeficit !== 0 ? (currentYear - 1) : null,
                        recoveryHistory: []
                    },

                    // ✅ CHANGED: Available balance now includes deficit and any brought-forward days
                    availableBalance: Math.max(0, currentYearAccrued + initialDeficit + (leaveBroughtForward?.daysCarriedFromPreviousYear || 0)),

                    lastAccrualDate: lastAccrualDateStr,
                    nextAccrualDate: nextAccrualDateStr,
                    totalAccruedSinceJoin: currentYearAccrued
                },

                LeaveBroughtForward: leaveBroughtForward,

                CompensationLeave: {
                    balance: initialCompensationDays,
                    used: 0,
                    awards: initialCompensationDays > 0 ? [{
                        date: new Date().toISOString().split('T')[0],
                        days: initialCompensationDays,
                        reason: 'Initial balance set on account creation',
                        awardedBy: currentUser
                    }] : []
                },

                SickLeave: {
                    used: staffData.sickUsed || 0,
                    resetDate: `${currentYear + 1}-01-01`
                },

                LeaveHistory: {
                    [currentYear]: {
                        annualUsed: 0,
                        sickUsed: staffData.sickUsed || 0,
                        broughtForwardUsed: 0,
                        totalUsed: staffData.sickUsed || 0
                    }
                },

                LeaveDeficit: {
                    records: [],
                    totalDeficit: 0,
                    deducted: 0,
                    pending: 0
                },

                Metadata: {
                    created: new Date().toISOString(),
                    createdBy: currentUser,
                    active: true,
                    eligibleForLeave: eligibleForLeave,
                    initialBalances: {
                        annualAccrued: currentYearAccrued,
                        sick: staffData.sickUsed || 0,
                        daysCarriedFromPreviousYear: staffData.daysCarriedFromPreviousYear || 0,
                        // ✅ NEW: Track initial deficit in metadata
                        deficit: initialDeficit,
                        compensationDays: initialCompensationDays,
                        setBy: currentUser,
                        timestamp: new Date().toISOString()
                    }
                }
            };

            if (!eligibleForLeave) {
                newStaff.LeaveAccrual.eligible = false;
                newStaff.LeaveAccrual.accruedYearToDate = 0;
                newStaff.LeaveAccrual.availableBalance = 0;
                newStaff.LeaveBroughtForward = null;
                newStaff.SickLeave.used = 0;
            }

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            staffFile.data.push(newStaff);
            staffFile.metadata.recordCount = staffFile.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            Utils.logAction('CREATE_STAFF', {
                email: staffData.Email,
                name: staffData.Name,
                role: staffData.Role,
                department: staffData.Department,
                eligibleForLeave: eligibleForLeave,
                initialAccrued: currentYearAccrued,
                // ✅ NEW: Log deficit
                initialDeficit: initialDeficit,
                lastAccrualDate: lastAccrualDateStr,
                nextAccrualDate: nextAccrualDateStr,
                daysCarriedFromPreviousYear: staffData.daysCarriedFromPreviousYear || 0,
                joinDate: joinDate
            });

            // ✅ CHANGED: Build message with deficit info
            const message = eligibleForLeave
                ? `Staff member created with ${currentYearAccrued.toFixed(3)} days accrued for ${currentYear}`
                : 'Staff member created (not eligible for leave)';

            const deficitMsg = initialDeficit !== 0
                ? ` and ${Math.abs(initialDeficit).toFixed(3)} day deficit`
                : '';

            const bfMessage = leaveBroughtForward
                ? ` and ${leaveBroughtForward.daysCarriedFromPreviousYear} days brought forward from previous year`
                : '';

            return Utils.createSuccessResponse({
                staff: newStaff,
                message: message + deficitMsg + bfMessage
            });

        } catch (error) {
            console.error('Error creating staff member:', error);
            return Utils.createErrorResponse('Failed to create staff member: ' + error.message);
        }
    },

    updateStaff: function (originalEmail, staffData) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = this.getUserRole(currentUser);

            if (userRole !== SYSTEM.ROLES.ADMIN) {
                return Utils.createErrorResponse('Only administrators can update staff');
            }

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffIndex = staffFile.data.findIndex(staff =>
                staff.Email.toLowerCase().trim() === originalEmail.toLowerCase().trim()
            );

            if (staffIndex === -1) {
                return Utils.createErrorResponse('Staff member not found');
            }

            const updatedStaff = { ...staffFile.data[staffIndex] };
            const currentYear = Utils.getCurrentYear().toString();
            const changes = [];

            // Ensure LeaveHistory exists
            if (!updatedStaff.LeaveHistory) {
                updatedStaff.LeaveHistory = {};
            }
            if (!updatedStaff.LeaveHistory[currentYear]) {
                updatedStaff.LeaveHistory[currentYear] = {
                    annualUsed: 0,
                    sickUsed: 0,
                    broughtForwardUsed: 0,
                    totalUsed: 0
                };
            }

            // =============================================
            // UPDATE FIELDS WITH CROSS-VALIDATION
            // =============================================

            // Basic info updates
            if (staffData.Name) {
                updatedStaff.Name = staffData.Name.trim();
                changes.push('Name');
            }
            if (staffData.Role) {
                updatedStaff.Role = staffData.Role;
                changes.push('Role');
            }
            if (staffData.Department) {
                updatedStaff.Department = staffData.Department.trim();
                changes.push('Department');
            }
            if (staffData.Supervisor !== undefined) {
                updatedStaff.Supervisor = staffData.Supervisor;
                changes.push('Supervisor');
            }
            if (staffData.WorkingHoursPerDay) {
                updatedStaff.WorkingHoursPerDay = staffData.WorkingHoursPerDay;
                changes.push('WorkingHoursPerDay');
            }

            // =============================================
            // JOIN DATE UPDATE
            // =============================================
            if (staffData.JoinDate) {
                const oldJoinDate = updatedStaff.JoinDate;
                updatedStaff.JoinDate = staffData.JoinDate;
                if (oldJoinDate !== staffData.JoinDate) {
                    changes.push('JoinDate');
                }
            }

            // =============================================
            // ACCRUAL RECALCULATION - ALWAYS PROCESS IF PROVIDED
            // =============================================
            if (staffData.recalculatedAccrued !== undefined) {
                const newAccrued = parseFloat(staffData.recalculatedAccrued);
                const oldAccrued = updatedStaff.LeaveAccrual.accruedYearToDate || 0;

                if (Math.abs(newAccrued - oldAccrued) > 0.01) {
                    console.log(`Updating accrued for ${originalEmail}: ${oldAccrued} -> ${newAccrued}`);
                    updatedStaff.LeaveAccrual.accruedYearToDate = newAccrued;
                    changes.push('accruedYearToDate (from recalculation)');

                    // Immediately recalculate available balance with new accrued
                    const used = updatedStaff.LeaveAccrual.usedYearToDate || 0;
                    const broughtForward = updatedStaff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0;
                    const deficit = updatedStaff.LeaveAccrual.annualDeficit?.amount || 0;

                    const newAvailable = Math.max(0, newAccrued - used + broughtForward + deficit);

                    if (Math.abs((updatedStaff.LeaveAccrual.availableBalance || 0) - newAvailable) > 0.01) {
                        updatedStaff.LeaveAccrual.availableBalance = newAvailable;
                        changes.push('availableBalance (recalculated after accrual update)');
                    }
                }
            }

            if (staffData.eligibleForLeave !== undefined) {
                updatedStaff.EligibleForLeave = staffData.eligibleForLeave;
                // Keep LeaveAccrual.eligible in sync — it is read by calculateAvailableBalance,
                // processMonthlyAccrual, and canTakeLeave and must always match the top-level flag.
                if (!updatedStaff.LeaveAccrual) {
                    updatedStaff.LeaveAccrual = { eligible: staffData.eligibleForLeave };
                } else {
                    updatedStaff.LeaveAccrual.eligible = staffData.eligibleForLeave;
                }
                // Also mirror into Metadata for display consistency
                if (updatedStaff.Metadata) {
                    updatedStaff.Metadata.eligibleForLeave = staffData.eligibleForLeave;
                }
                changes.push('EligibleForLeave');
            }

            // =============================================
            // LEAVE ACCRUAL UPDATES
            // =============================================

            // Update annual used
            if (staffData.annualUsed !== undefined) {
                const newAnnualUsed = parseFloat(staffData.annualUsed) || 0;
                const oldAnnualUsed = updatedStaff.LeaveHistory[currentYear].annualUsed || 0;

                if (Math.abs(newAnnualUsed - oldAnnualUsed) > 0.01) {
                    updatedStaff.LeaveHistory[currentYear].annualUsed = newAnnualUsed;

                    // usedYearToDate tracks annual pool only (annualUsed + bfUsed).
                    // Sick leave is a separate pool and must NOT be included here.
                    const bfUsed = updatedStaff.LeaveHistory[currentYear].broughtForwardUsed || 0;
                    updatedStaff.LeaveAccrual.usedYearToDate = newAnnualUsed + bfUsed;

                    changes.push('annualUsed');
                }
            }

            // Update sick used
            if (staffData.sickUsed !== undefined) {
                const newSickUsed = parseFloat(staffData.sickUsed) || 0;
                const oldSickUsed = updatedStaff.LeaveHistory[currentYear].sickUsed || 0;

                if (Math.abs(newSickUsed - oldSickUsed) > 0.01) {
                    updatedStaff.LeaveHistory[currentYear].sickUsed = newSickUsed;

                    if (!updatedStaff.SickLeave) {
                        updatedStaff.SickLeave = { used: 0, resetDate: `${Utils.getCurrentYear() + 1}-01-01` };
                    }
                    updatedStaff.SickLeave.used = newSickUsed;

                    // Sick leave does NOT affect usedYearToDate (annual pool counter).
                    // Only update the SickLeave object — annual pool is unchanged.

                    changes.push('sickUsed');
                }
            }

            // Update brought forward usage AND balance
            if (staffData.broughtForwardUsed !== undefined || staffData.daysCarriedFromPreviousYear !== undefined) {

                if (staffData.broughtForwardUsed !== undefined) {
                    const newBfUsed = parseFloat(staffData.broughtForwardUsed) || 0;
                    const oldBfUsed = updatedStaff.LeaveHistory[currentYear].broughtForwardUsed || 0;

                    if (Math.abs(newBfUsed - oldBfUsed) > 0.01) {
                        updatedStaff.LeaveHistory[currentYear].broughtForwardUsed = newBfUsed;

                        const annualUsed = updatedStaff.LeaveHistory[currentYear].annualUsed || 0;
                        const sickUsed = updatedStaff.LeaveHistory[currentYear].sickUsed || 0;
                        updatedStaff.LeaveAccrual.usedYearToDate = annualUsed + sickUsed + newBfUsed;

                        changes.push('broughtForwardUsed');
                    }
                }

                if (staffData.daysCarriedFromPreviousYear !== undefined) {
                    const carriedDays = parseFloat(staffData.daysCarriedFromPreviousYear) || 0;

                    if (carriedDays > 0) {
                        const maxCarry = ConfigManager.getMaxCarryForward();
                        const cappedCarried = Math.min(Math.max(0, carriedDays), maxCarry);
                        const bfUsed = updatedStaff.LeaveHistory[currentYear].broughtForwardUsed || 0;

                        updatedStaff.LeaveBroughtForward = {
                            daysCarriedFromPreviousYear: cappedCarried,
                            expiryDate: Utils.getEasterExpiryDate().toISOString().split('T')[0],
                            yearEarned: Utils.getCurrentYear() - 1,
                            yearExpires: Utils.getCurrentYear(),
                            isExpired: false,
                            note: `${cappedCarried} days remaining, ${bfUsed} used`
                        };
                    } else {
                        updatedStaff.LeaveBroughtForward = null;
                    }
                    changes.push('daysCarriedFromPreviousYear');
                }
            }

            // =============================================
            // UPDATE DEFICIT
            // =============================================
            if (staffData.annualDeficit !== undefined) {
                const newDeficit = parseFloat(staffData.annualDeficit) || 0;
                const oldDeficit = updatedStaff.LeaveAccrual.annualDeficit?.amount || 0;

                if (Math.abs(newDeficit - oldDeficit) > 0.01) {
                    // Ensure annualDeficit object exists
                    if (!updatedStaff.LeaveAccrual.annualDeficit) {
                        updatedStaff.LeaveAccrual.annualDeficit = {
                            amount: 0,
                            fromYear: null,
                            recoveryHistory: []
                        };
                    }

                    updatedStaff.LeaveAccrual.annualDeficit.amount = newDeficit;

                    // Set fromYear if deficit exists and wasn't set before
                    if (newDeficit !== 0 && !updatedStaff.LeaveAccrual.annualDeficit.fromYear) {
                        updatedStaff.LeaveAccrual.annualDeficit.fromYear = Utils.getCurrentYear() - 1;
                    }

                    // If deficit becomes zero, optionally clear fromYear
                    if (newDeficit === 0) {
                        updatedStaff.LeaveAccrual.annualDeficit.fromYear = null;
                    }

                    changes.push('annualDeficit');
                }
            }

            // =============================================
            // UPDATE COMPENSATION LEAVE BALANCE
            // =============================================
            if (staffData.compensationDays !== undefined) {
                const newCompDays = Math.max(0, parseFloat(staffData.compensationDays) || 0);
                if (!updatedStaff.CompensationLeave) {
                    updatedStaff.CompensationLeave = { balance: 0, used: 0, awards: [] };
                }
                const oldCompDays = updatedStaff.CompensationLeave.balance || 0;
                if (Math.abs(newCompDays - oldCompDays) > 0.001) {
                    updatedStaff.CompensationLeave.balance = newCompDays;
                    updatedStaff.CompensationLeave.awards = updatedStaff.CompensationLeave.awards || [];
                    updatedStaff.CompensationLeave.awards.push({
                        date: new Date().toISOString().split('T')[0],
                        days: newCompDays - oldCompDays,
                        reason: `Balance adjusted by admin (${oldCompDays} → ${newCompDays})`,
                        awardedBy: currentUser
                    });
                    changes.push('compensationDays');
                }
            }

            // Update total used in history
            updatedStaff.LeaveHistory[currentYear].totalUsed =
                (updatedStaff.LeaveHistory[currentYear].annualUsed || 0) +
                (updatedStaff.LeaveHistory[currentYear].sickUsed || 0) +
                (updatedStaff.LeaveHistory[currentYear].broughtForwardUsed || 0);

            // =============================================
            // RECALCULATE AVAILABLE BALANCE (includes deficit)
            // =============================================

            const accrued = updatedStaff.LeaveAccrual.accruedYearToDate || 0;
            const used = updatedStaff.LeaveAccrual.usedYearToDate || 0;
            const broughtForward = updatedStaff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0;
            const deficit = updatedStaff.LeaveAccrual.annualDeficit?.amount || 0;

            const correctAvailable = Math.max(0, accrued - used + broughtForward + deficit);

            if (Math.abs((updatedStaff.LeaveAccrual.availableBalance || 0) - correctAvailable) > 0.01) {
                updatedStaff.LeaveAccrual.availableBalance = correctAvailable;
                changes.push('availableBalance');
            }

            // Handle email change
            if (staffData.Email && staffData.Email.toLowerCase().trim() !== originalEmail.toLowerCase().trim()) {
                const emailExists = staffFile.data.some((staff, index) =>
                    index !== staffIndex && staff.Email.toLowerCase().trim() === staffData.Email.toLowerCase().trim()
                );
                if (emailExists) {
                    return Utils.createErrorResponse('Another staff member already has this email');
                }
                updatedStaff.Email = staffData.Email.trim();
                changes.push('Email');
            }

            // Update metadata
            updatedStaff.Metadata = updatedStaff.Metadata || {};
            updatedStaff.Metadata.lastUpdated = new Date().toISOString();
            updatedStaff.Metadata.updatedBy = currentUser;

            if (changes.length > 0) {
                updatedStaff.Metadata.lastChanges = {
                    timestamp: new Date().toISOString(),
                    fields: changes
                };
            }

            // Save to file
            staffFile.data[staffIndex] = updatedStaff;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            // Clear caches
            EnhancedCacheManager.clearBalance(updatedStaff.Email);
            EnhancedCacheManager.clearPattern(SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX);

            Utils.logAction('UPDATE_STAFF', {
                email: originalEmail,
                newEmail: staffData.Email || originalEmail,
                changes: changes
            }, currentUser);

            return Utils.createSuccessResponse({
                staff: updatedStaff,
                changes: changes
            }, `Staff member updated successfully (${changes.length} changes)`);

        } catch (error) {
            console.error('Error updating staff member:', error);
            return Utils.createErrorResponse('Failed to update staff member: ' + error.message);
        }
    },
    deleteStaff: function (email) {
        try {
            if (typeof email === 'object' && email !== null) {
                email = email.email || email.targetEmail || '';
            }
            if (!email || typeof email !== 'string') {
                return Utils.createErrorResponse('Valid email is required to delete staff');
            }

            const currentUser = Session.getActiveUser().getEmail();
            const userRole = this.getUserRole(currentUser);

            if (userRole !== SYSTEM.ROLES.ADMIN) {
                return Utils.createErrorResponse('Only administrators can delete staff');
            }

            if (email.toLowerCase().trim() === currentUser.toLowerCase().trim()) {
                return Utils.createErrorResponse('You cannot delete your own account');
            }

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffIndex = staffFile.data.findIndex(staff =>
                staff.Email.toLowerCase().trim() === email.toLowerCase().trim()
            );

            if (staffIndex === -1) {
                return Utils.createErrorResponse('Staff member not found');
            }

            staffFile.data[staffIndex].Metadata.active = false;
            staffFile.data[staffIndex].Metadata.deactivatedAt = new Date().toISOString();
            staffFile.data[staffIndex].Metadata.deactivatedBy = currentUser;

            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            Utils.logAction('DELETE_STAFF', { email: email });

            return Utils.createSuccessResponse(
                { email: email },
                'Staff member deactivated successfully'
            );

        } catch (error) {
            console.error('Error deleting staff member:', error);
            return Utils.createErrorResponse('Failed to delete staff member: ' + error.message);
        }
    },

    setActingSupervisor: function (supervisorEmail, actingEmailOrData, actingName, startDate, endDate, notes) {
        try {
            if (!supervisorEmail) return Utils.createErrorResponse('supervisorEmail is required');
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffIndex = staffFile.data.findIndex(staff =>
                staff.Email && staff.Email.toLowerCase().trim() === supervisorEmail.toLowerCase().trim()
            );

            if (staffIndex === -1) return Utils.createErrorResponse('Supervisor not found in staff records');

            const supervisor = staffFile.data[staffIndex];
            let actingEmail = '';
            let fromDate = '';
            let toDate = '';
            let active = true;
            let note = '';
            let resolvedName = actingName || '';

            if (typeof actingEmailOrData === 'object' && actingEmailOrData !== null) {
                actingEmail = actingEmailOrData.actingEmail || actingEmailOrData.email || '';
                resolvedName = actingEmailOrData.actingName || actingEmailOrData.name || resolvedName;
                fromDate = actingEmailOrData.startDate || actingEmailOrData.fromDate || '';
                toDate = actingEmailOrData.endDate || actingEmailOrData.toDate || '';
                active = actingEmailOrData.active !== false;
                note = actingEmailOrData.notes || actingEmailOrData.note || '';
            } else {
                actingEmail = actingEmailOrData || '';
                fromDate = startDate || '';
                toDate = endDate || '';
                note = notes || '';
            }

            if (actingEmail && !resolvedName) {
                const actingStaff = staffFile.data.find(s =>
                    s.Email && s.Email.toLowerCase().trim() === actingEmail.toLowerCase().trim()
                );
                if (actingStaff) resolvedName = actingStaff.Name || '';
            }

            supervisor.ActingSupervisor = {
                email: actingEmail ? actingEmail.trim() : '',
                actingEmail: actingEmail ? actingEmail.trim() : '',
                name: resolvedName || '',
                actingName: resolvedName || '',
                fromDate: fromDate || '',
                startDate: fromDate || '',
                toDate: toDate || '',
                endDate: toDate || '',
                active: active && Boolean(actingEmail),
                notes: note || '',
                updatedAt: new Date().toISOString()
            };

            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearAll();
            EnhancedCacheManager.buildIndexes();

            return Utils.createSuccessResponse(
                supervisor.ActingSupervisor,
                active ? `Approval delegation set to ${actingName || actingEmail} from ${fromDate} to ${toDate}` : 'Approval delegation deactivated'
            );
        } catch (error) {
            console.error('Error in setActingSupervisor:', error);
            return Utils.createErrorResponse('Failed to set acting supervisor: ' + error.message);
        }
    }
};

// =============================================
// MONTHLY ACCRUAL PROCESSING
// =============================================

const AccrualManager = {
    processMonthlyAccrual: function () {
        try {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();

            // The first day of the CURRENT month
            const firstOfCurrentMonth = new Date(currentYear, currentMonth, 1);

            console.log(`🔄 Processing monthly accrual for ${firstOfCurrentMonth.toISOString().split('T')[0]}`);

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            let processedCount = 0;
            let totalAccrued = 0;
            let deficitRecovered = 0;
            let deficitRemaining = 0;
            const accrualLog = [];

            staffFile.data.forEach((staff, index) => {
                if (staff.Metadata?.active === false) return;
                if (!staff.EligibleForLeave || !staff.LeaveAccrual?.eligible) return;

                const nextAccrualDate = new Date(staff.LeaveAccrual.nextAccrualDate);

                // Check if we need to accrue for the current month
                if (currentDate >= nextAccrualDate) {
                    const monthlyRate = staff.LeaveAccrual.monthlyRate || 1.75;
                    let newAccrued = monthlyRate;

                    // Handle deficit recovery
                    const deficitBefore = staff.LeaveAccrual.annualDeficit?.amount || 0;
                    let deficitRecovery = 0;

                    if (deficitBefore < 0) {
                        deficitRecovery = Math.min(Math.abs(deficitBefore), monthlyRate);
                        staff.LeaveAccrual.annualDeficit.amount += deficitRecovery;
                        newAccrued -= deficitRecovery;

                        if (!staff.LeaveAccrual.annualDeficit.recoveryHistory) {
                            staff.LeaveAccrual.annualDeficit.recoveryHistory = [];
                        }
                        staff.LeaveAccrual.annualDeficit.recoveryHistory.push({
                            date: currentDate.toISOString().split('T')[0],
                            amount: deficitRecovery,
                            remainingDeficit: staff.LeaveAccrual.annualDeficit.amount,
                            note: `Monthly accrual applied to deficit`
                        });

                        deficitRecovered += deficitRecovery;
                        deficitRemaining += staff.LeaveAccrual.annualDeficit.amount;
                    }

                    // Always increment accruedYearToDate by the full monthly rate.
                    // Deficit recovery reduces the NET available balance via annualDeficit.amount,
                    // but the gross accrual still happened — the YTD stat must reflect it.
                    staff.LeaveAccrual.accruedYearToDate += monthlyRate;
                    staff.LeaveAccrual.totalAccruedSinceJoin = (staff.LeaveAccrual.totalAccruedSinceJoin || 0) + monthlyRate;

                    // Calculate available balance — annual pool plus any remaining brought-forward days
                    const deficitAmount = staff.LeaveAccrual.annualDeficit?.amount || 0;
                    const usedYearToDate = staff.LeaveAccrual.usedYearToDate || 0;
                    const accruedYearToDate = staff.LeaveAccrual.accruedYearToDate || 0;
                    const broughtForwardRemaining = staff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0;

                    let availableBalance = accruedYearToDate - usedYearToDate + deficitAmount + broughtForwardRemaining;
                    staff.LeaveAccrual.availableBalance = Math.max(0, availableBalance);

                    // CRITICAL FIX: Set next accrual date to the FIRST of NEXT month
                    // This ensures we accrue for each month as we enter it
                    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
                    staff.LeaveAccrual.nextAccrualDate = nextMonth.toISOString().split('T')[0];
                    staff.LeaveAccrual.lastAccrualDate = firstOfCurrentMonth.toISOString().split('T')[0];

                    staff.Metadata.lastAccrual = {
                        date: currentDate.toISOString().split('T')[0],
                        amount: monthlyRate,
                        deficitRecovered: deficitRecovery,
                        availableAfter: staff.LeaveAccrual.availableBalance,
                        deficitBefore: deficitBefore,
                        deficitAfter: staff.LeaveAccrual.annualDeficit?.amount || 0
                    };

                    accrualLog.push({
                        email: staff.Email,
                        name: staff.Name,
                        monthlyRate: monthlyRate,
                        accrued: newAccrued,
                        deficitRecovered: deficitRecovery,
                        totalAccruedYTD: staff.LeaveAccrual.accruedYearToDate,
                        usedYTD: staff.LeaveAccrual.usedYearToDate,
                        availableBalance: staff.LeaveAccrual.availableBalance,
                        deficitBefore: deficitBefore,
                        deficitAfter: staff.LeaveAccrual.annualDeficit?.amount || 0
                    });

                    totalAccrued += monthlyRate;
                    processedCount++;
                }
            });

            if (processedCount > 0) {
                DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

                Utils.logAction('MONTHLY_ACCRUAL_PROCESSING', {
                    date: currentDate.toISOString().split('T')[0],
                    processedCount: processedCount,
                    totalAccrued: totalAccrued,
                    deficitRecovered: deficitRecovered,
                    deficitRemaining: deficitRemaining
                });

                console.log(`✅ Monthly accrual processed: ${processedCount} staff, ${totalAccrued.toFixed(3)} days accrued, ${deficitRecovered.toFixed(3)} days deficit recovered`);
            }

            return {
                success: true,
                processedCount: processedCount,
                totalAccrued: totalAccrued,
                deficitRecovered: deficitRecovered,
                deficitRemaining: deficitRemaining,
                accrualLog: accrualLog.slice(0, 10)
            };

        } catch (error) {
            console.error('❌ Error in monthly accrual processing:', error);
            return { success: false, error: error.message };
        }
    },
    calculateAvailableBalance: function (staff) {
        if (!staff.EligibleForLeave || !staff.LeaveAccrual?.eligible) return 0;
        const accrual = staff.LeaveAccrual;
        const accrued = accrual.accruedYearToDate || 0;
        const used = accrual.usedYearToDate || 0;
        const deficit = accrual.annualDeficit?.amount || 0;
        // Annual pool only. Brought-forward days are a separate expiring pool;
        // callers that need the total combine this with availableBroughtForward explicitly.
        const available = accrued - used + deficit;
        return Math.max(0, available);
    },

    canTakeLeave: function (staff, daysRequested) {
        if (!staff.EligibleForLeave || !staff.LeaveAccrual?.eligible) {
            return { canTake: false, reason: 'Staff is not eligible for leave' };
        }

        const availableBalance = this.calculateAvailableBalance(staff);

        if (availableBalance >= daysRequested) {
            return {
                canTake: true,
                available: availableBalance,
                willBorrow: 0,
                remaining: availableBalance - daysRequested,
                deficitAfter: staff.LeaveAccrual?.annualDeficit?.amount || 0
            };
        } else {
            const borrowAmount = daysRequested - availableBalance;
            const currentDeficit = staff.LeaveAccrual?.annualDeficit?.amount || 0;
            const newDeficit = currentDeficit - borrowAmount;
            const monthlyRate = staff.LeaveAccrual?.monthlyRate || 1.75;
            const maxReasonableBorrow = monthlyRate * 6;

            if (Math.abs(newDeficit) > maxReasonableBorrow) {
                return {
                    canTake: false,
                    available: availableBalance,
                    willBorrow: borrowAmount,
                    reason: `Cannot borrow more than ${maxReasonableBorrow.toFixed(3)} days ahead (6 months)`
                };
            }

            return {
                canTake: true,
                available: availableBalance,
                willBorrow: borrowAmount,
                remaining: 0,
                newDeficit: newDeficit,
                monthsToRepay: Math.ceil(Math.abs(newDeficit) / monthlyRate),
                note: `${borrowAmount.toFixed(3)} days would be borrowed ahead, creating a deficit`
            };
        }
    },

    getAccrualProjection: function (staff) {
        if (!staff.EligibleForLeave || !staff.LeaveAccrual?.eligible) return null;

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const monthsRemaining = 12 - currentMonth - 1;
        const monthlyRate = staff.LeaveAccrual?.monthlyRate || 1.75;
        const futureAccrual = monthsRemaining * monthlyRate;
        const currentAvailable = this.calculateAvailableBalance(staff);
        const currentDeficit = staff.LeaveAccrual?.annualDeficit?.amount || 0;

        return {
            currentMonth: currentMonth + 1,
            monthsRemaining: monthsRemaining,
            monthlyRate: monthlyRate,
            futureAccrual: futureAccrual,
            currentAvailable: currentAvailable,
            currentDeficit: currentDeficit,
            projectedYearEnd: currentAvailable + futureAccrual,
            canBorrow: futureAccrual,
            nextAccrualDate: staff.LeaveAccrual?.nextAccrualDate
        };
    },

    updateAfterLeave: function (staff, daysTaken) {
        if (!staff.LeaveAccrual) return staff;
        const oldUsed = staff.LeaveAccrual.usedYearToDate || 0;
        staff.LeaveAccrual.usedYearToDate = oldUsed + daysTaken;
        // Compute raw (pre-floor) annual balance to detect a true deficit
        const accrued = staff.LeaveAccrual.accruedYearToDate || 0;
        const used = staff.LeaveAccrual.usedYearToDate;
        const deficit = staff.LeaveAccrual.annualDeficit?.amount || 0;
        const rawBalance = accrued - used + deficit;
        staff.LeaveAccrual.availableBalance = Math.max(0, rawBalance);
        if (rawBalance < 0) {
            if (!staff.LeaveAccrual.annualDeficit) {
                staff.LeaveAccrual.annualDeficit = { amount: 0, fromYear: null, recoveryHistory: [] };
            }
            // rawBalance is negative — record as the deficit amount directly
            staff.LeaveAccrual.annualDeficit.amount = rawBalance;
        }
        return staff;
    }
};

// =============================================
// APPLICATIONS MANAGEMENT
// =============================================

const ApplicationsManager = {
    getAllApplicationsData: function (filters = {}) {
        const startTime = Date.now();
        const cacheKey = SYSTEM.CACHE_KEYS.ALL_APPLICATIONS;

        if (Object.keys(filters).length === 0) {
            const cached = EnhancedCacheManager.get(cacheKey);
            if (cached) {
                EnhancedCacheManager.logOperation('getAllApplicationsData(cached)', startTime, { cacheHit: true });
                return cached;
            }
        }

        if (filters.email && !filters.supervisor && !filters.startDate && !filters.endDate) {
            const applications = EnhancedCacheManager.getApplicationsByEmail(filters.email, filters);
            EnhancedCacheManager.logOperation('getAllApplicationsData(indexed)', startTime, {
                cacheHit: false, indexed: true, count: applications.length
            });
            return applications;
        }

        try {
            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            let applications = applicationsFile.data || [];
            let updatedApplicationsFile = false;

            // Self-heal pending daily applications if business days were incorrectly calculated with holidays
            applications.forEach(app => {
                if (app && app.Status === SYSTEM.STATUS.PENDING && app.LeaveMode !== 'Hourly' && app.StartDate && app.EndDate) {
                    const accurateBusinessDays = Utils.getBusinessDays(app.StartDate, app.EndDate);
                    if (accurateBusinessDays > 0 && app.Duration !== accurateBusinessDays) {
                        const oldDuration = app.Duration;
                        app.Duration = accurateBusinessDays;
                        if (!app.Metadata) app.Metadata = {};
                        app.Metadata.businessDays = accurateBusinessDays;
                        const holidays = Utils.getHolidaysInRange(app.StartDate, app.EndDate).filter(h => !h.isWeekend);
                        app.Metadata.holidaysExcluded = holidays.map(h => h.name);

                        // Also adjust deduction amounts if needed
                        if (app.DeductFromAnnual > 0 && app.DeductFromAnnual === oldDuration) {
                            app.DeductFromAnnual = accurateBusinessDays;
                        } else if (app.DeductFromCompensation > 0 && app.DeductFromCompensation === oldDuration) {
                            app.DeductFromCompensation = accurateBusinessDays;
                        } else if (app.DeductFromSick > 0 && app.DeductFromSick === oldDuration) {
                            app.DeductFromSick = accurateBusinessDays;
                        } else if (app.DeductFromBroughtForward > 0 && app.DeductFromBroughtForward === oldDuration) {
                            app.DeductFromBroughtForward = accurateBusinessDays;
                        }
                        updatedApplicationsFile = true;
                    }
                }
            });

            if (updatedApplicationsFile) {
                try {
                    DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
                } catch (e) {
                    console.error('Failed to save healed applications:', e);
                }
            }

            if (filters.email) applications = applications.filter(app =>
                app.Email && app.Email.toLowerCase() === filters.email.toLowerCase()
            );
            if (filters.status) applications = applications.filter(app => app.Status === filters.status);
            if (filters.leaveType) applications = applications.filter(app => app.LeaveType === filters.leaveType);
            if (filters.year) {
                applications = applications.filter(app => {
                    if (!app.DateApplied) return false;
                    return new Date(app.DateApplied).getFullYear().toString() === filters.year.toString();
                });
            }
            if (filters.startDate && filters.endDate) {
                const filterStart = new Date(filters.startDate);
                const filterEnd = new Date(filters.endDate);
                applications = applications.filter(app => {
                    if (!app.StartDate) return false;
                    const appStart = new Date(app.StartDate);
                    return appStart >= filterStart && appStart <= filterEnd;
                });
            }
            if (filters.supervisor) {
                applications = applications.filter(app =>
                    app.SupervisorEmail && app.SupervisorEmail.toLowerCase() === filters.supervisor.toLowerCase()
                );
            }

            applications.sort((a, b) => {
                const dateA = new Date(a.DateApplied || 0);
                const dateB = new Date(b.DateApplied || 0);
                return dateB - dateA;
            });

            if (Object.keys(filters).length === 0) {
                EnhancedCacheManager.set(cacheKey, applications);
            }

            EnhancedCacheManager.logOperation('getAllApplicationsData', startTime, {
                cacheHit: false, count: applications.length, filters: Object.keys(filters)
            });

            return applications;
        } catch (error) {
            console.error('Error in getAllApplicationsData:', error);
            EnhancedCacheManager.logOperation('getAllApplicationsData(error)', startTime, { error: error.message });
            return [];
        }
    },

    submitLeaveApplication: function (applicationData) {
        try {
            const userEmail = Session.getActiveUser().getEmail();
            const user = StaffManager.getUserData(userEmail);

            if (!user) return Utils.createErrorResponse('User not found in system');
            if (!user.EligibleForLeave) return Utils.createErrorResponse('You are not eligible for leave');
            if (!applicationData.leaveType) return Utils.createErrorResponse('Leave type is required');
            if (!applicationData.reason || applicationData.reason.trim().length < 10) {
                return Utils.createErrorResponse('Please provide a detailed reason (minimum 10 characters)');
            }

            let duration = 0;
            let hours = 0;
            let startDate = applicationData.startDate;
            let endDate = applicationData.endDate;
            let businessDays = 0;

            if (applicationData.leaveMode === 'Hourly') {
                hours = parseFloat(applicationData.hours) || 0;
                if (hours < SYSTEM.LEAVE_POLICY.MIN_LEAVE_HOURS || hours > SYSTEM.LEAVE_POLICY.MAX_LEAVE_HOURS) {
                    return Utils.createErrorResponse(`Hours must be between ${SYSTEM.LEAVE_POLICY.MIN_LEAVE_HOURS} and ${SYSTEM.LEAVE_POLICY.MAX_LEAVE_HOURS}`);
                }
                const workingHoursPerDay = user.WorkingHoursPerDay || SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY;
                duration = hours / workingHoursPerDay;
                startDate = applicationData.hourlyDate || applicationData.startDate;
                endDate = startDate;
                businessDays = duration;
            } else {
                if (!startDate || !endDate) return Utils.createErrorResponse('Start date and end date are required');
                const start = Utils.parseLocalDate(startDate);
                const end = Utils.parseLocalDate(endDate);
                const today = Utils.parseLocalDate(new Date());
                // Sick leave may be applied retroactively; only future-only restriction applies to other leave types
                const isSickLeaveType = applicationData.leaveType === SYSTEM.LEAVE_TYPES.SICK;
                if (!isSickLeaveType && start < today) return Utils.createErrorResponse('Start date cannot be in the past');
                if (end < start) return Utils.createErrorResponse('End date must be after start date');
                businessDays = Utils.getBusinessDays(start, end);
                duration = businessDays;
                if (businessDays < SYSTEM.LEAVE_POLICY.MIN_LEAVE_DURATION) {
                    return Utils.createErrorResponse(`Minimum leave duration is ${SYSTEM.LEAVE_POLICY.MIN_LEAVE_DURATION} business days`);
                }
            }

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);

            // Overlap check: ensure applicant has no overlapping Pending or Approved applications
            const reqStart = Utils.parseLocalDate(startDate);
            const reqEnd = Utils.parseLocalDate(endDate);
            if (reqStart && reqEnd) {
                const userApps = (applicationsFile.data || []).filter(app =>
                    app.Email && app.Email.toLowerCase().trim() === userEmail.toLowerCase().trim() &&
                    (app.Status === SYSTEM.STATUS.PENDING || app.Status === SYSTEM.STATUS.APPROVED)
                );
                for (const ex of userApps) {
                    const exStart = Utils.parseLocalDate(ex.StartDate || ex.HourlyDate);
                    const exEnd = Utils.parseLocalDate(ex.EndDate || ex.HourlyDate || ex.StartDate);
                    if (exStart && exEnd) {
                        if (reqStart <= exEnd && reqEnd >= exStart) {
                            return Utils.createErrorResponse(
                                `You already have an active (${ex.Status}) leave application (${ex.ID}) from ` +
                                `${Utils.formatDateForDisplay(exStart)} to ${Utils.formatDateForDisplay(exEnd)} that overlaps with these dates.`
                            );
                        }
                    }
                }
            }

            // Blackout period check (seasonal peak dates)
            if (applicationData.leaveMode !== 'Hourly' && startDate && endDate) {
                const blackoutConflict = BlackoutPeriodManager.checkConflict(user.Department, startDate, endDate);
                if (blackoutConflict.hasConflict) {
                    if (blackoutConflict.isStrict && user.Role !== SYSTEM.ROLES.ADMIN && user.Role !== SYSTEM.ROLES.HR) {
                        const firstStrict = blackoutConflict.conflicts.find(c => c.severity === 'strict') || blackoutConflict.conflicts[0];
                        return Utils.createErrorResponse(
                            `Leave blocked: Requested dates fall during a strict company blackout period: "${firstStrict.name}" (${firstStrict.reason || 'Operational peak period'})`
                        );
                    }
                }
            }

            const staffingCheck = (applicationData.leaveMode !== 'Hourly' && startDate && endDate)
                ? BlackoutPeriodManager.checkMinimumStaffing(user.Department, startDate, endDate, userEmail)
                : { breach: false };

            const balanceCheck = this.checkLeaveBalanceWithPriority(userEmail, applicationData.leaveType, businessDays);
            if (!balanceCheck.success) return balanceCheck;

            const deductions = balanceCheck.data.deductions;
            let calendarDays = 0;
            if (applicationData.leaveMode !== 'Hourly' && startDate && endDate) {
                const start = Utils.parseLocalDate(startDate);
                const end = Utils.parseLocalDate(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                calendarDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            const appId = 'APP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const currentDate = new Date().toISOString().split('T')[0];
            const supervisorEmail = user.Supervisor || '';
            let supervisorName = '';
            if (supervisorEmail) {
                const supervisorUser = StaffManager.getUserData(supervisorEmail);
                supervisorName = supervisorUser ? supervisorUser.Name || '' : '';
            }

            // Handover colleague details
            let handoverEmail = (applicationData.handoverEmail || '').trim();
            let handoverName = (applicationData.handoverName || '').trim();
            let handoverNotes = (applicationData.handoverNotes || '').trim();
            if (handoverEmail && !handoverName) {
                const handoverStaff = StaffManager.getUserData(handoverEmail);
                if (handoverStaff) {
                    handoverName = handoverStaff.Name || handoverEmail;
                }
            }

            // Handover Tasks
            let handoverTasks = [];
            if (Array.isArray(applicationData.handoverTasks)) {
                handoverTasks = applicationData.handoverTasks.map((t, idx) => {
                    const taskText = typeof t === 'string' ? t.trim() : (t.task || t.title || t.text || '').trim();
                    const taskId = (typeof t === 'object' && t !== null && t.id) ? String(t.id) : ('ht_' + (idx + 1));
                    return {
                        id: taskId,
                        task: taskText,
                        title: taskText,
                        completed: Boolean(t && t.completed),
                        completedAt: (t && t.completedAt) || null
                    };
                }).filter(t => t.task.length > 0);
            } else if (typeof applicationData.handoverTasks === 'string' && applicationData.handoverTasks.trim()) {
                handoverTasks = applicationData.handoverTasks.split(/[\n,;]+/).map((t, idx) => {
                    const taskText = t.trim();
                    return {
                        id: 'ht_' + (idx + 1),
                        task: taskText,
                        title: taskText,
                        completed: false,
                        completedAt: null
                    };
                }).filter(t => t.task.length > 0);
            }

            // Direct document attachment upload to Google Drive if file provided
            let attachmentUrl = (typeof applicationData.attachment === 'string') ? applicationData.attachment : '';
            let attachmentFileId = null;
            let attachmentFileName = null;
            const attPayload = (applicationData.attachmentFile && applicationData.attachmentFile.base64Data)
                ? applicationData.attachmentFile
                : (applicationData.attachment && typeof applicationData.attachment === 'object' && applicationData.attachment.base64Data)
                    ? applicationData.attachment
                    : null;

            if (attPayload) {
                try {
                    const uploadRes = AttachmentManager.uploadAttachment({
                        fileName: attPayload.fileName,
                        mimeType: attPayload.mimeType,
                        base64Data: attPayload.base64Data,
                        appId: appId,
                        applicantEmail: userEmail
                    });
                    if (uploadRes.success && uploadRes.data) {
                        attachmentUrl = uploadRes.data.fileUrl;
                        attachmentFileId = uploadRes.data.fileId;
                        attachmentFileName = uploadRes.data.fileName;
                    }
                } catch (uErr) {
                    console.warn('Attachment upload error (non-fatal):', uErr.message);
                }
            }

            // Deficit check: total annual pool after this leave (BF deductions don't create a deficit
            // in the annual accrual — they draw from a separate expiring pool).
            const availableAfter = AccrualManager.calculateAvailableBalance(user) - (deductions.annual || 0);
            const willHaveDeficit = availableAfter < 0;

            const holidaysExcluded = (applicationData.leaveMode !== 'Hourly' && startDate && endDate)
                ? Utils.getHolidaysInRange(startDate, endDate).filter(h => !h.isWeekend).map(h => h.name)
                : [];

            const blackoutCheck = (applicationData.leaveMode !== 'Hourly' && startDate && endDate)
                ? BlackoutPeriodManager.checkConflict(user.Department, startDate, endDate)
                : { hasConflict: false };

            // Multi-tier approval routing:
            // Standard routine leaves (<= 5 business days) need only supervisor approval.
            // Extended leaves (> 5 business days) or specialized types (Study, Maternity, Paternity) require 2-tier approval (Supervisor + HR)
            const isSpecializedLeave = [
                SYSTEM.LEAVE_TYPES.STUDY,
                SYSTEM.LEAVE_TYPES.MATERNITY,
                SYSTEM.LEAVE_TYPES.PATERNITY
            ].includes(applicationData.leaveType);
            const requiresDualApproval = (businessDays > 5) || isSpecializedLeave;

            const application = {
                ID: appId,
                Email: userEmail,
                Name: user.Name,
                Department: user.Department || 'General',
                Role: user.Role,
                LeaveType: applicationData.leaveType,
                LeaveMode: applicationData.leaveMode || 'Daily',
                StartDate: startDate,
                EndDate: endDate,
                Hours: hours || null,
                Duration: parseFloat(businessDays.toFixed(3)),
                CalendarDays: calendarDays,
                Reason: applicationData.reason,
                Attachment: attachmentUrl,
                AttachmentUrl: attachmentUrl,
                AttachmentFileId: attachmentFileId,
                AttachmentFileName: attachmentFileName,
                AttachmentName: attachmentFileName,
                HandoverEmail: handoverEmail,
                HandoverName: handoverName,
                HandoverColleagueEmail: handoverEmail,
                HandoverColleagueName: handoverName,
                HandoverNotes: handoverNotes,
                HandoverStatus: handoverEmail ? 'Pending' : 'None',
                HandoverTasks: handoverTasks,
                RequiresDualApproval: requiresDualApproval,
                ApprovalStage: requiresDualApproval ? 'pending_supervisor' : 'pending_single',
                SupervisorApproval: null,
                HRApproval: null,
                VacationResponderConfigured: false,
                Status: SYSTEM.STATUS.PENDING,
                DateApplied: currentDate,
                ProcessedDate: '',
                ProcessedBy: '',
                Comment: '',
                DeductFromAnnual: deductions.annual || 0,
                DeductFromBroughtForward: deductions.broughtForward || 0,
                DeductFromSick: deductions.sick || 0,
                DeductFromCompensation: deductions.compensation || 0,
                Supervisor: supervisorName,
                SupervisorEmail: supervisorEmail,
                WorkingHoursPerDay: user.WorkingHoursPerDay || SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY,
                Metadata: {
                    isHourly: applicationData.leaveMode === 'Hourly',
                    timestamp: new Date().toISOString(),
                    businessDays: businessDays,
                    holidaysExcluded: holidaysExcluded,
                    willCreateDeficit: willHaveDeficit,
                    deficitAmount: willHaveDeficit ? Math.abs(availableAfter) : 0,
                    blackoutNotice: blackoutCheck.hasConflict ? blackoutCheck.conflicts.map(c => c.name).join(', ') : null,
                    minimumStaffingNotice: staffingCheck.breach || false,
                    handover: {
                        email: handoverEmail,
                        name: handoverName,
                        notes: handoverNotes
                    }
                }
            };

            applicationsFile.data.push(application);
            applicationsFile.metadata.recordCount = applicationsFile.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
            EnhancedCacheManager.buildIndexes();
            if (supervisorEmail) {
                NotificationManager.notifyApplicationSubmitted(application);
            }
            if (handoverEmail) {
                NotificationManager.notifyHandoverNominated(application);
            }

            Utils.logAction('SUBMIT_LEAVE_APPLICATION', {
                applicationId: appId,
                user: userEmail,
                leaveType: applicationData.leaveType,
                businessDays: businessDays,
                deductions: deductions,
                willCreateDeficit: willHaveDeficit
            });

            let message = 'Leave application submitted successfully';
            if (willHaveDeficit) {
                message += `. Note: This will create a deficit of ${Math.abs(availableAfter).toFixed(3)} days`;
            }

            return Utils.createSuccessResponse({
                applicationId: appId,
                id: appId,
                message: message,
                application: {
                    id: appId,
                    status: SYSTEM.STATUS.PENDING,
                    submitted: currentDate,
                    businessDays: businessDays,
                    willCreateDeficit: willHaveDeficit,
                    deficitAmount: willHaveDeficit ? Math.abs(availableAfter) : 0
                }
            });

        } catch (error) {
            console.error('Error in submitLeaveApplication:', error);
            return Utils.createErrorResponse('System error while submitting application: ' + error.message);
        }
    },

    checkLeaveBalanceWithPriority: function (email, leaveType, duration) {
        try {
            const user = StaffManager.getUserData(email);
            if (!user) return Utils.createErrorResponse('User not found');
            if (!user.EligibleForLeave) return Utils.createErrorResponse('Staff is not eligible for leave');

            const currentYear = Utils.getCurrentYear();
            const yearHistory = user.LeaveHistory?.[currentYear.toString()] || {
                annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, compensationUsed: 0, totalUsed: 0
            };

            const availableAnnual = AccrualManager.calculateAvailableBalance(user);

            // ── Brought-forward pool (expires at Easter) ─────────────────────
            let availableBroughtForward = 0;
            const easterDate = Utils.getEasterExpiryDate(user.LeaveBroughtForward);
            easterDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isBroughtForwardExpired = Boolean(user.LeaveBroughtForward?.isExpired) || (today > easterDate);
            if (user.LeaveBroughtForward && !isBroughtForwardExpired) {
                // daysCarriedFromPreviousYear is the remaining available balance in the brought forward pool
                availableBroughtForward = Math.max(0, user.LeaveBroughtForward.daysCarriedFromPreviousYear || 0);
            }

            // ── Compensation leave pool ───────────────────────────────────────
            // balance is the remaining available balance in the compensation pool
            const availableCompensation = Math.max(0, user.CompensationLeave?.balance || 0);

            const isSickLeave = leaveType === SYSTEM.LEAVE_TYPES.SICK;
            const isCompensationLeave = leaveType === SYSTEM.LEAVE_TYPES.COMPENSATION;

            let deductions = { annual: 0, broughtForward: 0, sick: 0, compensation: 0 };
            let remainingRequired = duration;

            if (isSickLeave) {
                // Sick leave draws entirely from the sick pool — no mixing
                const sickAllocation = ConfigManager.getSickLeaveAllocation();
                const sickBalance = Math.max(0, sickAllocation - (user.SickLeave?.used || 0));
                if (sickBalance < duration) {
                    return Utils.createErrorResponse(
                        `Insufficient sick leave balance. Available: ${sickBalance.toFixed(3)} days`
                    );
                }
                deductions.sick = duration;

            } else if (isCompensationLeave) {
                // Compensation leave draws from its own pool only
                if (availableCompensation < duration) {
                    return Utils.createErrorResponse(
                        `Insufficient compensation leave balance. Available: ${availableCompensation.toFixed(3)} days`
                    );
                }
                deductions.compensation = duration;

            } else {
                // Annual leave — deduction priority:
                //   1. Compensation days first (awarded for weekend work — highest priority, never expires)
                //   2. Brought-forward days second (expires at Easter — use before annual)
                //   3. Annual accrual pool third
                //   4. Borrow against future accruals if still short

                if (availableCompensation > 0) {
                    const useComp = Math.min(availableCompensation, remainingRequired);
                    deductions.compensation = useComp;
                    remainingRequired -= useComp;
                }

                if (remainingRequired > 0 && availableBroughtForward > 0) {
                    const useBF = Math.min(availableBroughtForward, remainingRequired);
                    deductions.broughtForward = useBF;
                    remainingRequired -= useBF;
                }

                if (remainingRequired > 0 && availableAnnual > 0) {
                    const useAnnual = Math.min(availableAnnual, remainingRequired);
                    deductions.annual = useAnnual;
                    remainingRequired -= useAnnual;
                }

                if (remainingRequired > 0) {
                    const monthsRemaining = 12 - today.getMonth() - 1;
                    const monthlyRate = user.LeaveAccrual?.monthlyRate || 1.75;
                    const maxBorrowable = monthsRemaining * monthlyRate;
                    const canBorrowCheck = AccrualManager.canTakeLeave(user, remainingRequired);

                    if (canBorrowCheck.canTake && remainingRequired <= maxBorrowable) {
                        deductions.annual = (deductions.annual || 0) + remainingRequired;
                        remainingRequired = 0;
                        return Utils.createSuccessResponse({
                            hasSufficientBalance: true,
                            deductions,
                            remainingBalances: {
                                annual: Math.max(0, availableAnnual - deductions.annual),
                                broughtForward: Math.max(0, availableBroughtForward - deductions.broughtForward),
                                compensation: Math.max(0, availableCompensation - deductions.compensation),
                                sick: ConfigManager.getSickLeaveAllocation() - (user.SickLeave?.used || 0)
                            },
                            willBorrow: canBorrowCheck.willBorrow,
                            note: `Application approved with borrowing of ${canBorrowCheck.willBorrow.toFixed(3)} days ahead`,
                            warning: 'Creating a deficit will reduce future accruals until repaid.'
                        });
                    } else {
                        const availableTotal = availableAnnual + availableBroughtForward + availableCompensation;
                        return Utils.createErrorResponse(
                            `Insufficient leave balance. Available: ${availableTotal.toFixed(3)} days (` +
                            `Compensation: ${availableCompensation.toFixed(3)}, ` +
                            `Brought Forward: ${availableBroughtForward.toFixed(3)}, ` +
                            `Annual: ${availableAnnual.toFixed(3)}), Required: ${duration} days.`
                        );
                    }
                }
            }

            return Utils.createSuccessResponse({
                hasSufficientBalance: true,
                deductions,
                remainingBalances: {
                    annual: Math.max(0, availableAnnual - deductions.annual),
                    broughtForward: Math.max(0, availableBroughtForward - deductions.broughtForward),
                    compensation: Math.max(0, availableCompensation - deductions.compensation),
                    sick: ConfigManager.getSickLeaveAllocation() - (user.SickLeave?.used || 0) - deductions.sick
                },
                willBorrow: 0
            });

        } catch (error) {
            console.error('Error checking leave balance:', error);
            return Utils.createErrorResponse('Failed to check leave balance: ' + error.toString());
        }
    },
    checkTeamLeaveClashes: function (email, startDate, endDate) {
        try {
            if (!startDate || !endDate) return [];
            const reqStart = Utils.parseLocalDate(startDate);
            const reqEnd = Utils.parseLocalDate(endDate);
            if (!reqStart || !reqEnd) return [];

            const user = email ? StaffManager.getUserData(email) : null;
            const department = user ? (user.Department || '') : '';
            const supervisorEmail = user ? (user.Supervisor || '') : '';

            const allApps = this.getAllApplicationsData({});
            const activeApps = allApps.filter(app => {
                if (email && app.Email && app.Email.toLowerCase().trim() === email.toLowerCase().trim()) return false;
                if (app.Status !== SYSTEM.STATUS.PENDING && app.Status !== SYSTEM.STATUS.APPROVED) return false;

                // Match department or supervisor
                const sameDept = department && app.Department && app.Department.toLowerCase() === department.toLowerCase();
                const sameSup = supervisorEmail && app.SupervisorEmail && app.SupervisorEmail.toLowerCase() === supervisorEmail.toLowerCase();
                if (!sameDept && !sameSup) return false;

                const appStart = Utils.parseLocalDate(app.StartDate || app.HourlyDate);
                const appEnd = Utils.parseLocalDate(app.EndDate || app.HourlyDate || app.StartDate);
                if (!appStart || !appEnd) return false;

                return reqStart <= appEnd && reqEnd >= appStart;
            });

            return activeApps.map(app => ({
                id: app.ID,
                name: app.Name,
                applicantName: app.Name,
                email: app.Email,
                applicantEmail: app.Email,
                department: app.Department,
                role: app.Role,
                startDate: app.StartDate,
                endDate: app.EndDate,
                duration: app.Duration,
                status: app.Status,
                leaveType: app.LeaveType
            }));
        } catch (error) {
            console.error('Error checking team clashes:', error);
            return [];
        }
    },

    getApplicationById: function (appId) {
        if (!appId) return null;
        const allApps = this.getAllApplicationsData({});
        return allApps.find(app => app.ID === appId) || null;
    },

    processApplicationDecision: function (appId, decision, comment = '', callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);

            if (!user) return Utils.createErrorResponse('User not found');

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applicationIndex = applicationsFile.data.findIndex(app => app.ID === appId);

            if (applicationIndex === -1) return Utils.createErrorResponse('Application not found');

            const application = applicationsFile.data[applicationIndex];

            if (application.Status !== SYSTEM.STATUS.PENDING) {
                return Utils.createErrorResponse('Application is not in pending status');
            }

            const isSupervisor = application.SupervisorEmail && application.SupervisorEmail.toLowerCase().trim() === currentUser.toLowerCase().trim();
            const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
            const isHR = user.Role === SYSTEM.ROLES.HR;

            // Check if current user is an active acting supervisor delegated by the primary supervisor
            let isActingSupervisor = false;
            if (application.SupervisorEmail) {
                const primarySupervisor = StaffManager.getUserData(application.SupervisorEmail);
                if (primarySupervisor && primarySupervisor.ActingSupervisor && primarySupervisor.ActingSupervisor.active) {
                    const act = primarySupervisor.ActingSupervisor;
                    const actEmail = (act.actingEmail || act.email || '').toLowerCase().trim();
                    if (actEmail && actEmail === currentUser.toLowerCase().trim()) {
                        const today = Utils.parseLocalDate(new Date());
                        const actStart = Utils.parseLocalDate(act.startDate || act.fromDate);
                        const actEnd = Utils.parseLocalDate(act.endDate || act.toDate);
                        if (actStart && actEnd && today >= actStart && today <= actEnd) {
                            isActingSupervisor = true;
                        }
                    }
                }
            }

            if (!isSupervisor && !isAdmin && !isHR && !isActingSupervisor) {
                return Utils.createErrorResponse('You are not authorized to process this application');
            }

            // Check if dual approval is required:
            // routine leaves (<= 5 days) need only single approval;
            // leaves > 5 days or specialized leave types (Study, Maternity, Paternity) require 2 tiers.
            const isSpecializedLeave = [
                SYSTEM.LEAVE_TYPES.STUDY,
                SYSTEM.LEAVE_TYPES.MATERNITY,
                SYSTEM.LEAVE_TYPES.PATERNITY
            ].includes(application.LeaveType);
            const requiresDualApproval = Boolean(application.RequiresDualApproval || (application.Duration > 5) || isSpecializedLeave);

            // If dual approval is required, decision is approve, and current user is Supervisor (not Admin/HR):
            const isSupervisorApproval = (isSupervisor || isActingSupervisor) && !isAdmin && !isHR;
            const isStage1 = application.ApprovalStage === 'pending_supervisor' || !application.ApprovalStage;

            if (decision === 'approve' && requiresDualApproval && isSupervisorApproval && isStage1) {
                // Tier 1 completed: Supervisor approved, forwarded to HR
                application.ApprovalStage = 'pending_hr';
                application.Status = SYSTEM.STATUS.PENDING;
                application.SupervisorApproval = {
                    approvedBy: currentUser + (isActingSupervisor ? ' (Acting Supervisor)' : ''),
                    approvedAt: new Date().toISOString(),
                    comment: comment || ''
                };
                application.Comment = (application.Comment ? application.Comment + ' | ' : '') + `Supervisor Approved: ${comment || 'Recommended for HR sign-off'}`;
                if (!application.Metadata) application.Metadata = {};
                application.Metadata.supervisorApprovedAt = new Date().toISOString();
                if (isActingSupervisor) {
                    application.Metadata.actedBySupervisor = true;
                    application.Metadata.actingSupervisorEmail = currentUser;
                }

                DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
                EnhancedCacheManager.buildIndexes();

                try {
                    NotificationManager.notifyHREndorsementRequired(application);
                } catch (nErr) {
                    console.warn('HR endorsement notification error:', nErr.message);
                }

                Utils.logAction('SUPERVISOR_ENDORSE_LEAVE', {
                    applicationId: appId,
                    supervisor: currentUser,
                    nextStage: 'pending_hr'
                });

                return Utils.createSuccessResponse({
                    id: appId,
                    applicationId: appId,
                    status: SYSTEM.STATUS.PENDING,
                    approvalStage: 'pending_hr',
                    message: 'Application endorsed by supervisor. Forwarded to HR for final sign-off (extended/specialized leave).'
                });
            }

            const newStatus = decision === 'approve' ? SYSTEM.STATUS.APPROVED : SYSTEM.STATUS.DECLINED;

            applicationsFile.data[applicationIndex].Status = newStatus;
            applicationsFile.data[applicationIndex].ApprovalStage = newStatus === SYSTEM.STATUS.APPROVED ? 'approved' : 'declined';
            applicationsFile.data[applicationIndex].ProcessedDate = new Date().toISOString();
            applicationsFile.data[applicationIndex].ProcessedBy = currentUser + (isActingSupervisor ? ' (Acting Supervisor)' : '');
            applicationsFile.data[applicationIndex].Comment = comment || '';

            if (newStatus === SYSTEM.STATUS.APPROVED && (isAdmin || isHR)) {
                applicationsFile.data[applicationIndex].HRApproval = {
                    approvedBy: currentUser,
                    approvedAt: new Date().toISOString(),
                    comment: comment || ''
                };
            }

            if (!applicationsFile.data[applicationIndex].Metadata) {
                applicationsFile.data[applicationIndex].Metadata = {};
            }
            if (isActingSupervisor) {
                applicationsFile.data[applicationIndex].Metadata.actedBySupervisor = true;
                applicationsFile.data[applicationIndex].Metadata.actingSupervisorEmail = currentUser;
            }

            if (newStatus === SYSTEM.STATUS.APPROVED) {
                this.updateStaffLeaveBalances(application);
                try {
                    CalendarSyncManager.syncLeaveToCalendar(application);
                } catch (calErr) {
                    console.warn('Calendar sync error (non-fatal):', calErr.message);
                }
                try {
                    if (typeof GmailSyncManager !== 'undefined') {
                        GmailSyncManager.configureVacationResponder(application);
                        applicationsFile.data[applicationIndex].VacationResponderConfigured = true;
                    }
                } catch (vErr) {
                    console.warn('Vacation responder sync error (non-fatal):', vErr.message);
                }
                if (application.HandoverEmail) {
                    try {
                        NotificationManager.notifyHandoverAssigned(application);
                    } catch (hErr) {
                        console.warn('Handover notify error (non-fatal):', hErr.message);
                    }
                }
            }

            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
            EnhancedCacheManager.buildIndexes();

            let emailSent = false;
            if (newStatus === SYSTEM.STATUS.APPROVED) {
                emailSent = NotificationManager.notifyApplicationApproved(application);
            } else {
                emailSent = NotificationManager.notifyApplicationDeclined(application);
            }

            // Always notify HR of every leave decision
            NotificationManager.notifyHRDecision(application, newStatus, comment);

            Utils.logAction('PROCESS_APPLICATION', {
                applicationId: appId,
                decision: decision,
                newStatus: newStatus,
                processedBy: currentUser,
                isActingSupervisor: isActingSupervisor,
                applicant: application.Email,
                emailSent: emailSent
            });

            return Utils.createSuccessResponse({
                applicationId: appId,
                status: newStatus,
                processedBy: currentUser,
                processedDate: new Date().toISOString(),
                emailSent: emailSent
            }, `Application ${decision}d successfully`);

        } catch (error) {
            console.error('Error processing application decision:', error);
            return Utils.createErrorResponse('Failed to process application: ' + error.toString());
        }
    },
    cancelApplication: function (appId, reasonOrUserEmail, optionalReason) {
        try {
            let callerEmail = Session.getActiveUser().getEmail();
            let reason = '';
            if (optionalReason !== undefined) {
                if (reasonOrUserEmail && typeof reasonOrUserEmail === 'string' && reasonOrUserEmail.includes('@')) {
                    callerEmail = reasonOrUserEmail;
                }
                reason = optionalReason;
            } else if (typeof reasonOrUserEmail === 'string') {
                reason = reasonOrUserEmail;
            }

            const currentUser = callerEmail;
            const user = StaffManager.getUserData(currentUser);
            if (!user) return Utils.createErrorResponse('User not found');

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applicationIndex = applicationsFile.data.findIndex(app => app.ID === appId);
            if (applicationIndex === -1) return Utils.createErrorResponse('Application not found');

            const application = applicationsFile.data[applicationIndex];

            // Only the applicant, an admin, or HR can cancel
            const isOwner = application.Email.toLowerCase() === currentUser.toLowerCase();
            const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
            const isHR = user.Role === SYSTEM.ROLES.HR;
            if (!isOwner && !isAdmin && !isHR) {
                return Utils.createErrorResponse('You are not authorised to cancel this application');
            }

            // Allowed to cancel Pending or Approved applications
            if (application.Status !== SYSTEM.STATUS.PENDING && application.Status !== SYSTEM.STATUS.APPROVED) {
                return Utils.createErrorResponse(
                    `Cannot cancel a ${application.Status} application. Only Pending or Approved applications can be cancelled.`
                );
            }

            const wasApproved = application.Status === SYSTEM.STATUS.APPROVED;

            // Rule: Approved leave beyond the leave's end date cannot be cancelled
            if (wasApproved) {
                const endInput = application.EndDate || application.StartDate || application.HourlyDate;
                if (endInput) {
                    const leaveEnd = Utils.parseLocalDate(endInput);
                    if (leaveEnd) {
                        leaveEnd.setHours(0, 0, 0, 0);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (today > leaveEnd) {
                            return Utils.createErrorResponse('Approved leave cannot be cancelled after the leave end date has passed');
                        }
                    }
                }
            }

            // If it was already approved, roll back all deductions from staff balances & remove from Google Calendar
            if (wasApproved) {
                this.rollbackStaffLeaveBalances(application);
                try {
                    CalendarSyncManager.removeLeaveFromCalendar(application);
                } catch (calErr) {
                    console.warn('Calendar removal error (non-fatal):', calErr.message);
                }
                try {
                    if (typeof GmailSyncManager !== 'undefined') {
                        GmailSyncManager.disableVacationResponder();
                    }
                } catch (vErr) {
                    console.warn('Vacation responder disable error (non-fatal):', vErr.message);
                }
            }

            // Mark as cancelled
            applicationsFile.data[applicationIndex].Status = SYSTEM.STATUS.CANCELLED;
            applicationsFile.data[applicationIndex].ProcessedDate = new Date().toISOString();
            applicationsFile.data[applicationIndex].ProcessedBy = currentUser;
            applicationsFile.data[applicationIndex].Comment = reason || (wasApproved ? 'Approved leave cancelled & balance restored' : 'Cancelled by applicant');

            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
            EnhancedCacheManager.buildIndexes();
            EnhancedCacheManager.clearBalance(application.Email);
            EnhancedCacheManager.clear(`${SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX}${application.Email}`);

            Utils.logAction('CANCEL_APPLICATION', {
                applicationId: appId,
                cancelledBy: currentUser,
                applicant: application.Email,
                wasApproved: wasApproved,
                reason: reason || 'Cancelled by applicant'
            });

            return Utils.createSuccessResponse(
                { applicationId: appId, status: SYSTEM.STATUS.CANCELLED, wasApproved: wasApproved, balanceRestored: wasApproved },
                wasApproved ? 'Approved application cancelled and leave balances restored successfully' : 'Application cancelled successfully'
            );

        } catch (error) {
            console.error('Error cancelling application:', error);
            return Utils.createErrorResponse('Failed to cancel application: ' + error.message);
        }
    },

    updateStaffLeaveBalances: function (application) {
        const startTime = Date.now();
        try {
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffIndex = staffFile.data.findIndex(staff =>
                staff.Email.toLowerCase().trim() === application.Email.toLowerCase().trim()
            );

            if (staffIndex === -1) {
                console.error('Staff not found for application:', application.Email);
                return;
            }

            const staff = staffFile.data[staffIndex];
            if (!staff.EligibleForLeave) {
                console.error('Staff not eligible for leave:', application.Email);
                return;
            }

            const currentYear = Utils.getCurrentYear().toString();
            if (!staff.LeaveHistory) staff.LeaveHistory = {};
            if (!staff.LeaveHistory[currentYear]) {
                staff.LeaveHistory[currentYear] = { annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, totalUsed: 0 };
            }
            const yearHistory = staff.LeaveHistory[currentYear];

            if (application.DeductFromAnnual > 0) {
                yearHistory.annualUsed += application.DeductFromAnnual;
                if (staff.LeaveAccrual) {
                    staff.LeaveAccrual.usedYearToDate += application.DeductFromAnnual;
                    // Compute raw (pre-floor) annual balance so deficit can be detected and recorded
                    const accrued = staff.LeaveAccrual.accruedYearToDate || 0;
                    const used = staff.LeaveAccrual.usedYearToDate;
                    const existingDeficit = staff.LeaveAccrual.annualDeficit?.amount || 0;
                    const rawAnnualBalance = accrued - used + existingDeficit;
                    staff.LeaveAccrual.availableBalance = Math.max(0, rawAnnualBalance);
                    if (rawAnnualBalance < 0) {
                        if (!staff.LeaveAccrual.annualDeficit) {
                            staff.LeaveAccrual.annualDeficit = { amount: 0, fromYear: null, recoveryHistory: [] };
                        }
                        staff.LeaveAccrual.annualDeficit.amount = rawAnnualBalance;
                    }
                }
            }

            if (application.DeductFromBroughtForward > 0) {
                yearHistory.broughtForwardUsed += application.DeductFromBroughtForward;
                if (staff.LeaveBroughtForward) {
                    const currentBalance = staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0;
                    const newBalance = Math.max(0, currentBalance - application.DeductFromBroughtForward);
                    if (newBalance > 0) {
                        staff.LeaveBroughtForward.daysCarriedFromPreviousYear = newBalance;
                    } else {
                        staff.LeaveBroughtForward = null;
                    }
                }
            }

            if (application.DeductFromSick > 0) {
                yearHistory.sickUsed += application.DeductFromSick;
                if (staff.SickLeave) {
                    staff.SickLeave.used += application.DeductFromSick;
                }
            }

            // Deduct from compensation leave pool
            if (application.DeductFromCompensation > 0) {
                yearHistory.compensationUsed = (yearHistory.compensationUsed || 0) + application.DeductFromCompensation;
                if (staff.CompensationLeave) {
                    staff.CompensationLeave.balance = Math.max(0,
                        (staff.CompensationLeave.balance || 0) - application.DeductFromCompensation
                    );
                    staff.CompensationLeave.used = (staff.CompensationLeave.used || 0) + application.DeductFromCompensation;
                }
            }

            yearHistory.totalUsed += application.Duration || 0;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearBalance(application.Email);
            EnhancedCacheManager.clear(`${SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX}${application.Email}`);

            Utils.logAction('UPDATE_STAFF_BALANCE', {
                email: application.Email,
                deductions: {
                    annual: application.DeductFromAnnual,
                    broughtForward: application.DeductFromBroughtForward,
                    sick: application.DeductFromSick
                },
                applicationId: application.ID
            });

            EnhancedCacheManager.logOperation('updateStaffLeaveBalances', startTime, {
                email: application.Email,
                applicationId: application.ID
            });

        } catch (error) {
            console.error('Error updating staff leave balances:', error);
            EnhancedCacheManager.logOperation('updateStaffLeaveBalances(error)', startTime, { error: error.message });
        }
    },

    rollbackStaffLeaveBalances: function (application) {
        const startTime = Date.now();
        try {
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const staffIndex = staffFile.data.findIndex(staff =>
                staff.Email.toLowerCase().trim() === application.Email.toLowerCase().trim()
            );

            if (staffIndex === -1) {
                console.error('Staff not found to rollback balance:', application.Email);
                return;
            }

            const staff = staffFile.data[staffIndex];
            const currentYear = Utils.getCurrentYear().toString();
            if (!staff.LeaveHistory) staff.LeaveHistory = {};
            if (!staff.LeaveHistory[currentYear]) {
                staff.LeaveHistory[currentYear] = { annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, compensationUsed: 0, totalUsed: 0 };
            }
            const yearHistory = staff.LeaveHistory[currentYear];

            // Rollback annual leave
            if (application.DeductFromAnnual > 0) {
                yearHistory.annualUsed = Math.max(0, (yearHistory.annualUsed || 0) - application.DeductFromAnnual);
                if (staff.LeaveAccrual) {
                    staff.LeaveAccrual.usedYearToDate = Math.max(0, (staff.LeaveAccrual.usedYearToDate || 0) - application.DeductFromAnnual);
                    const accrued = staff.LeaveAccrual.accruedYearToDate || 0;
                    const used = staff.LeaveAccrual.usedYearToDate;
                    const deficit = staff.LeaveAccrual.annualDeficit?.amount || 0;
                    staff.LeaveAccrual.availableBalance = Math.max(0, accrued - used + deficit);
                    if (deficit < 0 && staff.LeaveAccrual.annualDeficit) {
                        const rawAnnualBalance = accrued - used;
                        staff.LeaveAccrual.annualDeficit.amount = Math.min(0, rawAnnualBalance);
                    }
                }
            }

            // Rollback brought forward
            if (application.DeductFromBroughtForward > 0) {
                yearHistory.broughtForwardUsed = Math.max(0, (yearHistory.broughtForwardUsed || 0) - application.DeductFromBroughtForward);
                if (staff.LeaveBroughtForward) {
                    staff.LeaveBroughtForward.daysCarriedFromPreviousYear = (staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0) + application.DeductFromBroughtForward;
                } else {
                    staff.LeaveBroughtForward = {
                        daysCarriedFromPreviousYear: application.DeductFromBroughtForward,
                        yearEarned: Utils.getCurrentYear() - 1,
                        expiryDate: Utils.getEasterExpiryDate().toISOString().split('T')[0],
                        isExpired: false,
                        note: 'Restored from cancelled leave application'
                    };
                }
            }

            // Rollback sick leave
            if (application.DeductFromSick > 0) {
                yearHistory.sickUsed = Math.max(0, (yearHistory.sickUsed || 0) - application.DeductFromSick);
                if (staff.SickLeave) {
                    staff.SickLeave.used = Math.max(0, (staff.SickLeave.used || 0) - application.DeductFromSick);
                }
            }

            // Rollback compensation leave
            if (application.DeductFromCompensation > 0) {
                yearHistory.compensationUsed = Math.max(0, (yearHistory.compensationUsed || 0) - application.DeductFromCompensation);
                if (staff.CompensationLeave) {
                    staff.CompensationLeave.balance = (staff.CompensationLeave.balance || 0) + application.DeductFromCompensation;
                    staff.CompensationLeave.used = Math.max(0, (staff.CompensationLeave.used || 0) - application.DeductFromCompensation);
                }
            }

            yearHistory.totalUsed = Math.max(0, (yearHistory.totalUsed || 0) - (application.Duration || 0));
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearBalance(application.Email);
            EnhancedCacheManager.clear(`${SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX}${application.Email}`);

            Utils.logAction('ROLLBACK_STAFF_BALANCE', {
                email: application.Email,
                applicationId: application.ID,
                restoredDeductions: {
                    annual: application.DeductFromAnnual,
                    broughtForward: application.DeductFromBroughtForward,
                    sick: application.DeductFromSick,
                    compensation: application.DeductFromCompensation
                }
            });

            EnhancedCacheManager.logOperation('rollbackStaffLeaveBalances', startTime, {
                email: application.Email,
                applicationId: application.ID
            });

        } catch (error) {
            console.error('Error rolling back staff leave balances:', error);
            EnhancedCacheManager.logOperation('rollbackStaffLeaveBalances(error)', startTime, { error: error.message });
        }
    },

    amendLeaveDates: function (appId, newStartDate, newEndDate, reason, callerEmail) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            if (!user) return Utils.createErrorResponse('User not found');

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const appIndex = applicationsFile.data.findIndex(app => app.ID === appId);
            if (appIndex === -1) return Utils.createErrorResponse('Application not found');

            const app = applicationsFile.data[appIndex];
            if (app.Status !== SYSTEM.STATUS.APPROVED) {
                return Utils.createErrorResponse('Only Approved leave applications can be amended');
            }

            const isOwner = app.Email.toLowerCase() === currentUser.toLowerCase();
            const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
            const isHR = user.Role === SYSTEM.ROLES.HR;
            const isSupervisor = app.SupervisorEmail && app.SupervisorEmail.toLowerCase() === currentUser.toLowerCase();

            if (!isOwner && !isAdmin && !isHR && !isSupervisor) {
                return Utils.createErrorResponse('You are not authorized to amend this application');
            }

            const start = Utils.parseLocalDate(newStartDate);
            const end = Utils.parseLocalDate(newEndDate);
            if (!start || !end || start > end) {
                return Utils.createErrorResponse('Invalid amendment date range');
            }

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const sIdx = staffFile.data.findIndex(s => s.Email.toLowerCase() === app.Email.toLowerCase());
            if (sIdx === -1) return Utils.createErrorResponse('Applicant staff record not found');
            const applicantUser = staffFile.data[sIdx];

            // Overlap check against applicant's OTHER active applications
            const otherActiveApps = applicationsFile.data.filter(a =>
                a.ID !== appId &&
                a.Email.toLowerCase() === app.Email.toLowerCase() &&
                (a.Status === SYSTEM.STATUS.PENDING || a.Status === SYSTEM.STATUS.APPROVED)
            );

            for (const other of otherActiveApps) {
                const oStart = Utils.parseLocalDate(other.StartDate || other.HourlyDate);
                const oEnd = Utils.parseLocalDate(other.EndDate || other.HourlyDate || other.StartDate);
                if (oStart && oEnd && start <= oEnd && end >= oStart) {
                    return Utils.createErrorResponse(
                        `Amended dates overlap with existing ${other.Status} application (${other.ID}) from ${Utils.formatDateForDisplay(oStart)} to ${Utils.formatDateForDisplay(oEnd)}`
                    );
                }
            }

            const newDuration = Utils.getBusinessDays(newStartDate, newEndDate);
            const oldDuration = app.Duration;
            const dayDifference = Number((newDuration - oldDuration).toFixed(3));

            // Adjust staff leave balance if duration changed
            if (dayDifference > 0) {
                const available = AccrualManager.calculateAvailableBalance(applicantUser);
                if (available < dayDifference) {
                    return Utils.createErrorResponse(
                        `Insufficient leave balance for requested extension of ${dayDifference} day(s). Available: ${available.toFixed(2)}`
                    );
                }
                applicantUser.LeaveAccrual.usedYearToDate = (applicantUser.LeaveAccrual.usedYearToDate || 0) + dayDifference;
                applicantUser.LeaveAccrual.availableBalance = Math.max(0, (applicantUser.LeaveAccrual.availableBalance || 0) - dayDifference);
                app.DeductFromAnnual = (app.DeductFromAnnual || 0) + dayDifference;
            } else if (dayDifference < 0) {
                const refundDays = Math.abs(dayDifference);
                applicantUser.LeaveAccrual.usedYearToDate = Math.max(0, (applicantUser.LeaveAccrual.usedYearToDate || 0) - refundDays);
                applicantUser.LeaveAccrual.availableBalance = (applicantUser.LeaveAccrual.availableBalance || 0) + refundDays;
                app.DeductFromAnnual = Math.max(0, (app.DeductFromAnnual || 0) - refundDays);
            }

            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            app.Metadata = app.Metadata || {};
            app.Metadata.amendments = app.Metadata.amendments || [];
            app.Metadata.amendments.push({
                amendedAt: new Date().toISOString(),
                amendedBy: currentUser,
                oldStartDate: app.StartDate,
                oldEndDate: app.EndDate,
                oldDuration: oldDuration,
                newStartDate: newStartDate,
                newEndDate: newEndDate,
                newDuration: newDuration,
                dayDifference: dayDifference,
                reason: reason || 'Leave dates amended'
            });

            app.StartDate = newStartDate;
            app.EndDate = newEndDate;
            app.Duration = newDuration;
            app.CalendarDays = Utils.getCalendarDays(newStartDate, newEndDate);
            app.Comment = (app.Comment ? app.Comment + ' | ' : '') + `Dates amended to ${newStartDate}..${newEndDate} by ${currentUser}`;

            try {
                CalendarSyncManager.updateLeaveCalendarEvent(app, newStartDate, newEndDate);
            } catch (calErr) {
                console.warn('Calendar amendment sync error (non-fatal):', calErr.message);
            }

            if (app.Status === SYSTEM.STATUS.APPROVED && typeof GmailSyncManager !== 'undefined') {
                try {
                    GmailSyncManager.configureVacationResponder(app);
                } catch (vErr) {
                    console.warn('Vacation responder reconfigure notice:', vErr.message);
                }
            }

            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
            EnhancedCacheManager.buildIndexes();
            EnhancedCacheManager.clearBalance(app.Email);

            try {
                NotificationManager.notifyLeaveAmended(app, dayDifference, reason);
            } catch (nErr) {
                console.warn('Amendment notification error:', nErr.message);
            }

            Utils.logAction('AMEND_APPLICATION', {
                appId,
                applicant: app.Email,
                amendedBy: currentUser,
                oldDates: `${oldDuration} days (${app.Metadata.amendments[app.Metadata.amendments.length - 1].oldStartDate}..${app.Metadata.amendments[app.Metadata.amendments.length - 1].oldEndDate})`,
                newDates: `${newDuration} days (${newStartDate}..${newEndDate})`,
                dayDifference
            });

            return Utils.createSuccessResponse({
                applicationId: appId,
                newStartDate,
                newEndDate,
                newDuration,
                dayDifference,
                diff: dayDifference,
                message: dayDifference < 0
                    ? `Leave shortened by ${Math.abs(dayDifference)} day(s); days refunded to balance.`
                    : (dayDifference > 0 ? `Leave extended by ${dayDifference} day(s); deducted from balance.` : 'Dates updated.')
            }, 'Leave application dates amended successfully');

        } catch (error) {
            console.error('Error in amendLeaveDates:', error);
            return Utils.createErrorResponse('Failed to amend leave dates: ' + error.message);
        }
    }
};

// =============================================
// DASHBOARD & BALANCE CALCULATIONS
// =============================================

const DashboardManager = {
    calculateUserBalance: function (email) {
        const startTime = Date.now();
        const cachedBalance = EnhancedCacheManager.getBalance(email);
        if (cachedBalance) {
            EnhancedCacheManager.logOperation('calculateUserBalance(cached)', startTime, { cacheHit: true, email: email });
            return cachedBalance;
        }

        try {
            const user = StaffManager.getUserData(email);
            if (!user) {
                EnhancedCacheManager.logOperation('calculateUserBalance(no user)', startTime, { email: email });
                return null;
            }

            if (!user.EligibleForLeave) {
                const balanceData = {
                    eligible: false,
                    annual: {
                        eligible: false,
                        accrued: 0,
                        used: 0,
                        available: 0,
                        monthlyRate: 0,
                        nextAccrualDate: null,
                        annualDeficit: 0,
                        hasDeficit: false,
                        deficitAmount: 0,
                        percentage: 0,
                        note: 'Not eligible for leave'
                    },
                    sick: {
                        allocation: ConfigManager.getSickLeaveAllocation(),
                        used: 0,
                        balance: ConfigManager.getSickLeaveAllocation(),
                        percentage: 0
                    },
                    broughtForward: null,
                    total: { available: 0, used: 0, allocation: 0, percentage: 0, hasAnnualDeficit: false, annualDeficitAmount: 0 }
                };
                EnhancedCacheManager.setBalance(email, balanceData);
                return balanceData;
            }

            const currentYear = Utils.getCurrentYear().toString();
            const yearHistory = user.LeaveHistory?.[currentYear] || {
                annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, totalUsed: 0
            };

            const accrual = user.LeaveAccrual || {
                monthlyRate: 1.75,
                accruedYearToDate: 0,
                usedYearToDate: 0,
                annualDeficit: { amount: 0 },
                availableBalance: 0,
                nextAccrualDate: null
            };

            const monthlyRate = accrual.monthlyRate || 1.75;
            const accruedYearToDate = accrual.accruedYearToDate || 0;
            const usedYearToDate = accrual.usedYearToDate || 0;
            const annualDeficit = accrual.annualDeficit?.amount || 0;
            const availableAnnual = AccrualManager.calculateAvailableBalance(user);

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth(); // 0-based

            // Determine how many months have elapsed since the staff member started accruing
            // this year — for mid-year joiners, use their join month rather than January.
            let accrualStartMonth = 0; // January by default
            if (user.JoinDate) {
                const joinDate = new Date(user.JoinDate);
                if (joinDate.getFullYear() === currentDate.getFullYear()) {
                    accrualStartMonth = joinDate.getMonth();
                }
            }
            const monthsAccruing = currentMonth - accrualStartMonth + 1; // inclusive
            const theoreticalAllocation = Math.max(0, monthsAccruing) * monthlyRate;
            const annualPercentage = theoreticalAllocation > 0 ?
                Math.min(100, Math.round((usedYearToDate / theoreticalAllocation) * 100)) : 0;

            // =============================================
            // BROUGHT FORWARD CALCULATIONS - UPDATED
            // =============================================
            let broughtForwardData = null;
            let availableBroughtForward = 0;
            let broughtForwardTotal = 0;
            let broughtForwardUsed = 0;
            let broughtForwardRemaining = 0;
            let broughtForwardPercentage = 0;

            if (user.LeaveBroughtForward) {
                broughtForwardRemaining = user.LeaveBroughtForward.daysCarriedFromPreviousYear || 0;
                broughtForwardUsed = yearHistory.broughtForwardUsed || 0;
                broughtForwardTotal = broughtForwardRemaining + broughtForwardUsed;  // Original total
                availableBroughtForward = broughtForwardRemaining;

                const easterDate = Utils.getEasterExpiryDate(user.LeaveBroughtForward);
                easterDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isExpired = Boolean(user.LeaveBroughtForward.isExpired) || (today > easterDate);

                const rawRemaining = broughtForwardRemaining;
                if (isExpired) {
                    availableBroughtForward = 0;
                    broughtForwardRemaining = 0;
                }

                broughtForwardPercentage = broughtForwardTotal > 0 ?
                    Math.min(100, Math.round((broughtForwardUsed / broughtForwardTotal) * 100)) : 0;

                const easterStr = Utils.formatDateForDisplay(easterDate);
                const acqYear = user.LeaveBroughtForward.yearEarned || (today.getFullYear() - 1);

                broughtForwardData = {
                    // Complete information
                    total: broughtForwardTotal,                    // Original total (e.g. 5.0)
                    remaining: broughtForwardRemaining,             // 0 when forfeited
                    used: broughtForwardUsed,                        // Used so far
                    forfeited: isExpired ? rawRemaining : (user.LeaveBroughtForward.forfeitedDays || 0),
                    daysCarriedFromPreviousYear: broughtForwardRemaining, // 0 when forfeited
                    available: availableBroughtForward,            // 0 when forfeited
                    expiryDate: user.LeaveBroughtForward.expiryDate || Utils.formatLocalDate(easterDate),
                    yearEarned: user.LeaveBroughtForward.yearEarned,
                    yearExpires: user.LeaveBroughtForward.yearExpires || (user.LeaveBroughtForward.yearEarned ? user.LeaveBroughtForward.yearEarned + 1 : today.getFullYear()),
                    isExpired: isExpired,
                    isForfeited: isExpired,
                    note: isExpired
                        ? `${rawRemaining} day(s) carried forward from ${acqYear} forfeited after Easter (${easterStr})`
                        : (user.LeaveBroughtForward.note || ''),
                    percentage: broughtForwardPercentage,
                    usagePercentage: broughtForwardPercentage
                };
            }

            // Sick leave calculations
            const sickAllocation = ConfigManager.getSickLeaveAllocation();
            const sickUsed = user.SickLeave?.used || 0;
            const sickBalance = Math.max(0, sickAllocation - sickUsed);
            const sickPercentage = sickAllocation > 0 ? Math.round((sickUsed / sickAllocation) * 100) : 0;

            // Compensation leave
            const compensationBalance = Math.max(0, user.CompensationLeave?.balance || 0);
            const compensationUsedTotal = user.CompensationLeave?.used || 0;
            const compensationTotal = compensationBalance + compensationUsedTotal;

            // Total calculations (annual available + brought forward available + compensation balance)
            const totalAvailable = availableAnnual + availableBroughtForward + compensationBalance;
            const totalUsed = usedYearToDate + broughtForwardUsed + compensationUsedTotal;
            const totalAllocation = theoreticalAllocation + (broughtForwardTotal > 0 ? broughtForwardTotal : 0) + compensationTotal;
            const overallPercentage = totalAllocation > 0 ? Math.round((totalUsed / totalAllocation) * 100) : 0;

            const projection = AccrualManager.getAccrualProjection(user);

            let daysUntilNextAccrual = 0;
            if (accrual.nextAccrualDate) {
                const nextAccrual = new Date(accrual.nextAccrualDate);
                daysUntilNextAccrual = Math.max(0, Math.ceil((nextAccrual - currentDate) / (1000 * 60 * 60 * 24)));
            }

            const balanceData = {
                eligible: true,
                annual: {
                    eligible: true,
                    allocation: theoreticalAllocation,
                    accrued: accruedYearToDate,
                    used: usedYearToDate,
                    available: availableAnnual,
                    monthlyRate: monthlyRate,
                    annualDeficit: annualDeficit,
                    hasDeficit: annualDeficit < 0,
                    deficitAmount: Math.abs(Math.min(0, annualDeficit)),
                    percentage: annualPercentage,
                    nextAccrualDate: accrual.nextAccrualDate,
                    daysUntilNextAccrual: daysUntilNextAccrual,
                    note: annualDeficit < 0 ? `${Math.abs(annualDeficit).toFixed(2)} day deficit from previous year` : 'No annual deficit',
                    projection: projection ? {
                        monthsRemaining: projection.monthsRemaining,
                        futureAccrual: projection.futureAccrual,
                        projectedYearEnd: projection.projectedYearEnd
                    } : null
                },
                sick: {
                    allocation: sickAllocation,
                    used: sickUsed,
                    balance: sickBalance,
                    percentage: sickPercentage
                },
                broughtForward: broughtForwardData,
                compensation: {
                    balance: compensationBalance,
                    used: compensationUsedTotal,
                    total: compensationTotal,
                    totalAwarded: compensationTotal,
                    awards: user.CompensationLeave?.awards || []
                },
                total: {
                    available: totalAvailable,
                    used: totalUsed,
                    allocation: totalAllocation,
                    percentage: overallPercentage,
                    hasAnnualDeficit: annualDeficit < 0,
                    annualDeficitAmount: Math.abs(Math.min(0, annualDeficit))
                }
            };

            EnhancedCacheManager.setBalance(email, balanceData);
            EnhancedCacheManager.logOperation('calculateUserBalance', startTime, { cacheHit: false, email: email });

            return balanceData;

        } catch (error) {
            console.error('Error calculating user balance:', error);
            EnhancedCacheManager.logOperation('calculateUserBalance(error)', startTime, { email: email, error: error.message });
            return null;
        }
    },
    getDashboardData: function () {
        const startTime = Date.now();
        const userEmail = Session.getActiveUser().getEmail();
        const cacheKey = `${SYSTEM.CACHE_KEYS.DASHBOARD_PREFIX}${userEmail}`;

        const cached = EnhancedCacheManager.get(cacheKey);
        if (cached) {
            EnhancedCacheManager.logOperation('getDashboardData(cached)', startTime, { cacheHit: true });
            return cached;
        }

        try {
            const user = StaffManager.getUserData(userEmail);
            if (!user) return Utils.createErrorResponse('User not found in staff records');

            const balanceData = this.calculateUserBalance(userEmail);
            if (!balanceData) return Utils.createErrorResponse('Failed to calculate balance');

            const applications = EnhancedCacheManager.getApplicationsByEmail(userEmail, {});
            const recentApplications = applications.slice(0, 10);

            const stats = {
                totalApplications: applications.length,
                approvedApplications: applications.filter(app => app.Status === SYSTEM.STATUS.APPROVED).length,
                pendingApplications: applications.filter(app => app.Status === SYSTEM.STATUS.PENDING).length,
                declinedApplications: applications.filter(app => app.Status === SYSTEM.STATUS.DECLINED).length,
                cancelledApplications: applications.filter(app => app.Status === SYSTEM.STATUS.CANCELLED).length
            };

            let supervisedData = null;
            if (user.Role === SYSTEM.ROLES.SUPERVISOR || user.Role === SYSTEM.ROLES.ADMIN) {
                const supervisedStaff = StaffManager.getStaffBySupervisor(userEmail);
                const pendingApplications = EnhancedCacheManager.getPendingApplications(userEmail);
                supervisedData = {
                    teamSize: supervisedStaff.length,
                    eligibleTeamSize: supervisedStaff.filter(s => s.EligibleForLeave).length,
                    pendingCount: pendingApplications.length
                };
            }

            const dashboardData = Utils.createSuccessResponse({
                user: {
                    email: user.Email,
                    name: user.Name,
                    role: user.Role,
                    department: user.Department,
                    joinDate: user.JoinDate,
                    supervisor: user.Supervisor,
                    eligibleForLeave: user.EligibleForLeave
                },
                balance: balanceData,
                applications: recentApplications,
                stats: stats,
                supervisedData: supervisedData,
                systemInfo: {
                    currentYear: Utils.getCurrentYear(),
                    version: SYSTEM.VERSION,
                    lastUpdated: new Date().toISOString(),
                    accrualSystem: {
                        enabled: ConfigManager.isAccrualSystemEnabled(),
                        monthlyRate: balanceData.annual.monthlyRate
                    }
                }
            });

            EnhancedCacheManager.set(cacheKey, dashboardData);
            EnhancedCacheManager.logOperation('getDashboardData', startTime, { cacheHit: false, email: userEmail });

            return dashboardData;

        } catch (error) {
            console.error('Error getting dashboard data:', error);
            EnhancedCacheManager.logOperation('getDashboardData(error)', startTime, { error: error.message });
            return Utils.createErrorResponse('Failed to load dashboard data: ' + error.toString());
        }
    },

    getSupervisorStatsData: function () {
        try {
            const supervisorEmail = Session.getActiveUser().getEmail();
            const supervisorRole = StaffManager.getUserRole(supervisorEmail);

            if (supervisorRole !== SYSTEM.ROLES.SUPERVISOR && supervisorRole !== SYSTEM.ROLES.ADMIN) {
                throw new Error('User is not a supervisor');
            }

            const supervisedStaff = StaffManager.getStaffBySupervisor(supervisorEmail);
            const allApplications = ApplicationsManager.getAllApplicationsData({});

            let pendingCount = 0;
            let approvedThisMonth = 0;
            let cancelledCount = 0;
            let totalTheoreticalAllocation = 0;
            let totalUsed = 0;
            let totalAccrued = 0;
            let totalDeficit = 0;
            const currentMonth = new Date().getMonth();
            const currentYear = Utils.getCurrentYear();

            const eligibleSupervisedStaff = supervisedStaff.filter(staff => staff.EligibleForLeave);

            eligibleSupervisedStaff.forEach(staff => {
                const staffApplications = allApplications.filter(app =>
                    app.Email && app.Email.toLowerCase().trim() === staff.Email.toLowerCase().trim()
                );

                pendingCount += staffApplications.filter(app => app.Status === SYSTEM.STATUS.PENDING).length;
                cancelledCount += staffApplications.filter(app => app.Status === SYSTEM.STATUS.CANCELLED).length;

                approvedThisMonth += staffApplications.filter(app => {
                    if (app.Status !== SYSTEM.STATUS.APPROVED) return false;
                    const processedDate = app.ProcessedDate || app.DateApplied;
                    if (!processedDate) return false;
                    try {
                        const date = new Date(processedDate);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                    } catch (e) {
                        return false;
                    }
                }).length;

                const monthlyRate = staff.LeaveAccrual?.monthlyRate || 1.75;
                const monthsThisYear = currentMonth + 1;
                const theoreticalAllocation = monthsThisYear * monthlyRate;

                totalTheoreticalAllocation += theoreticalAllocation;
                totalUsed += staff.LeaveAccrual?.usedYearToDate || 0;
                totalAccrued += staff.LeaveAccrual?.accruedYearToDate || 0;
                totalDeficit += Math.abs(Math.min(0, staff.LeaveAccrual?.annualDeficit?.amount || 0));
            });

            const utilizationRate = totalTheoreticalAllocation > 0 ?
                Math.round((totalUsed / totalTheoreticalAllocation) * 100) : 0;
            const effectiveUtilizationRate = totalTheoreticalAllocation > 0 ?
                Math.round(((totalUsed + totalDeficit) / totalTheoreticalAllocation) * 100) : 0;

            const staffBalances = eligibleSupervisedStaff.map(staff => {
                const balanceData = this.calculateUserBalance(staff.Email);
                const compBal = balanceData?.compensation?.balance ?? staff.CompensationLeave?.balance ?? 0;
                const compUsed = balanceData?.compensation?.used ?? staff.CompensationLeave?.used ?? 0;
                return {
                    name: staff.Name,
                    email: staff.Email,
                    department: staff.Department,
                    role: staff.Role,
                    eligibleForLeave: staff.EligibleForLeave,
                    compensationBalance: compBal,
                    compensationUsed: compUsed,
                    balance: balanceData || {
                        annual: { available: 0, used: 0, percentage: 0 },
                        broughtForward: null,
                        sick: { balance: 0, used: 0, percentage: 0 },
                        compensation: { balance: compBal, used: compUsed, total: compBal + compUsed },
                        total: { available: 0, used: 0, percentage: 0 }
                    }
                };
            });

            const lowBalanceAlerts = staffBalances.filter(staff =>
                staff.balance.total.available < 5 || staff.balance.annual.hasDeficit
            ).map(staff => ({
                name: staff.name,
                email: staff.email,
                totalBalance: staff.balance.total.available,
                annualBalance: staff.balance.annual.available,
                broughtForwardBalance: staff.balance.broughtForward?.daysCarriedFromPreviousYear || 0,
                compensationBalance: staff.balance.compensation?.balance || staff.compensationBalance || 0,
                sickBalance: staff.balance.sick.balance,
                hasDeficit: staff.balance.annual.hasDeficit,
                deficitAmount: staff.balance.annual.deficitAmount || 0
            }));

            const deficitStaff = staffBalances.filter(staff => staff.balance.annual.hasDeficit)
                .map(staff => ({
                    name: staff.name,
                    email: staff.email,
                    deficit: staff.balance.annual.deficitAmount,
                    effectiveAnnualBalance: staff.balance.annual.available,
                    monthlyRate: staff.balance.annual.monthlyRate,
                    monthsToRepay: Math.ceil(staff.balance.annual.deficitAmount / staff.balance.annual.monthlyRate)
                }));

            const ineligibleStaff = supervisedStaff.filter(staff => !staff.EligibleForLeave)
                .map(staff => ({
                    name: staff.Name,
                    email: staff.Email,
                    department: staff.Department,
                    role: staff.Role,
                    note: 'Not eligible for leave'
                }));

            return {
                teamSize: supervisedStaff.length,
                eligibleTeamSize: eligibleSupervisedStaff.length,
                ineligibleTeamSize: ineligibleStaff.length,
                pendingCount: pendingCount,
                cancelledCount: cancelledCount,
                approvedThisMonth: approvedThisMonth,
                utilizationRate: utilizationRate,
                effectiveUtilizationRate: effectiveUtilizationRate,
                summary: {
                    totalTheoreticalAllocation: totalTheoreticalAllocation,
                    totalAccrued: totalAccrued,
                    totalUsed: totalUsed,
                    totalDeficit: totalDeficit,
                    remaining: totalAccrued - totalUsed,
                    averageUtilization: utilizationRate,
                    staffWithDeficit: deficitStaff.length,
                    totalDeficitAmount: totalDeficit
                },
                supervisedStaff: staffBalances,
                lowBalanceAlerts: lowBalanceAlerts,
                deficitStaff: deficitStaff,
                ineligibleStaff: ineligibleStaff
            };
        } catch (error) {
            console.error('Error getting supervisor dashboard stats:', error);
            throw new Error('Failed to get supervisor dashboard stats: ' + error.toString());
        }
    }
};

// =============================================
// ADMIN FUNCTIONS
// =============================================

const AdminManager = {
    processYearEnd: function (isSystemAutomated = false) {
        try {
            if (!isSystemAutomated) {
                const currentUser = Session.getActiveUser().getEmail();
                const userRole = StaffManager.getUserRole(currentUser);

                if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
                    return Utils.createErrorResponse('Only administrators can run year-end processing');
                }
            }

            const today = new Date();
            const targetYear = today.getFullYear();   // the year we are now entering
            const sourceYear = targetYear - 1;        // the year just ended

            // ── YEAR GUARD — run once per year ───────────────────────────────────
            const guardKey = `yearEndProcessed_${sourceYear}`;
            const alreadyRan = PropertiesService.getScriptProperties().getProperty(guardKey);
            if (alreadyRan) {
                return Utils.createErrorResponse(
                    `Year-end for ${sourceYear} was already processed on ${alreadyRan}. Skipping.`
                );
            }

            // Easter of the target year = expiry date for brought-forward leave
            const expiryDate = Utils.calculateEasterDate(targetYear);

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            let processedCount = 0;
            let totalCarriedForward = 0;
            let totalCompensationCarried = 0;
            let totalAnnualDeficit = 0;
            const carryForwardLog = [];
            const annualDeficitLog = [];

            const maxCarryForward = ConfigManager.getMaxCarryForward();

            staffFile.data.forEach((member) => {
                if (member.Metadata?.active === false) return;
                if (!member.EligibleForLeave) return;

                const accrual = member.LeaveAccrual || {
                    accruedYearToDate: 0,
                    usedYearToDate: 0,
                    annualDeficit: { amount: 0 }
                };

                // ── 1. Annual leave carry-forward or deficit ───────────────────────
                const accrued = accrual.accruedYearToDate || 0;
                const used = accrual.usedYearToDate || 0;
                const existingDeficit = accrual.annualDeficit?.amount || 0;
                const netPosition = accrued - used + existingDeficit;

                let newBFDays = 0;

                if (netPosition > 0) {
                    newBFDays = Math.min(netPosition, maxCarryForward);
                    member.LeaveBroughtForward = {
                        daysCarriedFromPreviousYear: newBFDays,
                        expiryDate: Utils.formatLocalDate(expiryDate),
                        yearEarned: sourceYear,
                        yearExpires: targetYear,
                        isExpired: false,
                        note: `${newBFDays} days unused ${sourceYear} annual leave — expires Easter ${targetYear} (${Utils.formatLocalDate(expiryDate)})`
                    };
                    member.LeaveAccrual.annualDeficit = { amount: 0, fromYear: null, recoveryHistory: [] };

                    carryForwardLog.push({
                        email: member.Email,
                        name: member.Name,
                        carriedForward: newBFDays,
                        forfeitedExcess: netPosition > maxCarryForward
                            ? +(netPosition - maxCarryForward).toFixed(3) : 0
                    });
                    totalCarriedForward += newBFDays;

                } else if (netPosition < 0) {
                    member.LeaveAccrual.annualDeficit = {
                        amount: netPosition,
                        fromYear: sourceYear,
                        recoveryHistory: [],
                        note: `Deficit from ${sourceYear} — recovered from ${targetYear} monthly accruals`
                    };
                    member.LeaveBroughtForward = null;

                    annualDeficitLog.push({ email: member.Email, name: member.Name, deficit: netPosition });
                    totalAnnualDeficit += Math.abs(netPosition);

                } else {
                    member.LeaveBroughtForward = null;
                    member.LeaveAccrual.annualDeficit = { amount: 0, fromYear: null, recoveryHistory: [] };
                }

                // ── 2. Compensation leave — accumulates, never reset ──────────────
                if (member.CompensationLeave) {
                    totalCompensationCarried += member.CompensationLeave.balance || 0;
                }

                // ── 3. Reset annual accrual counters for the new year ─────────────
                member.LeaveAccrual.accruedYearToDate = 0;
                member.LeaveAccrual.usedYearToDate = 0;

                // Available balance starts as the BF days carried forward (if any).
                // Monthly accrual for January will add 1.75 on top when it runs.
                // Deficit staff start at 0 — they must accrue their way back.
                member.LeaveAccrual.availableBalance = Math.max(0, newBFDays);

                const nextAccrualDate = new Date(targetYear, 0, 1); // Jan 1 of new year
                member.LeaveAccrual.nextAccrualDate = nextAccrualDate.toISOString().split('T')[0];
                member.LeaveAccrual.lastAccrualDate = new Date(sourceYear, 11, 1).toISOString().split('T')[0];

                // ── 4. Reset sick leave ────────────────────────────────────────────
                member.SickLeave = {
                    used: 0,
                    balance: SYSTEM.LEAVE_POLICY.SICK_LEAVE,   // 7 days
                    resetDate: `${targetYear + 1}-01-01`
                };

                // ── 5. Fresh LeaveHistory entry for the new year ──────────────────
                if (!member.LeaveHistory) member.LeaveHistory = {};
                member.LeaveHistory[targetYear.toString()] = {
                    annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0,
                    compensationUsed: 0, totalUsed: 0
                };

                processedCount++;
            });

            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearAll();
            EnhancedCacheManager.buildIndexes();

            // ── Stamp the guard so this never runs twice for sourceYear ──────────
            PropertiesService.getScriptProperties().setProperty(guardKey, today.toISOString());

            // ── Log to annual_reset_logs.json ─────────────────────────────────────
            const resetLogFile = DataManager.readDataFile(SYSTEM.DATA_FILES.ANNUAL_RESET);
            resetLogFile.data.push({
                timestamp: today.toISOString(),
                performedBy: currentUser,
                sourceYear, targetYear,
                easterDate: expiryDate.toISOString().split('T')[0],
                processedCount,
                totalCarriedForward,
                totalCompensationCarried,
                totalAnnualDeficit,
                carryForwardLog,
                annualDeficitLog
            });
            DataManager.writeDataFile(SYSTEM.DATA_FILES.ANNUAL_RESET, resetLogFile);

            Utils.logAction('YEAR_END_PROCESSING', {
                sourceYear, targetYear, processedCount,
                totalCarriedForward, totalAnnualDeficit
            }, currentUser);

            // ── Notify HR ─────────────────────────────────────────────────────────
            NotificationManager.notifyHRYearEnd({
                sourceYear, targetYear, processedCount,
                totalCarriedForward, totalAnnualDeficit,
                forfeitedCount: 0,   // expiry is now a separate Easter job
                easterDate: expiryDate.toISOString().split('T')[0]
            });

            const message =
                `Year-end processing complete for ${sourceYear} → ${targetYear}. ` +
                `${totalCarriedForward.toFixed(3)} days carried forward (expires Easter ${targetYear}: ` +
                `${expiryDate.toDateString()}). ` +
                (totalAnnualDeficit > 0
                    ? `${totalAnnualDeficit.toFixed(3)} days deficit carried forward. `
                    : '');

            return Utils.createSuccessResponse({
                sourceYear, targetYear, processedCount,
                totalCarriedForward, totalCompensationCarried,
                totalAnnualDeficit,
                easterExpiryDate: expiryDate.toISOString().split('T')[0],
                carryForwardLog, annualDeficitLog
            }, message);

        } catch (error) {
            console.error('Error in year-end processing:', error);
            return Utils.createErrorResponse('Year-end processing failed: ' + error.toString());
        }
    }
};



// =============================================
// EMAIL NOTIFICATION SERVICE - CLEAN PROFESSIONAL
// =============================================

const EmailService = {
    SYSTEM_NAME: SYSTEM.NAME,
    SYSTEM_URL: ScriptApp.getService().getUrl(),

    // Base styles shared across all templates
    baseStyles: `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5; 
      color: #1f2937; 
      background-color: #f3f4f6; 
      margin: 0; 
      padding: 20px; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); 
      overflow: hidden; 
    }
    .header { 
      padding: 24px 32px; 
      text-align: center; 
    }
    .header-primary { background-color: #059669; }
    .header-success { background-color: #059669; }
    .header-error { background-color: #dc2626; }
    .title { 
      font-size: 20px; 
      font-weight: 600; 
      color: white; 
      margin: 0; 
    }
    .subtitle { 
      font-size: 14px; 
      color: rgba(255, 255, 255, 0.9); 
      margin-top: 4px; 
    }
    .content { padding: 32px; }
    .greeting { 
      font-size: 16px; 
      font-weight: 500; 
      color: #111827; 
      margin-bottom: 24px; 
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badge-approved { background-color: #d1fae5; color: #065f46; }
    .badge-declined { background-color: #fee2e2; color: #991b1b; }
    .section { 
      background-color: #f9fafb; 
      border-radius: 8px; 
      padding: 24px; 
      margin-bottom: 24px; 
    }
    .grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 16px; 
    }
    .label { 
      font-size: 12px; 
      color: #6b7280; 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
      margin-bottom: 4px; 
    }
    .value { 
      font-size: 16px; 
      font-weight: 500; 
      color: #111827; 
    }
    .reason-box { 
      background: white; 
      border-radius: 6px; 
      padding: 16px; 
      border-left: 3px solid #059669; 
      margin-top: 16px; 
    }
    .button { 
      display: inline-block; 
      background-color: #059669; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 6px; 
      text-decoration: none; 
      font-weight: 500; 
      font-size: 14px; 
      margin-top: 24px; 
    }
    .footer { 
      background-color: #f9fafb; 
      padding: 24px 32px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb; 
      font-size: 12px; 
      color: #6b7280; 
    }
    .footer a { color: #059669; text-decoration: none; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  `,

    templates: {
        applicationSubmitted: {
            subject: `Leave Application Submitted - ${SYSTEM.NAME}`,
            htmlBody: (data) => `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${EmailService.baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header header-primary">
              <div class="title">${data.systemName}</div>
              <div class="subtitle">Leave Management System</div>
            </div>
            <div class="content">
              <div class="greeting">Dear ${data.supervisorName},</div>
              <div class="section">
                <div style="font-weight: 600; color: #059669; margin-bottom: 16px;">New Leave Application</div>
                <div class="grid">
                  <div><div class="label">Staff Member</div><div class="value">${data.staffName}</div></div>
                  <div><div class="label">Department</div><div class="value">${data.department}</div></div>
                  <div><div class="label">Leave Type</div><div class="value">${data.leaveType}</div></div>
                  <div><div class="label">Duration</div><div class="value">${data.duration} days</div></div>
                  <div><div class="label">Start Date</div><div class="value">${data.startDate}</div></div>
                  <div><div class="label">End Date</div><div class="value">${data.endDate}</div></div>
                </div>
                <div style="margin-top: 16px;">
                  <div class="label">Reason</div>
                  <div class="value">${data.reason}</div>
                </div>
                <div style="text-align: center;">
                  <a href="${data.actionUrl}" class="button">Review Application</a>
                </div>
              </div>
              <div style="text-align: center; color: #6b7280; font-size: 13px;">
                Please review within 48 hours
              </div>
            </div>
            <div class="footer">
              <div><a href="${data.systemUrl}">${data.systemUrl}</a></div>
              <div style="margin-top: 8px;">© ${new Date().getFullYear()} ${SYSTEM.ORGANIZATION}</div>
              <div style="margin-top: 16px; font-size: 11px;">This is an automated message. Please do not reply.</div>
            </div>
          </div>
        </body>
        </html>
      `
        },

        applicationApproved: {
            subject: `Leave Application Approved - ${SYSTEM.NAME}`,
            htmlBody: (data) => `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${EmailService.baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header header-success">
              <div class="title">${data.systemName}</div>
              <div class="subtitle">Leave Management System</div>
            </div>
            <div class="content">
              <div style="text-align: center;">
                <span class="badge badge-approved">✓ APPROVED</span>
                <div class="greeting" style="margin-top: 8px;">Great news, ${data.staffName}!</div>
                <p style="color: #6b7280;">Your leave application has been approved.</p>
              </div>
              <hr>
              <div class="grid">
                <div><div class="label">Application ID</div><div class="value">${data.appId}</div></div>
                <div><div class="label">Leave Type</div><div class="value">${data.leaveType}</div></div>
                <div><div class="label">Period</div><div class="value">${data.startDate} - ${data.endDate}</div></div>
                <div><div class="label">Duration</div><div class="value">${data.duration} days</div></div>
              </div>
              <hr>
              <div style="display: flex; justify-content: space-between; text-align: center;">
                <div><div class="label">Annual Used</div><div class="value">${data.deductAnnual}</div></div>
                <div><div class="label">B/Fwd Used</div><div class="value">${data.deductBroughtForward}</div></div>
                <div><div class="label">Sick Used</div><div class="value">${data.deductSick}</div></div>
              </div>
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Balance</a>
              </div>
            </div>
            <div class="footer">
              <div><a href="${data.systemUrl}">${data.systemUrl}</a></div>
              <div>Making Every Season Count</div>
            </div>
          </div>
        </body>
        </html>
      `
        },

        applicationDeclined: {
            subject: `Leave Application Declined - ${SYSTEM.NAME}`,
            htmlBody: (data) => `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${EmailService.baseStyles}</style></head>
        <body>
          <div class="container">
            <div class="header header-error">
              <div class="title">${data.systemName}</div>
              <div class="subtitle">Leave Management System</div>
            </div>
            <div class="content">
              <div style="text-align: center;">
                <span class="badge badge-declined">✗ DECLINED</span>
                <div class="greeting" style="margin-top: 8px;">Dear ${data.staffName},</div>
                <p style="color: #6b7280;">Your leave application has been declined.</p>
              </div>
              <hr>
              <div class="grid">
                <div><div class="label">Application ID</div><div class="value">${data.appId}</div></div>
                <div><div class="label">Leave Type</div><div class="value">${data.leaveType}</div></div>
                <div><div class="label">Period</div><div class="value">${data.startDate} - ${data.endDate}</div></div>
                <div><div class="label">Duration</div><div class="value">${data.duration} days</div></div>
              </div>
              <div class="reason-box">
                <div class="label">Reason for Declining</div>
                <div class="value">${data.comment}</div>
              </div>
              <div style="background-color: #fef3c7; border-radius: 6px; padding: 16px; margin-top: 24px;">
                <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">Next Steps</div>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px;">
                  <li>Review the reason for declining above</li>
                  <li>Check your leave balance before reapplying</li>
                  <li>Contact your supervisor if you need clarification</li>
                </ul>
              </div>
              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">View Details</a>
              </div>
            </div>
            <div class="footer">
              <div><a href="${data.systemUrl}">${data.systemUrl}</a></div>
              <div>Making Every Season Count</div>
            </div>
          </div>
        </body>
        </html>
      `
        }
    },

    sendEmail: function (templateName, recipientEmail, recipientName, data) {
        try {
            if (!recipientEmail || !Utils.isValidEmail(recipientEmail)) {
                console.warn('Invalid recipient email:', recipientEmail);
                return false;
            }

            const template = this.templates[templateName];
            if (!template) {
                console.error('Email template not found:', templateName);
                return false;
            }

            const emailData = {
                systemName: this.SYSTEM_NAME,
                systemUrl: this.SYSTEM_URL,
                dashboardUrl: this.SYSTEM_URL,
                actionUrl: this.SYSTEM_URL,
                department: data.department || 'Not specified',
                ...data
            };

            // Generate HTML from template function
            const htmlBody = template.htmlBody(emailData);

            MailApp.sendEmail({
                to: recipientEmail,
                subject: template.subject,
                htmlBody: htmlBody,
                name: this.SYSTEM_NAME
            });

            console.log(`✓ Email sent to ${recipientEmail}: ${templateName}`);
            return true;

        } catch (error) {
            console.error('✗ Error sending email:', error);
            return false;
        }
    }
};
// =============================================
// NOTIFICATION TRIGGERS
// =============================================

const NotificationManager = {
    // ── Helper: get all HR staff emails ──────────────────────────────────
    getHREmails: function () {
        try {
            const allStaff = StaffManager.getAllStaffData();
            return allStaff
                .filter(s => s.Role === SYSTEM.ROLES.HR && s.Metadata?.active !== false)
                .map(s => s.Email)
                .filter(Boolean);
        } catch (e) {
            console.error('getHREmails error:', e);
            return [];
        }
    },

    notifyApplicationSubmitted: function (application) {
        try {
            if (!application.SupervisorEmail) return false;
            const supervisor = StaffManager.getUserData(application.SupervisorEmail);
            if (!supervisor) return false;

            const data = {
                supervisorName: supervisor.Name,
                staffName: application.Name,
                leaveType: application.LeaveType,
                startDate: Utils.formatDateForDisplay(application.StartDate),
                endDate: Utils.formatDateForDisplay(application.EndDate),
                duration: application.Duration,
                reason: application.Reason || 'No reason provided',
                department: application.Department
            };

            EmailService.sendEmail('applicationSubmitted', application.SupervisorEmail, supervisor.Name, data);

            // Also notify HR of the new submission
            this.getHREmails().forEach(hrEmail => {
                try {
                    const hrUser = StaffManager.getUserData(hrEmail);
                    EmailService.sendEmail('applicationSubmitted', hrEmail, hrUser?.Name || 'HR', data);
                } catch (e) { console.error('HR notify submit error:', e); }
            });

            return true;
        } catch (error) {
            console.error('Error in notifyApplicationSubmitted:', error);
            return false;
        }
    },

    notifyApplicationApproved: function (application) {
        try {
            return EmailService.sendEmail('applicationApproved',
                application.Email,
                application.Name,
                {
                    staffName: application.Name,
                    appId: application.ID,
                    leaveType: application.LeaveType,
                    startDate: Utils.formatDateForDisplay(application.StartDate),
                    endDate: Utils.formatDateForDisplay(application.EndDate),
                    duration: application.Duration,
                    approvedBy: application.ProcessedBy,
                    processedDate: Utils.formatDateForDisplay(application.ProcessedDate),
                    deductAnnual: application.DeductFromAnnual || 0,
                    deductBroughtForward: application.DeductFromBroughtForward || 0,
                    deductCompensation: application.DeductFromCompensation || 0,
                    deductSick: application.DeductFromSick || 0
                }
            );
        } catch (error) {
            console.error('Error in notifyApplicationApproved:', error);
            return false;
        }
    },

    notifyApplicationDeclined: function (application) {
        try {
            return EmailService.sendEmail('applicationDeclined',
                application.Email,
                application.Name,
                {
                    staffName: application.Name,
                    appId: application.ID,
                    leaveType: application.LeaveType,
                    startDate: Utils.formatDateForDisplay(application.StartDate),
                    endDate: Utils.formatDateForDisplay(application.EndDate),
                    duration: application.Duration,
                    declinedBy: application.ProcessedBy,
                    processedDate: Utils.formatDateForDisplay(application.ProcessedDate),
                    comment: application.Comment || 'No reason provided'
                }
            );
        } catch (error) {
            console.error('Error in notifyApplicationDeclined:', error);
            return false;
        }
    },

    // Notify all HR staff of every leave decision (approve or decline)
    notifyHRDecision: function (application, decision, comment) {
        try {
            const hrEmails = this.getHREmails();
            if (hrEmails.length === 0) return false;

            const subject = `[Leave Decision] ${decision}: ${application.Name} — ${application.LeaveType}`;
            const body = `
        <p>A leave application has been <strong>${decision}</strong>.</p>
        <table>
          <tr><td><b>Staff</b></td><td>${application.Name} (${application.Email})</td></tr>
          <tr><td><b>Department</b></td><td>${application.Department || '—'}</td></tr>
          <tr><td><b>Leave Type</b></td><td>${application.LeaveType}</td></tr>
          <tr><td><b>Period</b></td><td>${Utils.formatDateForDisplay(application.StartDate)} – ${Utils.formatDateForDisplay(application.EndDate)}</td></tr>
          <tr><td><b>Duration</b></td><td>${application.Duration} day(s)</td></tr>
          <tr><td><b>Processed By</b></td><td>${application.ProcessedBy}</td></tr>
          ${comment ? `<tr><td><b>Comment</b></td><td>${comment}</td></tr>` : ''}
          <tr><td><b>Deductions</b></td><td>
            Annual: ${application.DeductFromAnnual || 0} |
            BF: ${application.DeductFromBroughtForward || 0} |
            Comp: ${application.DeductFromCompensation || 0} |
            Sick: ${application.DeductFromSick || 0}
          </td></tr>
        </table>
      `;

            hrEmails.forEach(hrEmail => {
                try {
                    MailApp.sendEmail({ to: hrEmail, subject, htmlBody: body, name: SYSTEM.NAME });
                } catch (e) { console.error('HR decision notify error:', e); }
            });
            return true;
        } catch (error) {
            console.error('notifyHRDecision error:', error);
            return false;
        }
    },

    // Notify HR of year-end processing summary
    notifyHRYearEnd: function (summary) {
        try {
            const hrEmails = this.getHREmails();
            if (hrEmails.length === 0) return false;

            const subject = `[Year-End] ${summary.sourceYear} → ${summary.targetYear} Processing Complete`;
            const body = `
        <p>Year-end leave processing has been completed.</p>
        <table>
          <tr><td><b>Source Year</b></td><td>${summary.sourceYear}</td></tr>
          <tr><td><b>Target Year</b></td><td>${summary.targetYear}</td></tr>
          <tr><td><b>Staff Processed</b></td><td>${summary.processedCount}</td></tr>
          <tr><td><b>Days Carried Forward</b></td><td>${summary.totalCarriedForward}</td></tr>
          <tr><td><b>Deficit Carried</b></td><td>${summary.totalAnnualDeficit}</td></tr>
          <tr><td><b>BF Leave Expiry (Easter)</b></td><td>${summary.easterDate}</td></tr>
          <tr><td><b>BF Days Forfeited</b></td><td>${summary.forfeitedCount} staff</td></tr>
        </table>
      `;

            hrEmails.forEach(hrEmail => {
                try {
                    MailApp.sendEmail({ to: hrEmail, subject, htmlBody: body, name: SYSTEM.NAME });
                } catch (e) { console.error('HR year-end notify error:', e); }
            });
            return true;
        } catch (error) {
            console.error('notifyHRYearEnd error:', error);
            return false;
        }
    },
    // Warn staff (and HR) 2 weeks before their BF days expire at Easter
    notifyBFWarning: function (staff, easterDate) {
        try {
            const easterStr = Utils.formatDateForDisplay(easterDate.toISOString().split('T')[0]);
            const bfDays = staff.LeaveBroughtForward.daysCarriedFromPreviousYear;
            const yearEarned = staff.LeaveBroughtForward.yearEarned;
            const systemUrl = EmailService.SYSTEM_URL;

            const subject = `[Action Required] Your ${bfDays} carried-forward leave day(s) expire on ${easterStr}`;

            const buildBody = (recipientName, isHR) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><style>${EmailService.baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background-color:#f59e0b;">
            <div class="title">${SYSTEM.NAME}</div>
            <div class="subtitle">Leave Management System</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${recipientName},</div>
            ${isHR
                    ? `<p style="color:#374151;">This is a reminder that <strong>${staff.Name}</strong> (${staff.Email}, ${staff.Department || '—'}) has unused carried-forward leave days that will expire soon.</p>`
                    : `<p style="color:#374151;">You have unused leave days that were carried forward from <strong>${yearEarned}</strong>. These days will be <strong>forfeited</strong> if not used before Easter.</p>`
                }
            <div class="section" style="border-left:4px solid #f59e0b;">
              <div class="grid">
                ${isHR ? `<div><div class="label">Staff Member</div><div class="value">${staff.Name}</div></div>` : ''}
                <div><div class="label">BF Days Remaining</div><div class="value" style="color:#d97706;font-weight:700;">${bfDays} day(s)</div></div>
                <div><div class="label">Year Earned</div><div class="value">${yearEarned}</div></div>
                <div><div class="label">Expiry Date (Easter)</div><div class="value" style="color:#dc2626;">${easterStr}</div></div>
                <div><div class="label">Days Until Expiry</div><div class="value" style="color:#dc2626;">~14 days</div></div>
              </div>
            </div>
            <div style="background-color:#fef3c7;border-radius:6px;padding:16px;margin-top:16px;">
              <div style="font-weight:600;color:#92400e;margin-bottom:8px;">⚠ Important</div>
              <p style="color:#92400e;margin:0;font-size:14px;">
                ${isHR
                    ? `Please remind ${staff.Name} to apply for leave before ${easterStr} to avoid forfeiture of these days.`
                    : `Please apply for leave before <strong>${easterStr}</strong>. Any remaining carried-forward days will be automatically forfeited on Easter Sunday.`
                }
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${systemUrl}" class="button">${isHR ? 'View HR Dashboard' : 'Apply for Leave Now'}</a>
            </div>
          </div>
          <div class="footer">
            <div><a href="${systemUrl}">${systemUrl}</a></div>
            <div style="margin-top:8px;">© ${new Date().getFullYear()} ${SYSTEM.ORGANIZATION}</div>
            <div style="margin-top:16px;font-size:11px;">This is an automated message. Please do not reply.</div>
          </div>
        </div>
      </body>
      </html>
    `;

            // Email the staff member
            MailApp.sendEmail({
                to: staff.Email,
                subject: subject,
                htmlBody: buildBody(staff.Name, false),
                name: SYSTEM.NAME
            });

            // Email each HR person
            this.getHREmails().forEach(hrEmail => {
                try {
                    const hrUser = StaffManager.getUserData(hrEmail);
                    MailApp.sendEmail({
                        to: hrEmail,
                        subject: `[HR Notice] ${subject}`,
                        htmlBody: buildBody(hrUser?.Name || 'HR Team', true),
                        name: SYSTEM.NAME
                    });
                } catch (e) { console.error('BF warning HR notify error:', e); }
            });

            console.log(`✓ BF warning sent for ${staff.Email}`);
            return true;

        } catch (error) {
            console.error('Error in notifyBFWarning:', error);
            return false;
        }
    },

    // Notify staff (and HR) that their BF days have been forfeited at Easter
    notifyBFExpired: function (staff, forfeitedDays, easterDate) {
        try {
            const easterStr = Utils.formatDateForDisplay(easterDate.toISOString().split('T')[0]);
            const systemUrl = EmailService.SYSTEM_URL;

            const subject = `Your ${forfeitedDays} carried-forward leave day(s) have expired`;

            const buildBody = (recipientName, isHR) => `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><style>${EmailService.baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header header-error">
            <div class="title">${SYSTEM.NAME}</div>
            <div class="subtitle">Leave Management System</div>
          </div>
          <div class="content">
            <div class="greeting">Dear ${recipientName},</div>
            ${isHR
                    ? `<p style="color:#374151;">The carried-forward leave days for <strong>${staff.Name}</strong> (${staff.Email}, ${staff.Department || '—'}) have now expired as of Easter Sunday (${easterStr}).</p>`
                    : `<p style="color:#374151;">Your carried-forward leave days have now expired as of Easter Sunday (<strong>${easterStr}</strong>). Unfortunately these days can no longer be used.</p>`
                }
            <div class="section" style="border-left:4px solid #dc2626;">
              <div class="grid">
                ${isHR ? `<div><div class="label">Staff Member</div><div class="value">${staff.Name}</div></div>` : ''}
                <div><div class="label">Days Forfeited</div><div class="value" style="color:#dc2626;font-weight:700;">${forfeitedDays} day(s)</div></div>
                <div><div class="label">Expired On</div><div class="value">${easterStr}</div></div>
              </div>
            </div>
            <p style="color:#6b7280;font-size:14px;">
              ${isHR
                    ? `No further action is required. This notification is for your records.`
                    : `Your regular annual leave balance and any other leave entitlements are not affected. Contact HR if you have any questions.`
                }
            </p>
            <div style="text-align:center;">
              <a href="${systemUrl}" class="button">${isHR ? 'View HR Dashboard' : 'View My Balance'}</a>
            </div>
          </div>
          <div class="footer">
            <div><a href="${systemUrl}">${systemUrl}</a></div>
            <div style="margin-top:8px;">© ${new Date().getFullYear()} ${SYSTEM.ORGANIZATION}</div>
            <div style="margin-top:16px;font-size:11px;">This is an automated message. Please do not reply.</div>
          </div>
        </div>
      </body>
      </html>
    `;

            // Email the staff member
            MailApp.sendEmail({
                to: staff.Email,
                subject: subject,
                htmlBody: buildBody(staff.Name, false),
                name: SYSTEM.NAME
            });

            // Email each HR person
            this.getHREmails().forEach(hrEmail => {
                try {
                    const hrUser = StaffManager.getUserData(hrEmail);
                    MailApp.sendEmail({
                        to: hrEmail,
                        subject: `[HR Notice] ${subject} — ${staff.Name}`,
                        htmlBody: buildBody(hrUser?.Name || 'HR Team', true),
                        name: SYSTEM.NAME
                    });
                } catch (e) { console.error('BF expiry HR notify error:', e); }
            });

            console.log(`✓ BF expiry notification sent for ${staff.Email}`);
            return true;

        } catch (error) {
            console.error('Error in notifyBFExpired:', error);
            return false;
        }
    },

    notifyHandoverNominated: function (application) {
        try {
            if (!application.HandoverEmail) return false;
            const subject = `[Handover Request] You are nominated as reliever for ${application.Name}`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">🌿 Handover Nomination</h3>
                    <p>Dear Colleague,</p>
                    <p><strong>${application.Name}</strong> (${application.Email}) has submitted a leave application and nominated you as their handover / reliever contact.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;padding:12px;">
                        <tr><td style="padding:6px;font-weight:bold;">Leave Type:</td><td>${application.LeaveType}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Period:</td><td>${Utils.formatDateForDisplay(application.StartDate)} to ${Utils.formatDateForDisplay(application.EndDate)}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Duration:</td><td>${application.Duration} business day(s)</td></tr>
                        ${application.HandoverNotes ? `<tr><td style="padding:6px;font-weight:bold;">Handover Notes:</td><td>${application.HandoverNotes}</td></tr>` : ''}
                    </table>
                    <p style="font-size:13px;color:#6b7280;">This request is currently pending supervisor approval. You will receive another notification once approved.</p>
                </div>
            `;
            MailApp.sendEmail({ to: application.HandoverEmail, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyHandoverNominated error:', e);
            return false;
        }
    },

    notifyHandoverAssigned: function (application) {
        try {
            if (!application.HandoverEmail) return false;
            const subject = `[Handover Confirmed] Leave Approved for ${application.Name}`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">🌿 Handover Coverage Confirmed</h3>
                    <p>Dear Colleague,</p>
                    <p>The leave application for <strong>${application.Name}</strong> has been approved.</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;padding:12px;">
                        <tr><td style="padding:6px;font-weight:bold;">Coverage Period:</td><td>${Utils.formatDateForDisplay(application.StartDate)} to ${Utils.formatDateForDisplay(application.EndDate)}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Duration:</td><td>${application.Duration} business day(s)</td></tr>
                        ${application.HandoverNotes ? `<tr><td style="padding:6px;font-weight:bold;">Handover Notes:</td><td>${application.HandoverNotes}</td></tr>` : ''}
                    </table>
                    <p style="font-size:13px;color:#6b7280;">Thank you for assisting your teammate during their absence.</p>
                </div>
            `;
            MailApp.sendEmail({ to: application.HandoverEmail, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyHandoverAssigned error:', e);
            return false;
        }
    },

    notifyHREndorsementRequired: function (application) {
        try {
            const hrEmails = this.getHREmails();
            if (hrEmails.length === 0) return false;
            const subject = `[Action Required] HR Endorsement Needed: ${application.Name} (${application.LeaveType}, ${application.Duration} days)`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#2563eb;margin-top:0;">📋 HR Leave Endorsement Required</h3>
                    <p>Dear HR Team,</p>
                    <p>The leave application for <strong>${application.Name}</strong> has been endorsed by their supervisor and requires secondary HR review (policy rule: leave duration &gt; 5 business days or specialized category).</p>
                    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;padding:12px;">
                        <tr><td style="padding:6px;font-weight:bold;">Applicant:</td><td>${application.Name} (${application.Email})</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Department:</td><td>${application.Department}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Leave Type:</td><td>${application.LeaveType}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Duration:</td><td><strong>${application.Duration} business day(s)</strong></td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Dates:</td><td>${Utils.formatDateForDisplay(application.StartDate)} to ${Utils.formatDateForDisplay(application.EndDate)}</td></tr>
                        <tr><td style="padding:6px;font-weight:bold;">Supervisor Sign-off:</td><td>${application.SupervisorApproval ? application.SupervisorApproval.approvedBy : application.Supervisor}</td></tr>
                    </table>
                    <p style="font-size:13px;color:#6b7280;">Please log into the HR Dashboard to review and grant final approval.</p>
                </div>
            `;
            hrEmails.forEach(email => {
                MailApp.sendEmail({ to: email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            });
            return true;
        } catch (e) {
            console.error('notifyHREndorsementRequired error:', e);
            return false;
        }
    },

    notifyHandoverResponse: function (application, decision, notes) {
        try {
            if (!application.Email) return false;
            const isAccepted = decision === 'Accepted' || decision === 'accept';
            const subject = isAccepted
                ? `[Handover Accepted] ${application.HandoverName || 'Colleague'} agreed to cover your leave`
                : `[Handover Notice] ${application.HandoverName || 'Colleague'} was unable to accept coverage`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:${isAccepted ? '#059669' : '#dc2626'};margin-top:0;">${isAccepted ? '✅ Handover Accepted' : '⚠️ Handover Declined'}</h3>
                    <p>Dear ${application.Name},</p>
                    <p>Your designated coverage colleague <strong>${application.HandoverName || application.HandoverEmail}</strong> has <strong>${isAccepted ? 'accepted' : 'declined'}</strong> your handover request for ${Utils.formatDateForDisplay(application.StartDate)} to ${Utils.formatDateForDisplay(application.EndDate)}.</p>
                    ${notes ? `<p><strong>Notes from colleague:</strong> "${notes}"</p>` : ''}
                    ${!isAccepted ? `<p style="color:#b91c1c;">Please arrange an alternative reliever colleague if coverage is required for your role.</p>` : ''}
                </div>
            `;
            MailApp.sendEmail({ to: application.Email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyHandoverResponse error:', e);
            return false;
        }
    },

    notifyLeaveRecalibrated: function (application, refundedDays, holidayName) {
        try {
            if (!application.Email) return false;
            const subject = `[Leave Balance Refund] ${refundedDays} day(s) credited due to Gazetted Public Holiday`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">🎉 Leave Days Refunded</h3>
                    <p>Dear ${application.Name},</p>
                    <p>Following the official government gazetting of a public holiday on <strong>${holidayName}</strong>, your leave application (${application.ID}) spanning this date has been recalibrated.</p>
                    <p><strong>${refundedDays} business day(s)</strong> have been automatically credited back to your leave balance.</p>
                    <p style="font-size:13px;color:#6b7280;">Your updated duration for this leave is now ${application.Duration} business days.</p>
                </div>
            `;
            MailApp.sendEmail({ to: application.Email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyLeaveRecalibrated error:', e);
            return false;
        }
    },

    notifyEasterExpiryWarning: function (staff, remainingDays, easterDate, daysUntilEaster) {
        try {
            const easterStr = Utils.formatDateForDisplay(easterDate);
            const subject = `[Action Required] ${remainingDays} Carried Forward Leave Day(s) Expiring on Easter (${easterStr})`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#b45309;margin-top:0;">⏰ Carried Forward Leave Expiry Reminder</h3>
                    <p>Dear ${staff.Name},</p>
                    <p>You have <strong>${remainingDays.toFixed(3)}</strong> days of carried-forward leave expiring on Easter Sunday, <strong>${easterStr}</strong> (in ${daysUntilEaster} days).</p>
                    <p>Under company policy, all brought-forward days not consumed by Easter are forfeited. Please log in to submit your leave application before ${easterStr}.</p>
                </div>
            `;
            MailApp.sendEmail({ to: staff.Email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyEasterExpiryWarning error:', e);
            return false;
        }
    },

    notifySupervisorStaleApplications: function (supervisorEmail, applications) {
        try {
            if (!supervisorEmail || !applications || applications.length === 0) return false;
            const subject = `[Reminder] You have ${applications.length} pending leave application(s) awaiting review`;
            const appRows = applications.map(a =>
                `<li><strong>${a.Name}</strong>: ${a.LeaveType} (${a.Duration} days, ${Utils.formatDateForDisplay(a.StartDate)} to ${Utils.formatDateForDisplay(a.EndDate)})</li>`
            ).join('');
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">⏰ Pending Leave Applications Reminder</h3>
                    <p>The following leave applications have been pending for more than 48 hours and require your review:</p>
                    <ul>${appRows}</ul>
                    <p>Please log in to your supervisor dashboard to approve or decline these requests.</p>
                </div>
            `;
            MailApp.sendEmail({ to: supervisorEmail, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifySupervisorStaleApplications error:', e);
            return false;
        }
    },

    notifyCompensationClaimSubmitted: function (claim) {
        try {
            if (!claim.SupervisorEmail) return false;
            const subject = `[Compensation Claim] New TOIL Claim from ${claim.Name} (${claim.DaysEarned} day(s))`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">⏱️ New Compensation Leave (TOIL) Claim</h3>
                    <p>Dear Supervisor,</p>
                    <p><strong>${claim.Name}</strong> has submitted a Time-Off In Lieu (TOIL) claim for overtime/weekend duty:</p>
                    <ul>
                        <li><strong>Date Worked:</strong> ${claim.DateWorked}</li>
                        <li><strong>Hours Worked:</strong> ${claim.HoursWorked} hours</li>
                        <li><strong>Days Earned:</strong> ${claim.DaysEarned} day(s)</li>
                        <li><strong>Location / Field Task:</strong> ${claim.Location || 'N/A'}</li>
                        <li><strong>Reason:</strong> ${claim.Reason}</li>
                    </ul>
                    <p>Please log in to your AgriLeave supervisor dashboard to review and approve this claim.</p>
                </div>
            `;
            MailApp.sendEmail({ to: claim.SupervisorEmail, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyCompensationClaimSubmitted error:', e);
            return false;
        }
    },

    notifyCompensationClaimDecision: function (claim, decision, comment) {
        try {
            const isApproved = decision === 'approve';
            const subject = `[${isApproved ? 'Approved' : 'Declined'}] Compensation Leave Claim (${claim.DaysEarned} day(s))`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:${isApproved ? '#059669' : '#dc2626'};margin-top:0;">
                        ${isApproved ? '✅ Compensation Leave Claim Approved' : '❌ Compensation Leave Claim Declined'}
                    </h3>
                    <p>Dear ${claim.Name},</p>
                    <p>Your compensation leave claim for <strong>${claim.DateWorked}</strong> (${claim.HoursWorked} hours / ${claim.DaysEarned} day(s)) has been <strong>${decision}d</strong>.</p>
                    ${comment ? `<p><strong>Supervisor Comment:</strong> ${comment}</p>` : ''}
                    ${isApproved ? `<p>Your compensation leave balance has been credited with <strong>+${claim.DaysEarned}</strong> day(s).</p>` : ''}
                </div>
            `;
            MailApp.sendEmail({ to: claim.Email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyCompensationClaimDecision error:', e);
            return false;
        }
    },

    notifyLeaveAmended: function (application, dayDifference, reason) {
        try {
            const subject = `[Leave Amended] ${application.Name} - Dates Updated`;
            const body = `
                <div style="font-family:sans-serif;padding:16px;color:#1f2937;">
                    <h3 style="color:#059669;margin-top:0;">📅 Leave Application Dates Amended</h3>
                    <p>Leave dates for <strong>${application.Name}</strong> have been updated:</p>
                    <ul>
                        <li><strong>New Period:</strong> ${application.StartDate} to ${application.EndDate} (${application.Duration} days)</li>
                        <li><strong>Adjustment:</strong> ${dayDifference > 0 ? `+${dayDifference} days deducted` : `${dayDifference} days refunded`}</li>
                        <li><strong>Reason:</strong> ${reason || 'Dates updated'}</li>
                    </ul>
                </div>
            `;
            if (application.SupervisorEmail) {
                MailApp.sendEmail({ to: application.SupervisorEmail, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            }
            MailApp.sendEmail({ to: application.Email, subject: subject, htmlBody: body, name: SYSTEM.NAME });
            return true;
        } catch (e) {
            console.error('notifyLeaveAmended error:', e);
            return false;
        }
    }
};

// =============================================
// GOOGLE CALENDAR SYNC MANAGER
// =============================================

const CalendarSyncManager = {
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
    },

    syncLeaveToCalendar: function (application) {
        try {
            if (typeof CalendarApp === 'undefined') return null;
            const cal = this.getLeaveCalendar();
            if (!cal) return null;

            const start = Utils.parseLocalDate(application.StartDate || application.HourlyDate);
            const end = Utils.parseLocalDate(application.EndDate || application.HourlyDate || application.StartDate);
            if (!start || !end) return null;

            // Google Calendar all-day events are exclusive of the end date (start of next day)
            const calEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

            const title = `🌿 [Leave] ${application.Name} - ${application.LeaveType}`;
            const description = [
                `Agri Experience Leave Management System`,
                `Application ID: ${application.ID}`,
                `Staff: ${application.Name} (${application.Email})`,
                `Department: ${application.Department || 'N/A'}`,
                `Leave Type: ${application.LeaveType}`,
                `Duration: ${application.Duration} day(s)`,
                `Period: ${Utils.formatDateForDisplay(start)} - ${Utils.formatDateForDisplay(end)}`,
                `Approved by: ${application.ProcessedBy || 'Supervisor'}`,
                application.HandoverName ? `Handover / Reliever: ${application.HandoverName} (${application.HandoverEmail || ''})` : '',
                `Reason: ${application.Reason || 'N/A'}`
            ].filter(Boolean).join('\n');

            const event = cal.createAllDayEvent(title, start, calEnd, {
                description: description,
                location: 'Agri Experience - ' + (application.Department || 'Office')
            });

            if (event) {
                const eventId = event.getId();
                application.Metadata = application.Metadata || {};
                application.Metadata.calendarEventId = eventId;
                console.log(`📅 Created calendar event: ${eventId} for application ${application.ID}`);
                return eventId;
            }
        } catch (error) {
            console.warn('Calendar sync error (non-fatal):', error.message);
        }
        return null;
    },

    removeLeaveFromCalendar: function (application) {
        try {
            if (typeof CalendarApp === 'undefined') return false;
            const eventId = application.Metadata?.calendarEventId;
            if (!eventId) return false;

            const cal = this.getLeaveCalendar();
            if (!cal) return false;

            const event = cal.getEventById(eventId);
            if (event) {
                event.deleteEvent();
                console.log(`📅 Deleted calendar event: ${eventId} for cancelled application ${application.ID}`);
                if (application.Metadata) application.Metadata.calendarEventId = null;
                return true;
            }
        } catch (error) {
            console.warn('Calendar event deletion error (non-fatal):', error.message);
        }
        return false;
    },

    updateLeaveCalendarEvent: function (application, newStartDate, newEndDate) {
        try {
            this.removeLeaveFromCalendar(application);
            const updatedApp = Object.assign({}, application, {
                StartDate: newStartDate,
                EndDate: newEndDate
            });
            const newEventId = this.syncLeaveToCalendar(updatedApp);
            if (newEventId) {
                application.Metadata = application.Metadata || {};
                application.Metadata.calendarEventId = newEventId;
                application.CalendarEventId = newEventId;
            }
            return newEventId;
        } catch (error) {
            console.warn('Calendar event update error (non-fatal):', error.message);
            return null;
        }
    }
};

// =============================================
// DAILY MAINTENANCE & HEARTBEAT MANAGER
// =============================================

const MaintenanceManager = {
    runDailyHeartbeat: function () {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const currentYear = today.getFullYear();
        const results = {
            timestamp: new Date().toISOString(),
            easterCheck: null,
            easterWarningsSent: 0,
            forfeitedStaffCount: 0,
            accrualCheck: null,
            staleApplicationsReminded: 0
        };

        // ── 1. Dynamic Movable Easter check & auto-forfeiture ────────────────
        const easter = Utils.calculateEasterDate(currentYear);
        easter.setHours(0, 0, 0, 0);

        if (today >= easter) {
            // Forfeit remaining brought-forward leave from previous year
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            let staffModified = false;

            staffFile.data.forEach(staff => {
                if (staff.LeaveBroughtForward && !staff.LeaveBroughtForward.isExpired) {
                    const bf = staff.LeaveBroughtForward;
                    const acqYear = bf.yearEarned || (currentYear - 1);
                    const expiryYear = bf.yearExpires || (acqYear + 1);

                    if (currentYear >= expiryYear) {
                        const rawRemaining = bf.daysCarriedFromPreviousYear || 0;
                        bf.isExpired = true;
                        bf.isForfeited = true;
                        bf.forfeitedDays = rawRemaining;
                        bf.daysCarriedFromPreviousYear = 0;
                        bf.forfeitedAt = today.toISOString();
                        bf.note = (bf.note || '') + ` [Forfeited on Easter ${currentYear}: ${rawRemaining.toFixed(3)} days]`;

                        results.forfeitedStaffCount++;
                        staffModified = true;

                        EnhancedCacheManager.clearBalance(staff.Email);
                        try {
                            NotificationManager.notifyBFExpired(staff, rawRemaining, easter);
                        } catch (e) {
                            console.error('Error notifying BF expired:', e.message);
                        }
                    }
                }
            });

            if (staffModified) {
                DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
                EnhancedCacheManager.buildIndexes();
                Utils.logAction('EASTER_BF_EXPIRY_RUN', {
                    date: today.toISOString(),
                    forfeitedStaffCount: results.forfeitedStaffCount,
                    easterDate: Utils.formatLocalDate(easter)
                });
            }
            results.easterCheck = `Easter passed (${Utils.formatLocalDate(easter)}). ${results.forfeitedStaffCount} staff BF forfeited.`;
        } else {
            // Proximity warnings (14 days, 7 days, 3 days before Easter)
            const diffTime = easter.getTime() - today.getTime();
            const daysUntilEaster = Math.round(diffTime / (1000 * 60 * 60 * 24));
            results.easterCheck = `Easter is in ${daysUntilEaster} days (${Utils.formatLocalDate(easter)}).`;

            if (daysUntilEaster === 14 || daysUntilEaster === 7 || daysUntilEaster === 3) {
                const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
                staffFile.data.forEach(staff => {
                    if (staff.LeaveBroughtForward && !staff.LeaveBroughtForward.isExpired) {
                        const rem = staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0;
                        if (rem > 0) {
                            NotificationManager.notifyEasterExpiryWarning(staff, rem, easter, daysUntilEaster);
                            results.easterWarningsSent++;
                        }
                    }
                });
            }
        }

        // ── 2. Monthly Accrual Auto-Heal ─────────────────────────────────────
        try {
            const startOfMonth = new Date(currentYear, today.getMonth(), 1);
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            const eligibleStaff = staffFile.data.filter(s => s.EligibleForLeave && s.LeaveAccrual?.eligible && s.Metadata?.active !== false);
            const missedAccrual = eligibleStaff.some(s => {
                const nextAccrual = s.LeaveAccrual?.nextAccrualDate ? new Date(s.LeaveAccrual.nextAccrualDate) : null;
                return nextAccrual && today >= nextAccrual;
            });

            if (missedAccrual) {
                console.log('🔄 Heartbeat detected missed monthly accrual, executing accrual...');
                const accrualRes = AccrualManager.processMonthlyAccrual();
                results.accrualCheck = `Auto-healed accrual for ${accrualRes.processedCount || 0} staff`;
            } else {
                results.accrualCheck = 'Accruals up to date';
            }
        } catch (accErr) {
            console.error('Heartbeat accrual check error:', accErr.message);
            results.accrualCheck = 'Error checking accrual: ' + accErr.message;
        }

        // ── 3. Stale Pending Applications Reminder (> 48h) ───────────────────
        try {
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const pendingApps = (appsFile.data || []).filter(app => app.Status === SYSTEM.STATUS.PENDING);
            const staleBySupervisor = {};

            pendingApps.forEach(app => {
                if (app.DateApplied) {
                    const applied = Utils.parseLocalDate(app.DateApplied);
                    if (applied) {
                        const daysPending = Math.round((today - applied) / (1000 * 60 * 60 * 24));
                        if (daysPending >= 2 && app.SupervisorEmail) {
                            staleBySupervisor[app.SupervisorEmail] = staleBySupervisor[app.SupervisorEmail] || [];
                            staleBySupervisor[app.SupervisorEmail].push(app);
                        }
                    }
                }
            });

            Object.keys(staleBySupervisor).forEach(supEmail => {
                const apps = staleBySupervisor[supEmail];
                NotificationManager.notifySupervisorStaleApplications(supEmail, apps);
                results.staleApplicationsReminded += apps.length;
            });
        } catch (staleErr) {
            console.error('Heartbeat stale application reminder error:', staleErr.message);
        }

        // ── 4. Automated Daily Morning Absence Digest (Google Chat Webhook & Email) ───
        try {
            if (typeof AbsenceDigestManager !== 'undefined') {
                const digestRes = AbsenceDigestManager.sendDailyDigest(today);
                results.absenceDigest = digestRes;
            }
        } catch (dErr) {
            console.error('Heartbeat daily digest error:', dErr.message);
            results.absenceDigest = { sent: false, error: dErr.message };
        }

        // ── 5. Master Google Sheets Dual-Store Routine Sync ───────────────────
        try {
            if (typeof SheetsDualStoreManager !== 'undefined') {
                const sheetSyncRes = SheetsDualStoreManager.syncAll();
                results.sheetsSync = sheetSyncRes;
            }
        } catch (sErr) {
            console.error('Heartbeat sheets dual-store sync error:', sErr.message);
            results.sheetsSync = { success: false, error: sErr.message };
        }

        return results;
    }
};

// =============================================
// COMPENSATION LEAVE (TOIL) MANAGER
// =============================================

const CompensationManager = {
    submitClaim: function (claimData) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const user = StaffManager.getUserData(currentUser);
            if (!user) return Utils.createErrorResponse('User not found');

            const dateWorked = claimData.dateWorked || claimData.workDate;
            const hoursWorked = parseFloat(claimData.hoursWorked || claimData.hours);
            const reason = (claimData.reason || claimData.activityType || '').trim();
            const location = (claimData.location || claimData.activityType || '').trim();

            if (!dateWorked) return Utils.createErrorResponse('Date worked is required');
            if (isNaN(hoursWorked) || hoursWorked <= 0) {
                return Utils.createErrorResponse('Hours worked must be greater than 0');
            }
            if (!reason) return Utils.createErrorResponse('Reason for overtime/weekend duty is required');

            // Date cannot be in the future
            const workedDate = Utils.parseLocalDate(dateWorked);
            const today = Utils.parseLocalDate(new Date());
            if (workedDate > today) {
                return Utils.createErrorResponse('Date worked cannot be in the future');
            }

            // Calculate days earned: 8+ hours = 1.0 day, 4-7 hours = 0.5 day, else proration
            let daysEarned = 1.0;
            if (hoursWorked >= 8) {
                daysEarned = 1.0;
            } else if (hoursWorked >= 4) {
                daysEarned = 0.5;
            } else {
                daysEarned = Number((hoursWorked / 8).toFixed(2));
            }

            const claimId = 'TOIL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const claim = {
                ID: claimId,
                Email: currentUser,
                Name: user.Name,
                Department: user.Department || 'General',
                DateWorked: dateWorked,
                HoursWorked: hoursWorked,
                DaysEarned: daysEarned,
                Reason: reason,
                Location: location,
                SupervisorEmail: user.Supervisor || '',
                Status: SYSTEM.STATUS.PENDING,
                DateSubmitted: new Date().toISOString(),
                ProcessedDate: null,
                ProcessedBy: null,
                Comment: ''
            };

            const claimsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.COMPENSATION_CLAIMS);
            claimsFile.data = claimsFile.data || [];
            claimsFile.data.push(claim);
            claimsFile.metadata = claimsFile.metadata || {};
            claimsFile.metadata.recordCount = claimsFile.data.length;

            DataManager.writeDataFile(SYSTEM.DATA_FILES.COMPENSATION_CLAIMS, claimsFile);

            try {
                NotificationManager.notifyCompensationClaimSubmitted(claim);
            } catch (notifErr) {
                console.warn('Compensation claim notification error:', notifErr.message);
            }

            Utils.logAction('SUBMIT_COMPENSATION_CLAIM', {
                claimId,
                email: currentUser,
                dateWorked,
                hoursWorked,
                daysEarned
            });

            return Utils.createSuccessResponse({
                claimId,
                daysEarned,
                status: SYSTEM.STATUS.PENDING
            }, `Compensation leave claim for ${daysEarned} day(s) submitted successfully`);

        } catch (error) {
            console.error('Error submitting compensation claim:', error);
            return Utils.createErrorResponse('Failed to submit compensation claim: ' + error.message);
        }
    },

    getClaims: function (filter = {}) {
        try {
            const claimsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.COMPENSATION_CLAIMS);
            let claims = claimsFile.data || [];

            if (filter.email) {
                claims = claims.filter(c => c.Email && c.Email.toLowerCase() === filter.email.toLowerCase().trim());
            }
            if (filter.supervisorEmail) {
                claims = claims.filter(c => c.SupervisorEmail && c.SupervisorEmail.toLowerCase() === filter.supervisorEmail.toLowerCase().trim());
            }
            if (filter.status) {
                claims = claims.filter(c => c.Status === filter.status);
            }

            return claims;
        } catch (error) {
            console.error('Error getting compensation claims:', error);
            return [];
        }
    },

    processClaimDecision: function (claimId, decision, comment = '', callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            if (!user) return Utils.createErrorResponse('User not found');

            const claimsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.COMPENSATION_CLAIMS);
            const claimIndex = (claimsFile.data || []).findIndex(c => c.ID === claimId);
            if (claimIndex === -1) return Utils.createErrorResponse('Compensation claim not found');

            const claim = claimsFile.data[claimIndex];
            if (claim.Status !== SYSTEM.STATUS.PENDING) {
                return Utils.createErrorResponse('Claim is already processed');
            }

            const isSupervisor = claim.SupervisorEmail && claim.SupervisorEmail.toLowerCase() === currentUser.toLowerCase();
            const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
            const isHR = user.Role === SYSTEM.ROLES.HR;

            if (!isSupervisor && !isAdmin && !isHR) {
                return Utils.createErrorResponse('You are not authorized to process this claim');
            }

            const isApproved = decision === 'approve';
            claim.Status = isApproved ? SYSTEM.STATUS.APPROVED : SYSTEM.STATUS.DECLINED;
            claim.ProcessedDate = new Date().toISOString();
            claim.ProcessedBy = currentUser;
            claim.Comment = comment || '';

            if (isApproved) {
                const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
                const sIdx = staffFile.data.findIndex(s => s.Email.toLowerCase() === claim.Email.toLowerCase());
                if (sIdx !== -1) {
                    const staff = staffFile.data[sIdx];
                    staff.CompensationLeave = staff.CompensationLeave || { balance: 0, used: 0 };
                    staff.CompensationLeave.balance = Number(((staff.CompensationLeave.balance || 0) + claim.DaysEarned).toFixed(2));
                    staff.CompensationLeave.earnedYearToDate = Number(((staff.CompensationLeave.earnedYearToDate || 0) + claim.DaysEarned).toFixed(2));
                    staff.CompensationLeave.lastCredited = new Date().toISOString();

                    DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
                    EnhancedCacheManager.clearBalance(claim.Email);
                    EnhancedCacheManager.buildIndexes();
                }
            }

            DataManager.writeDataFile(SYSTEM.DATA_FILES.COMPENSATION_CLAIMS, claimsFile);

            try {
                NotificationManager.notifyCompensationClaimDecision(claim, decision, comment);
            } catch (notifErr) {
                console.warn('Compensation decision notification error:', notifErr.message);
            }

            Utils.logAction('PROCESS_COMPENSATION_CLAIM', {
                claimId,
                decision,
                processedBy: currentUser,
                applicant: claim.Email,
                daysEarned: claim.DaysEarned
            });

            return Utils.createSuccessResponse({
                claimId,
                status: claim.Status,
                daysEarned: claim.DaysEarned
            }, `Claim ${decision}d successfully`);

        } catch (error) {
            console.error('Error processing compensation claim:', error);
            return Utils.createErrorResponse('Failed to process claim: ' + error.message);
        }
    }
};

// =============================================
// ATTACHMENT MANAGER (GOOGLE DRIVE INTEGRATION)
// =============================================

const AttachmentManager = {
    getAttachmentsFolder: function () {
        try {
            const systemFolder = DataManager.getSystemFolder();
            const yearStr = new Date().getFullYear().toString();

            let attachFolder;
            const folders = systemFolder.getFoldersByName('Attachments');
            if (folders.hasNext()) {
                attachFolder = folders.next();
            } else {
                attachFolder = systemFolder.createFolder('Attachments');
                attachFolder.setDescription('AgriLeave supporting medical notes and document attachments');
            }

            let yearFolder;
            const yFolders = attachFolder.getFoldersByName(yearStr);
            if (yFolders.hasNext()) {
                yearFolder = yFolders.next();
            } else {
                yearFolder = attachFolder.createFolder(yearStr);
            }

            return yearFolder;
        } catch (error) {
            console.error('Error resolving attachments folder:', error);
            return DataManager.getSystemFolder();
        }
    },

    uploadAttachment: function (uploadData) {
        try {
            if (!uploadData || !uploadData.base64Data) {
                return Utils.createErrorResponse('No file data provided');
            }

            let rawBase64 = uploadData.base64Data;
            if (rawBase64.includes(',')) {
                rawBase64 = rawBase64.split(',')[1];
            }

            const fileName = (uploadData.fileName || 'supporting_doc_' + Date.now()).replace(/[^a-zA-Z0-9._-]/g, '_');
            const mimeType = uploadData.mimeType || 'application/octet-stream';
            const appId = uploadData.appId || 'General';

            const folder = this.getAttachmentsFolder();
            let file;

            if (typeof Utilities !== 'undefined' && Utilities.base64Decode) {
                const bytes = Utilities.base64Decode(rawBase64);
                const blob = Utilities.newBlob(bytes, mimeType, fileName);
                file = folder.createFile(blob);
            } else {
                file = folder.createFile(fileName, rawBase64);
            }

            if (file && file.setDescription) {
                file.setDescription(`Leave Attachment | Application: ${appId} | Uploaded: ${new Date().toISOString()}`);
            }

            const fileId = file.getId();
            const fileUrl = file.getUrl ? file.getUrl() : `https://drive.google.com/file/d/${fileId}/view`;

            return Utils.createSuccessResponse({
                fileId: fileId,
                fileName: fileName,
                fileUrl: fileUrl,
                mimeType: mimeType
            }, 'File uploaded successfully');

        } catch (error) {
            console.error('Error in uploadAttachment:', error);
            return Utils.createErrorResponse('File upload failed: ' + error.message);
        }
    }
};

// =============================================
// BLACKOUT PERIOD & MINIMUM STAFFING MANAGER
// =============================================

const BlackoutPeriodManager = {
    getAll: function () {
        try {
            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.BLACKOUT_PERIODS);
            return file.data || [];
        } catch (error) {
            console.error('Error reading blackout periods:', error);
            return [];
        }
    },

    savePeriod: function (periodData) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = StaffManager.getUserRole(currentUser);
            if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
                return Utils.createErrorResponse('Insufficient permissions — Admin or HR required');
            }

            if (!periodData.name || !periodData.startDate || !periodData.endDate) {
                return Utils.createErrorResponse('Name, startDate, and endDate are required');
            }

            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.BLACKOUT_PERIODS);
            file.data = file.data || [];

            const id = periodData.id || ('BLK-' + Date.now());
            const existingIdx = file.data.findIndex(p => p.id === id);

            const record = {
                id,
                name: periodData.name.trim(),
                department: periodData.department || 'All',
                startDate: periodData.startDate,
                endDate: periodData.endDate,
                severity: periodData.severity === 'strict' ? 'strict' : 'warning',
                reason: periodData.reason || '',
                minimumStaffing: parseInt(periodData.minimumStaffing) || 2,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser
            };

            if (existingIdx !== -1) {
                file.data[existingIdx] = record;
            } else {
                file.data.push(record);
            }

            DataManager.writeDataFile(SYSTEM.DATA_FILES.BLACKOUT_PERIODS, file);
            return Utils.createSuccessResponse(record, 'Blackout period saved successfully');

        } catch (error) {
            console.error('Error saving blackout period:', error);
            return Utils.createErrorResponse('Failed to save blackout period: ' + error.message);
        }
    },

    deletePeriod: function (id) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = StaffManager.getUserRole(currentUser);
            if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
                return Utils.createErrorResponse('Insufficient permissions — Admin or HR required');
            }

            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.BLACKOUT_PERIODS);
            file.data = (file.data || []).filter(p => p.id !== id);
            DataManager.writeDataFile(SYSTEM.DATA_FILES.BLACKOUT_PERIODS, file);
            return Utils.createSuccessResponse({ id }, 'Blackout period deleted successfully');
        } catch (error) {
            console.error('Error deleting blackout period:', error);
            return Utils.createErrorResponse('Failed to delete blackout period: ' + error.message);
        }
    },

    checkConflict: function (department, startDate, endDate) {
        try {
            const periods = this.getAll();
            if (!periods.length || !startDate || !endDate) return { hasConflict: false, conflicts: [] };

            const reqStart = Utils.parseLocalDate(startDate);
            const reqEnd = Utils.parseLocalDate(endDate);
            if (!reqStart || !reqEnd) return { hasConflict: false, conflicts: [] };

            const conflicts = [];
            for (const p of periods) {
                const matchDept = p.department === 'All' || !department || p.department.toLowerCase() === department.toLowerCase();
                if (!matchDept) continue;

                const pStart = Utils.parseLocalDate(p.startDate);
                const pEnd = Utils.parseLocalDate(p.endDate);
                if (pStart && pEnd && reqStart <= pEnd && reqEnd >= pStart) {
                    conflicts.push({
                        id: p.id,
                        name: p.name,
                        department: p.department,
                        severity: p.severity,
                        reason: p.reason,
                        startDate: p.startDate,
                        endDate: p.endDate
                    });
                }
            }

            return {
                hasConflict: conflicts.length > 0,
                isStrict: conflicts.some(c => c.severity === 'strict'),
                conflicts
            };
        } catch (error) {
            console.error('Error checking blackout conflict:', error);
            return { hasConflict: false, conflicts: [] };
        }
    },

    checkMinimumStaffing: function (department, startDate, endDate, applicantEmail) {
        try {
            if (!department || department === 'General' || !startDate || !endDate) {
                return { permitted: true, breach: false };
            }

            const allStaff = StaffManager.getAllStaffData().filter(s =>
                s.Metadata?.active !== false &&
                s.Department && s.Department.toLowerCase() === department.toLowerCase()
            );

            if (allStaff.length <= 1) return { permitted: true, breach: false };

            const periods = this.getAll().filter(p => p.department === 'All' || p.department.toLowerCase() === department.toLowerCase());
            let minRequired = 2;
            if (periods.length && periods[0].minimumStaffing) {
                minRequired = periods[0].minimumStaffing;
            }

            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const reqStart = Utils.parseLocalDate(startDate);
            const reqEnd = Utils.parseLocalDate(endDate);
            const appEmailStr = typeof applicantEmail === 'string' ? applicantEmail.toLowerCase() : '';

            const awayStaff = new Set();
            (appsFile.data || []).forEach(a => {
                if (a.Status === SYSTEM.STATUS.APPROVED && a.Email && a.Email.toLowerCase() !== appEmailStr) {
                    if (a.Department && a.Department.toLowerCase() === department.toLowerCase()) {
                        const aStart = Utils.parseLocalDate(a.StartDate || a.HourlyDate);
                        const aEnd = Utils.parseLocalDate(a.EndDate || a.HourlyDate || a.StartDate);
                        if (aStart && aEnd && reqStart <= aEnd && reqEnd >= aStart) {
                            awayStaff.add(a.Email.toLowerCase());
                        }
                    }
                }
            });

            const remainingOnDuty = allStaff.length - (awayStaff.size + 1);
            if (remainingOnDuty < minRequired) {
                return {
                    permitted: false,
                    breach: true,
                    department,
                    totalStaff: allStaff.length,
                    alreadyAwayCount: awayStaff.size,
                    remainingOnDuty: Math.max(0, remainingOnDuty),
                    minRequired
                };
            }

            return { permitted: true, breach: false, remainingOnDuty, minRequired };
        } catch (error) {
            console.error('Error checking minimum staffing:', error);
            return { permitted: true, breach: false };
        }
    }
};

// =============================================
// GMAIL OUT-OF-OFFICE (VACATION RESPONDER) MANAGER
// =============================================

const GmailSyncManager = {
    configureVacationResponder: function (application) {
        try {
            if (typeof GmailApp === 'undefined' || !GmailApp.setVacationResponder) {
                return { success: false, reason: 'GmailApp service not available in current execution context' };
            }
            const startDate = Utils.parseLocalDate(application.StartDate || application.HourlyDate);
            const endDate = Utils.parseLocalDate(application.EndDate || application.HourlyDate || application.StartDate);
            if (!startDate || !endDate) return { success: false, reason: 'Invalid dates' };

            const handoverName = application.HandoverName || application.HandoverEmail || 'our team';
            const handoverEmail = application.HandoverEmail || SYSTEM.ADMIN_EMAIL;
            const applicantName = application.Name || 'Agri Experience Team';
            const formattedStart = Utils.formatDateForDisplay(startDate);
            const formattedEnd = Utils.formatDateForDisplay(endDate);

            const subject = `Out of Office: ${applicantName} (${formattedStart} - ${formattedEnd})`;
            const bodyHtml = `
                <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">
                    <p>Hello,</p>
                    <p>Thank you for reaching out. I am currently away on approved leave from <strong>${formattedStart}</strong> to <strong>${formattedEnd}</strong> and will have limited access to email.</p>
                    <p>For urgent matters or immediate assistance during my absence, please contact my designated coverage colleague: <strong>${handoverName}</strong> at <a href="mailto:${handoverEmail}">${handoverEmail}</a>.</p>
                    <p>I will attend to your email upon my return.</p>
                    <p>Best regards,<br><strong>${applicantName}</strong><br>Agri Experience</p>
                </div>
            `.trim();

            GmailApp.setVacationResponder(startDate, endDate, subject, bodyHtml, {
                responseBodyHtml: bodyHtml,
                restrictToContacts: false,
                restrictToDomain: false
            });

            return {
                success: true,
                subject: subject,
                startDate: formattedStart,
                endDate: formattedEnd
            };
        } catch (error) {
            console.warn('Gmail vacation responder notice (non-fatal):', error.message);
            return { success: false, error: error.message };
        }
    },

    disableVacationResponder: function () {
        try {
            if (typeof GmailApp === 'undefined' || !GmailApp.disableVacationResponder) return false;
            GmailApp.disableVacationResponder();
            return true;
        } catch (error) {
            console.warn('Gmail vacation responder disable notice (non-fatal):', error.message);
            return false;
        }
    },

    getResponderPreview: function (application) {
        const startDate = Utils.parseLocalDate(application.StartDate || application.HourlyDate || new Date());
        const endDate = Utils.parseLocalDate(application.EndDate || application.HourlyDate || application.StartDate || new Date());
        const handoverName = application.HandoverName || application.HandoverEmail || 'colleague';
        const handoverEmail = application.HandoverEmail || SYSTEM.ADMIN_EMAIL;
        const applicantName = application.Name || 'Staff Member';
        const formattedStart = Utils.formatDateForDisplay(startDate);
        const formattedEnd = Utils.formatDateForDisplay(endDate);

        return {
            subject: `Out of Office: ${applicantName} (${formattedStart} - ${formattedEnd})`,
            startDate: formattedStart,
            endDate: formattedEnd,
            handoverName,
            handoverEmail,
            message: `Thank you for reaching out. I am currently away on approved leave from ${formattedStart} to ${formattedEnd}. For urgent inquiries, please contact ${handoverName} at ${handoverEmail}.`
        };
    }
};

// =============================================
// INTERACTIVE HANDOVER & TASK CHECKLIST MANAGER
// =============================================

const HandoverManager = {
    getPendingHandovers: function (userEmail) {
        try {
            const email = (userEmail || Session.getActiveUser().getEmail() || '').toLowerCase().trim();
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applications = (appsFile.data || []).filter(app => {
                if (!app.HandoverEmail) return false;
                const matchesEmail = app.HandoverEmail.toLowerCase().trim() === email;
                const isActive = app.Status === SYSTEM.STATUS.PENDING || app.Status === SYSTEM.STATUS.APPROVED;
                return matchesEmail && isActive;
            });

            return applications.map(app => ({
                id: app.ID,
                applicationId: app.ID,
                applicantName: app.Name,
                applicantEmail: app.Email,
                department: app.Department,
                leaveType: app.LeaveType,
                startDate: app.StartDate,
                endDate: app.EndDate,
                duration: app.Duration,
                handoverStatus: app.HandoverStatus || 'Pending',
                handoverNotes: app.HandoverNotes || '',
                handoverTasks: app.HandoverTasks || [],
                status: app.Status
            }));
        } catch (error) {
            console.error('Error in getPendingHandovers:', error);
            return [];
        }
    },

    respondToHandover: function (appId, decision, notes = '', callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').toLowerCase().trim();
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const app = (appsFile.data || []).find(a => a.ID === appId);
            if (!app) return Utils.createErrorResponse('Application not found');

            const isDesignated = app.HandoverEmail && app.HandoverEmail.toLowerCase().trim() === currentUser;
            const staff = StaffManager.getUserData(currentUser);
            const isAdmin = staff && staff.Role === SYSTEM.ROLES.ADMIN;
            if (!isDesignated && !isAdmin) {
                return Utils.createErrorResponse('You are not the designated handover colleague for this application');
            }

            const isAccept = decision === 'accept' || decision === 'Accepted';
            app.HandoverStatus = isAccept ? 'Accepted' : 'Declined';
            app.HandoverResponseNotes = (notes || '').trim();
            app.HandoverRespondedAt = new Date().toISOString();

            if (!app.Metadata) app.Metadata = {};
            app.Metadata.handoverResponse = {
                decision: app.HandoverStatus,
                respondedBy: currentUser,
                timestamp: app.HandoverRespondedAt,
                notes: app.HandoverResponseNotes
            };

            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsFile);
            EnhancedCacheManager.buildIndexes();

            try {
                NotificationManager.notifyHandoverResponse(app, app.HandoverStatus, app.HandoverResponseNotes);
            } catch (nErr) {
                console.warn('Handover response notification notice (non-fatal):', nErr.message);
            }

            Utils.logAction('HANDOVER_RESPONSE', {
                applicationId: appId,
                colleague: currentUser,
                decision: app.HandoverStatus,
                notes: app.HandoverResponseNotes
            });

            return Utils.createSuccessResponse({
                applicationId: appId,
                handoverStatus: app.HandoverStatus,
                message: isAccept ? 'Handover coverage accepted successfully' : 'Handover coverage declined'
            });
        } catch (error) {
            return Utils.createErrorResponse('Failed to respond to handover: ' + error.message);
        }
    },

    toggleHandoverTask: function (appId, taskId, completed, callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').toLowerCase().trim();
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const app = (appsFile.data || []).find(a => a.ID === appId);
            if (!app) return Utils.createErrorResponse('Application not found');

            const isApplicant = app.Email && app.Email.toLowerCase().trim() === currentUser;
            const isHandover = app.HandoverEmail && app.HandoverEmail.toLowerCase().trim() === currentUser;
            const staff = StaffManager.getUserData(currentUser);
            const isAdmin = staff && staff.Role === SYSTEM.ROLES.ADMIN;

            if (!isApplicant && !isHandover && !isAdmin) {
                return Utils.createErrorResponse('Not authorized to update tasks for this application');
            }

            if (!Array.isArray(app.HandoverTasks)) app.HandoverTasks = [];
            const task = app.HandoverTasks.find(t => t.id === taskId);
            if (!task) return Utils.createErrorResponse('Task not found');

            task.completed = Boolean(completed);
            task.completedAt = task.completed ? new Date().toISOString() : null;
            task.completedBy = task.completed ? currentUser : null;

            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsFile);
            EnhancedCacheManager.buildIndexes();

            return Utils.createSuccessResponse({
                taskId,
                completed: task.completed,
                tasks: app.HandoverTasks
            }, 'Task status updated');
        } catch (error) {
            return Utils.createErrorResponse('Failed to update task: ' + error.message);
        }
    }
};

// =============================================
// AUTOMATED DAILY ABSENCE DIGEST MANAGER
// =============================================

const AbsenceDigestManager = {
    getTodayAbsenceDigest: function (targetDateInput = null) {
        try {
            const targetDate = targetDateInput ? Utils.parseLocalDate(targetDateInput) : Utils.parseLocalDate(new Date());
            const targetStr = Utils.formatLocalDate(targetDate);
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);

            const holDetails = Utils.getPublicHolidayDetails(targetDate);
            const isHoliday = holDetails !== null;
            const holidayName = isHoliday ? holDetails.name : null;
            const dayOfWeek = targetDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = dayNames[dayOfWeek];
            const isNonWorkingDay = isHoliday || isWeekend;

            const activeStaff = (staffFile.data || []).filter(s => s.Metadata?.active !== false && s.EligibleForLeave);
            const approvedApps = (appsFile.data || []).filter(a => a.Status === SYSTEM.STATUS.APPROVED);

            const todayAbsences = [];
            approvedApps.forEach(app => {
                const start = Utils.parseLocalDate(app.StartDate || app.HourlyDate);
                const end = Utils.parseLocalDate(app.EndDate || app.HourlyDate || app.StartDate);
                if (start && end && targetDate >= start && targetDate <= end) {
                    todayAbsences.push({
                        applicationId: app.ID,
                        name: app.Name,
                        email: app.Email,
                        department: app.Department || 'General',
                        leaveType: app.LeaveType,
                        leaveMode: app.LeaveMode || 'Daily',
                        isHourly: app.LeaveMode === 'Hourly',
                        hours: app.Hours,
                        startDate: app.StartDate,
                        endDate: app.EndDate,
                        returnDate: Utils.formatLocalDate(new Date(end.getTime() + 86400000)),
                        handoverName: app.HandoverName || 'Team',
                        handoverEmail: app.HandoverEmail || ''
                    });
                }
            });

            // Departmental breakdown
            const departmentStats = {};
            activeStaff.forEach(s => {
                const dept = s.Department || 'General';
                if (!departmentStats[dept]) {
                    departmentStats[dept] = { totalStaff: 0, awayCount: 0, onDutyCount: 0 };
                }
                departmentStats[dept].totalStaff++;
            });

            todayAbsences.forEach(ab => {
                if (departmentStats[ab.department]) {
                    departmentStats[ab.department].awayCount++;
                }
            });

            Object.keys(departmentStats).forEach(dept => {
                const d = departmentStats[dept];
                d.onDutyCount = Math.max(0, d.totalStaff - d.awayCount);
                d.coveragePercent = d.totalStaff > 0 ? Math.round((d.onDutyCount / d.totalStaff) * 100) : 100;
            });

            const totalStaffCount = activeStaff.length;
            const totalAwayCount = todayAbsences.length;
            const totalOnDuty = Math.max(0, totalStaffCount - totalAwayCount);
            const overallStrength = totalStaffCount > 0 ? Math.round((totalOnDuty / totalStaffCount) * 100) : 100;

            let displayStatus = `${overallStrength}% Team Strength`;
            if (isHoliday) {
                displayStatus = `Public Holiday (${holidayName})`;
            } else if (isWeekend) {
                displayStatus = `Weekend (${dayName})`;
            }

            return {
                date: targetStr,
                formattedDate: Utils.formatDateForDisplay(targetDate),
                dayOfWeek,
                dayName,
                isHoliday: Boolean(isHoliday),
                holidayName,
                isWeekend: Boolean(isWeekend),
                isNonWorkingDay: Boolean(isNonWorkingDay),
                displayStatus,
                totalStaffCount,
                totalAwayCount,
                totalOnDuty,
                overallStrength,
                absences: todayAbsences,
                departmentStats
            };
        } catch (error) {
            console.error('Error generating absence digest:', error);
            return {
                date: new Date().toISOString().split('T')[0],
                totalStaffCount: 0,
                totalAwayCount: 0,
                absences: [],
                departmentStats: {}
            };
        }
    },

    sendDailyDigest: function (targetDateInput = null, webhookUrl = null) {
        try {
            const digest = this.getTodayAbsenceDigest(targetDateInput);
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            const url = webhookUrl || settingsFile.data?.googleChatWebhookUrl || settingsFile.data?.GOOGLE_CHAT_WEBHOOK_URL;

            let webhookSent = false;
            let webhookResponse = null;

            if (url && typeof UrlFetchApp !== 'undefined') {
                let cardTitle = "🌿 Agri Experience — Today's Absence Digest";
                let cardSubtitle = `${digest.formattedDate} • Team Strength: ${digest.overallStrength}%`;
                let sectionHeader = `Out of Office (${digest.totalAwayCount} away, ${digest.totalOnDuty} on duty)`;
                let itemsText = '';

                if (digest.isHoliday) {
                    cardTitle = `🌿 Agri Experience — Public Holiday: ${digest.holidayName}`;
                    cardSubtitle = `${digest.formattedDate} • Official Non-Working Holiday (Office Closed)`;
                    sectionHeader = `Statutory Holiday: ${digest.holidayName}`;
                    itemsText = `🇰🇪 <b>Today is ${digest.holidayName}.</b><br>Agri Experience offices are closed in observance of the statutory public holiday.<br>Staff are not on regular office duty and statutory holidays are not deducted from annual leave.`;
                } else if (digest.isWeekend) {
                    cardTitle = `🌿 Agri Experience — Weekend (${digest.dayName})`;
                    cardSubtitle = `${digest.formattedDate} • Non-Working Day (Office Closed)`;
                    sectionHeader = `Weekend Non-Working Day`;
                    itemsText = `☕ <b>Agri Experience offices are closed for the weekend (${digest.dayName}).</b> Regular business operations resume on Monday.`;
                } else if (digest.absences.length === 0) {
                    itemsText = '✅ <b>All staff are on duty today. No scheduled absences.</b>';
                } else {
                    itemsText = digest.absences.map(a =>
                        `• <b>${a.name}</b> (${a.department}): <i>${a.leaveType}</i> ${a.isHourly ? `[${a.hours}h]` : ''} | Coverage: <b>${a.handoverName}</b>`
                    ).join('<br>');
                }

                const cardPayload = {
                    cardsV2: [{
                        cardId: 'dailyAbsenceDigestCard',
                        card: {
                            header: {
                                title: cardTitle,
                                subtitle: cardSubtitle,
                                imageUrl: digest.isHoliday ? "https://img.icons8.com/color/96/confetti.png" : "https://img.icons8.com/color/96/leave.png"
                            },
                            sections: [{
                                header: sectionHeader,
                                widgets: [{
                                    textParagraph: { text: itemsText }
                                }]
                            }]
                        }
                    }]
                };

                try {
                    const resp = UrlFetchApp.fetch(url, {
                        method: 'post',
                        contentType: 'application/json',
                        payload: JSON.stringify(cardPayload),
                        muteHttpExceptions: true
                    });
                    webhookSent = resp.getResponseCode() >= 200 && resp.getResponseCode() < 300;
                    webhookResponse = resp.getContentText();
                } catch (fetchErr) {
                    console.warn('Google Chat Webhook dispatch notice:', fetchErr.message);
                }
            }

            return {
                success: true,
                digest,
                webhookSent,
                webhookResponse
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// =============================================
// GAZETTED PUBLIC HOLIDAY & RECALIBRATION MANAGER
// =============================================

const HolidayManager = {
    getAllCustomHolidays: function () {
        try {
            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS);
            return file.data || [];
        } catch (error) {
            return [];
        }
    },

    addCustomHoliday: function (holidayData, callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            const isAdminOrHR = user && (user.Role === SYSTEM.ROLES.ADMIN || user.Role === SYSTEM.ROLES.HR);
            if (!isAdminOrHR) {
                return Utils.createErrorResponse('Only HR or System Administrators can gazette public holidays');
            }

            const name = (holidayData.name || '').trim();
            const date = (holidayData.date || '').trim();
            const description = (holidayData.description || '').trim();

            if (!name) return Utils.createErrorResponse('Holiday name is required');
            if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return Utils.createErrorResponse('Valid holiday date (YYYY-MM-DD) is required');
            }

            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS);
            if (!file.data) file.data = [];

            const existing = file.data.find(h => h.date === date);
            if (existing) {
                return Utils.createErrorResponse(`A public holiday is already registered for ${date}: "${existing.name}"`);
            }

            const newHoliday = {
                id: 'HOL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                name,
                date,
                description,
                addedBy: currentUser,
                addedAt: new Date().toISOString()
            };

            file.data.push(newHoliday);
            file.metadata.recordCount = file.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS, file);
            EnhancedCacheManager.clearAll();

            Utils.logAction('ADD_GAZETTED_HOLIDAY', {
                holidayId: newHoliday.id,
                name,
                date,
                addedBy: currentUser
            });

            return Utils.createSuccessResponse(newHoliday, 'Gazetted public holiday added successfully');
        } catch (error) {
            return Utils.createErrorResponse('Failed to add public holiday: ' + error.message);
        }
    },

    deleteCustomHoliday: function (holidayId, callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            const isAdminOrHR = user && (user.Role === SYSTEM.ROLES.ADMIN || user.Role === SYSTEM.ROLES.HR);
            if (!isAdminOrHR) {
                return Utils.createErrorResponse('Only HR or System Administrators can delete public holidays');
            }

            const file = DataManager.readDataFile(SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS);
            const idx = (file.data || []).findIndex(h => h.id === holidayId || h.date === holidayId);
            if (idx === -1) return Utils.createErrorResponse('Holiday not found');

            const deleted = file.data.splice(idx, 1)[0];
            file.metadata.recordCount = file.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS, file);
            EnhancedCacheManager.clearAll();

            Utils.logAction('DELETE_GAZETTED_HOLIDAY', {
                holidayId: deleted.id,
                name: deleted.name,
                date: deleted.date,
                deletedBy: currentUser
            });

            return Utils.createSuccessResponse(deleted, 'Gazetted public holiday removed');
        } catch (error) {
            return Utils.createErrorResponse('Failed to delete public holiday: ' + error.message);
        }
    },

    recalibrateLeavesForHoliday: function (holidayDate, callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            const isAdminOrHR = user && (user.Role === SYSTEM.ROLES.ADMIN || user.Role === SYSTEM.ROLES.HR);
            if (!isAdminOrHR) {
                return Utils.createErrorResponse('Only HR or System Administrators can recalibrate leave applications');
            }

            const holDate = Utils.parseLocalDate(holidayDate);
            if (!holDate) return Utils.createErrorResponse('Valid holiday date is required');

            // Check if holiday is on a weekend
            const dayOfWeek = holDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applications = appsFile.data || [];
            const affectedApps = [];

            applications.forEach(app => {
                if (app.LeaveMode === 'Hourly') return;
                if (app.Status !== SYSTEM.STATUS.PENDING && app.Status !== SYSTEM.STATUS.APPROVED) return;

                const start = Utils.parseLocalDate(app.StartDate);
                const end = Utils.parseLocalDate(app.EndDate);
                if (!start || !end) return;

                if (holDate >= start && holDate <= end) {
                    const oldDuration = app.Duration;
                    const accurateBusinessDays = Utils.getBusinessDays(app.StartDate, app.EndDate);

                    if (accurateBusinessDays < oldDuration) {
                        const dayDiff = oldDuration - accurateBusinessDays;
                        app.Duration = accurateBusinessDays;
                        if (!app.Metadata) app.Metadata = {};
                        if (!Array.isArray(app.Metadata.recalibrations)) app.Metadata.recalibrations = [];

                        app.Metadata.recalibrations.push({
                            holidayDate,
                            refund: dayDiff,
                            oldDuration,
                            newDuration: accurateBusinessDays,
                            timestamp: new Date().toISOString()
                        });

                        // If approved, refund the deducted day
                        if (app.Status === SYSTEM.STATUS.APPROVED) {
                            if (app.DeductFromAnnual >= dayDiff) {
                                app.DeductFromAnnual -= dayDiff;
                            } else if (app.DeductFromBroughtForward >= dayDiff) {
                                app.DeductFromBroughtForward -= dayDiff;
                            } else if (app.DeductFromCompensation >= dayDiff) {
                                app.DeductFromCompensation -= dayDiff;
                            } else {
                                app.DeductFromAnnual = Math.max(0, app.DeductFromAnnual - dayDiff);
                            }
                            EnhancedCacheManager.clearBalance(app.Email);
                        }

                        affectedApps.push({
                            id: app.ID,
                            email: app.Email,
                            name: app.Name,
                            oldDuration,
                            newDuration: accurateBusinessDays,
                            refunded: dayDiff,
                            status: app.Status
                        });

                        try {
                            NotificationManager.notifyLeaveRecalibrated(app, dayDiff, holidayDate);
                        } catch (nErr) {}
                    }
                }
            });

            if (affectedApps.length > 0) {
                DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsFile);
                EnhancedCacheManager.buildIndexes();
                Utils.logAction('RECALIBRATE_LEAVES_HOLIDAY', {
                    holidayDate,
                    recalibratedBy: currentUser,
                    affectedCount: affectedApps.length
                });
            }

            return Utils.createSuccessResponse({
                holidayDate,
                affectedCount: affectedApps.length,
                affectedApplications: affectedApps,
                isWeekend
            }, `Recalibrated ${affectedApps.length} overlapping application(s). Days refunded.`);
        } catch (error) {
            return Utils.createErrorResponse('Failed to recalibrate applications: ' + error.message);
        }
    },

    recalibrateAllLeaves: function (callerEmail = null) {
        try {
            const currentUser = (callerEmail || Session.getActiveUser().getEmail() || '').trim();
            const user = StaffManager.getUserData(currentUser);
            const isAdminOrHR = user && (user.Role === SYSTEM.ROLES.ADMIN || user.Role === SYSTEM.ROLES.HR);
            if (!isAdminOrHR) {
                return Utils.createErrorResponse('Only HR or System Administrators can recalibrate leave applications');
            }

            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applications = appsFile.data || [];
            const affectedApps = [];
            let totalDaysRefunded = 0;

            applications.forEach(app => {
                if (app.LeaveMode === 'Hourly') return;
                if (app.Status !== SYSTEM.STATUS.PENDING && app.Status !== SYSTEM.STATUS.APPROVED) return;

                const start = Utils.parseLocalDate(app.StartDate);
                const end = Utils.parseLocalDate(app.EndDate);
                if (!start || !end) return;

                const oldDuration = app.Duration;
                const accurateBusinessDays = Utils.getBusinessDays(app.StartDate, app.EndDate);

                if (accurateBusinessDays < oldDuration) {
                    const dayDiff = oldDuration - accurateBusinessDays;
                    app.Duration = accurateBusinessDays;
                    totalDaysRefunded += dayDiff;

                    if (!app.Metadata) app.Metadata = {};
                    if (!Array.isArray(app.Metadata.recalibrations)) app.Metadata.recalibrations = [];

                    app.Metadata.recalibrations.push({
                        holidayDate: 'ALL_GAZETTED_HOLIDAYS',
                        refund: dayDiff,
                        oldDuration,
                        newDuration: accurateBusinessDays,
                        timestamp: new Date().toISOString()
                    });

                    // If approved, refund the deducted day
                    if (app.Status === SYSTEM.STATUS.APPROVED) {
                        if (app.DeductFromAnnual >= dayDiff) {
                            app.DeductFromAnnual -= dayDiff;
                        } else if (app.DeductFromBroughtForward >= dayDiff) {
                            app.DeductFromBroughtForward -= dayDiff;
                        } else if (app.DeductFromCompensation >= dayDiff) {
                            app.DeductFromCompensation -= dayDiff;
                        } else {
                            app.DeductFromAnnual = Math.max(0, app.DeductFromAnnual - dayDiff);
                        }
                        EnhancedCacheManager.clearBalance(app.Email);
                    }

                    affectedApps.push({
                        id: app.ID,
                        email: app.Email,
                        name: app.Name,
                        oldDuration,
                        newDuration: accurateBusinessDays,
                        refunded: dayDiff,
                        status: app.Status
                    });

                    try {
                        NotificationManager.notifyLeaveRecalibrated(app, dayDiff, 'Gazetted Public Holidays');
                    } catch (nErr) {}
                }
            });

            if (affectedApps.length > 0) {
                DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsFile);
                EnhancedCacheManager.buildIndexes();
                Utils.logAction('RECALIBRATE_ALL_LEAVES', {
                    recalibratedBy: currentUser,
                    affectedCount: affectedApps.length,
                    totalDaysRefunded
                });
            }

            return Utils.createSuccessResponse({
                affectedCount: affectedApps.length,
                totalDaysRefunded,
                affectedApplications: affectedApps
            }, `Recalibrated ${affectedApps.length} leave application(s). Refunded ${totalDaysRefunded} total day(s) to staff balances.`);
        } catch (error) {
            return Utils.createErrorResponse('Failed to recalibrate applications: ' + error.message);
        }
    }
};

// =============================================
// SETUP FUNCTIONS
// =============================================

const SetupManager = {
    createFirstAdminUser: function () {
        try {
            const currentUser = Session.getActiveUser().getEmail();

            // Use configured admin email
            const adminEmail = SYSTEM.ADMIN_EMAIL;
            const currentYear = Utils.getCurrentYear();
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const nextAccrualDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

            // Check if user already exists (by admin email)
            const existingStaff = StaffManager.getAllStaffData();
            const existingUser = existingStaff.find(staff =>
                staff.Email.toLowerCase().trim() === adminEmail.toLowerCase().trim()
            );

            if (existingUser) {
                return Utils.createSuccessResponse(
                    { user: existingUser },
                    'System administrator already exists'
                );
            }

            // Create admin user with leave eligibility set to false
            const adminUser = {
                Email: adminEmail,
                Name: 'System Administrator',
                Role: SYSTEM.ROLES.ADMIN,
                Department: 'Administration',
                Supervisor: '',
                WorkingHoursPerDay: 8,
                JoinDate: today.toISOString().split('T')[0],
                EligibleForLeave: false,  // ❗ NOT eligible for leave

                LeaveAccrual: {
                    eligible: false,  // ❗ NOT eligible
                    monthlyRate: 1.75,
                    accruedYearToDate: 0,
                    usedYearToDate: 0,
                    annualDeficit: { amount: 0, fromYear: null, recoveryHistory: [] },
                    availableBalance: 0,
                    nextAccrualDate: nextAccrualDate.toISOString().split('T')[0],
                    lastAccrualDate: startOfMonth.toISOString().split('T')[0],
                    totalAccruedSinceJoin: 0
                },

                LeaveBroughtForward: null,

                SickLeave: {
                    used: 0,
                    resetDate: `${currentYear + 1}-01-01`
                },

                LeaveHistory: {
                    [currentYear]: { annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, totalUsed: 0 }
                },

                LeaveDeficit: { records: [], totalDeficit: 0, deducted: 0, pending: 0 },

                Metadata: {
                    created: new Date().toISOString(),
                    createdBy: 'system',
                    active: true,
                    eligibleForLeave: false,  // ❗ NOT eligible
                    isSystemAccount: true  // ✅ Flag to identify system account
                }
            };

            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            staffFile.data.push(adminUser);
            staffFile.metadata.recordCount = staffFile.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            return Utils.createSuccessResponse(
                { user: adminUser },
                'System administrator account created successfully (not eligible for leave).'
            );

        } catch (error) {
            console.error('Error creating admin user:', error);
            return Utils.createErrorResponse('Failed to create admin user: ' + error.message);
        }
    }
};

// =============================================
// SYSTEM MANAGEMENT
// =============================================

const SystemManager = {
    resetAndInitializeSystem: function (freshStart = false) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const systemAdminEmail = SYSTEM.ADMIN_EMAIL;

            const currentYear = Utils.getCurrentYear();
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const nextAccrualDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

            const staffList = [
                'moses@agri-experience.com-Tech Team-staff',
                'denis@agri-experience.com-Tech Team-staff',
                'ronald@agri-experience.com-Tech Team-staff',
                'victor@agri-experience.com-Tech Team-staff',
                'mulemia@agri-experience.com-Tech Team-supervisor',
                'jayne@agri-experience.com-Admin Team-supervisor',
                'claire@agri-experience.com-Admin Team-admin'
            ];

            const results = {
                freshStart: freshStart,
                filesReset: [],
                systemAdminCreated: false,
                staffCreated: [],
                staffSkipped: [],
                errors: []
            };

            if (freshStart) {
                const dataFiles = [
                    SYSTEM.DATA_FILES.STAFF,
                    SYSTEM.DATA_FILES.APPLICATIONS,
                    SYSTEM.DATA_FILES.SETTINGS,
                    SYSTEM.DATA_FILES.LOGS,
                    SYSTEM.DATA_FILES.ANNUAL_RESET
                ];

                dataFiles.forEach(filename => {
                    try {
                        const defaultData = DataManager.createDefaultDataStructure(filename);
                        DataManager.writeDataFile(filename, defaultData);
                        results.filesReset.push({ file: filename, status: 'reset' });
                    } catch (error) {
                        results.errors.push({ action: `reset_file_${filename}`, error: error.message });
                    }
                });
            }

            // Get existing staff or create new array
            let staffArray = freshStart ? [] : StaffManager.getAllStaffData();

            // Check if system admin already exists
            const systemAdminExists = staffArray.some(staff =>
                staff.Email.toLowerCase().trim() === systemAdminEmail.toLowerCase().trim()
            );

            if (!systemAdminExists) {
                // Create system admin account (not eligible for leave)
                const systemAdmin = {
                    Email: systemAdminEmail,
                    Name: 'System Administrator',
                    Role: SYSTEM.ROLES.ADMIN,
                    Department: 'Administration',
                    Supervisor: '',
                    WorkingHoursPerDay: 8,
                    JoinDate: today.toISOString().split('T')[0],
                    EligibleForLeave: false,  // ❗ NOT eligible

                    LeaveAccrual: {
                        eligible: false,
                        monthlyRate: 1.75,
                        accruedYearToDate: 0,
                        usedYearToDate: 0,
                        annualDeficit: { amount: 0, fromYear: null, recoveryHistory: [] },
                        availableBalance: 0,
                        nextAccrualDate: nextAccrualDate.toISOString().split('T')[0],
                        lastAccrualDate: startOfMonth.toISOString().split('T')[0],
                        totalAccruedSinceJoin: 0
                    },

                    LeaveBroughtForward: null,

                    SickLeave: {
                        used: 0,
                        resetDate: `${currentYear + 1}-01-01`
                    },

                    LeaveHistory: {
                        [currentYear]: { annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, totalUsed: 0 }
                    },

                    Metadata: {
                        created: new Date().toISOString(),
                        createdBy: 'system_initialization',
                        active: true,
                        eligibleForLeave: false,
                        isSystemAccount: true  // ✅ Flag to identify system account
                    }
                };

                staffArray.push(systemAdmin);
                results.systemAdminCreated = true;
            }

            // Process staff list (skip if they already exist or are the system admin)
            const staffToCreate = [];
            staffList.forEach(staffEntry => {
                const parts = staffEntry.split('-');
                if (parts.length !== 3) {
                    results.errors.push({ entry: staffEntry, error: 'Invalid format' });
                    return;
                }

                const email = parts[0].trim();
                const department = parts[1].trim();
                let role = parts[2].trim().toLowerCase();

                // Skip if this is the system admin email
                if (email.toLowerCase() === systemAdminEmail.toLowerCase()) {
                    results.staffSkipped.push({ email: email, reason: 'System admin account' });
                    return;
                }

                if (!Utils.isValidEmail(email)) {
                    results.errors.push({ entry: staffEntry, error: 'Invalid email format' });
                    return;
                }

                if (role === 'admin') role = SYSTEM.ROLES.ADMIN;
                else if (role === 'supervisor') role = SYSTEM.ROLES.SUPERVISOR;
                else if (role === 'staff') role = SYSTEM.ROLES.STAFF;
                else {
                    results.errors.push({ entry: staffEntry, error: 'Invalid role' });
                    return;
                }

                // Check if staff already exists
                const exists = staffArray.some(s =>
                    s.Email && s.Email.toLowerCase().trim() === email.toLowerCase().trim()
                );

                if (!exists) {
                    staffToCreate.push({ email, department, role });
                } else {
                    results.staffSkipped.push({ email: email, reason: 'Already exists' });
                }
            });

            // Create new staff members
            if (staffToCreate.length > 0) {
                staffToCreate.forEach(staffData => {
                    const { email, department, role } = staffData;
                    const name = Utils.generateNameFromEmail(email);

                    const newStaff = {
                        Email: email,
                        Name: name,
                        Role: role,
                        Department: department,
                        Supervisor: '',
                        WorkingHoursPerDay: 8,
                        JoinDate: today.toISOString().split('T')[0],
                        EligibleForLeave: true,

                        LeaveAccrual: {
                            eligible: true,
                            monthlyRate: 1.75,
                            accruedYearToDate: 0,
                            usedYearToDate: 0,
                            annualDeficit: { amount: 0, fromYear: null, recoveryHistory: [] },
                            availableBalance: 0,
                            nextAccrualDate: nextAccrualDate.toISOString().split('T')[0],
                            lastAccrualDate: startOfMonth.toISOString().split('T')[0],
                            totalAccruedSinceJoin: 0
                        },

                        LeaveBroughtForward: null,

                        SickLeave: {
                            used: 0,
                            resetDate: `${currentYear + 1}-01-01`
                        },

                        LeaveHistory: {
                            [currentYear]: { annualUsed: 0, sickUsed: 0, broughtForwardUsed: 0, totalUsed: 0 }
                        },

                        Metadata: {
                            created: new Date().toISOString(),
                            createdBy: 'system_initialization',
                            active: true,
                            eligibleForLeave: true
                        }
                    };

                    staffArray.push(newStaff);
                    results.staffCreated.push({ email, name, department, role });
                });
            }

            // Set up supervisor assignments
            const supervisorAssignments = {
                'moses@agri-experience.com': 'mulemia@agri-experience.com',
                'denis@agri-experience.com': 'mulemia@agri-experience.com',
                'ronald@agri-experience.com': 'mulemia@agri-experience.com',
                'victor@agri-experience.com': 'mulemia@agri-experience.com',
                'mulemia@agri-experience.com': 'jayne@agri-experience.com',
                'jayne@agri-experience.com': systemAdminEmail,  // Points to system admin
                'claire@agri-experience.com': systemAdminEmail   // Points to system admin
            };

            // Apply supervisor assignments
            let assignmentsMade = 0;
            staffArray = staffArray.map(staff => {
                const email = staff.Email.toLowerCase();
                if (supervisorAssignments[email]) {
                    staff.Supervisor = supervisorAssignments[email];
                    assignmentsMade++;
                }
                return staff;
            });

            // Save all staff data
            const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
            staffFile.data = staffArray;
            staffFile.metadata.recordCount = staffArray.length;
            staffFile.metadata.lastUpdated = new Date().toISOString();
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);

            // Rebuild indexes
            EnhancedCacheManager.clearAll();
            EnhancedCacheManager.buildIndexes();

            Utils.logAction('SYSTEM_INITIALIZATION', {
                freshStart: freshStart,
                systemAdmin: systemAdminEmail,
                staffCreated: results.staffCreated.length,
                staffSkipped: results.staffSkipped.length,
                assignmentsMade: assignmentsMade,
                errors: results.errors.length
            }, currentUser);

            const totalStaff = staffArray.length;
            const eligibleStaff = staffArray.filter(s => s.EligibleForLeave).length;

            return {
                success: true,
                data: {
                    summary: {
                        performedBy: currentUser,
                        operation: freshStart ? 'system_reset' : 'system_initialization',
                        systemAdmin: systemAdminEmail,
                        totalStaff: totalStaff,
                        eligibleStaff: eligibleStaff,
                        systemAdminEligible: false
                    },
                    details: {
                        systemAdminCreated: results.systemAdminCreated,
                        staffCreated: results.staffCreated,
                        staffSkipped: results.staffSkipped,
                        filesReset: results.filesReset,
                        errors: results.errors
                    }
                },
                message: freshStart
                    ? `✅ SYSTEM RESET COMPLETE! System admin: ${systemAdminEmail} (not eligible for leave). Total staff: ${totalStaff} (${eligibleStaff} eligible).`
                    : `✅ SYSTEM INITIALIZATION COMPLETE! System admin: ${systemAdminEmail}. Added ${results.staffCreated.length} new staff members.`
            };

        } catch (error) {
            console.error('❌ Fatal error in system initialization:', error);
            return { success: false, error: 'System initialization failed: ' + error.message };
        }
    },

    initializeSystem: function () {
        return this.resetAndInitializeSystem(false);
    },

    resetSystem: function () {
        return this.resetAndInitializeSystem(true);
    }
};

// =============================================
// HYBRID DUAL-STORE ENGINE (GOOGLE SHEETS MASTER & LIVE MIRROR)
// =============================================

const SheetsDualStoreManager = {
    getSpreadsheet: function () {
        try {
            const scriptProps = PropertiesService.getScriptProperties();
            const cachedId = scriptProps.getProperty('SHEETS_DATABASE_ID');
            const folder = DataManager.getSystemFolder();

            // 1. Try cached spreadsheet ID
            if (cachedId) {
                try {
                    const ss = SpreadsheetApp.openById(cachedId);
                    if (ss) {
                        return ss;
                    }
                } catch (openErr) {
                    console.warn('Cached Sheets database ID invalid, searching system folder:', openErr.message);
                }
            }

            // 2. Search directly inside system folder
            const files = folder.getFilesByName(SYSTEM.SHEETS_DATABASE.FILE_NAME);
            if (files.hasNext()) {
                const existingFile = files.next();
                const ss = SpreadsheetApp.openById(existingFile.getId());
                scriptProps.setProperty('SHEETS_DATABASE_ID', ss.getId());
                this.ensureTabs(ss);
                return ss;
            }

            // 3. Auto-generate new Master Database spreadsheet directly in project folder
            console.log(`📊 Auto-generating "${SYSTEM.SHEETS_DATABASE.FILE_NAME}" in folder "${folder.getName()}"...`);
            const newSs = SpreadsheetApp.create(SYSTEM.SHEETS_DATABASE.FILE_NAME);
            const newSsId = newSs.getId();
            const driveFile = DriveApp.getFileById(newSsId);

            // Move the sheet into the system folder alongside the JSON files
            if (typeof driveFile.moveTo === 'function') {
                driveFile.moveTo(folder);
            } else if (typeof folder.addFile === 'function') {
                folder.addFile(driveFile);
                try {
                    if (typeof DriveApp.getRootFolder === 'function') {
                        DriveApp.getRootFolder().removeFile(driveFile);
                    }
                } catch (e) {
                    console.warn('Root folder file removal skipped:', e.message);
                }
            }

            scriptProps.setProperty('SHEETS_DATABASE_ID', newSsId);
            this.ensureTabs(newSs);
            this.syncAll(newSs);
            return newSs;

        } catch (error) {
            console.error('❌ Fatal error resolving Sheets Database:', error);
            throw error;
        }
    },

    ensureTabs: function (ss) {
        if (!ss) return;

        const tabConfigs = [
            {
                name: SYSTEM.SHEETS_DATABASE.SHEETS.APPLICATIONS,
                headers: [
                    'Application ID', 'Date Applied', 'Applicant Name', 'Email', 'Role', 'Department',
                    'Leave Type', 'Start Date', 'End Date', 'Business Days', 'Status', 'Approval Stage',
                    'Supervisor Email', 'Handover Colleague', 'Handover Status', 'Reason',
                    'Supervisor Notes', 'HR Notes', 'Calendar Event ID', 'Last Updated'
                ],
                headerColor: '#1E3A8A' // Deep Navy
            },
            {
                name: SYSTEM.SHEETS_DATABASE.SHEETS.STAFF_BALANCES,
                headers: [
                    'Email', 'Full Name', 'Department', 'Role', 'Supervisor', 'Employment Date',
                    'Eligible', 'Annual Rate', 'Annual Accrued', 'Annual Used', 'Annual Remaining',
                    'Brought Forward Remaining', 'Comp Balance', 'Sick Used', 'Sick Balance', 'Last Updated'
                ],
                headerColor: '#2E7D32' // Forest Green
            },
            {
                name: SYSTEM.SHEETS_DATABASE.SHEETS.GAZETTED_HOLIDAYS,
                headers: [
                    'Holiday ID', 'Name', 'Date', 'Year', 'Type', 'Description', 'Created At', 'Created By'
                ],
                headerColor: '#B45309' // Amber
            },
            {
                name: SYSTEM.SHEETS_DATABASE.SHEETS.AUDIT_LOG,
                headers: [
                    'Timestamp', 'Action', 'User Email', 'Details', 'Status'
                ],
                headerColor: '#374151' // Charcoal
            }
        ];

        tabConfigs.forEach(cfg => {
            let sheet = ss.getSheetByName(cfg.name);
            if (!sheet) {
                sheet = ss.insertSheet(cfg.name);
            }

            if (sheet.getLastRow() === 0) {
                sheet.getRange(1, 1, 1, cfg.headers.length).setValues([cfg.headers]);
                sheet.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold');
                sheet.getRange(1, 1, 1, cfg.headers.length).setBackground(cfg.headerColor);
                sheet.getRange(1, 1, 1, cfg.headers.length).setFontColor('#FFFFFF');
                sheet.setFrozenRows(1);
            }
        });

        // Clean up initial default 'Sheet1' if present
        const sheet1 = ss.getSheetByName('Sheet1');
        if (sheet1 && ss.getSheets().length > 1) {
            try {
                ss.deleteSheet(sheet1);
            } catch (e) {
                // Ignore if cannot delete
            }
        }
    },

    syncApplications: function (applications = null, targetSs = null) {
        try {
            const ss = targetSs || this.getSpreadsheet();
            const sheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.APPLICATIONS);
            if (!sheet) return false;

            let apps = applications;
            if (!apps) {
                const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
                apps = appsFile.data || [];
            }

            const rows = apps.map(app => [
                app.ID || '',
                app.DateApplied || '',
                app.Name || app.ApplicantName || '',
                app.Email || app.ApplicantEmail || '',
                app.Role || '',
                app.Department || '',
                app.LeaveType || '',
                app.StartDate || '',
                app.EndDate || '',
                app.Duration !== undefined ? app.Duration : (app.WorkingDays || 0),
                app.Status || '',
                app.ApprovalStage || (app.Status === SYSTEM.STATUS.APPROVED ? 'approved' : 'pending'),
                app.SupervisorEmail || '',
                app.HandoverName || app.HandoverEmail || '',
                app.HandoverStatus || 'None',
                app.Reason || '',
                (app.SupervisorApproval && app.SupervisorApproval.comment) || app.SupervisorNotes || '',
                (app.HRApproval && app.HRApproval.comment) || app.HRNotes || '',
                app.CalendarEventId || '',
                app.LastUpdated || new Date().toISOString()
            ]);

            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
                sheet.getRange(2, 1, lastRow - 1, 20).clearContent();
            }

            if (rows.length > 0) {
                sheet.getRange(2, 1, rows.length, 20).setValues(rows);
            }
            return true;
        } catch (error) {
            console.error('Error syncing applications to Sheets:', error);
            return false;
        }
    },

    syncBalances: function (targetSs = null) {
        try {
            const ss = targetSs || this.getSpreadsheet();
            const sheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.STAFF_BALANCES);
            if (!sheet) return false;

            const staffData = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false);
            const rows = staffData.map(s => {
                const bal = DashboardManager.calculateUserBalance(s.Email) || {};
                const ann = bal.annual || {};
                const bf = bal.broughtForward || {};
                const sick = bal.sick || {};
                const compBal = (s.CompensationLeave && s.CompensationLeave.balance) || 0;
                return [
                    s.Email || '',
                    s.Name || '',
                    s.Department || '',
                    s.Role || '',
                    s.Supervisor || '',
                    s.EmploymentDate || s.JoinDate || '',
                    s.EligibleForLeave ? 'Yes' : 'No',
                    ann.monthlyRate || 1.75,
                    ann.accrued || 0,
                    ann.used || 0,
                    ann.available || 0,
                    bf.available || bf.remaining || 0,
                    compBal,
                    sick.used || 0,
                    sick.balance || 0,
                    new Date().toISOString()
                ];
            });

            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
                sheet.getRange(2, 1, lastRow - 1, 16).clearContent();
            }

            if (rows.length > 0) {
                sheet.getRange(2, 1, rows.length, 16).setValues(rows);
            }
            return true;
        } catch (error) {
            console.error('Error syncing balances to Sheets:', error);
            return false;
        }
    },

    syncHolidays: function (holidays = null, targetSs = null) {
        try {
            const ss = targetSs || this.getSpreadsheet();
            const sheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.GAZETTED_HOLIDAYS);
            if (!sheet) return false;

            let hols = holidays;
            if (!hols) {
                hols = HolidayManager.getAllCustomHolidays();
            }

            const rows = hols.map(h => [
                h.id || '',
                h.name || '',
                h.date || '',
                h.year || (h.date ? h.date.substring(0, 4) : ''),
                h.type || 'Gazetted',
                h.description || '',
                h.createdAt || '',
                h.createdBy || ''
            ]);

            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
                sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
            }

            if (rows.length > 0) {
                sheet.getRange(2, 1, rows.length, 8).setValues(rows);
            }
            return true;
        } catch (error) {
            console.error('Error syncing gazetted holidays to Sheets:', error);
            return false;
        }
    },

    syncAuditLogs: function (logs = null, targetSs = null) {
        try {
            const ss = targetSs || this.getSpreadsheet();
            const sheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.AUDIT_LOG);
            if (!sheet) return false;

            let logEntries = logs;
            if (!logEntries) {
                const logsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.LOGS);
                logEntries = logsFile.data || [];
            }

            const rows = logEntries.slice(-500).map(l => [
                l.timestamp || '',
                l.action || '',
                l.userEmail || '',
                typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || ''),
                l.status || 'OK'
            ]);

            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
                sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
            }

            if (rows.length > 0) {
                sheet.getRange(2, 1, rows.length, 5).setValues(rows);
            }
            return true;
        } catch (error) {
            console.error('Error syncing audit logs to Sheets:', error);
            return false;
        }
    },

    syncAll: function (targetSs = null) {
        try {
            const ss = targetSs || this.getSpreadsheet();
            this.ensureTabs(ss);

            this.syncApplications(null, ss);
            this.syncBalances(ss);
            this.syncHolidays(null, ss);
            this.syncAuditLogs(null, ss);

            const now = new Date().toISOString();
            PropertiesService.getScriptProperties().setProperty('SHEETS_DATABASE_LAST_SYNC', now);

            return {
                success: true,
                sheetId: ss.getId(),
                sheetUrl: ss.getUrl(),
                fileName: SYSTEM.SHEETS_DATABASE.FILE_NAME,
                lastSync: now
            };
        } catch (error) {
            console.error('Fatal error in SheetsDualStoreManager.syncAll:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    syncOnChange: function (filename, data) {
        try {
            if (filename === SYSTEM.DATA_FILES.APPLICATIONS) {
                this.syncApplications(data.data || []);
            } else if (filename === SYSTEM.DATA_FILES.STAFF) {
                this.syncBalances();
            } else if (filename === SYSTEM.DATA_FILES.GAZETTED_HOLIDAYS) {
                this.syncHolidays(data.data || []);
            }
        } catch (err) {
            console.warn(`Non-blocking Sheets mirror update failed for ${filename}:`, err.message);
        }
    },

    restoreFromJsonOrSheets: function (source = 'sheets') {
        try {
            if (source === 'sheets') {
                const ss = this.getSpreadsheet();
                const sheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.APPLICATIONS);
                if (!sheet) throw new Error('Applications tab not found in Master Sheet');

                const lastRow = sheet.getLastRow();
                if (lastRow <= 1) {
                    throw new Error('No application rows found in Google Sheet to restore');
                }

                const rows = sheet.getRange(2, 1, lastRow - 1, 20).getValues();
                const restoredApps = rows.map(r => ({
                    ID: String(r[0]),
                    DateApplied: String(r[1]),
                    Name: String(r[2]),
                    ApplicantName: String(r[2]),
                    Email: String(r[3]),
                    ApplicantEmail: String(r[3]),
                    Role: String(r[4]),
                    Department: String(r[5]),
                    LeaveType: String(r[6]),
                    StartDate: String(r[7]),
                    EndDate: String(r[8]),
                    Duration: Number(r[9]) || 0,
                    Status: String(r[10]) || 'Pending',
                    ApprovalStage: String(r[11]) || 'approved',
                    SupervisorEmail: String(r[12]),
                    HandoverName: String(r[13]),
                    HandoverStatus: String(r[14]),
                    Reason: String(r[15]),
                    SupervisorNotes: String(r[16]),
                    HRNotes: String(r[17]),
                    CalendarEventId: String(r[18]),
                    LastUpdated: String(r[19]) || new Date().toISOString()
                }));

                const appsData = {
                    data: restoredApps,
                    metadata: {
                        restoredFromSheets: true,
                        restoredAt: new Date().toISOString(),
                        recordCount: restoredApps.length,
                        version: SYSTEM.VERSION
                    }
                };

                DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsData);
                EnhancedCacheManager.buildIndexes();

                return {
                    success: true,
                    message: `Successfully restored ${restoredApps.length} applications from Google Sheet mirror!`,
                    restoredCount: restoredApps.length
                };
            } else {
                // Restore JSON into Sheets (full sync)
                return this.syncAll();
            }
        } catch (error) {
            console.error('Fatal error during database restoration:', error);
            throw error;
        }
    },

    getDatabaseStatus: function () {
        try {
            const ss = this.getSpreadsheet();
            const scriptProps = PropertiesService.getScriptProperties();
            const appSheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.APPLICATIONS);
            const staffSheet = ss.getSheetByName(SYSTEM.SHEETS_DATABASE.SHEETS.STAFF_BALANCES);

            return {
                enabled: true,
                id: ss.getId(),
                url: ss.getUrl(),
                name: SYSTEM.SHEETS_DATABASE.FILE_NAME,
                folder: SYSTEM.FOLDER_NAME,
                lastSync: scriptProps.getProperty('SHEETS_DATABASE_LAST_SYNC') || 'Never',
                applicationsCount: appSheet ? Math.max(0, appSheet.getLastRow() - 1) : 0,
                staffCount: staffSheet ? Math.max(0, staffSheet.getLastRow() - 1) : 0
            };
        } catch (e) {
            return {
                enabled: false,
                error: e.message
            };
        }
    }
};

// =============================================
// HISTORICAL COLD-STORAGE ARCHIVE MANAGER
// =============================================

const ArchiveManager = {
    archivePastYearApplications: function (cutoffYear = null) {
        try {
            const currentYear = Utils.getCurrentYear();
            const yearThreshold = cutoffYear !== null ? parseInt(cutoffYear, 10) : (currentYear - 1);

            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const allApps = appsFile.data || [];

            const toArchive = [];
            const toKeep = [];

            allApps.forEach(app => {
                const appDate = app.StartDate || app.DateApplied;
                const appYear = appDate ? new Date(appDate).getFullYear() : currentYear;
                const isClosed = app.Status === SYSTEM.STATUS.APPROVED ||
                    app.Status === SYSTEM.STATUS.DECLINED ||
                    app.Status === SYSTEM.STATUS.CANCELLED;

                // Only archive closed applications strictly on or before cutoffYear
                if (isClosed && appYear <= yearThreshold) {
                    toArchive.push(app);
                } else {
                    toKeep.push(app);
                }
            });

            if (toArchive.length === 0) {
                return {
                    success: true,
                    archivedCount: 0,
                    remainingCount: toKeep.length,
                    message: `No closed applications found from year ${yearThreshold} or earlier to archive.`
                };
            }

            // Read or create archive file
            const archiveFile = DataManager.readDataFile(SYSTEM.DATA_FILES.ARCHIVE) || { data: [], metadata: {} };
            archiveFile.data = archiveFile.data || [];
            archiveFile.data.push(...toArchive);
            archiveFile.metadata = Object.assign({}, archiveFile.metadata || {}, {
                lastArchived: new Date().toISOString(),
                recordCount: archiveFile.data.length,
                lastCutoffYear: yearThreshold
            });

            // Write archive file
            DataManager.writeDataFile(SYSTEM.DATA_FILES.ARCHIVE, archiveFile);

            // Update active applications file
            appsFile.data = toKeep;
            appsFile.metadata = Object.assign({}, appsFile.metadata || {}, {
                recordCount: toKeep.length,
                lastArchivePruning: new Date().toISOString()
            });
            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, appsFile);

            return {
                success: true,
                archivedCount: toArchive.length,
                totalArchived: archiveFile.data.length,
                remainingCount: toKeep.length,
                cutoffYear: yearThreshold,
                message: `Successfully archived ${toArchive.length} closed applications from ${yearThreshold} or earlier.`
            };
        } catch (error) {
            console.error('ArchiveManager error:', error);
            throw error;
        }
    },

    getArchiveSummary: function () {
        try {
            const archiveFile = DataManager.readDataFile(SYSTEM.DATA_FILES.ARCHIVE) || { data: [], metadata: {} };
            const data = archiveFile.data || [];
            const yearSet = new Set();
            data.forEach(a => {
                const d = a.StartDate || a.DateApplied;
                if (d) {
                    const y = new Date(d).getFullYear();
                    if (!isNaN(y)) yearSet.add(y);
                }
            });
            const years = Array.from(yearSet).sort((a, b) => b - a);
            return {
                totalRecords: data.length,
                years: years,
                lastArchived: archiveFile.metadata ? archiveFile.metadata.lastArchived : null,
                lastCutoffYear: archiveFile.metadata ? archiveFile.metadata.lastCutoffYear : null
            };
        } catch (e) {
            return { totalRecords: 0, years: [], lastArchived: null };
        }
    },

    getArchivedApplications: function (filters = {}) {
        try {
            const archiveFile = DataManager.readDataFile(SYSTEM.DATA_FILES.ARCHIVE);
            let apps = archiveFile.data || [];

            if (filters.email) {
                const emailKey = filters.email.toLowerCase().trim();
                apps = apps.filter(a => a.Email && a.Email.toLowerCase().trim() === emailKey);
            }
            if (filters.year && filters.year !== 'all') {
                apps = apps.filter(a => {
                    const d = a.StartDate || a.DateApplied;
                    return d && new Date(d).getFullYear().toString() === filters.year.toString();
                });
            }
            if (filters.leaveType && filters.leaveType !== 'all') {
                apps = apps.filter(a => a.LeaveType === filters.leaveType);
            }
            if (filters.status && filters.status !== 'all') {
                apps = apps.filter(a => a.Status === filters.status);
            }
            if (filters.department && filters.department !== 'all') {
                apps = apps.filter(a => a.Department === filters.department);
            }
            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                apps = apps.filter(a =>
                    (a.Name && a.Name.toLowerCase().includes(q)) ||
                    (a.Email && a.Email.toLowerCase().includes(q)) ||
                    (a.ID && a.ID.toLowerCase().includes(q)) ||
                    (a.Reason && a.Reason.toLowerCase().includes(q)) ||
                    (a.HandoverColleagueName && a.HandoverColleagueName.toLowerCase().includes(q))
                );
            }

            return apps;
        } catch (error) {
            console.error('Error fetching archived applications:', error);
            return [];
        }
    }
};

// =============================================
// DIAGNOSTICS & SYSTEM HEALTH ENGINE
// =============================================

const DiagnosticsManager = {
    getSystemHealth: function () {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            status: 'HEALTHY',
            folder: { name: SYSTEM.FOLDER_NAME, exists: false, id: null, error: null },
            databaseFiles: {},
            sheetsMirror: null,
            cache: { memoryTier: 'OK', distributedTier: 'UNKNOWN', error: null },
            triggers: { total: 0, managedInstalled: 0, missing: [], triggers: [] },
            integrations: {
                calendar: { configured: false, calendarId: null },
                chatWebhook: { configured: false }
            }
        };

        // 1. Project Drive Folder check
        try {
            const folder = DataManager.getSystemFolder();
            if (folder) {
                diagnostics.folder.exists = true;
                diagnostics.folder.id = folder.getId();
            }
        } catch (fErr) {
            diagnostics.folder.error = fErr.message;
            diagnostics.status = 'DEGRADED';
        }

        // 2. Data Files check
        const fileKeys = Object.keys(SYSTEM.DATA_FILES);
        fileKeys.forEach(k => {
            const fileName = SYSTEM.DATA_FILES[k];
            try {
                const file = DataManager.readDataFile(fileName);
                const recCount = Array.isArray(file.data) ? file.data.length : (file.data ? Object.keys(file.data).length : 0);
                diagnostics.databaseFiles[k] = {
                    fileName: fileName,
                    exists: true,
                    recordCount: recCount,
                    lastUpdated: (file.metadata && file.metadata.lastUpdated) ? file.metadata.lastUpdated : null
                };
            } catch (dErr) {
                diagnostics.databaseFiles[k] = {
                    fileName: fileName,
                    exists: false,
                    error: dErr.message
                };
                if (k !== 'ARCHIVE' && k !== 'GAZETTED_HOLIDAYS') {
                    diagnostics.status = 'DEGRADED';
                }
            }
        });

        // 3. Sheets Dual-Store Mirror check
        try {
            if (typeof SheetsDualStoreManager !== 'undefined') {
                diagnostics.sheetsMirror = SheetsDualStoreManager.getDatabaseStatus();
            }
        } catch (sErr) {
            diagnostics.sheetsMirror = { error: sErr.message, status: 'ERROR' };
        }

        // 4. CacheService check
        try {
            if (typeof CacheService !== 'undefined' && CacheService.getScriptCache) {
                const scriptCache = CacheService.getScriptCache();
                if (scriptCache) {
                    scriptCache.put('__diag_ping', 'ok', 60);
                    const pingVal = scriptCache.get('__diag_ping');
                    diagnostics.cache.distributedTier = pingVal === 'ok' ? 'ACTIVE' : 'DEGRADED';
                } else {
                    diagnostics.cache.distributedTier = 'UNAVAILABLE';
                }
            }
        } catch (cErr) {
            diagnostics.cache.distributedTier = 'ERROR: ' + cErr.message;
        }

        // 5. Triggers check
        const expectedTriggers = [
            'scheduledDailyHeartbeat',
            'scheduledMonthlyAccrual',
            'scheduledYearEnd',
            'scheduledEasterWarning',
            'scheduledEasterExpiry'
        ];
        try {
            if (typeof ScriptApp !== 'undefined' && ScriptApp.getProjectTriggers) {
                const triggers = ScriptApp.getProjectTriggers() || [];
                diagnostics.triggers.total = triggers.length;
                const registeredHandlers = triggers.map(t => t.getHandlerFunction());
                expectedTriggers.forEach(fn => {
                    const found = registeredHandlers.includes(fn);
                    if (found) {
                        diagnostics.triggers.managedInstalled++;
                    } else {
                        diagnostics.triggers.missing.push(fn);
                    }
                });
                diagnostics.triggers.triggers = triggers.map(t => ({
                    handler: t.getHandlerFunction(),
                    id: t.getUniqueId ? t.getUniqueId() : null
                }));
            }
        } catch (tErr) {
            diagnostics.triggers.error = tErr.message;
        }

        // 6. Integrations check
        try {
            const settingsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.SETTINGS);
            const calId = settingsFile && settingsFile.data ? settingsFile.data.calendarId : null;
            diagnostics.integrations.calendar.configured = Boolean(calId);
            diagnostics.integrations.calendar.calendarId = calId;

            const webhookUrl = settingsFile && settingsFile.data ? settingsFile.data.chatWebhookUrl : null;
            diagnostics.integrations.chatWebhook.configured = Boolean(webhookUrl);
        } catch (iErr) {}

        return diagnostics;
    },

    installSystemTriggers: function () {
        return setupAutomaticAccrual();
    }
};

// =============================================
// FINANCIAL LEAVE LIABILITY & ACCRUAL PROVISION
// =============================================

const FinancialProvisionManager = {
    getLeaveLiabilityReport: function (params = {}) {
        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const allStaff = staffFile.data || [];
        const activeStaff = allStaff.filter(s => s.EligibleForLeave && (!s.Metadata || s.Metadata.active !== false));

        const currentYear = Utils.getCurrentYear();
        const defaultDailySalary = (params && params.defaultDailySalary) ? parseFloat(params.defaultDailySalary) : 0;

        let totalLiabilityDays = 0;
        let totalCarriedForwardDays = 0;
        let totalAccruedDays = 0;
        let totalEstimatedValue = 0;
        const departmentalSummary = {};
        const staffRecords = [];

        activeStaff.forEach(staff => {
            const email = staff.Email;
            const balanceObj = DashboardManager.calculateUserBalance(email);
            const annual = balanceObj ? balanceObj.annual : null;
            const bf = balanceObj ? balanceObj.broughtForward : null;

            const entitlement = (staff.LeaveAccrual && staff.LeaveAccrual.annualEntitlement) || 21;
            const accrued = annual ? (annual.accrued || 0) : 0;
            const bfDays = bf ? (bf.available || 0) : 0;
            const bfForfeited = bf ? (bf.forfeited || 0) : 0;
            const taken = annual ? (annual.used || 0) : 0;
            const remaining = (annual ? (annual.available || 0) : 0) + bfDays;

            const dailyRate = staff.Salary && staff.Salary.dailyRate
                ? parseFloat(staff.Salary.dailyRate)
                : (staff.Metadata && staff.Metadata.dailyRate ? parseFloat(staff.Metadata.dailyRate) : defaultDailySalary);

            const estimatedValue = remaining * dailyRate;

            totalLiabilityDays += remaining;
            totalCarriedForwardDays += bfDays;
            totalAccruedDays += accrued;
            totalEstimatedValue += estimatedValue;

            const dept = staff.Department || 'General';
            if (!departmentalSummary[dept]) {
                departmentalSummary[dept] = {
                    department: dept,
                    staffCount: 0,
                    liabilityDays: 0,
                    carriedForwardDays: 0,
                    estimatedValue: 0
                };
            }
            departmentalSummary[dept].staffCount++;
            departmentalSummary[dept].liabilityDays += remaining;
            departmentalSummary[dept].carriedForwardDays += bfDays;
            departmentalSummary[dept].estimatedValue += estimatedValue;

            staffRecords.push({
                email: email,
                name: staff.Name,
                department: dept,
                jobTitle: staff.JobTitle || '',
                entitlement: entitlement,
                accruedThisYear: Math.round(accrued * 100) / 100,
                carriedForwardDays: Math.round(bfDays * 100) / 100,
                bfForfeitedDays: Math.round(bfForfeited * 100) / 100,
                daysTaken: Math.round(taken * 100) / 100,
                remainingLiabilityDays: Math.round(remaining * 100) / 100,
                dailyRate: dailyRate,
                estimatedLiabilityValue: Math.round(estimatedValue * 100) / 100
            });
        });

        staffRecords.sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name));

        const report = {
            generatedAt: new Date().toISOString(),
            year: currentYear,
            currency: (params && params.currency) ? params.currency : 'KES',
            activeStaffCount: activeStaff.length,
            totalLiabilityDays: Math.round(totalLiabilityDays * 100) / 100,
            totalCarriedForwardDays: Math.round(totalCarriedForwardDays * 100) / 100,
            totalAccruedDays: Math.round(totalAccruedDays * 100) / 100,
            totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
            departmentalSummary: Object.values(departmentalSummary),
            staffRecords: staffRecords
        };

        if (params && params.syncToSheet && typeof SheetsDualStoreManager !== 'undefined') {
            try {
                this.syncLiabilityReportToSheet(report);
                report.syncedToSheet = true;
            } catch (sheetErr) {
                console.error('Failed to sync liability report to sheet:', sheetErr);
                report.syncedToSheet = false;
                report.sheetError = sheetErr.message;
            }
        }

        return report;
    },

    syncLiabilityReportToSheet: function (report) {
        const ss = SheetsDualStoreManager.getSpreadsheet();
        if (!ss) return;
        const tabName = 'Leave_Liability_Report';
        let sheet = ss.getSheetByName(tabName);
        if (!sheet) {
            sheet = ss.insertSheet(tabName);
        }
        if (typeof sheet.clear === 'function') {
            sheet.clear();
        } else if (typeof sheet.clearContents === 'function') {
            sheet.clearContents();
        }

        const headers = [
            'Staff Name', 'Email', 'Department', 'Job Title',
            'Entitlement', 'Accrued This Year', 'Carried Forward (BF)',
            'Days Taken', 'Remaining Liability Days',
            'Daily Rate (' + report.currency + ')', 'Estimated Provision (' + report.currency + ')'
        ];

        const rows = [headers];
        report.staffRecords.forEach(s => {
            rows.push([
                s.name, s.email, s.department, s.jobTitle,
                s.entitlement, s.accruedThisYear, s.carriedForwardDays,
                s.daysTaken, s.remainingLiabilityDays,
                s.dailyRate, s.estimatedLiabilityValue
            ]);
        });

        rows.push([]);
        rows.push(['--- DEPARTMENTAL SUMMARY ---', '', '', '', '', '', '', '', '', '', '', '']);
        rows.push(['Department', 'Staff Count', 'Total Liability Days', 'Total Carried Forward', 'Total Provision (' + report.currency + ')']);
        report.departmentalSummary.forEach(d => {
            rows.push([d.department, d.staffCount, d.liabilityDays, d.carriedForwardDays, d.estimatedValue]);
        });
        rows.push(['TOTAL', report.activeStaffCount, report.totalLiabilityDays, report.totalCarriedForwardDays, report.totalEstimatedValue]);

        sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
        sheet.getRange(1, 1, 1, headers.length)
            .setBackground('#059669')
            .setFontColor('#FFFFFF')
            .setFontWeight('bold');
        sheet.setFrozenRows(1);
    }
};

// =============================================
// PUBLIC API FUNCTIONS
// =============================================

function apiCreateFirstAdmin() {
    return SetupManager.createFirstAdminUser();
}

function apiGetCurrentUser() {
    try {
        const userEmail = Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(userEmail);
        return Utils.createSuccessResponse({
            email: userEmail,
            name: user ? user.Name : null,
            role: user ? user.Role : null,
            exists: !!user
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to get current user: ' + error.message);
    }
}

function apiGetDashboardData() {
    return DashboardManager.getDashboardData();
}

function apiGetUserBalance() {
    try {
        const userEmail = Session.getActiveUser().getEmail();
        const balanceData = DashboardManager.calculateUserBalance(userEmail);
        if (!balanceData) return Utils.createErrorResponse('User not found');
        return Utils.createSuccessResponse(balanceData);
    } catch (error) {
        return Utils.createErrorResponse('Failed to calculate balance: ' + error.toString());
    }
}

function apiCheckLeaveBalance(email, leaveType, duration, isHourly = false) {
    try {
        console.log('apiCheckLeaveBalance received:', { email, leaveType, duration, isHourly });

        // Handle case where params come as a single object
        if (typeof email === 'object' && email !== null) {
            const params = email;
            email = params.email;
            leaveType = params.leaveType;
            duration = params.duration;
            isHourly = params.isHourly || false;
        }

        // Ensure email is a string
        if (typeof email !== 'string') {
            return Utils.createErrorResponse('Email must be a string - received: ' + typeof email);
        }

        const durationNum = parseFloat(duration);
        const isHourlyBool = isHourly === 'true' || isHourly === true;

        if (isHourlyBool) {
            const user = StaffManager.getUserData(email);
            if (!user) return Utils.createErrorResponse('User not found');
            const workingHoursPerDay = user.WorkingHoursPerDay || SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY;
            const days = durationNum / workingHoursPerDay;
            return ApplicationsManager.checkLeaveBalanceWithPriority(email, leaveType, days);
        } else {
            return ApplicationsManager.checkLeaveBalanceWithPriority(email, leaveType, durationNum);
        }
    } catch (error) {
        console.error('Error in apiCheckLeaveBalance:', error);
        return Utils.createErrorResponse('Failed to check leave balance: ' + error.toString());
    }
}

function apiCancelApplication(params) {
    try {
        // Handle both parameter formats
        if (typeof params === 'string') {
            // Called with just appId
            return ApplicationsManager.cancelApplication(params, '');
        } else {
            // Called with object { appId, reason }
            return ApplicationsManager.cancelApplication(params.appId, params.reason || '');
        }
    } catch (error) {
        console.error('Error in apiCancelApplication:', error);
        return Utils.createErrorResponse('Failed to cancel application: ' + error.message);
    }
}

// Add this temporary debug function
function debugCheckApplication(email) {
    const userEmail = email || Session.getActiveUser().getEmail();
    console.log('Debug: Checking applications for:', userEmail);

    // Read directly from file
    const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
    console.log('All applications from file:', appsFile.data);

    // Filter manually
    const manualFilter = appsFile.data.filter(app =>
        app.Email && app.Email.toLowerCase().trim() === userEmail.toLowerCase().trim()
    );
    console.log('Manually filtered applications:', manualFilter);

    // Check indexes
    console.log('Email index size:', EnhancedCacheManager.indexes.applicationsByEmail.size);
    console.log('Email index keys:', Array.from(EnhancedCacheManager.indexes.applicationsByEmail.keys()));

    return {
        fileData: appsFile.data,
        manualFilter: manualFilter,
        indexes: EnhancedCacheManager.indexes
    };
}

function apiGetApplicationById(appId) {
    try {
        if (typeof appId === 'object' && appId !== null) {
            appId = appId.appId || appId.id || appId.ID;
        }
        if (!appId || typeof appId !== 'string') {
            return Utils.createErrorResponse('Application ID is required');
        }
        const app = ApplicationsManager.getApplicationById(appId.trim());
        if (!app) return Utils.createErrorResponse('Application not found');

        const currentUser = (Session.getActiveUser().getEmail() || '').toLowerCase().trim();
        const userRole = StaffManager.getUserRole(currentUser);

        const isOwner = (app.Email || '').toLowerCase().trim() === currentUser;
        const isSupervisor = (app.SupervisorEmail || '').toLowerCase().trim() === currentUser;
        const isAdminOrHr = userRole === SYSTEM.ROLES.ADMIN || userRole === SYSTEM.ROLES.HR;
        const isCoverageColleague = (app.HandoverColleagueEmail || '').toLowerCase().trim() === currentUser;

        if (!isOwner && !isSupervisor && !isAdminOrHr && !isCoverageColleague) {
            return Utils.createErrorResponse('You are not authorized to view this application');
        }

        return Utils.createSuccessResponse(app, 'Application details retrieved');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get application: ' + error.message);
    }
}

function apiSubmitLeaveApplication(applicationData) {
    return ApplicationsManager.submitLeaveApplication(applicationData);
}

function apiGetMyApplications(filters = {}) {
    try {
        console.log('apiGetMyApplications called with filters:', filters);

        const userEmail = Session.getActiveUser().getEmail();
        console.log('Current user email:', userEmail);

        filters.email = userEmail;

        // Use cache manager with its new fallback logic
        const applications = EnhancedCacheManager.getApplicationsByEmail(userEmail, filters);

        console.log(`Returning ${applications.length} applications`);

        return Utils.createSuccessResponse({
            data: applications,
            count: applications.length
        });

    } catch (error) {
        console.error('Error in apiGetMyApplications:', error);
        return Utils.createErrorResponse('Failed to load applications: ' + error.toString());
    }
}
function checkCacheHealth() {
    const stats = EnhancedCacheManager.getPerformanceStats();

    // Check applications index
    const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
    const totalInFile = appsFile.data.length;

    // Count unique emails in file
    const emailsInFile = new Set();
    appsFile.data.forEach(app => emailsInFile.add(app.Email));

    // Compare with index
    const indexSize = EnhancedCacheManager.indexes.applicationsByEmail.size;

    console.log('Cache Health Check:', {
        fileTotal: totalInFile,
        uniqueEmailsInFile: emailsInFile.size,
        indexSize: indexSize,
        cacheStats: stats.cache,
        indexStats: {
            staffByEmail: EnhancedCacheManager.indexes.staffByEmail.size,
            appsByEmail: EnhancedCacheManager.indexes.applicationsByEmail.size,
            appsByStatus: EnhancedCacheManager.indexes.applicationsByStatus.size
        }
    });

    // Auto-rebuild if needed
    if (totalInFile > 0 && indexSize === 0) {
        console.log('⚠️ Cache out of sync! Rebuilding...');
        EnhancedCacheManager.buildIndexes();
        return { fixed: true, message: 'Indexes rebuilt' };
    }

    return { healthy: true };
}
function apiProcessApplicationDecision(appId, decision, comment = '') {
    try {
        // Handle case where params come as a single object
        if (typeof appId === 'object' && appId !== null) {
            const params = appId;
            appId = params.appId;
            decision = params.decision;
            comment = params.comment || '';
        }

        // Ensure appId is a string
        if (typeof appId !== 'string') {
            return Utils.createErrorResponse('appId must be a string');
        }

        return ApplicationsManager.processApplicationDecision(appId, decision, comment);

    } catch (error) {
        return Utils.createErrorResponse('Failed to process application: ' + error.toString());
    }
}

function apiGetPendingApplications() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        console.log('Fetching pending applications for supervisor:', currentUser);

        const user = StaffManager.getUserData(currentUser);
        if (!user) return Utils.createErrorResponse('User not found');

        if (user.Role !== SYSTEM.ROLES.SUPERVISOR && user.Role !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('User is not a supervisor');
        }

        // Get ALL applications
        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        let allApps = appsFile.data || [];

        console.log('Total applications in system:', allApps.length);

        // Filter to pending applications where this user is the supervisor
        const pendingApps = allApps.filter(app => {
            // Must be pending
            if (app.Status !== SYSTEM.STATUS.PENDING) return false;

            // If dual approval is awaiting HR endorsement, supervisor has already endorsed it
            if (app.ApprovalStage === 'pending_hr') return false;

            // Must have this user as supervisor
            const supervisorEmail = app.SupervisorEmail || app.supervisorEmail;
            if (!supervisorEmail) return false;

            return supervisorEmail.toLowerCase().trim() === currentUser.toLowerCase().trim();
        });

        console.log('Found pending apps for this supervisor:', pendingApps.length);

        // Sort by date (oldest first)
        pendingApps.sort((a, b) => {
            const dateA = new Date(a.DateApplied || a.dateApplied || 0);
            const dateB = new Date(b.DateApplied || b.dateApplied || 0);
            return dateA - dateB;
        });

        return Utils.createSuccessResponse({
            data: pendingApps,
            count: pendingApps.length
        });

    } catch (error) {
        console.error('Error in apiGetPendingApplications:', error);
        return Utils.createErrorResponse('Failed to get pending applications: ' + error.toString());
    }
}

function apiGetTeamApplications() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(currentUser);
        if (!user) return Utils.createErrorResponse('User not found');
        if (user.Role !== SYSTEM.ROLES.SUPERVISOR && user.Role !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('User is not a supervisor');
        }
        const supervisedStaff = StaffManager.getStaffBySupervisor(currentUser);
        const supervisedEmails = supervisedStaff.map(staff => staff.Email.toLowerCase());
        let teamApplications = [];
        supervisedEmails.forEach(email => {
            const staffApplications = EnhancedCacheManager.getApplicationsByEmail(email, {});
            teamApplications = teamApplications.concat(staffApplications);
        });
        return Utils.createSuccessResponse({ data: teamApplications, count: teamApplications.length });
    } catch (error) {
        return Utils.createErrorResponse('Failed to get team applications: ' + error.toString());
    }
}

function apiGetSupervisorStats() {
    try {
        const result = DashboardManager.getSupervisorStatsData();
        return Utils.createSuccessResponse(result);
    } catch (error) {
        return Utils.createErrorResponse(error.message);
    }
}

function apiCreateStaff(staffData) {
    return StaffManager.createStaff(staffData);
}

function apiUpdateStaff(originalEmail, staffData) {
    try {
        // Handle case where params come as a single object
        if (typeof originalEmail === 'object' && originalEmail !== null) {
            const params = originalEmail;
            return StaffManager.updateStaff(params.originalEmail, params.staffData);
        }

        // Handle case where params are separate
        return StaffManager.updateStaff(originalEmail, staffData);

    } catch (error) {
        return Utils.createErrorResponse('Failed to update staff member: ' + error.message);
    }
}
function apiDeleteStaff(email) {
    if (typeof email === 'object' && email !== null) {
        email = email.email || email.targetEmail || '';
    }
    return StaffManager.deleteStaff(email);
}

function apiGetAllStaff() {
    try {
        if (!Utils.checkPermission([SYSTEM.ROLES.ADMIN, SYSTEM.ROLES.HR, SYSTEM.ROLES.SUPERVISOR])) {
            return Utils.createErrorResponse('Insufficient permissions');
        }
        const staffData = StaffManager.getAllStaffData();
        const activeStaff = staffData.filter(s => s.Metadata?.active !== false);
        return Utils.createSuccessResponse({ data: activeStaff, count: activeStaff.length });
    } catch (error) {
        return Utils.createErrorResponse('Failed to load staff: ' + error.toString());
    }
}
function apiGetAllApplications() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);

        if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.SUPERVISOR && userRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Insufficient permissions');
        }

        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        let applications = appsFile.data || [];

        applications.sort((a, b) => {
            const dateA = new Date(a.DateApplied || 0);
            const dateB = new Date(b.DateApplied || 0);
            return dateB - dateA;
        });

        return Utils.createSuccessResponse({ data: applications, count: applications.length });

    } catch (error) {
        console.error('Error in apiGetAllApplications:', error);
        return Utils.createErrorResponse('Failed to load applications: ' + error.toString());
    }
}

function apiGetSupervisors() {
    try {
        if (!Utils.checkPermission([SYSTEM.ROLES.ADMIN, SYSTEM.ROLES.SUPERVISOR])) {
            return Utils.createErrorResponse('Insufficient permissions');
        }
        const supervisors = StaffManager.getSupervisorsData();
        return Utils.createSuccessResponse({ data: supervisors, count: supervisors.length });
    } catch (error) {
        return Utils.createErrorResponse('Failed to load supervisors: ' + error.toString());
    }
}

// ── Award compensation leave days to a staff member (Admin/HR only) ──────
function apiAwardCompensationLeave(params) {
    try {
        if (typeof params !== 'object' || !params) {
            return Utils.createErrorResponse('params object required: { email, days, reason, date }');
        }
        const { email, days, reason, date } = params;
        if (!email || !days || days <= 0) {
            return Utils.createErrorResponse('email and positive days are required');
        }

        const currentUser = Session.getActiveUser().getEmail();
        const currentRole = StaffManager.getUserRole(currentUser);
        if (currentRole !== SYSTEM.ROLES.ADMIN && currentRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Only Admin or HR can award compensation leave');
        }

        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const idx = staffFile.data.findIndex(s =>
            s.Email.toLowerCase().trim() === email.toLowerCase().trim()
        );
        if (idx === -1) return Utils.createErrorResponse('Staff member not found');

        const member = staffFile.data[idx];

        if (!member.CompensationLeave) {
            member.CompensationLeave = { balance: 0, used: 0, awards: [] };
        }

        const awardDays = parseFloat(days);
        member.CompensationLeave.balance = (member.CompensationLeave.balance || 0) + awardDays;
        member.CompensationLeave.awards = member.CompensationLeave.awards || [];
        
        const awardDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        member.CompensationLeave.awards.push({
            date: awardDate,
            days: awardDays,
            reason: reason || 'Compensation for weekend/public holiday work',
            awardedBy: currentUser,
            timestamp: new Date().toISOString(),
            revoked: false
        });

        member.Metadata.lastUpdated = new Date().toISOString();
        member.Metadata.updatedBy = currentUser;

        DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
        EnhancedCacheManager.clearBalance(email);

        Utils.logAction('AWARD_COMPENSATION_LEAVE', { 
            email, days: awardDays, reason, date: awardDate, awardedBy: currentUser 
        });

        return Utils.createSuccessResponse({
            email, 
            daysAwarded: awardDays,
            newBalance: member.CompensationLeave.balance,
            awards: member.CompensationLeave.awards
        }, `${awardDays} compensation day(s) awarded to ${member.Name}`);

    } catch (error) {
        return Utils.createErrorResponse('Failed to award compensation leave: ' + error.message);
    }
}

// ── Get staff compensation leave profile and award history ────────────────
function apiGetStaffCompensation(emailOrParams) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const currentRole = StaffManager.getUserRole(currentUser);

        const email = typeof emailOrParams === 'object' && emailOrParams !== null
            ? (emailOrParams.email || currentUser)
            : (emailOrParams || currentUser);

        const isSelf = currentUser.toLowerCase().trim() === email.toLowerCase().trim();
        const isPrivileged = currentRole === SYSTEM.ROLES.ADMIN || currentRole === SYSTEM.ROLES.HR || currentRole === SYSTEM.ROLES.SUPERVISOR;

        if (!isSelf && !isPrivileged) {
            return Utils.createErrorResponse('Insufficient permissions to view compensation details');
        }

        const staff = StaffManager.getUserData(email);
        if (!staff) return Utils.createErrorResponse('Staff member not found');

        const comp = staff.CompensationLeave || { balance: 0, used: 0, awards: [] };

        return Utils.createSuccessResponse({
            email: staff.Email,
            name: staff.Name,
            department: staff.Department,
            balance: comp.balance || 0,
            used: comp.used || 0,
            totalAwarded: (comp.balance || 0) + (comp.used || 0),
            awards: comp.awards || []
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to get staff compensation: ' + error.message);
    }
}

// ── Adjust compensation leave balance directly (Admin/HR only) ─────────────
function apiAdjustCompensationLeave(params) {
    try {
        if (typeof params !== 'object' || !params) {
            return Utils.createErrorResponse('params object required: { email, newBalance, reason }');
        }
        const { email, newBalance, reason } = params;
        if (!email || newBalance === undefined || isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0) {
            return Utils.createErrorResponse('email and non-negative newBalance are required');
        }

        const currentUser = Session.getActiveUser().getEmail();
        const currentRole = StaffManager.getUserRole(currentUser);
        if (currentRole !== SYSTEM.ROLES.ADMIN && currentRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Only Admin or HR can adjust compensation leave');
        }

        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const idx = staffFile.data.findIndex(s =>
            s.Email.toLowerCase().trim() === email.toLowerCase().trim()
        );
        if (idx === -1) return Utils.createErrorResponse('Staff member not found');

        const member = staffFile.data[idx];
        if (!member.CompensationLeave) {
            member.CompensationLeave = { balance: 0, used: 0, awards: [] };
        }

        const prevBalance = member.CompensationLeave.balance || 0;
        const targetBalance = Math.max(0, parseFloat(newBalance));
        const delta = targetBalance - prevBalance;

        member.CompensationLeave.balance = targetBalance;
        member.CompensationLeave.awards = member.CompensationLeave.awards || [];
        member.CompensationLeave.awards.push({
            date: new Date().toISOString().split('T')[0],
            days: delta,
            type: 'adjustment',
            previousBalance: prevBalance,
            newBalance: targetBalance,
            reason: reason || `Manual balance adjustment by ${currentUser}`,
            awardedBy: currentUser,
            timestamp: new Date().toISOString(),
            revoked: false
        });

        member.Metadata.lastUpdated = new Date().toISOString();
        member.Metadata.updatedBy = currentUser;

        DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
        EnhancedCacheManager.clearBalance(email);

        Utils.logAction('ADJUST_COMPENSATION_LEAVE', {
            email, prevBalance, newBalance: targetBalance, delta, reason, adjustedBy: currentUser
        });

        return Utils.createSuccessResponse({
            email, prevBalance, previousBalance: prevBalance, newBalance: targetBalance, delta,
            awards: member.CompensationLeave.awards
        }, `Compensation balance for ${member.Name} adjusted from ${prevBalance.toFixed(3)} to ${targetBalance.toFixed(3)} days`);

    } catch (error) {
        return Utils.createErrorResponse('Failed to adjust compensation leave: ' + error.message);
    }
}

// ── Revoke an existing compensation leave award (Admin/HR only) ─────────────
function apiRevokeCompensationAward(params) {
    try {
        if (typeof params !== 'object' || !params) {
            return Utils.createErrorResponse('params object required: { email, awardIndex, reason }');
        }
        const { email, awardIndex, reason } = params;
        if (!email || awardIndex === undefined || awardIndex === null) {
            return Utils.createErrorResponse('email and awardIndex are required');
        }

        const currentUser = Session.getActiveUser().getEmail();
        const currentRole = StaffManager.getUserRole(currentUser);
        if (currentRole !== SYSTEM.ROLES.ADMIN && currentRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Only Admin or HR can revoke compensation awards');
        }

        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const idx = staffFile.data.findIndex(s =>
            s.Email.toLowerCase().trim() === email.toLowerCase().trim()
        );
        if (idx === -1) return Utils.createErrorResponse('Staff member not found');

        const member = staffFile.data[idx];
        if (!member.CompensationLeave || !member.CompensationLeave.awards || !member.CompensationLeave.awards[awardIndex]) {
            return Utils.createErrorResponse('Award record not found');
        }

        const targetAward = member.CompensationLeave.awards[awardIndex];
        if (targetAward.revoked) {
            return Utils.createErrorResponse('This award has already been revoked');
        }

        const daysToDeduct = targetAward.days || 0;
        const currentBal = member.CompensationLeave.balance || 0;
        const newBal = Math.max(0, currentBal - daysToDeduct);

        targetAward.revoked = true;
        targetAward.revokedDate = new Date().toISOString().split('T')[0];
        targetAward.revokedBy = currentUser;
        targetAward.revocationReason = reason || 'Award revoked by administrator';

        member.CompensationLeave.balance = newBal;
        member.Metadata.lastUpdated = new Date().toISOString();
        member.Metadata.updatedBy = currentUser;

        DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
        EnhancedCacheManager.clearBalance(email);

        Utils.logAction('REVOKE_COMPENSATION_AWARD', {
            email, awardIndex, daysDeducted: daysToDeduct, newBalance: newBal, reason, revokedBy: currentUser
        });

        return Utils.createSuccessResponse({
            email, newBalance: newBal, revokedAward: targetAward,
            awards: member.CompensationLeave.awards
        }, `Award of ${daysToDeduct} day(s) revoked for ${member.Name}. New balance: ${newBal.toFixed(3)}`);

    } catch (error) {
        return Utils.createErrorResponse('Failed to revoke compensation award: ' + error.message);
    }
}

// ── Get all compensation records across the organization (Admin/HR only) ───
function apiGetAllCompensationRecords() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const currentRole = StaffManager.getUserRole(currentUser);
        if (currentRole !== SYSTEM.ROLES.ADMIN && currentRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Only Admin or HR can access all compensation records');
        }

        const staffData = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false);
        const records = staffData.map(s => {
            const comp = s.CompensationLeave || { balance: 0, used: 0, awards: [] };
            return {
                email: s.Email,
                name: s.Name,
                department: s.Department,
                role: s.Role,
                eligibleForLeave: s.EligibleForLeave,
                balance: comp.balance || 0,
                used: comp.used || 0,
                totalAwarded: (comp.balance || 0) + (comp.used || 0),
                awardsCount: (comp.awards || []).length,
                awards: comp.awards || []
            };
        });

        const totalActiveBalance = records.reduce((sum, r) => sum + r.balance, 0);
        const totalUsed = records.reduce((sum, r) => sum + r.used, 0);

        return Utils.createSuccessResponse({
            records: records,
            summary: {
                totalStaffWithComp: records.filter(r => r.balance > 0 || r.used > 0).length,
                totalActiveBalance: +totalActiveBalance.toFixed(3),
                totalBalance: +totalActiveBalance.toFixed(3),
                totalUsed: +totalUsed.toFixed(3),
                totalAwarded: +(totalActiveBalance + totalUsed).toFixed(3)
            }
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to load compensation records: ' + error.message);
    }
}

// ── Batch Process Decisions on Multiple Applications (Supervisor/Admin/HR) ─────
function apiBatchProcessDecisions(params) {
    try {
        if (typeof params !== 'object' || !params) {
            return Utils.createErrorResponse('params object required: { appIds, decision, comment }');
        }
        const { appIds, decision, comment } = params;
        if (!Array.isArray(appIds) || appIds.length === 0) {
            return Utils.createErrorResponse('appIds must be a non-empty array of application IDs');
        }
        if (decision !== 'approve' && decision !== 'decline') {
            return Utils.createErrorResponse('decision must be either "approve" or "decline"');
        }

        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.SUPERVISOR && userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Only Supervisors, Admins, or HR can process applications');
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const appId of appIds) {
            const res = ApplicationsManager.processApplicationDecision(appId, decision, comment || `Batch ${decision}d by ${currentUser}`);
            if (res.success) {
                successCount++;
                results.push({ appId, success: true });
            } else {
                failCount++;
                results.push({ appId, success: false, error: res.error });
            }
        }

        return Utils.createSuccessResponse({
            total: appIds.length,
            successCount,
            failCount,
            decision,
            results
        }, `Processed ${successCount} of ${appIds.length} application(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to batch process applications: ' + error.message);
    }
}

// ── Get upcoming public holidays & long weekend / bridge opportunities ────────
function apiGetUpcomingHolidays() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const year = today.getFullYear();
        const holidays = [];

        // Fixed holidays
        const fixed = [
            { month: 0, day: 1, name: "New Year's Day" },
            { month: 4, day: 1, name: "Labour Day" },
            { month: 5, day: 1, name: "Madaraka Day" },
            { month: 9, day: 10, name: "Utamaduni / Mazigira Day" },
            { month: 9, day: 20, name: "Mashujaa Day" },
            { month: 11, day: 12, name: "Jamhuri Day" },
            { month: 11, day: 25, name: "Christmas Day" },
            { month: 11, day: 26, name: "Boxing Day" }
        ];

        [year, year + 1].forEach(y => {
            const easter = Utils.calculateEasterDate(y);
            easter.setHours(0, 0, 0, 0);
            const goodFriday = new Date(easter);
            goodFriday.setDate(easter.getDate() - 2);
            const easterMonday = new Date(easter);
            easterMonday.setDate(easter.getDate() + 1);

            holidays.push({ date: goodFriday, name: 'Good Friday' });
            holidays.push({ date: easterMonday, name: 'Easter Monday' });

            fixed.forEach(h => {
                const hd = new Date(y, h.month, h.day);
                hd.setHours(0, 0, 0, 0);
                holidays.push({ date: hd, name: h.name });
                if (hd.getDay() === 0) {
                    let carryDays = 1;
                    if (h.month === 11 && h.day === 25) {
                        carryDays = 2; // Tuesday Dec 27
                    }
                    const obs = new Date(hd);
                    obs.setDate(hd.getDate() + carryDays);
                    holidays.push({ date: obs, name: `${h.name} (Observed)` });
                }
            });
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const futureHolidays = holidays
            .filter(h => h.date >= today)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
            .map(h => {
                const diffTime = h.date.getTime() - today.getTime();
                const daysAway = Math.round(diffTime / (1000 * 60 * 60 * 24));
                const dayOfWeek = dayNames[h.date.getDay()];
                let bridgeTip = null;

                if (dayOfWeek === 'Tuesday') {
                    bridgeTip = 'Bridge Opportunity: Take Monday off for a 4-day weekend!';
                } else if (dayOfWeek === 'Thursday') {
                    bridgeTip = 'Bridge Opportunity: Take Friday off for a 4-day weekend!';
                } else if (dayOfWeek === 'Friday' || dayOfWeek === 'Monday') {
                    bridgeTip = 'Long weekend!';
                }

                return {
                    name: h.name,
                    date: Utils.formatLocalDate(h.date),
                    displayDate: Utils.formatDateForDisplay(h.date),
                    dayOfWeek: dayOfWeek,
                    daysAway: daysAway,
                    countdown: daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`,
                    bridgeTip: bridgeTip
                };
            });

        return Utils.createSuccessResponse(futureHolidays);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get upcoming holidays: ' + error.message);
    }
}

// ── HR dashboard: all staff balances + all applications ──────────────────
function apiGetHRDashboard() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);

        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Insufficient permissions — HR or Admin required');
        }

        const staffData = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false);
        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        const allApps = appsFile.data || [];

        // Build enriched staff list with balances
        const staffWithBalances = staffData.map(s => {
            const balance = DashboardManager.calculateUserBalance(s.Email) || {};
            return {
                email: s.Email,
                name: s.Name,
                role: s.Role,
                department: s.Department,
                eligibleForLeave: s.EligibleForLeave,
                balance,
                compensationBalance: s.CompensationLeave?.balance || 0
            };
        });

        const pendingApps = allApps.filter(a => a.Status === SYSTEM.STATUS.PENDING);
        const approvedApps = allApps.filter(a => a.Status === SYSTEM.STATUS.APPROVED);
        const declinedApps = allApps.filter(a => a.Status === SYSTEM.STATUS.DECLINED);
        const cancelledApps = allApps.filter(a => a.Status === SYSTEM.STATUS.CANCELLED);
        const hrEndorsements = pendingApps.filter(a => a.ApprovalStage === 'pending_hr');

        // Calculate leave liability across active eligible staff
        let totalAnnualDays = 0;
        let totalBroughtForwardDays = 0;
        let totalCompensationDays = 0;

        staffWithBalances.forEach(s => {
            if (s.eligibleForLeave && s.balance) {
                totalAnnualDays += (s.balance.annual?.available || 0);
                totalBroughtForwardDays += (s.balance.broughtForward?.available || 0);
                totalCompensationDays += (s.compensationBalance || 0);
            }
        });

        const totalUnconsumedDays = Number((totalAnnualDays + totalBroughtForwardDays + totalCompensationDays).toFixed(2));

        const liability = {
            totalUnconsumedDays,
            totalAnnualDays: Number(totalAnnualDays.toFixed(2)),
            totalBroughtForwardDays: Number(totalBroughtForwardDays.toFixed(2)),
            totalCompensationDays: Number(totalCompensationDays.toFixed(2))
        };

        return Utils.createSuccessResponse({
            staff: staffWithBalances,
            applications: {
                all: allApps,
                pending: pendingApps,
                approved: approvedApps,
                declined: declinedApps,
                cancelled: cancelledApps,
                pendingCount: pendingApps.length,
                cancelledCount: cancelledApps.length,
                hrEndorsements: hrEndorsements,
                hrEndorsementCount: hrEndorsements.length
            },
            summary: {
                totalStaff: staffData.length,
                eligibleStaff: staffData.filter(s => s.EligibleForLeave).length,
                totalApplications: allApps.length,
                pendingApplications: pendingApps.length,
                approvedApplications: approvedApps.length,
                declinedApplications: declinedApps.length,
                cancelledApplications: cancelledApps.length,
                pendingHREndorsements: hrEndorsements.length
            },
            liability
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to load HR dashboard: ' + error.message);
    }
}

function apiProcessYearEnd() {
    return AdminManager.processYearEnd();
}

function apiGetSystemInfo() {
    return Utils.createSuccessResponse({
        name: SYSTEM.NAME,
        version: SYSTEM.VERSION,
        organization: SYSTEM.ORGANIZATION,
        policy: {
            annualAllocation: SYSTEM.LEAVE_POLICY.ANNUAL_ALLOCATION,
            sickLeave: SYSTEM.LEAVE_POLICY.SICK_LEAVE,
            maxCarryForward: SYSTEM.LEAVE_POLICY.MAX_CARRY_FORWARD,
            workingHoursPerDay: SYSTEM.LEAVE_POLICY.WORKING_HOURS_PER_DAY,
            monthlyAccrualRate: SYSTEM.LEAVE_POLICY.MONTHLY_ACCRUAL_RATE
        }
    });
}

function apiProcessMonthlyAccrual() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Only administrators can process monthly accrual');
        }
        const result = AccrualManager.processMonthlyAccrual();
        return Utils.createSuccessResponse(result, `Monthly accrual processed for ${result.processedCount} staff`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to process monthly accrual: ' + error.message);
    }
}

function apiGetAccrualDetails(email = null) {
    try {
        const userEmail = email || Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(userEmail);
        if (!user) return Utils.createErrorResponse('User not found');

        const accrual = user.LeaveAccrual || {};
        const today = new Date();
        const nextAccrualDate = new Date(accrual.nextAccrualDate || today);
        const daysUntilNextAccrual = Math.ceil((nextAccrualDate - today) / (1000 * 60 * 60 * 24));

        return Utils.createSuccessResponse({
            eligible: user.EligibleForLeave || false,
            monthlyRate: accrual.monthlyRate || 1.75,
            accruedYearToDate: accrual.accruedYearToDate || 0,
            usedYearToDate: accrual.usedYearToDate || 0,
            availableBalance: accrual.availableBalance || 0,
            annualDeficit: accrual.annualDeficit || { amount: 0 },
            nextAccrualDate: accrual.nextAccrualDate,
            daysUntilNextAccrual: daysUntilNextAccrual
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to get accrual details: ' + error.message);
    }
}

function apiGetPerformanceStats() {
    try {
        if (!Utils.checkPermission(SYSTEM.ROLES.ADMIN)) {
            return Utils.createErrorResponse('Only administrators can view performance stats');
        }
        const stats = EnhancedCacheManager.getPerformanceStats();
        return Utils.createSuccessResponse(stats);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get performance stats: ' + error.message);
    }
}

function apiClearAllCaches() {
    try {
        if (!Utils.checkPermission(SYSTEM.ROLES.ADMIN)) {
            return Utils.createErrorResponse('Only administrators can clear caches');
        }
        EnhancedCacheManager.clearAll();
        EnhancedCacheManager.buildIndexes();
        return Utils.createSuccessResponse({ cleared: true }, 'All caches cleared successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to clear caches: ' + error.message);
    }
}

function apiRebuildIndexes() {
    try {
        if (!Utils.checkPermission(SYSTEM.ROLES.ADMIN)) {
            return Utils.createErrorResponse('Only administrators can rebuild indexes');
        }
        const startTime = Date.now();
        EnhancedCacheManager.buildIndexes();
        const duration = Date.now() - startTime;
        return Utils.createSuccessResponse({ rebuilt: true, duration: duration }, `Indexes rebuilt in ${duration}ms`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to rebuild indexes: ' + error.message);
    }
}

function apiTestConnection() {
    return Utils.createSuccessResponse({
        user: Session.getActiveUser().getEmail(),
        system: SYSTEM.NAME,
        version: SYSTEM.VERSION,
        status: 'Connected',
        cacheStatus: 'Active'
    });
}

function initializeSystem() {
    return SystemManager.initializeSystem();
}

function resetSystem() {
    return SystemManager.resetSystem();
}

function processMonthlyAccrualAutomatically() {
    console.log('⏰ Automatic monthly accrual processing started...');
    const result = AccrualManager.processMonthlyAccrual();
    console.log('✅ Automatic monthly accrual completed:', result);
    return result;
}

// =============================================
// WEB APP ENTRY POINT
// =============================================

function doGet(e) {
    try {
        // 1. Initialise cache
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const currentUser = Session.getActiveUser().getEmail();

        // 2. Handle initial setup redirect parameter cleanly
        if (e && e.parameter && e.parameter.setup === 'true') {
            const allStaff = StaffManager.getAllStaffData();
            if (!allStaff || allStaff.length === 0) {
                SetupManager.createFirstAdminUser();
            }
            const html = HtmlService.createHtmlOutput(
                '<script>window.location.href="' + ScriptApp.getService().getUrl() + '";</script>'
            );
            return html.setTitle('Redirecting...');
        }

        // 3. Check if current user is registered
        const user = StaffManager.getUserData(currentUser);
        if (!user) {
            const allStaff = StaffManager.getAllStaffData();
            if (!allStaff || allStaff.length === 0) {
                // First ever initialization: create system admin
                const result = SetupManager.createFirstAdminUser();
                if (result.success && currentUser.toLowerCase() === SYSTEM.ADMIN_EMAIL.toLowerCase()) {
                    const html = HtmlService.createHtmlOutput(
                        '<script>window.location.href="' + ScriptApp.getService().getUrl() + '";</script>'
                    );
                    return html.setTitle('Redirecting...');
                }
            }

            // User is not enrolled in the system: render a clear, helpful access page without infinite redirect
            const html = HtmlService.createHtmlOutput(
                `<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Access Required - ${SYSTEM.NAME}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f9fafb; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; color: #1f2937; padding: 24px; box-sizing: border-box; }
                        .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); text-align: center; border: 1px solid #e5e7eb; }
                        .icon-circle { width: 64px; height: 64px; background: #ecfdf5; color: #059669; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
                        h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #111827; }
                        p { font-size: 14px; line-height: 1.6; color: #6b7280; margin: 0 0 20px; }
                        .user-badge { background: #f3f4f6; padding: 8px 14px; border-radius: 8px; font-family: ui-monospace, monospace; font-size: 13px; color: #374151; display: inline-block; margin-bottom: 24px; word-break: break-all; }
                        .info-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; text-align: left; font-size: 13px; color: #854d0e; margin-bottom: 24px; }
                        .footer { font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="icon-circle">🌿</div>
                        <h1>Staff Profile Required</h1>
                        <div class="user-badge">${currentUser || 'Signed in user'}</div>
                        <p>Welcome to <strong>${SYSTEM.NAME}</strong>. Your Google account has not yet been registered in the staff directory.</p>
                        <div class="info-box">
                            <strong>Next Steps:</strong> Please notify Human Resources or your System Administrator to create your staff profile. Once added, refresh this page to access your dashboard.
                        </div>
                        <div class="footer">${SYSTEM.ORGANIZATION} &bull; Version ${SYSTEM.VERSION}</div>
                    </div>
                </body>
                </html>`
            );
            return html.setTitle('Access Required - ' + SYSTEM.NAME)
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        }

        try {
            // Direct HTML output avoids unnecessary server-side template compilation and prevents token mangling
            const html = HtmlService.createHtmlOutputFromFile('Index');
            return html
                .setTitle(SYSTEM.NAME)
                .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
        } catch (outputErr) {
            console.warn('createHtmlOutputFromFile fallback to template evaluate:', outputErr);
            try {
                const html = HtmlService.createTemplateFromFile('Index').evaluate();
                return html
                    .setTitle(SYSTEM.NAME)
                    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
            } catch (error) {
                console.error('Error loading Index.html:', error);
                const html = HtmlService.createHtmlOutput(
                    '<h1>System Ready</h1><p>Please refresh the page.</p>'
                );
                return html.setTitle(SYSTEM.NAME);
            }
        }

    } catch (error) {
        console.error('Fatal error in doGet:', error);
        const html = HtmlService.createHtmlOutput(
            '<h1>System Error</h1><p>' + error.message + '</p>'
        );
        return html.setTitle('Error - ' + SYSTEM.NAME);
    }
}

// =============================================
// TRIGGER SETUP — run once from Script Editor
// =============================================

// Call this function ONCE from the GAS Script Editor to install the automatic triggers.
function setupAutomaticAccrual() {
    try {
        // Remove all existing managed triggers to avoid duplicates
        const managedHandlers = [
            'scheduledDailyHeartbeat',
            'scheduledMonthlyAccrual',
            'scheduledYearEnd',
            'scheduledEasterWarning',
            'scheduledEasterExpiry'
        ];

        ScriptApp.getProjectTriggers().forEach(trigger => {
            if (managedHandlers.includes(trigger.getHandlerFunction())) {
                ScriptApp.deleteTrigger(trigger);
            }
        });

        // ── 0. Daily Maintenance Heartbeat — daily at 06:00 ─────────────────
        // Computes dynamic movable Easter warnings, Easter auto-forfeiture,
        // missed accrual auto-heal, and stale application digests.
        ScriptApp.newTrigger('scheduledDailyHeartbeat')
            .timeBased()
            .everyDays(1)
            .atHour(6)
            .create();

        // ── 1. Monthly accrual — 1st of each month at 01:00 ─────────────────
        ScriptApp.newTrigger('scheduledMonthlyAccrual')
            .timeBased()
            .onMonthDay(1)
            .atHour(1)
            .create();

        // ── 2. Year-end reset — monthly on the 1st at 00:30 (guarded to Jan 1st) ──
        ScriptApp.newTrigger('scheduledYearEnd')
            .timeBased()
            .onMonthDay(1)
            .atHour(0)
            .nearMinute(30)
            .create();

        // ── 3. Easter BF warning — monthly on the 15th at 08:00 (guarded to Easter 14-day notice) ──
        ScriptApp.newTrigger('scheduledEasterWarning')
            .timeBased()
            .onMonthDay(15)
            .atHour(8)
            .create();

        // ── 4. Easter BF expiry — monthly on the 5th at 07:00 (guarded to on/after Easter) ──
        ScriptApp.newTrigger('scheduledEasterExpiry')
            .timeBased()
            .onMonthDay(5)
            .atHour(7)
            .create();

        console.log('✅ All 5 automatic triggers registered');
        return (
            'Triggers registered:\n' +
            '  • Daily Heartbeat: Daily at 06:00 (Easter, Accrual Heal, Stale App Reminders)\n' +
            '  • Monthly accrual: 1st of each month at 01:00\n' +
            '  • Year-end reset:  Monthly 1st at 00:30 (executes on Jan 1st)\n' +
            '  • BF warning:      Monthly 15th at 08:00 (executes 14 days before Easter)\n' +
            '  • BF expiry:       Monthly 5th at 07:00  (executes on/after Easter)'
        );

    } catch (error) {
        console.error('❌ Failed to setup triggers:', error);
        throw new Error('Failed to setup triggers: ' + error.message);
    }
}

// ── Fires daily at 06:00 — automated maintenance heartbeat ─────────────────
function scheduledDailyHeartbeat() {
    console.log('⏰ Scheduled daily maintenance heartbeat started...');
    try {
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();
        const results = MaintenanceManager.runDailyHeartbeat();
        console.log('✅ Daily heartbeat completed successfully:', JSON.stringify(results));
        return results;
    } catch (error) {
        console.error('❌ Scheduled daily heartbeat failed:', error);
        return { error: error.message };
    }
}

// API endpoint to trigger heartbeat manually (Admin or HR)
function apiTriggerDailyHeartbeat() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Insufficient permissions — Admin or HR required');
        }
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();
        const results = MaintenanceManager.runDailyHeartbeat();
        return Utils.createSuccessResponse(results, 'Daily heartbeat executed successfully');
    } catch (error) {
        return Utils.createErrorResponse('Heartbeat execution failed: ' + error.message);
    }
}
// ── Fires monthly on the 1st at 00:30 — runs year-end reset once on Jan 1st ─
function scheduledYearEnd() {
    console.log('⏰ Scheduled year-end processing check started...');
    try {
        const today = new Date();
        // Guard: Only execute in January (month 0 in JS Date) on the 1st
        if (today.getMonth() !== 0 || today.getDate() !== 1) {
            console.log(`Today is ${today.toDateString()} (Month: ${today.getMonth() + 1}). Year-end reset only runs on Jan 1st. Skipping.`);
            return { skipped: true, reason: 'Not January 1st' };
        }

        // Re-initialise cache before any data operations
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const result = AdminManager.processYearEnd(true);
        console.log('✅ Scheduled year-end completed:', result.message || result.error);
        return result;
    } catch (error) {
        console.error('❌ scheduledYearEnd failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Fires monthly on the 15th — sends 2-week BF expiry warning if Easter is 14 days away ──
function scheduledEasterWarning() {
    console.log('⏰ Easter BF warning check started...');
    try {
        const today = new Date();
        // Guard: Easter warnings only evaluate in March or April (months 2 and 3)
        if (today.getMonth() !== 2 && today.getMonth() !== 3) {
            console.log(`Today is ${today.toDateString()}. Easter warnings only evaluate in March/April. Skipping.`);
            return { skipped: true, reason: 'Outside Easter season' };
        }

        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const easterDate = Utils.calculateEasterDate(today.getFullYear());

        // Calculate days until Easter
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntil = Math.round((easterDate - today) / msPerDay);

        // Only act when we are within the 14-day warning window
        if (daysUntil < 0 || daysUntil > 14) {
            console.log(`Easter is ${daysUntil} days away — outside warning window. No emails sent.`);
            return { skipped: true, daysUntilEaster: daysUntil };
        }

        const staffData = StaffManager.getAllStaffData();
        let warnedCount = 0;

        staffData.forEach(staff => {
            if (staff.Metadata?.active === false) return;
            if (!staff.EligibleForLeave) return;
            if (!staff.LeaveBroughtForward) return;

            const bfDays = staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0;
            if (bfDays <= 0) return;

            // Check the BF leave belongs to this warning window
            const bfExpiry = Utils.getEasterExpiryDate(staff.LeaveBroughtForward);
            bfExpiry.setHours(0, 0, 0, 0);
            const daysUntil = Math.round((bfExpiry - today) / msPerDay);
            if (daysUntil > 14 || daysUntil <= 0) return;

            NotificationManager.notifyBFWarning(staff, bfExpiry);
            warnedCount++;
        });

        console.log(`✅ BF warning sent to ${warnedCount} staff member(s).`);
        return { success: true, warnedCount, daysUntilEaster: daysUntil };

    } catch (error) {
        console.error('❌ scheduledEasterWarning failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Fires monthly on the 5th — expires BF days if today is Easter Sunday or later ───────
function scheduledEasterExpiry() {
    console.log('⏰ Easter BF expiry check started...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Guard: Easter expiry only evaluates in March or April (months 2 and 3)
        if (today.getMonth() !== 2 && today.getMonth() !== 3) {
            console.log(`Today is ${today.toDateString()}. Easter expiry only evaluates in March/April. Skipping.`);
            return { skipped: true, reason: 'Outside Easter season' };
        }

        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const easterDate = Utils.calculateEasterDate(today.getFullYear());
        easterDate.setHours(0, 0, 0, 0);

        // Only act on Easter Sunday or later
        if (today < easterDate) {
            console.log(`Today (${today.toDateString()}) is before Easter (${easterDate.toDateString()}). Skipping.`);
            return { skipped: true, reason: 'Easter has not yet passed' };
        }

        // Guard — only expire once per Easter year
        const guardKey = `easterExpiryDone_${today.getFullYear()}`;
        const alreadyRan = PropertiesService.getScriptProperties().getProperty(guardKey);
        if (alreadyRan) {
            console.log(`Easter expiry already processed for ${today.getFullYear()} on ${alreadyRan}.`);
            return { skipped: true, reason: 'Already processed for this year' };
        }

        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        let expiredCount = 0;
        let totalForfeited = 0;
        const forfeitLog = [];

        staffFile.data.forEach(member => {
            if (member.Metadata?.active === false) return;
            if (!member.EligibleForLeave) return;
            if (!member.LeaveBroughtForward) return;

            const bfDays = member.LeaveBroughtForward.daysCarriedFromPreviousYear || 0;
            if (bfDays <= 0) return;

            // Check if today is on or after the Easter expiry date of this brought forward leave
            const bfExpiry = Utils.getEasterExpiryDate(member.LeaveBroughtForward);
            bfExpiry.setHours(0, 0, 0, 0);
            if (today < bfExpiry) return;

            // Expire it
            forfeitLog.push({ email: member.Email, name: member.Name, forfeitedDays: bfDays });
            totalForfeited += bfDays;

            member.LeaveBroughtForward.daysCarriedFromPreviousYear = 0;
            member.LeaveBroughtForward.isExpired = true;
            member.LeaveBroughtForward.isForfeited = true;
            member.LeaveBroughtForward.forfeitedDays = bfDays;
            member.LeaveBroughtForward.forfeitedDate = today.toISOString().split('T')[0];
            member.LeaveBroughtForward.note = `${bfDays} days carried forward from ${member.LeaveBroughtForward.yearEarned || 'previous year'} forfeited at Easter (${bfExpiry.toISOString().split('T')[0]})`;

            // Recalculate available balance — remove the now-expired BF days
            const accrued = member.LeaveAccrual.accruedYearToDate || 0;
            const used = member.LeaveAccrual.usedYearToDate || 0;
            const deficit = member.LeaveAccrual.annualDeficit?.amount || 0;
            member.LeaveAccrual.availableBalance = Math.max(0, accrued - used + deficit);

            // Notify individual + HR
            NotificationManager.notifyBFExpired(member, bfDays, bfExpiry);
            expiredCount++;
        });

        if (expiredCount > 0) {
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearAll();
            EnhancedCacheManager.buildIndexes();
        }

        // Stamp guard
        PropertiesService.getScriptProperties().setProperty(guardKey, today.toISOString());

        Utils.logAction('EASTER_BF_EXPIRY', {
            easterDate: easterDate.toISOString().split('T')[0],
            expiredCount,
            totalForfeited,
            forfeitLog
        }, 'system');

        console.log(`✅ Easter expiry complete. ${expiredCount} staff, ${totalForfeited} days forfeited.`);
        return { success: true, expiredCount, totalForfeited, forfeitLog };

    } catch (error) {
        console.error('❌ scheduledEasterExpiry failed:', error);
        return { success: false, error: error.message };
    }
}

// This function is called by the GAS time-based trigger on the 1st of each month.
// It must be a top-level function so GAS can find it as a trigger target.
function scheduledMonthlyAccrual() {
    console.log('⏰ Scheduled monthly accrual started...');
    const result = AccrualManager.processMonthlyAccrual();
    console.log('✅ Scheduled accrual completed:', result);

    try {
        const logFile = DataManager.readDataFile('accrual_schedule_log.json');
        logFile.data.push({
            timestamp: new Date().toISOString(),
            result: result
        });
        DataManager.writeDataFile('accrual_schedule_log.json', logFile);
    } catch (logError) {
        console.error('Failed to write accrual schedule log:', logError);
    }

    return result;
}


function fixAccrualForAllStaff() {
    try {
        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Helper to format date as YYYY-MM-DD in local time
        function formatLocalDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // CORRECT DATES
        const firstOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const firstOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

        const expectedLastAccrual = formatLocalDate(firstOfCurrentMonth);
        const expectedNextAccrual = formatLocalDate(firstOfNextMonth);

        console.log(`✅ CORRECT lastAccrualDate should be: ${expectedLastAccrual}`);
        console.log(`✅ CORRECT nextAccrualDate should be: ${expectedNextAccrual}`);

        let dateFixCount = 0;

        staffFile.data.forEach(staff => {
            if (!staff.EligibleForLeave || !staff.LeaveAccrual) return;

            let dateChanged = false;

            if (staff.LeaveAccrual.lastAccrualDate !== expectedLastAccrual) {
                console.log(`${staff.Email}: Fixing lastAccrualDate from "${staff.LeaveAccrual.lastAccrualDate}" to "${expectedLastAccrual}"`);
                staff.LeaveAccrual.lastAccrualDate = expectedLastAccrual;
                dateChanged = true;
            }

            if (staff.LeaveAccrual.nextAccrualDate !== expectedNextAccrual) {
                console.log(`${staff.Email}: Fixing nextAccrualDate from "${staff.LeaveAccrual.nextAccrualDate}" to "${expectedNextAccrual}"`);
                staff.LeaveAccrual.nextAccrualDate = expectedNextAccrual;
                dateChanged = true;
            }

            if (dateChanged) dateFixCount++;
        });

        if (dateFixCount > 0) {
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            console.log(`✅ Fixed accrual dates for ${dateFixCount} staff`);
        } else {
            console.log('✅ All accrual dates are correct');
        }

        return {
            success: true,
            dateFixCount: dateFixCount,
            correctDates: {
                lastAccrualDate: expectedLastAccrual,
                nextAccrualDate: expectedNextAccrual
            }
        };

    } catch (error) {
        console.error('Error fixing accrual:', error);
        return { success: false, error: error.message };
    }
}
function fixAccruedDaysForAllStaff() {
    try {
        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth(); // 0-11 (0 = January)

        let updatedCount = 0;
        const results = [];

        staffFile.data.forEach((staff, index) => {
            if (!staff.EligibleForLeave || !staff.LeaveAccrual) return;

            const joinDate = new Date(staff.JoinDate);
            const joinYear = joinDate.getFullYear();
            const joinMonth = joinDate.getMonth();

            // Calculate correct accrued days for current year
            let correctAccrued = 0;

            if (joinYear === currentYear) {
                // Joined this year - months from join month to current month (inclusive)
                for (let month = joinMonth; month <= currentMonth; month++) {
                    correctAccrued += 1.75;
                }
            } else {
                // Joined in previous year - all months in current year up to (but not including) current month
                for (let month = 0; month < currentMonth; month++) {
                    correctAccrued += 1.75;
                }
            }

            const currentAccrued = staff.LeaveAccrual.accruedYearToDate || 0;

            // Only update if different (allow small rounding difference)
            if (Math.abs(currentAccrued - correctAccrued) > 0.01) {
                staff.LeaveAccrual.accruedYearToDate = correctAccrued;

                // Recalculate available balance. BF is a separate pool — add it explicitly
                // since calculateAvailableBalance only covers the annual pool.
                const used = staff.LeaveAccrual.usedYearToDate || 0;
                const bfEaster = Utils.getEasterExpiryDate(staff.LeaveBroughtForward);
                const isBfExpired = Boolean(staff.LeaveBroughtForward?.isExpired) || (new Date() > bfEaster);
                const broughtForward = (!isBfExpired && staff.LeaveBroughtForward) ? (staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0) : 0;

                staff.LeaveAccrual.availableBalance = Math.max(0,
                    correctAccrued - used + deficit + broughtForward
                );

                // Update total accrued since join (optional)
                staff.LeaveAccrual.totalAccruedSinceJoin = correctAccrued;

                updatedCount++;
                results.push({
                    email: staff.Email,
                    name: staff.Name,
                    oldValue: currentAccrued,
                    newValue: correctAccrued
                });
            }
        });

        if (updatedCount > 0) {
            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearAll();
            EnhancedCacheManager.buildIndexes();
        }

        return Utils.createSuccessResponse({
            updatedCount: updatedCount,
            details: results
        }, `Fixed accrued days for ${updatedCount} staff members`);

    } catch (error) {
        console.error('Error fixing accrued days:', error);
        return Utils.createErrorResponse('Failed to fix accrued days: ' + error.message);
    }
}
function fixStaffLeaveData(email) {
    try {
        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const staffIndex = staffFile.data.findIndex(s =>
            s.Email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (staffIndex === -1) {
            return Utils.createErrorResponse('Staff not found');
        }

        const staff = staffFile.data[staffIndex];
        const currentYear = Utils.getCurrentYear().toString();
        const changes = [];

        // 1. Ensure LeaveHistory exists for current year
        if (!staff.LeaveHistory) {
            staff.LeaveHistory = {};
        }
        if (!staff.LeaveHistory[currentYear]) {
            staff.LeaveHistory[currentYear] = {
                annualUsed: 0,
                sickUsed: 0,
                broughtForwardUsed: 0,
                totalUsed: 0
            };
        }

        const history = staff.LeaveHistory[currentYear];

        // 2. Calculate annual used from history (LeaveAccrual is strictly for Annual leave)
        const annualUsedFromHistory = history.annualUsed || 0;

        // 3. Update usedYearToDate in LeaveAccrual
        if (Math.abs((staff.LeaveAccrual.usedYearToDate || 0) - annualUsedFromHistory) > 0.01) {
            changes.push({
                field: 'LeaveAccrual.usedYearToDate',
                old: staff.LeaveAccrual.usedYearToDate,
                new: annualUsedFromHistory
            });
            staff.LeaveAccrual.usedYearToDate = annualUsedFromHistory;
        }

        // 3b. Update SickLeave.used from history if out of sync
        if (staff.SickLeave) {
            const sickUsedFromHistory = history.sickUsed || 0;
            if (Math.abs((staff.SickLeave.used || 0) - sickUsedFromHistory) > 0.01) {
                changes.push({
                    field: 'SickLeave.used',
                    old: staff.SickLeave.used,
                    new: sickUsedFromHistory
                });
                staff.SickLeave.used = sickUsedFromHistory;
            }
        }

        // 4. Update brought forward balance based on usage
        if (staff.LeaveBroughtForward && history.broughtForwardUsed > 0) {
            const originalBroughtForward = staff.LeaveBroughtForward.daysCarriedFromPreviousYear;
            const remainingBroughtForward = Math.max(0, originalBroughtForward - history.broughtForwardUsed);

            if (staff.LeaveBroughtForward.daysCarriedFromPreviousYear !== remainingBroughtForward) {
                changes.push({
                    field: 'LeaveBroughtForward.daysCarriedFromPreviousYear',
                    old: staff.LeaveBroughtForward.daysCarriedFromPreviousYear,
                    new: remainingBroughtForward
                });
                staff.LeaveBroughtForward.daysCarriedFromPreviousYear = remainingBroughtForward;

                // Update note
                staff.LeaveBroughtForward.note = `${remainingBroughtForward} days remaining, ${history.broughtForwardUsed} used`;
            }
        }

        // 5. Recalculate available balance correctly
        const accrued = staff.LeaveAccrual.accruedYearToDate || 0;
        const annualUsed = staff.LeaveAccrual.usedYearToDate || 0;
        const deficit = staff.LeaveAccrual.annualDeficit?.amount || 0;
        const annualAvailable = Math.max(0, accrued - annualUsed + deficit);
        const bfEaster = Utils.getEasterExpiryDate(staff.LeaveBroughtForward);
        const isBfExpired = Boolean(staff.LeaveBroughtForward?.isExpired) || (new Date() > bfEaster);
        const broughtForward = (!isBfExpired && staff.LeaveBroughtForward) ? (staff.LeaveBroughtForward.daysCarriedFromPreviousYear || 0) : 0;
        const correctAvailable = annualAvailable + broughtForward;

        if (Math.abs((staff.LeaveAccrual.availableBalance || 0) - correctAvailable) > 0.01) {
            changes.push({
                field: 'LeaveAccrual.availableBalance',
                old: staff.LeaveAccrual.availableBalance,
                new: correctAvailable
            });
            staff.LeaveAccrual.availableBalance = correctAvailable;
        }

        // 6. Fix totalAccruedSinceJoin if needed
        const joinDate = new Date(staff.JoinDate);
        const joinYear = joinDate.getFullYear();
        const joinMonth = joinDate.getMonth();
        const currentYear_num = Utils.getCurrentYear();
        const currentMonth = new Date().getMonth();

        let lifetimeAccrued = 0;

        // Calculate months from join date to present
        for (let year = joinYear; year <= currentYear_num; year++) {
            const startMonth = (year === joinYear) ? joinMonth : 0;
            const endMonth = (year === currentYear_num) ? currentMonth : 11;

            for (let month = startMonth; month <= endMonth; month++) {
                lifetimeAccrued += 1.75;
            }
        }

        if (Math.abs((staff.LeaveAccrual.totalAccruedSinceJoin || 0) - lifetimeAccrued) > 0.01) {
            changes.push({
                field: 'LeaveAccrual.totalAccruedSinceJoin',
                old: staff.LeaveAccrual.totalAccruedSinceJoin,
                new: lifetimeAccrued
            });
            staff.LeaveAccrual.totalAccruedSinceJoin = lifetimeAccrued;
        }

        // 7. Save if changes were made
        if (changes.length > 0) {
            staff.Metadata.lastUpdated = new Date().toISOString();
            staff.Metadata.updatedBy = Session.getActiveUser().getEmail();
            staff.Metadata.fixApplied = {
                timestamp: new Date().toISOString(),
                changes: changes
            };

            DataManager.writeDataFile(SYSTEM.DATA_FILES.STAFF, staffFile);
            EnhancedCacheManager.clearBalance(email);
        }

        return Utils.createSuccessResponse({
            email: email,
            name: staff.Name,
            changes: changes,
            correctedData: {
                usedYearToDate: staff.LeaveAccrual.usedYearToDate,
                broughtForwardRemaining: staff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0,
                availableBalance: staff.LeaveAccrual.availableBalance,
                totalAccruedSinceJoin: staff.LeaveAccrual.totalAccruedSinceJoin
            }
        }, changes.length > 0 ? `Fixed ${changes.length} issues` : 'No fixes needed');

    } catch (error) {
        console.error('Error fixing staff data:', error);
        return Utils.createErrorResponse('Failed to fix staff data: ' + error.message);
    }
}

// API endpoint
function apiFixStaffLeaveData(email) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);

        if (userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Only administrators can fix staff data');
        }

        // Handle if called with object
        if (typeof email === 'object' && email !== null) {
            const params = email;
            email = params.email;
        }

        return fixStaffLeaveData(email);

    } catch (error) {
        return Utils.createErrorResponse('Failed to fix staff data: ' + error.message);
    }
}

// Fix all staff
function apiFixAllStaffLeaveData() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);

        if (userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Only administrators can fix staff data');
        }

        const staffFile = DataManager.readDataFile(SYSTEM.DATA_FILES.STAFF);
        const results = [];

        staffFile.data.forEach(staff => {
            if (staff.Email) {
                const result = fixStaffLeaveData(staff.Email);
                if (result.success && result.data.changes.length > 0) {
                    results.push({
                        email: staff.Email,
                        changes: result.data.changes
                    });
                }
            }
        });

        return Utils.createSuccessResponse({
            fixedCount: results.length,
            details: results
        }, `Fixed data for ${results.length} staff members`);

    } catch (error) {
        return Utils.createErrorResponse('Failed to fix all staff: ' + error.message);
    }
}

// =============================================
// ENHANCEMENT API ENDPOINTS
// =============================================

// 1. Team Leave Clash & Coverage Checker
function apiCheckTeamLeaveClashes(startDate, endDate, email) {
    try {
        let sDate = startDate;
        let eDate = endDate;
        let applicantEmail = email;

        if (typeof startDate === 'object' && startDate !== null) {
            sDate = startDate.startDate;
            eDate = startDate.endDate;
            applicantEmail = startDate.email;
        }

        if (!applicantEmail) {
            applicantEmail = Session.getActiveUser().getEmail();
        }

        const clashes = ApplicationsManager.checkTeamLeaveClashes(applicantEmail, sDate, eDate);
        return Utils.createSuccessResponse(clashes, `Found ${clashes.length} colleague leave clash(es)`);
    } catch (error) {
        return Utils.createErrorResponse('Error checking team clashes: ' + error.message);
    }
}

// 2. Acting Supervisor Delegation
function apiSetActingSupervisor(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        
        let supervisorEmail = currentUser;
        if (params && params.supervisorEmail && (userRole === SYSTEM.ROLES.ADMIN || userRole === SYSTEM.ROLES.HR)) {
            supervisorEmail = params.supervisorEmail;
        }

        const actingEmail = params?.actingEmail || null;
        const actingName = params?.actingName || '';
        const startDate = params?.startDate || null;
        const endDate = params?.endDate || null;
        const notes = params?.notes || '';

        return StaffManager.setActingSupervisor(supervisorEmail, actingEmail, actingName, startDate, endDate, notes);
    } catch (error) {
        return Utils.createErrorResponse('Failed to set acting supervisor: ' + error.message);
    }
}

function apiGetActingSupervisor() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(currentUser);
        const delegation = user?.ActingSupervisor || null;
        
        // Also find if current user is acting for any supervisors currently
        const allStaff = StaffManager.getAllStaffData();
        const todayStr = Utils.formatLocalDate(new Date());
        const actingFor = allStaff.filter(s => {
            const act = s.ActingSupervisor;
            if (!act || !act.actingEmail) return false;
            if (act.actingEmail.toLowerCase().trim() !== currentUser.toLowerCase().trim()) return false;
            if (act.startDate && act.startDate > todayStr) return false;
            if (act.endDate && act.endDate < todayStr) return false;
            return true;
        }).map(s => ({
            supervisorEmail: s.Email,
            supervisorName: s.Name,
            startDate: s.ActingSupervisor.startDate,
            endDate: s.ActingSupervisor.endDate,
            notes: s.ActingSupervisor.notes
        }));

        return Utils.createSuccessResponse({
            delegation,
            actingFor
        });
    } catch (error) {
        return Utils.createErrorResponse('Failed to get acting supervisor details: ' + error.message);
    }
}

// 3. Calendar Sync Trigger
function apiSyncCalendar(appId) {
    try {
        if (typeof appId === 'object' && appId !== null) {
            appId = appId.appId || appId.id;
        }
        const app = ApplicationsManager.getApplicationById(appId);
        if (!app) return Utils.createErrorResponse('Application not found');
        const eventId = CalendarSyncManager.syncLeaveToCalendar(app);
        if (eventId) {
            return Utils.createSuccessResponse({ eventId }, 'Calendar event created/synced successfully');
        } else {
            return Utils.createErrorResponse('Calendar sync returned no event ID');
        }
    } catch (error) {
        return Utils.createErrorResponse('Failed to sync calendar: ' + error.message);
    }
}

// 4. Data Export (CSV) for HR & Supervisors
function apiExportSystemData(dataType) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);

        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.SUPERVISOR) {
            return Utils.createErrorResponse('Insufficient permissions for data export');
        }

        if (typeof dataType === 'object' && dataType !== null) {
            dataType = dataType.dataType || dataType.type;
        }
        dataType = dataType || 'applications';

        function escapeCsv(val) {
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }

        let csvRows = [];
        let filename = `agri_leave_export_${dataType}_${Utils.formatLocalDate(new Date())}.csv`;

        if (dataType === 'applications') {
            const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const allApps = appsFile.data || [];
            csvRows.push([
                'Application ID', 'Applicant Name', 'Applicant Email', 'Department',
                'Supervisor Email', 'Leave Type', 'Start Date', 'End Date',
                'Working Days', 'Status', 'Date Applied', 'Decision Date',
                'Handover Colleague', 'Handover Email', 'Handover Notes', 'Reason'
            ].map(escapeCsv).join(','));

            allApps.forEach(a => {
                csvRows.push([
                    a.ID || '',
                    a.ApplicantName || a.Name || '',
                    a.ApplicantEmail || a.Email || '',
                    a.Department || '',
                    a.SupervisorEmail || '',
                    a.LeaveType || '',
                    a.StartDate || '',
                    a.EndDate || '',
                    a.Duration !== undefined ? a.Duration : (a.WorkingDays || a.Days || 0),
                    a.Status || '',
                    a.DateApplied || '',
                    a.ProcessedDate || a.DecisionDate || '',
                    a.HandoverColleagueName || a.HandoverName || '',
                    a.HandoverColleagueEmail || a.HandoverEmail || '',
                    a.HandoverNotes || '',
                    a.Reason || ''
                ].map(escapeCsv).join(','));
            });
        } else if (dataType === 'staff_balances' || dataType === 'balances') {
            const staffData = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false);
            csvRows.push([
                'Staff Name', 'Email', 'Role', 'Department', 'Eligible For Leave',
                'Join Date', 'Annual Rate', 'Annual Accrued YTD', 'Annual Used YTD',
                'Annual Available', 'Brought Forward Available', 'Brought Forward Forfeited',
                'Compensation Balance', 'Total Available Balance', 'Sick Used YTD'
            ].map(escapeCsv).join(','));

            staffData.forEach(s => {
                const bal = DashboardManager.calculateUserBalance(s.Email) || {};
                csvRows.push([
                    s.Name || '',
                    s.Email || '',
                    s.Role || '',
                    s.Department || '',
                    s.EligibleForLeave ? 'Yes' : 'No',
                    s.JoinDate || '',
                    s.LeaveAccrual?.monthlyRate || 1.75,
                    bal.annual?.accrued || 0,
                    bal.annual?.used || 0,
                    bal.annual?.available || 0,
                    bal.broughtForward?.available || 0,
                    bal.broughtForward?.forfeited || 0,
                    s.CompensationLeave?.balance || 0,
                    bal.total?.available || 0,
                    bal.sick?.used || 0
                ].map(escapeCsv).join(','));
            });
        } else if (dataType === 'liability' || dataType === 'leave_liability' || dataType === 'unconsumed_leave') {
            const staffData = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false && s.EligibleForLeave);
            csvRows.push([
                'Staff Name', 'Email', 'Role', 'Department', 'Annual Available',
                'Brought Forward Available', 'Compensation Balance', 'Total Unconsumed Days'
            ].map(escapeCsv).join(','));

            staffData.forEach(s => {
                const bal = DashboardManager.calculateUserBalance(s.Email) || {};
                const annual = bal.annual?.available || 0;
                const bf = bal.broughtForward?.available || 0;
                const comp = s.CompensationLeave?.balance || 0;
                const total = Number((annual + bf + comp).toFixed(2));

                csvRows.push([
                    s.Name || '',
                    s.Email || '',
                    s.Role || '',
                    s.Department || '',
                    annual,
                    bf,
                    comp,
                    total
                ].map(escapeCsv).join(','));
            });
        } else {
            return Utils.createErrorResponse('Unknown export data type: ' + dataType);
        }

        const csvContent = csvRows.join('\r\n');
        return Utils.createSuccessResponse({
            csvContent,
            filename,
            rowCount: csvRows.length - 1
        }, `Exported ${csvRows.length - 1} records successfully`);

    } catch (error) {
        return Utils.createErrorResponse('Failed to export data: ' + error.message);
    }
}

// 5. Team Availability Grid / Wallchart API
function apiGetTeamAvailability(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(currentUser);
        if (!user) return Utils.createErrorResponse('User not found');

        params = params || {};
        const now = new Date();
        const year = parseInt(params.year) || now.getFullYear();
        const month = parseInt(params.month) || (now.getMonth() + 1); // 1-12
        const departmentFilter = params.department || null;

        const daysInMonth = new Date(year, month, 0).getDate();
        const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

        const holidays = Utils.getHolidaysInRange(monthStartStr, monthEndStr);
        const holidayMap = {};
        holidays.forEach(h => {
            holidayMap[h.date] = h.name;
        });

        const allStaff = StaffManager.getAllStaffData().filter(s => s.Metadata?.active !== false);
        let targetStaff = [];

        const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
        const isHR = user.Role === SYSTEM.ROLES.HR;
        const isSupervisor = user.Role === SYSTEM.ROLES.SUPERVISOR;

        const userEmail = currentUser.toLowerCase().trim();
        const userName = (user.Name || '').toLowerCase().trim();

        // Staff directly reporting to this supervisor (matched by supervisor email or name)
        const isSupervisedByMe = s => {
            if (!s.Supervisor) return false;
            const sup = s.Supervisor.toLowerCase().trim();
            return sup === userEmail || (userName && sup === userName);
        };

        // Determine if request is in supervisor scope (Team Availability) or HR scope:
        // 1. Explicitly requested via params.scope === 'supervisor' or containerId === 'teamWallchartContainer'
        // 2. OR user is not an Admin/HR (regular supervisor or staff viewing their team)
        const isSupervisorScope = params.scope === 'supervisor' || params.containerId === 'teamWallchartContainer' || (!isAdmin && !isHR);

        if (isSupervisorScope) {
            // Team Availability for supervisor: ONLY show staff under him or her
            let myStaff = allStaff.filter(isSupervisedByMe);
            if (departmentFilter && departmentFilter !== 'All') {
                myStaff = myStaff.filter(s => s.Department && s.Department.toLowerCase() === departmentFilter.toLowerCase());
            }
            targetStaff = myStaff;
        } else {
            // For HR can have everybody
            targetStaff = departmentFilter && departmentFilter !== 'All'
                ? allStaff.filter(s => s.Department && s.Department.toLowerCase() === departmentFilter.toLowerCase())
                : allStaff;
        }

        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        const allApps = (appsFile.data || []).filter(a =>
            a.Status === SYSTEM.STATUS.APPROVED || a.Status === SYSTEM.STATUS.PENDING
        );

        const coverage = targetStaff.map(s => {
            const sEmail = s.Email.toLowerCase().trim();
            const staffApps = allApps.filter(a => a.Email && a.Email.toLowerCase().trim() === sEmail);
            const handoverApps = allApps.filter(a =>
                (a.HandoverEmail && a.HandoverEmail.toLowerCase().trim() === sEmail) ||
                (a.HandoverColleagueEmail && a.HandoverColleagueEmail.toLowerCase().trim() === sEmail)
            );

            const days = {};
            for (let d = 1; d <= daysInMonth; d++) {
                const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const curDate = Utils.parseLocalDate(dStr);
                const dayOfWeek = curDate.getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const holidayName = holidayMap[dStr] || null;

                let status = isWeekend ? 'weekend' : (holidayName ? 'holiday' : 'working');
                let details = holidayName ? { holiday: holidayName } : null;

                if (!isWeekend && !holidayName) {
                    for (const app of staffApps) {
                        const aStart = Utils.parseLocalDate(app.StartDate || app.HourlyDate);
                        const aEnd = Utils.parseLocalDate(app.EndDate || app.HourlyDate || app.StartDate);
                        if (aStart && aEnd && curDate >= aStart && curDate <= aEnd) {
                            status = app.Status === SYSTEM.STATUS.APPROVED ? 'leave_approved' : 'leave_pending';
                            details = {
                                appId: app.ID,
                                leaveType: app.LeaveType,
                                status: app.Status,
                                duration: app.Duration,
                                handover: app.HandoverName || app.HandoverColleagueName || null
                            };
                            break;
                        }
                    }

                    if (status === 'working') {
                        for (const hApp of handoverApps) {
                            if (hApp.Status === SYSTEM.STATUS.APPROVED) {
                                const hStart = Utils.parseLocalDate(hApp.StartDate || hApp.HourlyDate);
                                const hEnd = Utils.parseLocalDate(hApp.EndDate || hApp.HourlyDate || hApp.StartDate);
                                if (hStart && hEnd && curDate >= hStart && curDate <= hEnd) {
                                    status = 'handover';
                                    details = {
                                        appId: hApp.ID,
                                        coveringFor: hApp.Name,
                                        leaveType: hApp.LeaveType
                                    };
                                    break;
                                }
                            }
                        }
                    }
                }

                days[d] = {
                    date: dStr,
                    dayOfWeek,
                    status,
                    details
                };
            }

            return {
                email: s.Email,
                name: s.Name,
                role: s.Role,
                department: s.Department || 'General',
                days
            };
        });

        const matrix = coverage.map(c => ({
            staff: { name: c.name, email: c.email, department: c.department, role: c.role },
            days: Object.keys(c.days).map(k => ({
                day: parseInt(k),
                date: c.days[k].date,
                status: c.days[k].status === 'leave_approved' ? 'leave' : (c.days[k].status === 'leave_pending' ? 'pending' : c.days[k].status),
                detail: c.days[k].details ? (c.days[k].details.leaveType || c.days[k].details.holiday || c.days[k].details.coveringFor || '') : ''
            }))
        }));

        return Utils.createSuccessResponse({
            year,
            month,
            daysInMonth,
            holidays,
            coverage,
            matrix,
            scope: isSupervisorScope ? 'supervisor' : 'hr',
            totalStaff: targetStaff.length
        }, 'Team availability loaded successfully');

    } catch (error) {
        console.error('Error in apiGetTeamAvailability:', error);
        return Utils.createErrorResponse('Failed to load team availability: ' + error.message);
    }
}

// 6. Compensation (TOIL) Claim APIs
function apiSubmitCompensationClaim(claimData) {
    try {
        if (!claimData) return Utils.createErrorResponse('Claim data is required');
        return CompensationManager.submitClaim(claimData);
    } catch (error) {
        return Utils.createErrorResponse('Failed to submit compensation claim: ' + error.message);
    }
}

function apiGetCompensationClaims(filter) {
    try {
        const claims = CompensationManager.getClaims(filter || {});
        return Utils.createSuccessResponse(claims, `Retrieved ${claims.length} claim(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get compensation claims: ' + error.message);
    }
}

function apiProcessCompensationClaim(params) {
    try {
        if (!params || !params.claimId || !params.decision) {
            return Utils.createErrorResponse('claimId and decision are required');
        }
        return CompensationManager.processClaimDecision(params.claimId, params.decision, params.comment || '');
    } catch (error) {
        return Utils.createErrorResponse('Failed to process claim: ' + error.message);
    }
}

// 7. Direct Attachment Upload API
function apiUploadAttachment(params) {
    try {
        if (!params || !params.base64Data) {
            return Utils.createErrorResponse('base64Data is required');
        }
        return AttachmentManager.uploadAttachment(params);
    } catch (error) {
        return Utils.createErrorResponse('Upload failed: ' + error.message);
    }
}

// 8. Leave Date Amendment API
function apiAmendLeaveDates(params) {
    try {
        if (!params || !params.appId || !params.newStartDate || !params.newEndDate) {
            return Utils.createErrorResponse('appId, newStartDate, and newEndDate are required');
        }
        return ApplicationsManager.amendLeaveDates(
            params.appId,
            params.newStartDate,
            params.newEndDate,
            params.reason || ''
        );
    } catch (error) {
        return Utils.createErrorResponse('Failed to amend leave dates: ' + error.message);
    }
}

// 9. Blackout Periods & Staffing Rules APIs
function apiGetBlackoutPeriods() {
    try {
        const periods = BlackoutPeriodManager.getAll();
        return Utils.createSuccessResponse(periods, 'Blackout periods loaded');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get blackout periods: ' + error.message);
    }
}

function apiSaveBlackoutPeriod(params) {
    try {
        if (!params) return Utils.createErrorResponse('Period data is required');
        return BlackoutPeriodManager.savePeriod(params);
    } catch (error) {
        return Utils.createErrorResponse('Failed to save blackout period: ' + error.message);
    }
}

function apiDeleteBlackoutPeriod(id) {
    try {
        if (typeof id === 'object' && id !== null) id = id.id;
        if (!id) return Utils.createErrorResponse('id is required');
        return BlackoutPeriodManager.deletePeriod(id);
    } catch (error) {
        return Utils.createErrorResponse('Failed to delete blackout period: ' + error.message);
    }
}

// 10. Interactive Handover Coverage & Task APIs
function apiGetMyHandoverRequests() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const requests = HandoverManager.getPendingHandovers(currentUser);
        return Utils.createSuccessResponse(requests, `Retrieved ${requests.length} handover request(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get handover requests: ' + error.message);
    }
}

function apiRespondToHandover(params) {
    try {
        if (!params || !params.appId || !params.decision) {
            return Utils.createErrorResponse('appId and decision are required');
        }
        return HandoverManager.respondToHandover(params.appId, params.decision, params.notes || '');
    } catch (error) {
        return Utils.createErrorResponse('Failed to respond to handover: ' + error.message);
    }
}

function apiToggleHandoverTask(params) {
    try {
        if (!params || !params.appId || !params.taskId) {
            return Utils.createErrorResponse('appId and taskId are required');
        }
        return HandoverManager.toggleHandoverTask(params.appId, params.taskId, params.completed);
    } catch (error) {
        return Utils.createErrorResponse('Failed to toggle handover task: ' + error.message);
    }
}

// 11. Daily Absence Digest APIs
function apiGetTodayAbsenceDigest(params) {
    try {
        const dateInput = (typeof params === 'string') ? params : (params && params.date ? params.date : null);
        const digest = AbsenceDigestManager.getTodayAbsenceDigest(dateInput);
        return Utils.createSuccessResponse(digest, 'Absence digest retrieved');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get absence digest: ' + error.message);
    }
}

function apiSendDailyAbsenceDigest(params, optionalWebhookUrl) {
    try {
        let dateInput = null;
        let webhookUrl = null;
        if (typeof params === 'string') {
            dateInput = params;
            webhookUrl = optionalWebhookUrl || null;
        } else if (params && typeof params === 'object') {
            dateInput = params.date || null;
            webhookUrl = params.webhookUrl || optionalWebhookUrl || null;
        }
        const result = AbsenceDigestManager.sendDailyDigest(dateInput, webhookUrl);
        return result.success ? Utils.createSuccessResponse(result, 'Daily absence digest sent successfully') : Utils.createErrorResponse(result.error || 'Failed to dispatch digest');
    } catch (error) {
        return Utils.createErrorResponse('Failed to send absence digest: ' + error.message);
    }
}

// 12. Gazetted Public Holidays & Retroactive Recalibration APIs
function apiGetGazettedHolidays() {
    try {
        const holidays = HolidayManager.getAllCustomHolidays();
        return Utils.createSuccessResponse(holidays, `Retrieved ${holidays.length} gazetted holiday(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get gazetted holidays: ' + error.message);
    }
}

function apiAddGazettedHoliday(params) {
    try {
        if (!params || !params.name || !params.date) {
            return Utils.createErrorResponse('Holiday name and date are required');
        }
        return HolidayManager.addCustomHoliday(params);
    } catch (error) {
        return Utils.createErrorResponse('Failed to add gazetted holiday: ' + error.message);
    }
}

function apiDeleteGazettedHoliday(id) {
    try {
        if (typeof id === 'object' && id !== null) id = id.id || id.holidayId;
        if (!id) return Utils.createErrorResponse('Holiday id is required');
        return HolidayManager.deleteCustomHoliday(id);
    } catch (error) {
        return Utils.createErrorResponse('Failed to delete gazetted holiday: ' + error.message);
    }
}

function apiRecalibrateOverlappingLeaves(params) {
    try {
        const date = (params && typeof params === 'object') ? (params.date || params.holidayDate) : params;
        if (!date || date === 'ALL' || (params && params.all)) {
            return HolidayManager.recalibrateAllLeaves();
        }
        return HolidayManager.recalibrateLeavesForHoliday(date);
    } catch (error) {
        return Utils.createErrorResponse('Failed to recalibrate leaves: ' + error.message);
    }
}

function apiRecalibrateAllLeaves() {
    try {
        return HolidayManager.recalibrateAllLeaves();
    } catch (error) {
        return Utils.createErrorResponse('Failed to recalibrate all leaves: ' + error.message);
    }
}

// 13. Multi-tier Approval & HR Endorsement Queue APIs
function apiGetPendingHREndorsements() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view the endorsement queue.');
        }
        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        const apps = (appsFile.data || []).filter(a => a.Status === SYSTEM.STATUS.PENDING && a.ApprovalStage === 'pending_hr');
        return Utils.createSuccessResponse(apps, `Retrieved ${apps.length} pending HR endorsement(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get pending HR endorsements: ' + error.message);
    }
}

// 14. Gmail Vacation Responder APIs
function apiConfigureVacationResponder(params) {
    try {
        let appId = params;
        if (typeof params === 'object' && params !== null) appId = params.appId || params.id;
        if (!appId) return Utils.createErrorResponse('Application appId is required');
        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        const app = (appsFile.data || []).find(a => a.ID === appId);
        if (!app) return Utils.createErrorResponse('Application not found');
        const res = GmailSyncManager.configureVacationResponder(app);
        return res.success ? Utils.createSuccessResponse(res, 'Vacation responder configured') : Utils.createErrorResponse(res.error || res.reason || 'Failed to configure vacation responder');
    } catch (error) {
        return Utils.createErrorResponse('Vacation responder error: ' + error.message);
    }
}

function apiGetVacationResponderPreview(appId) {
    try {
        if (typeof appId === 'object' && appId !== null) appId = appId.appId || appId.id;
        if (!appId) return Utils.createErrorResponse('appId is required');
        const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
        const app = (appsFile.data || []).find(a => a.ID === appId);
        if (!app) return Utils.createErrorResponse('Application not found');
        const preview = GmailSyncManager.getResponderPreview(app);
        return Utils.createSuccessResponse(preview, 'Preview generated');
    } catch (error) {
        return Utils.createErrorResponse('Failed to generate preview: ' + error.message);
    }
}

// 15. Unified Bootstrap API (Single Round-Trip Hydration)
function apiGetBootstrapData(params) {
    try {
        const currentUserEmail = (params && params.email) || Session.getActiveUser().getEmail();
        const user = StaffManager.getUserData(currentUserEmail);
        if (!user) {
            return Utils.createErrorResponse('User profile not found: ' + currentUserEmail);
        }

        const role = user.Role || SYSTEM.ROLES.STAFF;
        const isSupervisor = role === SYSTEM.ROLES.SUPERVISOR || role === SYSTEM.ROLES.ADMIN;
        const isHR = role === SYSTEM.ROLES.HR || role === SYSTEM.ROLES.ADMIN;
        const isAdmin = role === SYSTEM.ROLES.ADMIN;

        // 1. User Balance Breakdown
        const balances = DashboardManager.calculateUserBalance(currentUserEmail);

        // 2. User's Applications (recent 15) and status counts
        const myApps = EnhancedCacheManager.getApplicationsByEmail(currentUserEmail, {});
        const recentApplications = myApps.slice(0, 15);
        const myPendingCount = myApps.filter(app => app.Status === SYSTEM.STATUS.PENDING).length;
        const myApprovedCount = myApps.filter(app => app.Status === SYSTEM.STATUS.APPROVED).length;

        // 3. Today's Absence Digest
        let absenceDigest = null;
        try {
            if (typeof AbsenceDigestManager !== 'undefined') {
                absenceDigest = AbsenceDigestManager.getTodayAbsenceDigest();
            }
        } catch (e) {
            console.warn('Absence digest in bootstrap:', e.message);
        }

        // 4. Pending Acting Handovers assigned to user
        let pendingHandovers = [];
        try {
            if (typeof HandoverManager !== 'undefined') {
                pendingHandovers = HandoverManager.getPendingHandovers(currentUserEmail);
            }
        } catch (e) {
            console.warn('Handovers in bootstrap:', e.message);
        }

        // 5. Supervisor Pending Applications
        let supervisorQueue = { count: 0, applications: [] };
        if (isSupervisor) {
            try {
                const supApps = (typeof EnhancedCacheManager !== 'undefined' && EnhancedCacheManager.getPendingApplications)
                    ? EnhancedCacheManager.getPendingApplications(currentUserEmail)
                    : [];
                supervisorQueue = {
                    count: supApps.length,
                    applications: supApps.slice(0, 10)
                };
            } catch (e) {
                console.warn('Supervisor queue in bootstrap:', e.message);
            }
        }

        // 6. HR Pending Endorsements
        let hrQueue = { count: 0, applications: [] };
        if (isHR) {
            try {
                const appsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
                const endorsements = (appsFile.data || []).filter(a => a.Status === SYSTEM.STATUS.PENDING && a.ApprovalStage === 'pending_hr');
                hrQueue = {
                    count: endorsements.length,
                    applications: endorsements.slice(0, 10)
                };
            } catch (e) {
                console.warn('HR queue in bootstrap:', e.message);
            }
        }

        // 7. Gazetted Holidays
        let holidays = [];
        try {
            if (typeof HolidayManager !== 'undefined') {
                holidays = HolidayManager.getAllCustomHolidays();
            }
        } catch (e) {
            console.warn('Holidays in bootstrap:', e.message);
        }

        // 8. Sheets Database Status (HR/Admin only)
        let sheetsStatus = null;
        if (isHR || isAdmin) {
            try {
                if (typeof SheetsDualStoreManager !== 'undefined') {
                    sheetsStatus = SheetsDualStoreManager.getDatabaseStatus();
                }
            } catch (e) {
                console.warn('Sheets status in bootstrap:', e.message);
            }
        }

        return Utils.createSuccessResponse({
            user: {
                Email: user.Email,
                Name: user.Name,
                Department: user.Department,
                Role: user.Role,
                Supervisor: user.Supervisor,
                EmploymentDate: user.EmploymentDate || user.JoinDate
            },
            permissions: {
                role,
                isAdmin,
                isHR,
                isSupervisor
            },
            balances,
            recentApplications,
            myPendingCount,
            stats: {
                totalApplications: myApps.length,
                pendingApplications: myPendingCount,
                approvedApplications: myApprovedCount
            },
            absenceDigestToday: absenceDigest,
            pendingHandovers,
            supervisorQueue,
            hrQueue,
            holidays: holidays.slice(0, 10),
            sheetsStatus,
            systemYear: Utils.getCurrentYear(),
            serverTimestamp: new Date().toISOString()
        }, 'Bootstrap data loaded successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to load bootstrap data: ' + error.message);
    }
}

// 16. Google Sheets Master Database & Live Mirror APIs
function apiGetSheetsStatus() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view Sheets Database status.');
        }
        const status = SheetsDualStoreManager.getDatabaseStatus();
        return Utils.createSuccessResponse(status, 'Sheets database status loaded');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get Sheets database status: ' + error.message);
    }
}

function apiSyncSheetsDatabase() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can sync Sheets Database.');
        }
        const result = SheetsDualStoreManager.syncAll();
        return result.success ? Utils.createSuccessResponse(result, 'Master Google Sheets database synchronized successfully') : Utils.createErrorResponse(result.error || 'Failed to sync Sheets database');
    } catch (error) {
        return Utils.createErrorResponse('Failed to sync Sheets database: ' + error.message);
    }
}

function apiRestoreFromSheets(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
            return Utils.createErrorResponse('Unauthorized. Only Admin or HR can restore database from Sheets.');
        }
        const source = (params && params.source) || 'sheets';
        const result = SheetsDualStoreManager.restoreFromJsonOrSheets(source);
        return result.success ? Utils.createSuccessResponse(result, result.message) : Utils.createErrorResponse(result.error || 'Restore failed');
    } catch (error) {
        return Utils.createErrorResponse('Restore from Sheets failed: ' + error.message);
    }
}

// 17. Cold Storage Partitioning & Historical Archive APIs
function apiArchiveOldApplications(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can run archive partitioning.');
        }
        const cutoffYear = (params && params.cutoffYear) ? params.cutoffYear : null;
        const result = ArchiveManager.archivePastYearApplications(cutoffYear);
        return result.success ? Utils.createSuccessResponse(result, result.message) : Utils.createErrorResponse(result.error || 'Archive failed');
    } catch (error) {
        return Utils.createErrorResponse('Failed to archive old applications: ' + error.message);
    }
}

function apiGetArchivedApplications(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view archived applications.');
        }
        const filters = params || {};
        const archives = ArchiveManager.getArchivedApplications(filters);
        return Utils.createSuccessResponse(archives, `Retrieved ${archives.length} archived application(s)`);
    } catch (error) {
        return Utils.createErrorResponse('Failed to get archived applications: ' + error.message);
    }
}

function apiGetArchiveSummary() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view archive summary.');
        }
        const summary = ArchiveManager.getArchiveSummary();
        return Utils.createSuccessResponse(summary, 'Archive summary retrieved successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get archive summary: ' + error.message);
    }
}

// 18. System Diagnostics & Automated Triggers APIs
function apiGetSystemDiagnostics() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view system diagnostics.');
        }
        const health = DiagnosticsManager.getSystemHealth();
        return Utils.createSuccessResponse(health, 'System diagnostics retrieved successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to get system diagnostics: ' + error.message);
    }
}

function apiInstallSystemTriggers() {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can install system triggers.');
        }
        const installResult = DiagnosticsManager.installSystemTriggers();
        return Utils.createSuccessResponse({ result: installResult }, 'System automatic triggers installed & verified successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to install system triggers: ' + error.message);
    }
}

// 19. Financial Leave Liability & Accrual Provision APIs
function apiGetLeaveLiabilityReport(params) {
    try {
        const currentUser = Session.getActiveUser().getEmail();
        const userRole = StaffManager.getUserRole(currentUser);
        if (userRole !== SYSTEM.ROLES.HR && userRole !== SYSTEM.ROLES.ADMIN) {
            return Utils.createErrorResponse('Unauthorized. Only HR or Admin can view leave liability reports.');
        }
        const report = FinancialProvisionManager.getLeaveLiabilityReport(params || {});
        return Utils.createSuccessResponse(report, 'Leave liability and financial provision report generated successfully');
    } catch (error) {
        return Utils.createErrorResponse('Failed to generate leave liability report: ' + error.message);
    }
}

// =============================================
// END OF COMPLETE BACKEND CODE
// VERSION 3.7.0 - ENTERPRISE DIAGNOSTICS & AUDIT SUITE
// =============================================