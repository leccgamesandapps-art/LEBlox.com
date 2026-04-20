// ==================== ACCOUNT ROLE NETWORK ====================
// This file connects script.js and script2.js through a shared event system
// It ensures real-time synchronization of users, reports, bans, suspensions, and roles

(function() {
    // Storage keys (must match both script.js and script2.js)
    const STORAGE_KEYS = {
        USERS: 'leblox_users',
        REPORTS: 'leblox_reports',
        BANNED: 'leblox_banned',
        SUSPENDED: 'leblox_suspended',
        CURRENT_USER: 'leblox_currentUser',
        NEXT_ID: 'leblox_nextId'
    };

    // Event listeners registry
    const eventListeners = {
        usersUpdated: [],
        reportsUpdated: [],
        bannedUpdated: [],
        suspendedUpdated: [],
        currentUserUpdated: [],
        anyChange: []
    };

    // ==================== HELPER FUNCTIONS ====================
    function dispatchEvent(eventName, data) {
        if (eventListeners[eventName]) {
            eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in ' + eventName + ' listener:', e);
                }
            });
        }
        // Dispatch to anyChange listeners
        eventListeners.anyChange.forEach(callback => {
            try {
                callback({ type: eventName, data: data });
            } catch (e) {
                console.error('Error in anyChange listener:', e);
            }
        });
    }

    // ==================== STORAGE WRAPPERS WITH EVENTS ====================
    function setUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        dispatchEvent('usersUpdated', users);
        return users;
    }

    function getUsers() {
        var stored = localStorage.getItem(STORAGE_KEYS.USERS);
        return stored ? JSON.parse(stored) : [];
    }

    function setReports(reports) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
        dispatchEvent('reportsUpdated', reports);
        return reports;
    }

    function getReports() {
        var stored = localStorage.getItem(STORAGE_KEYS.REPORTS);
        return stored ? JSON.parse(stored) : [];
    }

    function setBanned(banned) {
        localStorage.setItem(STORAGE_KEYS.BANNED, JSON.stringify(banned));
        dispatchEvent('bannedUpdated', banned);
        return banned;
    }

    function getBanned() {
        var stored = localStorage.getItem(STORAGE_KEYS.BANNED);
        return stored ? JSON.parse(stored) : {};
    }

    function setSuspended(suspended) {
        localStorage.setItem(STORAGE_KEYS.SUSPENDED, JSON.stringify(suspended));
        dispatchEvent('suspendedUpdated', suspended);
        return suspended;
    }

    function getSuspended() {
        var stored = localStorage.getItem(STORAGE_KEYS.SUSPENDED);
        return stored ? JSON.parse(stored) : {};
    }

    function setCurrentUser(username) {
        if (username) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, username);
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
        dispatchEvent('currentUserUpdated', username);
        return username;
    }

    function getCurrentUser() {
        return localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    }

    // ==================== CORE OPERATIONS ====================
    var AccountRoleNetwork = {
        // Storage keys (for reference)
        STORAGE_KEYS: STORAGE_KEYS,

        // ========== USER OPERATIONS ==========
        getAllUsers: function() {
            return getUsers();
        },

        getUser: function(username) {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].username === username) return users[i];
            }
            return null;
        },

        addUser: function(user) {
            var users = getUsers();
            users.push(user);
            setUsers(users);
            return user;
        },

        updateUser: function(username, updates) {
            var users = getUsers();
            for (var i = 0; i < users.length; i++) {
                if (users[i].username === username) {
                    for (var key in updates) {
                        if (updates.hasOwnProperty(key)) {
                            users[i][key] = updates[key];
                        }
                    }
                    setUsers(users);
                    return users[i];
                }
            }
            return null;
        },

        deleteUser: function(username) {
            var users = getUsers();
            var filtered = [];
            for (var i = 0; i < users.length; i++) {
                if (users[i].username !== username) {
                    filtered.push(users[i]);
                }
            }
            setUsers(filtered);
            return true;
        },

        // ========== REPORT OPERATIONS ==========
        getAllReports: function() {
            return getReports();
        },

        addReport: function(report) {
            var reports = getReports();
            var newReport = {
                reportedUser: report.reportedUser,
                reporter: report.reporter,
                reason: report.reason,
                timestamp: report.timestamp || Date.now()
            };
            reports.push(newReport);
            setReports(reports);
            return newReport;
        },

        deleteReport: function(index) {
            var reports = getReports();
            if (index >= 0 && index < reports.length) {
                reports.splice(index, 1);
                setReports(reports);
                return true;
            }
            return false;
        },

        getReportsForUser: function(username) {
            var reports = getReports();
            var result = [];
            for (var i = 0; i < reports.length; i++) {
                if (reports[i].reportedUser === username) {
                    result.push(reports[i]);
                }
            }
            return result;
        },

        // ========== BAN OPERATIONS ==========
        isBanned: function(username) {
            var banned = getBanned();
            return banned[username] === true;
        },

        banUser: function(username) {
            var banned = getBanned();
            banned[username] = true;
            setBanned(banned);
            this.deleteUser(username);
            return true;
        },

        unbanUser: function(username) {
            var banned = getBanned();
            delete banned[username];
            setBanned(banned);
            return true;
        },

        // ========== SUSPENSION OPERATIONS ==========
        isSuspended: function(username) {
            var suspended = getSuspended();
            if (suspended[username] && suspended[username] > Date.now()) {
                return true;
            }
            if (suspended[username] && suspended[username] <= Date.now()) {
                this.unsuspendUser(username);
                return false;
            }
            return false;
        },

        getSuspensionTimeRemaining: function(username) {
            var suspended = getSuspended();
            if (suspended[username] && suspended[username] > Date.now()) {
                return suspended[username] - Date.now();
            }
            return 0;
        },

        suspendUser: function(username, durationHours) {
            var suspended = getSuspended();
            var untilTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
            suspended[username] = untilTimestamp;
            setSuspended(suspended);
            return untilTimestamp;
        },

        unsuspendUser: function(username) {
            var suspended = getSuspended();
            delete suspended[username];
            setSuspended(suspended);
            return true;
        },

        // ========== ROLE OPERATIONS ==========
        getUserRole: function(username) {
            var user = this.getUser(username);
            return user ? user.role : null;
        },

        setUserRole: function(username, role) {
            return this.updateUser(username, { role: role });
        },

        isOwner: function(username) {
            var user = this.getUser(username);
            return user && user.role === 'owner';
        },

        isAdmin: function(username) {
            var user = this.getUser(username);
            return user && (user.role === 'owner' || user.role === 'admin');
        },

        canModifyRole: function(adminUsername, targetUsername) {
            var admin = this.getUser(adminUsername);
            var target = this.getUser(targetUsername);
            if (!admin || !target) return false;
            if (admin.role === 'owner') return true;
            if (admin.role === 'admin' && target.role !== 'owner' && target.role !== 'admin') return true;
            return false;
        },

        canBanSuspend: function(adminUsername, targetUsername) {
            var admin = this.getUser(adminUsername);
            var target = this.getUser(targetUsername);
            if (!admin || !target) return false;
            if (admin.role === 'owner' && target.role === 'owner') return false;
            if (admin.role === 'admin' && (target.role === 'owner' || target.role === 'admin')) return false;
            return true;
        },

        // ========== EVENT LISTENERS ==========
        on: function(eventName, callback) {
            if (eventListeners[eventName]) {
                eventListeners[eventName].push(callback);
            } else {
                console.warn('Unknown event: ' + eventName);
            }
        },

        off: function(eventName, callback) {
            if (eventListeners[eventName]) {
                var index = eventListeners[eventName].indexOf(callback);
                if (index !== -1) {
                    eventListeners[eventName].splice(index, 1);
                }
            }
        },

        // ========== FORCE SYNC ==========
        syncAll: function() {
            dispatchEvent('usersUpdated', getUsers());
            dispatchEvent('reportsUpdated', getReports());
            dispatchEvent('bannedUpdated', getBanned());
            dispatchEvent('suspendedUpdated', getSuspended());
            dispatchEvent('currentUserUpdated', getCurrentUser());
        },

        // ========== CROSS-TAB COMMUNICATION ==========
        initCrossTabSync: function() {
            var self = this;
            window.addEventListener('storage', function(e) {
                if (e.key === STORAGE_KEYS.USERS) {
                    dispatchEvent('usersUpdated', getUsers());
                } else if (e.key === STORAGE_KEYS.REPORTS) {
                    dispatchEvent('reportsUpdated', getReports());
                } else if (e.key === STORAGE_KEYS.BANNED) {
                    dispatchEvent('bannedUpdated', getBanned());
                } else if (e.key === STORAGE_KEYS.SUSPENDED) {
                    dispatchEvent('suspendedUpdated', getSuspended());
                } else if (e.key === STORAGE_KEYS.CURRENT_USER) {
                    dispatchEvent('currentUserUpdated', getCurrentUser());
                }
                dispatchEvent('anyChange', { key: e.key, newValue: e.newValue, oldValue: e.oldValue });
            });
        }
    };

    // Auto-initialize cross-tab sync
    AccountRoleNetwork.initCrossTabSync();

    // Expose to global scope
    window.AccountRoleNetwork = AccountRoleNetwork;
    window.ARN = AccountRoleNetwork;

    console.log('Account Role Network initialized. Use window.AccountRoleNetwork or window.ARN');
})();