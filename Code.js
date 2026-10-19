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
        SETTINGS: 'system_settings.json',
        LOGS: 'system_logs.json',
        ANNUAL_RESET: 'annual_reset_logs.json'
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

    formatDateForDisplay: function (dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    },

    isPublicHoliday: function (date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const year = d.getFullYear();

        // 1. Fixed Kenya Public Holidays [month (0-11), day (1-31)]
        const fixedHolidays = [
            { month: 0, day: 1, name: "New Year's Day" },
            { month: 4, day: 1, name: "Labour Day" },
            { month: 5, day: 1, name: "Madaraka Day" },
            { month: 9, day: 10, name: "Utamaduni / Mazigira Day" },
            { month: 9, day: 20, name: "Mashujaa Day" },
            { month: 11, day: 12, name: "Jamhuri Day" },
            { month: 11, day: 25, name: "Christmas Day" },
            { month: 11, day: 26, name: "Boxing Day" }
        ];

        // 2. Dynamic Easter Holidays (Good Friday = Easter - 2 days, Easter Monday = Easter + 1 day)
        const easter = this.calculateEasterDate(year);
        easter.setHours(0, 0, 0, 0);
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        const easterMonday = new Date(easter);
        easterMonday.setDate(easter.getDate() + 1);

        if (d.getTime() === goodFriday.getTime() || d.getTime() === easterMonday.getTime()) {
            return true;
        }

        // Check fixed holidays & Sunday observed rule (if holiday falls on Sunday, following Monday is observed)
        for (const h of fixedHolidays) {
            const hDate = new Date(year, h.month, h.day);
            hDate.setHours(0, 0, 0, 0);
            if (d.getTime() === hDate.getTime()) {
                return true;
            }
            if (hDate.getDay() === 0) {
                const observedMonday = new Date(hDate);
                observedMonday.setDate(hDate.getDate() + 1);
                if (d.getTime() === observedMonday.getTime()) {
                    return true;
                }
            }
        }

        return false;
    },

    getBusinessDays: function (startDate, endDate) {
        let count = 0;
        const current = new Date(startDate);
        const end = new Date(endDate);
        current.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6 && !this.isPublicHoliday(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
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

    getEasterExpiryDate: function () {
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

    get: function (key, useFileCache = false) {
        const cacheType = this.getCacheType(key);
        if (useFileCache) return this.getFileCache(key);
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
        this.statistics.misses++;
        this.incrementTypeStat(cacheType, 'misses');
        return null;
    },

    set: function (key, value, ttl = null) {
        const cacheType = this.getCacheType(key);
        this.memory.set(key, value);
        this.timestamps.set(key, Date.now());
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
        return null;
    },

    setBalance: function (email, balanceData) {
        const cacheKey = `balance_${email}`;
        this.balanceCache.set(cacheKey, balanceData);
        this.balanceCacheTimestamps.set(cacheKey, Date.now());
        return true;
    },

    clearBalance: function (email) {
        const cacheKey = `balance_${email}`;
        this.balanceCache.delete(cacheKey);
        this.balanceCacheTimestamps.delete(cacheKey);
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
            }
        }
        for (const key of this.balanceCache.keys()) {
            if (key.includes(pattern)) {
                this.balanceCache.delete(key);
                this.balanceCacheTimestamps.delete(key);
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
        let applications = [];
        if (SYSTEM.PERFORMANCE.INDEXES.ENABLED) {
            const allPending = this.indexes.applicationsByStatus.get(SYSTEM.STATUS.PENDING) || [];
            applications = allPending.filter(app =>
                app.SupervisorEmail && app.SupervisorEmail.toLowerCase() === supervisorEmail.toLowerCase()
            );
        } else {
            const allPending = ApplicationsManager.getAllApplicationsData({ status: SYSTEM.STATUS.PENDING });
            applications = allPending.filter(app =>
                app.SupervisorEmail && app.SupervisorEmail.toLowerCase() === supervisorEmail.toLowerCase()
            );
        }
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
        return staffData.filter(member =>
            member.Supervisor && member.Supervisor.toLowerCase().trim() === supervisorEmail.toLowerCase().trim() &&
            member.Metadata?.active !== false
        );
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
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = this.getUserRole(currentUser);

            if (userRole !== SYSTEM.ROLES.ADMIN) {
                return Utils.createErrorResponse('Only administrators can delete staff');
            }

            if (email.toLowerCase() === currentUser.toLowerCase()) {
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
                const start = new Date(startDate);
                const end = new Date(endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
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

            const balanceCheck = this.checkLeaveBalanceWithPriority(userEmail, applicationData.leaveType, businessDays);
            if (!balanceCheck.success) return balanceCheck;

            const deductions = balanceCheck.data.deductions;
            let calendarDays = 0;
            if (applicationData.leaveMode !== 'Hourly' && startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }

            const appId = 'APP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            const currentDate = new Date().toISOString().split('T')[0];
            const supervisorEmail = user.Supervisor || '';
            let supervisorName = '';
            if (supervisorEmail) {
                const supervisorUser = StaffManager.getUserData(supervisorEmail);
                supervisorName = supervisorUser ? supervisorUser.Name || '' : '';
            }

            // Deficit check: total annual pool after this leave (BF deductions don't create a deficit
            // in the annual accrual — they draw from a separate expiring pool).
            const availableAfter = AccrualManager.calculateAvailableBalance(user) - (deductions.annual || 0);
            const willHaveDeficit = availableAfter < 0;

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
                Attachment: applicationData.attachment || '',
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
                    willCreateDeficit: willHaveDeficit,
                    deficitAmount: willHaveDeficit ? Math.abs(availableAfter) : 0
                }
            };

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            applicationsFile.data.push(application);
            applicationsFile.metadata.recordCount = applicationsFile.data.length;
            DataManager.writeDataFile(SYSTEM.DATA_FILES.APPLICATIONS, applicationsFile);
            EnhancedCacheManager.buildIndexes();
            if (supervisorEmail) {
                NotificationManager.notifyApplicationSubmitted(application);
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
            const easterDate = Utils.getEasterExpiryDate();
            const today = new Date();
            const isBroughtForwardExpired = user.LeaveBroughtForward?.isExpired || (today > easterDate);
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
    processApplicationDecision: function (appId, decision, comment = '') {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const user = StaffManager.getUserData(currentUser);

            if (!user) return Utils.createErrorResponse('User not found');

            const applicationsFile = DataManager.readDataFile(SYSTEM.DATA_FILES.APPLICATIONS);
            const applicationIndex = applicationsFile.data.findIndex(app => app.ID === appId);

            if (applicationIndex === -1) return Utils.createErrorResponse('Application not found');

            const application = applicationsFile.data[applicationIndex];

            if (application.Status !== SYSTEM.STATUS.PENDING) {
                return Utils.createErrorResponse('Application is not in pending status');
            }

            const isSupervisor = application.SupervisorEmail === currentUser;
            const isAdmin = user.Role === SYSTEM.ROLES.ADMIN;
            const isHR = user.Role === SYSTEM.ROLES.HR;

            if (!isSupervisor && !isAdmin && !isHR) {
                return Utils.createErrorResponse('You are not authorized to process this application');
            }

            const newStatus = decision === 'approve' ? SYSTEM.STATUS.APPROVED : SYSTEM.STATUS.DECLINED;

            applicationsFile.data[applicationIndex].Status = newStatus;
            applicationsFile.data[applicationIndex].ProcessedDate = new Date().toISOString();
            applicationsFile.data[applicationIndex].ProcessedBy = currentUser;
            applicationsFile.data[applicationIndex].Comment = comment || '';

            if (newStatus === SYSTEM.STATUS.APPROVED) {
                this.updateStaffLeaveBalances(application);
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
    cancelApplication: function (appId, reason) {
        try {
            const currentUser = Session.getActiveUser().getEmail();
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

            // If it was already approved, roll back all deductions from staff balances
            if (wasApproved) {
                this.rollbackStaffLeaveBalances(application);
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

                const easterDate = Utils.getEasterExpiryDate();
                const today = new Date();
                const isExpired = user.LeaveBroughtForward.isExpired || (today > easterDate);

                if (isExpired) {
                    availableBroughtForward = 0;
                }

                broughtForwardPercentage = broughtForwardTotal > 0 ?
                    Math.min(100, Math.round((broughtForwardUsed / broughtForwardTotal) * 100)) : 0;

                broughtForwardData = {
                    // Complete information
                    total: broughtForwardTotal,                    // Original total (3.0)
                    remaining: broughtForwardRemaining,             // Current balance (2.5)
                    used: broughtForwardUsed,                        // Used so far (0.5)
                    daysCarriedFromPreviousYear: broughtForwardRemaining, // For backward compatibility
                    available: availableBroughtForward,
                    expiryDate: user.LeaveBroughtForward.expiryDate,
                    yearEarned: user.LeaveBroughtForward.yearEarned,
                    isExpired: isExpired,
                    note: user.LeaveBroughtForward.note || '',
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
                pendingApplications: applications.filter(app => app.Status === SYSTEM.STATUS.PENDING).length
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
                return {
                    name: staff.Name,
                    email: staff.Email,
                    department: staff.Department,
                    role: staff.Role,
                    eligibleForLeave: staff.EligibleForLeave,
                    balance: balanceData || {
                        annual: { available: 0, used: 0, percentage: 0 },
                        broughtForward: null,
                        sick: { balance: 0, used: 0, percentage: 0 },
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
    processYearEnd: function () {
        try {
            const currentUser = Session.getActiveUser().getEmail();
            const userRole = StaffManager.getUserRole(currentUser);

            if (userRole !== SYSTEM.ROLES.ADMIN && userRole !== SYSTEM.ROLES.HR) {
                return Utils.createErrorResponse('Only administrators can run year-end processing');
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
                        expiryDate: expiryDate.toISOString().split('T')[0],
                        yearEarned: sourceYear,
                        yearExpires: targetYear,
                        isExpired: false,
                        note: `${newBFDays} days unused ${sourceYear} annual leave — expires Easter ${targetYear} (${expiryDate.toISOString().split('T')[0]})`
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
                    const obs = new Date(hd);
                    obs.setDate(hd.getDate() + 1);
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
                    date: h.date.toISOString().split('T')[0],
                    displayDate: Utils.formatDateForDisplay(h.date.toISOString().split('T')[0]),
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

        return Utils.createSuccessResponse({
            staff: staffWithBalances,
            applications: {
                all: allApps,
                pending: pendingApps,
                approved: approvedApps,
                pendingCount: pendingApps.length
            },
            summary: {
                totalStaff: staffData.length,
                eligibleStaff: staffData.filter(s => s.EligibleForLeave).length,
                pendingApplications: pendingApps.length
            }
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

// Call this function ONCE from the GAS Script Editor to install the monthly trigger.
function setupAutomaticAccrual() {
    try {
        // Remove all existing managed triggers to avoid duplicates
        const managedHandlers = [
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

        // ── 1. Monthly accrual — 1st of each month at 01:00 ─────────────────
        ScriptApp.newTrigger('scheduledMonthlyAccrual')
            .timeBased()
            .onMonthDay(1)
            .atHour(1)
            .create();

        // ── 2. Year-end reset — January 1st at 00:30 ─────────────────────────
        ScriptApp.newTrigger('scheduledYearEnd')
            .timeBased()
            .onMonthDay(1)
            .inMonth(ScriptApp.Month.JANUARY)
            .atHour(0)
            .nearMinute(30)
            .create();

        // ── 3. Easter BF warning — March 15th at 08:00 each year ─────────────
        // Runs annually on Mar 15. The handler itself checks whether today is
        // exactly 14 days before Easter and only acts if so.
        ScriptApp.newTrigger('scheduledEasterWarning')
            .timeBased()
            .onMonthDay(15)
            .inMonth(ScriptApp.Month.MARCH)
            .atHour(8)
            .create();

        // ── 4. Easter BF expiry — April 5th at 07:00 each year ───────────────
        // Runs annually on Apr 5. The handler checks whether today is Easter
        // Sunday (or past it) and only acts if so.
        ScriptApp.newTrigger('scheduledEasterExpiry')
            .timeBased()
            .onMonthDay(5)
            .inMonth(ScriptApp.Month.APRIL)
            .atHour(7)
            .create();

        console.log('✅ All automatic triggers registered');
        return (
            'Triggers registered:\n' +
            '  • Monthly accrual: 1st of each month at 01:00\n' +
            '  • Year-end reset:  Jan 1st at 00:30\n' +
            '  • BF warning:      Mar 15th at 08:00 (fires only when 14 days from Easter)\n' +
            '  • BF expiry:       Apr 5th at 07:00  (fires only on/after Easter)'
        );

    } catch (error) {
        console.error('❌ Failed to setup triggers:', error);
        return 'Failed to setup triggers: ' + error.message;
    }
}
// ── Fires Jan 1st at 00:30 — runs year-end reset once ────────────────────
function scheduledYearEnd() {
    console.log('⏰ Scheduled year-end processing started...');
    try {
        // Re-initialise cache before any data operations
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const result = AdminManager.processYearEnd();
        console.log('✅ Scheduled year-end completed:', result.message || result.error);
        return result;
    } catch (error) {
        console.error('❌ scheduledYearEnd failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Fires Mar 15th — sends 2-week BF expiry warning if Easter is 14 days away ──
function scheduledEasterWarning() {
    console.log('⏰ Easter BF warning check started...');
    try {
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const today = new Date();
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

            // Check the BF leave belongs to the current year's Easter expiry
            const bfExpiry = new Date(staff.LeaveBroughtForward.expiryDate);
            if (bfExpiry.getFullYear() !== today.getFullYear()) return;

            NotificationManager.notifyBFWarning(staff, easterDate);
            warnedCount++;
        });

        console.log(`✅ BF warning sent to ${warnedCount} staff member(s).`);
        return { success: true, warnedCount, daysUntilEaster: daysUntil };

    } catch (error) {
        console.error('❌ scheduledEasterWarning failed:', error);
        return { success: false, error: error.message };
    }
}

// ── Fires Apr 5th — expires BF days if today is Easter Sunday or later ───────
function scheduledEasterExpiry() {
    console.log('⏰ Easter BF expiry check started...');
    try {
        EnhancedCacheManager.initialize();
        EnhancedCacheManager.buildIndexes();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
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

            // Only expire BF leave that belongs to this year
            const bfExpiry = new Date(member.LeaveBroughtForward.expiryDate);
            bfExpiry.setHours(0, 0, 0, 0);
            if (bfExpiry.getFullYear() !== today.getFullYear()) return;

            // Expire it
            forfeitLog.push({ email: member.Email, name: member.Name, forfeitedDays: bfDays });
            totalForfeited += bfDays;

            member.LeaveBroughtForward = null;

            // Recalculate available balance — remove the now-expired BF days
            const accrued = member.LeaveAccrual.accruedYearToDate || 0;
            const used = member.LeaveAccrual.usedYearToDate || 0;
            const deficit = member.LeaveAccrual.annualDeficit?.amount || 0;
            member.LeaveAccrual.availableBalance = Math.max(0, accrued - used + deficit);

            // Notify individual + HR
            NotificationManager.notifyBFExpired(member, bfDays, easterDate);
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
                const deficit = staff.LeaveAccrual.annualDeficit?.amount || 0;
                const broughtForward = staff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0;

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
        const broughtForward = staff.LeaveBroughtForward?.daysCarriedFromPreviousYear || 0;
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
// END OF COMPLETE BACKEND CODE
// VERSION 3.4.0 - CRYSTAL CLEAR NAMING
// =============================================