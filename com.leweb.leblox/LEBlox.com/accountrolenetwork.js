// ==================== ACCOUNT ROLE NETWORK ====================
// This file connects script.js and script2.js through a shared event system

(function() {
    // Storage keys
    const STORAGE_KEYS = {
        USERS: 'leblox_users',
        REPORTS: 'leblox_reports',
        BANNED: 'leblox_banned',
        SUSPENDED: 'leblox_suspended',
        CURRENT_USER: 'leblox_currentUser',
        NEXT_ID: 'leblox_nextId',
        OWNER_LIST: 'leblox_owners',
        ADMIN_LIST: 'leblox_admins'
    };

    // Owner and Admin lists (YOU are the owner)
    const OWNER_LIST = ['LEOwner'];
    const ADMIN_LIST = ['LETester'];

    // Event listeners
    const eventListeners = {
        usersUpdated: [], reportsUpdated: [], bannedUpdated: [],
        suspendedUpdated: [], currentUserUpdated: [],
        ownersUpdated: [], adminsUpdated: [], anyChange: []
    };

    function dispatchEvent(eventName, data) {
        if (eventListeners[eventName]) {
            eventListeners[eventName].forEach(cb => { try { cb(data); } catch(e) {} });
        }
        eventListeners.anyChange.forEach(cb => { try { cb({ type: eventName, data: data }); } catch(e) {} });
    }

    // ==================== STORAGE WRAPPERS ====================
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

    // ==================== OWNER LIST FUNCTIONS ====================
    function getOwners() {
        var stored = localStorage.getItem(STORAGE_KEYS.OWNER_LIST);
        if (stored) {
            return JSON.parse(stored);
        }
        setOwners(OWNER_LIST);
        return OWNER_LIST;
    }

    function setOwners(owners) {
        localStorage.setItem(STORAGE_KEYS.OWNER_LIST, JSON.stringify(owners));
        dispatchEvent('ownersUpdated', owners);
        return owners;
    }

    function isOwner(username) {
        var owners = getOwners();
        return owners.includes(username);
    }

    function addOwner(username) {
        var owners = getOwners();
        if (!owners.includes(username)) {
            owners.push(username);
            setOwners(owners);
            // Also update user role
            var user = getUser(username);
            if (user) {
                user.role = 'owner';
                saveUsers();
            }
        }
        return owners;
    }

    // ==================== ADMIN LIST FUNCTIONS ====================
    function getAdmins() {
        var stored = localStorage.getItem(STORAGE_KEYS.ADMIN_LIST);
        if (stored) {
            return JSON.parse(stored);
        }
        setAdmins(ADMIN_LIST);
        return ADMIN_LIST;
    }

    function setAdmins(admins) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_LIST, JSON.stringify(admins));
        dispatchEvent('adminsUpdated', admins);
        return admins;
    }

    function isAdmin(username) {
        var admins = getAdmins();
        var owners = getOwners();
        return admins.includes(username) || owners.includes(username);
    }

    function canAccessAdminPanel(username) {
        return isOwner(username) || isAdmin(username);
    }

    // ==================== USER OPERATIONS ====================
    function getAllUsers() {
        return getUsers();
    }

    function getUser(username) {
        var users = getUsers();
        for (var i = 0; i < users.length; i++) {
            if (users[i].username === username) return users[i];
        }
        return null;
    }

    function addUser(user) {
        var users = getUsers();
        var owners = getOwners();
        var admins = getAdmins();
        if (owners.includes(user.username)) {
            user.role = 'owner';
        } else if (admins.includes(user.username)) {
            user.role = 'admin';
        } else {
            user.role = user.role || 'member';
        }
        users.push(user);
        setUsers(users);
        return user;
    }

    function updateUser(username, updates) {
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
    }

    function saveUsers() {
        var users = getUsers();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        dispatchEvent('usersUpdated', users);
    }

    function deleteUser(username) {
        var owners = getOwners();
        var admins = getAdmins();
        if (owners.includes(username) || admins.includes(username)) {
            return false;
        }
        var users = getUsers();
        var filtered = [];
        for (var i = 0; i < users.length; i++) {
            if (users[i].username !== username) {
                filtered.push(users[i]);
            }
        }
        setUsers(filtered);
        return true;
    }

    // ==================== VERIFY LOGIN (SYNCED WITH PASSWORD) ====================
    function verifyLogin(username, password) {
        var user = getUser(username);
        if (!user) return false;
        return user.password === password;
    }

    // ==================== REPORT OPERATIONS ====================
    function getAllReports() { return getReports(); }

    function addReport(report) {
        var reports = getReports();
        reports.push({
            reportedUser: report.reportedUser,
            reporter: report.reporter,
            reason: report.reason,
            timestamp: report.timestamp || Date.now()
        });
        setReports(reports);
        return report;
    }

    function deleteReport(index) {
        var reports = getReports();
        if (index >= 0 && index < reports.length) {
            reports.splice(index, 1);
            setReports(reports);
            return true;
        }
        return false;
    }

    function getReportsForUser(username) {
        var reports = getReports();
        var result = [];
        for (var i = 0; i < reports.length; i++) {
            if (reports[i].reportedUser === username) result.push(reports[i]);
        }
        return result;
    }

    // ==================== BAN OPERATIONS ====================
    function isBanned(username) {
        var banned = getBanned();
        return banned[username] === true;
    }

    function banUser(username) {
        var owners = getOwners();
        var admins = getAdmins();
        if (owners.includes(username) || admins.includes(username)) return false;
        var banned = getBanned();
        banned[username] = true;
        setBanned(banned);
        deleteUser(username);
        return true;
    }

    function unbanUser(username) {
        var banned = getBanned();
        delete banned[username];
        setBanned(banned);
        return true;
    }

    // ==================== SUSPENSION OPERATIONS ====================
    function isSuspended(username) {
        var suspended = getSuspended();
        if (suspended[username] && suspended[username] > Date.now()) return true;
        if (suspended[username] && suspended[username] <= Date.now()) {
            unsuspendUser(username);
            return false;
        }
        return false;
    }

    function getSuspensionTimeRemaining(username) {
        var suspended = getSuspended();
        if (suspended[username] && suspended[username] > Date.now()) {
            return suspended[username] - Date.now();
        }
        return 0;
    }

    function suspendUser(username, durationHours) {
        var owners = getOwners();
        var admins = getAdmins();
        if (owners.includes(username) || admins.includes(username)) return false;
        var suspended = getSuspended();
        var untilTimestamp = Date.now() + (durationHours * 60 * 60 * 1000);
        suspended[username] = untilTimestamp;
        setSuspended(suspended);
        return untilTimestamp;
    }

    function unsuspendUser(username) {
        var suspended = getSuspended();
        delete suspended[username];
        setSuspended(suspended);
        return true;
    }

    // ==================== ROLE OPERATIONS ====================
    function getUserRole(username) {
        var user = getUser(username);
        if (user) return user.role;
        if (isOwner(username)) return 'owner';
        if (isAdmin(username)) return 'admin';
        return 'member';
    }

    function getUserRoleBadge(username) {
        var role = getUserRole(username);
        if (role === 'owner') return '<span class="role-badge owner">👑 Owner</span>';
        if (role === 'admin') return '<span class="role-badge admin">⚙️ Admin</span>';
        return '<span class="role-badge member">👤 Member</span>';
    }

    function canModifyRole(adminUsername, targetUsername) {
        var adminRole = getUserRole(adminUsername);
        var targetRole = getUserRole(targetUsername);
        if (adminRole === 'owner') return true;
        if (adminRole === 'admin' && targetRole !== 'owner' && targetRole !== 'admin') return true;
        return false;
    }

    function canBanSuspend(adminUsername, targetUsername) {
        var adminRole = getUserRole(adminUsername);
        var targetRole = getUserRole(targetUsername);
        if (adminRole === 'owner' && targetRole === 'owner') return false;
        if (adminRole === 'admin' && (targetRole === 'owner' || targetRole === 'admin')) return false;
        return true;
    }

    // ==================== GET LISTS ====================
    function getOwnerList() { return getOwners(); }
    function getAdminList() { return getAdmins(); }

    // ==================== EVENT LISTENERS ====================
    function on(eventName, callback) {
        if (eventListeners[eventName]) eventListeners[eventName].push(callback);
        else console.warn('Unknown event: ' + eventName);
    }

    function off(eventName, callback) {
        if (eventListeners[eventName]) {
            var index = eventListeners[eventName].indexOf(callback);
            if (index !== -1) eventListeners[eventName].splice(index, 1);
        }
    }

    // ==================== SYNC ====================
    function syncAll() {
        dispatchEvent('usersUpdated', getUsers());
        dispatchEvent('reportsUpdated', getReports());
        dispatchEvent('bannedUpdated', getBanned());
        dispatchEvent('suspendedUpdated', getSuspended());
        dispatchEvent('currentUserUpdated', getCurrentUser());
        dispatchEvent('ownersUpdated', getOwners());
        dispatchEvent('adminsUpdated', getAdmins());
    }

    // ==================== CROSS-TAB SYNC ====================
    function initCrossTabSync() {
        window.addEventListener('storage', function(e) {
            if (e.key === STORAGE_KEYS.USERS) dispatchEvent('usersUpdated', getUsers());
            else if (e.key === STORAGE_KEYS.REPORTS) dispatchEvent('reportsUpdated', getReports());
            else if (e.key === STORAGE_KEYS.BANNED) dispatchEvent('bannedUpdated', getBanned());
            else if (e.key === STORAGE_KEYS.SUSPENDED) dispatchEvent('suspendedUpdated', getSuspended());
            else if (e.key === STORAGE_KEYS.CURRENT_USER) dispatchEvent('currentUserUpdated', getCurrentUser());
            else if (e.key === STORAGE_KEYS.OWNER_LIST) dispatchEvent('ownersUpdated', getOwners());
            else if (e.key === STORAGE_KEYS.ADMIN_LIST) dispatchEvent('adminsUpdated', getAdmins());
            dispatchEvent('anyChange', { key: e.key, newValue: e.newValue, oldValue: e.oldValue });
        });
    }

    // ==================== FIX EXISTING USERS' ROLES ====================
    function fixUserRoles() {
        var users = getUsers();
        var owners = getOwners();
        var admins = getAdmins();
        var changed = false;
        
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            if (owners.includes(user.username) && user.role !== 'owner') {
                user.role = 'owner';
                changed = true;
            } else if (admins.includes(user.username) && user.role !== 'admin') {
                user.role = 'admin';
                changed = true;
            } else if (!owners.includes(user.username) && !admins.includes(user.username) && user.role !== 'member') {
                user.role = 'member';
                changed = true;
            }
        }
        
        if (changed) {
            setUsers(users);
            console.log('Fixed user roles in localStorage');
        }
    }

    // ==================== EXPOSE API ====================
    var AccountRoleNetwork = {
        STORAGE_KEYS: STORAGE_KEYS,
        getAllUsers: getAllUsers,
        getUser: getUser,
        addUser: addUser,
        updateUser: updateUser,
        deleteUser: deleteUser,
        verifyLogin: verifyLogin,
        getAllReports: getAllReports,
        addReport: addReport,
        deleteReport: deleteReport,
        getReportsForUser: getReportsForUser,
        isBanned: isBanned,
        banUser: banUser,
        unbanUser: unbanUser,
        isSuspended: isSuspended,
        getSuspensionTimeRemaining: getSuspensionTimeRemaining,
        suspendUser: suspendUser,
        unsuspendUser: unsuspendUser,
        getUserRole: getUserRole,
        getUserRoleBadge: getUserRoleBadge,
        canModifyRole: canModifyRole,
        canBanSuspend: canBanSuspend,
        getOwnerList: getOwnerList,
        getAdminList: getAdminList,
        isOwner: isOwner,
        isAdmin: isAdmin,
        canAccessAdminPanel: canAccessAdminPanel,
        on: on,
        off: off,
        syncAll: syncAll,
        initCrossTabSync: initCrossTabSync,
        fixUserRoles: fixUserRoles
    };

    AccountRoleNetwork.initCrossTabSync();
    AccountRoleNetwork.fixUserRoles(); // Auto-fix existing user roles

    window.AccountRoleNetwork = AccountRoleNetwork;
    window.ARN = AccountRoleNetwork;

    console.log('Account Role Network initialized.');
    console.log('Owners:', AccountRoleNetwork.getOwnerList());
    console.log('Admins:', AccountRoleNetwork.getAdminList());
})();