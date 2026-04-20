// ==================== DATA STORAGE KEYS ====================
const STORAGE_USERS = 'leblox_users';
const STORAGE_REPORTS = 'leblox_reports';
const STORAGE_BANNED = 'leblox_banned';
const STORAGE_SUSPENDED = 'leblox_suspended';

const ROLE_OWNER = 'owner';
const ROLE_ADMIN = 'admin';
const ROLE_MEMBER = 'member';

let currentAdmin = null;
let users = [];
let reports = [];
let bannedUsers = {};
let suspendedUsers = {};

// Connect to Account Role Network
if (typeof AccountRoleNetwork !== 'undefined') {
    console.log('Connected to Account Role Network');
    AccountRoleNetwork.on('usersUpdated', function() {
        loadData();
        if (currentAdmin) {
            renderUsers();
            renderRoleManagement();
        }
    });
    AccountRoleNetwork.on('reportsUpdated', function() {
        loadData();
        if (currentAdmin) {
            renderReports();
        }
    });
    AccountRoleNetwork.on('suspendedUpdated', function() {
        loadData();
        if (currentAdmin) {
            renderUsers();
        }
    });
}

// ==================== LOAD DATA ====================
function loadData() {
    const storedUsers = localStorage.getItem(STORAGE_USERS);
    if (storedUsers) users = JSON.parse(storedUsers);
    else users = [];

    const storedReports = localStorage.getItem(STORAGE_REPORTS);
    if (storedReports) reports = JSON.parse(storedReports);
    else reports = [];

    const storedBanned = localStorage.getItem(STORAGE_BANNED);
    if (storedBanned) bannedUsers = JSON.parse(storedBanned);
    else bannedUsers = {};

    const storedSuspended = localStorage.getItem(STORAGE_SUSPENDED);
    if (storedSuspended) suspendedUsers = JSON.parse(storedSuspended);
    else suspendedUsers = {};
}

function saveUsers() { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function saveReports() { localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports)); }
function saveBanned() { localStorage.setItem(STORAGE_BANNED, JSON.stringify(bannedUsers)); }
function saveSuspended() { localStorage.setItem(STORAGE_SUSPENDED, JSON.stringify(suspendedUsers)); }

// ==================== ROLE HELPERS ====================
function canModifyRole(adminRole, targetRole) {
    if (adminRole === ROLE_OWNER) return true;
    if (adminRole === ROLE_ADMIN && targetRole !== ROLE_OWNER && targetRole !== ROLE_ADMIN) return true;
    return false;
}

function canBanSuspend(adminRole, targetRole) {
    if (adminRole === ROLE_OWNER && targetRole === ROLE_OWNER) return false;
    if (adminRole === ROLE_ADMIN && (targetRole === ROLE_OWNER || targetRole === ROLE_ADMIN)) return false;
    return true;
}

// ==================== ADMIN LOGIN (FIXED - recognizes Owner) ====================
function adminLogin(username, password) {
    // First try using AccountRoleNetwork if available
    if (typeof AccountRoleNetwork !== 'undefined') {
        // Verify password using the network (syncs with web.html)
        if (!AccountRoleNetwork.verifyLogin(username, password)) {
            return false;
        }
        // Check if user can access admin panel (owner or admin)
        if (AccountRoleNetwork.canAccessAdminPanel(username)) {
            const user = AccountRoleNetwork.getUser(username);
            if (user) {
                currentAdmin = user;
                console.log('Admin login successful via network:', username, 'Role:', user.role);
                return true;
            }
        }
        console.log('Admin login failed - not owner or admin:', username);
        return false;
    }
    
    // Fallback: direct localStorage check
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return false;
    
    // Check if user is owner or admin (using hardcoded lists as fallback)
    const OWNER_LIST = ['LEOwner'];
    const ADMIN_LIST = ['LETester'];
    
    if (OWNER_LIST.includes(username) || ADMIN_LIST.includes(username)) {
        currentAdmin = user;
        // Ensure role is set correctly
        if (OWNER_LIST.includes(username)) user.role = 'owner';
        else if (ADMIN_LIST.includes(username)) user.role = 'admin';
        saveUsers();
        return true;
    }
    
    return false;
}

// ==================== UI RENDERING ====================
function renderReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;
    if (reports.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">No reports yet</div>';
        return;
    }
    container.innerHTML = reports.map((report, idx) => `
        <div class="report-item" data-report-idx="${idx}">
            <div class="report-info">
                <div class="report-reporter">👤 Reported by: ${escapeHtml(report.reporter)}</div>
                <div class="report-reason">📝 Reason: ${escapeHtml(report.reason)}</div>
                <div class="report-time">🕒 ${new Date(report.timestamp).toLocaleString()}</div>
            </div>
            <div class="report-actions">
                <button class="delete-report-btn" data-idx="${idx}">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            reports.splice(idx, 1);
            saveReports();
            renderReports();
            if (!document.getElementById('userView').classList.contains('hidden')) renderUsers();
        });
    });
}

function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    const otherUsers = users.filter(u => u.username !== currentAdmin.username);
    if (otherUsers.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">No other users found</div>';
        return;
    }
    container.innerHTML = otherUsers.map((user, idx) => `
        <div class="user-item" data-username="${escapeHtml(user.username)}">
            <div class="user-info">
                ${idx+1}. <strong>${escapeHtml(user.displayName || user.username)}</strong> (${escapeHtml(user.username)})
                <span class="role-badge ${user.role}">${user.role === ROLE_OWNER ? '👑 Owner' : (user.role === ROLE_ADMIN ? '⚙️ Admin' : '👤 Member')}</span>
            </div>
            <div class="user-actions">
                <button class="view-user-btn" data-username="${escapeHtml(user.username)}">View</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.view-user-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.getAttribute('data-username');
            openUserDetailModal(username);
        });
    });
}

function renderRoleManagement() {
    const container = document.getElementById('roleUsersList');
    if (!container) return;
    const otherUsers = users.filter(u => u.username !== currentAdmin.username);
    if (otherUsers.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">No other users</div>';
        return;
    }
    container.innerHTML = otherUsers.map(user => {
        const canModify = canModifyRole(currentAdmin.role, user.role);
        const isAdmin = user.role === ROLE_ADMIN;
        return `
            <div class="role-user-item">
                <div>
                    <strong>${escapeHtml(user.displayName || user.username)}</strong> (${escapeHtml(user.username)})
                    <span class="role-badge ${user.role}">${user.role === ROLE_OWNER ? '👑 Owner' : (user.role === ROLE_ADMIN ? '⚙️ Admin' : '👤 Member')}</span>
                </div>
                <div>
                    <label class="role-switch ${!canModify ? 'disabled' : ''}">
                        <input type="checkbox" class="role-checkbox" data-username="${escapeHtml(user.username)}" ${isAdmin ? 'checked' : ''} ${!canModify ? 'disabled' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span style="margin-left: 8px; font-size: 0.75rem;">Admin</span>
                </div>
            </div>
        `;
    }).join('');
    document.querySelectorAll('.role-checkbox:not([disabled])').forEach(cb => {
        cb.addEventListener('change', async (e) => {
            const username = cb.getAttribute('data-username');
            const user = users.find(u => u.username === username);
            if (user) {
                user.role = cb.checked ? ROLE_ADMIN : ROLE_MEMBER;
                saveUsers();
                renderRoleManagement();
                renderUsers();
                // Sync with network if available
                if (typeof AccountRoleNetwork !== 'undefined') {
                    if (user.role === ROLE_ADMIN) {
                        AccountRoleNetwork.addAdmin(username);
                    } else {
                        AccountRoleNetwork.removeAdmin(username);
                    }
                }
            }
        });
    });
}

function openUserDetailModal(username) {
    const user = users.find(u => u.username === username);
    if (!user) return;
    document.getElementById('modalUsername').innerText = `${user.displayName || user.username} (${user.username})`;
    const userReports = reports.filter(r => r.reportedUser === username);
    const reportsContainer = document.getElementById('modalReportsList');
    if (userReports.length === 0) {
        reportsContainer.innerHTML = '<div class="empty-placeholder">No reports against this user</div>';
    } else {
        reportsContainer.innerHTML = userReports.map(r => `
            <div class="report-small">
                <div>Reported by: ${escapeHtml(r.reporter)}</div>
                <div>Reason: ${escapeHtml(r.reason)}</div>
                <div>Time: ${new Date(r.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
    }
    document.getElementById('userDetailModal').setAttribute('data-current-username', username);
    openModal('userDetailModal');
    
    const canModify = canBanSuspend(currentAdmin.role, user.role);
    const banBtn = document.getElementById('banUserBtn');
    const suspendBtn = document.getElementById('suspendUserBtn');
    if (banBtn) banBtn.style.display = canModify ? 'flex' : 'none';
    if (suspendBtn) suspendBtn.style.display = canModify ? 'flex' : 'none';
}

function confirmBan(username) {
    const user = users.find(u => u.username === username);
    if (!user) return;
    if (!canBanSuspend(currentAdmin.role, user.role)) {
        alert('You cannot ban this user.');
        return;
    }
    const userReports = reports.filter(r => r.reportedUser === username);
    document.getElementById('banConfirmUsername').innerText = username;
    const banReportsDiv = document.getElementById('banReportsList');
    if (userReports.length === 0) {
        banReportsDiv.innerHTML = '<div class="empty-placeholder">No reports</div>';
    } else {
        banReportsDiv.innerHTML = userReports.map(r => `
            <div class="report-small">📢 ${escapeHtml(r.reason)} (by ${escapeHtml(r.reporter)})</div>
        `).join('');
    }
    openModal('banConfirmModal');
    document.getElementById('confirmBanBtn').onclick = () => {
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
            saveUsers();
            bannedUsers[username] = true;
            saveBanned();
            reports = reports.filter(r => r.reportedUser !== username);
            saveReports();
            closeModal('banConfirmModal');
            closeModal('userDetailModal');
            renderReports();
            renderUsers();
            renderRoleManagement();
            alert(`User ${username} has been banned and removed.`);
        } else {
            alert('User not found.');
            closeModal('banConfirmModal');
        }
    };
    document.getElementById('cancelBanBtn').onclick = () => closeModal('banConfirmModal');
}

function confirmSuspend(username) {
    const user = users.find(u => u.username === username);
    if (!user) return;
    if (!canBanSuspend(currentAdmin.role, user.role)) {
        alert('You cannot suspend this user.');
        return;
    }
    const userReports = reports.filter(r => r.reportedUser === username);
    document.getElementById('suspendConfirmUsername').innerText = username;
    const suspendReportsDiv = document.getElementById('suspendReportsList');
    if (userReports.length === 0) {
        suspendReportsDiv.innerHTML = '<div class="empty-placeholder">No reports</div>';
    } else {
        suspendReportsDiv.innerHTML = userReports.map(r => `
            <div class="report-small">📢 ${escapeHtml(r.reason)} (by ${escapeHtml(r.reporter)})</div>
        `).join('');
    }
    openModal('suspendConfirmModal');
    document.getElementById('confirmSuspendBtn').onclick = () => {
        const hours = parseInt(document.getElementById('suspendHours').value) || 24;
        const untilTimestamp = Date.now() + (hours * 60 * 60 * 1000);
        suspendedUsers[username] = untilTimestamp;
        saveSuspended();
        closeModal('suspendConfirmModal');
        closeModal('userDetailModal');
        alert(`User ${username} suspended for ${hours} hours.`);
    };
    document.getElementById('cancelSuspendBtn').onclick = () => closeModal('suspendConfirmModal');
}

// Modal helpers
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Navigation
function showAdminApp() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('adminMainView').style.display = 'block';
    document.getElementById('adminMenu').style.display = 'flex';
    showHome();
    renderReports();
    renderUsers();
    renderRoleManagement();
}

function showHome() {
    document.getElementById('homeView').classList.remove('hidden');
    document.getElementById('userView').classList.add('hidden');
    document.getElementById('roleView').classList.add('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('home');
    renderReports();
}
function showUser() {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('userView').classList.remove('hidden');
    document.getElementById('roleView').classList.add('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('user');
    renderUsers();
}
function showRole() {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('userView').classList.add('hidden');
    document.getElementById('roleView').classList.remove('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('role');
    renderRoleManagement();
}
function showSettings() {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('userView').classList.add('hidden');
    document.getElementById('roleView').classList.add('hidden');
    document.getElementById('settingsView').classList.remove('hidden');
    setActiveMenu('settings');
}

function setActiveMenu(active) {
    const btns = ['homeMenuBtn', 'userMenuBtn', 'roleMenuBtn', 'settingsMenuBtn'];
    btns.forEach(btn => {
        const el = document.getElementById(btn);
        if (el) el.classList.remove('active');
    });
    if (active === 'home') document.getElementById('homeMenuBtn').classList.add('active');
    else if (active === 'user') document.getElementById('userMenuBtn').classList.add('active');
    else if (active === 'role') document.getElementById('roleMenuBtn').classList.add('active');
    else if (active === 'settings') document.getElementById('settingsMenuBtn').classList.add('active');
}

// Theme
function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('leblox_admin_theme', theme);
}
const savedTheme = localStorage.getItem('leblox_admin_theme');
applyTheme(savedTheme === 'light' ? 'light' : 'dark');
document.getElementById('whiteThemeBtn').onclick = () => applyTheme('light');
document.getElementById('blackThemeBtn').onclick = () => applyTheme('dark');

// Event Listeners
document.getElementById('adminLoginBtn').onclick = () => {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value;
    if (adminLogin(username, password)) {
        document.getElementById('adminLoginError').innerText = '';
        showAdminApp();
    } else {
        document.getElementById('adminLoginError').innerText = 'Invalid credentials or not an admin';
    }
};
document.getElementById('adminLogoutBtn').onclick = () => {
    currentAdmin = null;
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('adminMainView').style.display = 'none';
    document.getElementById('adminMenu').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
};
document.getElementById('homeMenuBtn').onclick = showHome;
document.getElementById('userMenuBtn').onclick = showUser;
document.getElementById('roleMenuBtn').onclick = showRole;
document.getElementById('settingsMenuBtn').onclick = showSettings;
document.getElementById('refreshDataBtn').onclick = () => {
    loadData();
    renderReports();
    renderUsers();
    renderRoleManagement();
    alert('Data refreshed!');
};
document.getElementById('closeUserDetailBtn').onclick = () => closeModal('userDetailModal');
document.getElementById('banUserBtn').onclick = () => {
    const username = document.getElementById('userDetailModal').getAttribute('data-current-username');
    if (username) confirmBan(username);
};
document.getElementById('suspendUserBtn').onclick = () => {
    const username = document.getElementById('userDetailModal').getAttribute('data-current-username');
    if (username) confirmSuspend(username);
};

// Fix existing user roles in localStorage
function fixUserRoles() {
    const OWNER_LIST = ['LEOwner'];
    const ADMIN_LIST = ['LETester'];
    let changed = false;
    
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (OWNER_LIST.includes(user.username) && user.role !== 'owner') {
            user.role = 'owner';
            changed = true;
        } else if (ADMIN_LIST.includes(user.username) && user.role !== 'admin') {
            user.role = 'admin';
            changed = true;
        } else if (!OWNER_LIST.includes(user.username) && !ADMIN_LIST.includes(user.username) && user.role !== 'member') {
            user.role = 'member';
            changed = true;
        }
    }
    
    if (changed) {
        saveUsers();
        console.log('Fixed user roles in localStorage');
    }
}

// Initial load
loadData();
fixUserRoles();
document.getElementById('loginView').style.display = 'flex';
document.getElementById('adminMainView').style.display = 'none';
document.getElementById('adminMenu').style.display = 'none';

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}