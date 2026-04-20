// ==================== ADMIN PANEL (web2.html) ====================

let currentAdmin = null;
let adminPermissionLevel = null;
let users = [];
let reports = [];

// ==================== API CONNECTION ====================
const API_URL = window.location.origin + '/server.php';

async function apiCall(action, data = {}) {
    try {
        const response = await fetch(`${API_URL}?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        return { success: false, error: 'Network error' };
    }
}

// ==================== PERMISSION LEVELS ====================
const LEVEL_OWNER = 1;
const LEVEL_ADMIN = 2;
const LEVEL_MEMBER = 3;

function canAccessAdminPanel(level) {
    return level === LEVEL_OWNER || level === LEVEL_ADMIN;
}

function canBanSuspend(adminLevel, targetLevel) {
    if (adminLevel === LEVEL_OWNER && targetLevel === LEVEL_OWNER) return false;
    if (adminLevel === LEVEL_OWNER) return true;
    return false;
}

function getRoleBadge(level) {
    if (level === LEVEL_OWNER) return '<span class="role-badge owner">👑 Owner</span>';
    if (level === LEVEL_ADMIN) return '<span class="role-badge admin">⚙️ Admin</span>';
    return '<span class="role-badge member">👤 Member</span>';
}

// ==================== LOAD DATA ====================
async function loadData() {
    const usersRes = await apiCall('getAllUsers');
    if (usersRes.success) users = usersRes.users;
    
    const reportsRes = await apiCall('getReports');
    if (reportsRes.success) reports = reportsRes.reports;
}

// ==================== ADMIN LOGIN ====================
async function adminLogin(username, password) {
    const result = await apiCall('login', { username, password });
    if (result.success && canAccessAdminPanel(result.permissionLevel)) {
        currentAdmin = result.user;
        adminPermissionLevel = result.permissionLevel;
        return true;
    }
    return false;
}

async function adminLogout() {
    await apiCall('logout');
    currentAdmin = null;
    adminPermissionLevel = null;
}

// ==================== UI RENDERING ====================
async function renderReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;
    await loadData();
    if (!reports.length) {
        container.innerHTML = '<div class="empty-placeholder">No reports yet</div>';
        return;
    }
    container.innerHTML = reports.map((report, idx) => `
        <div class="report-item" data-report-idx="${idx}">
            <div class="report-info">
                <div class="report-reporter">👤 Reported by: ${escapeHtml(report.reporter)}</div>
                <div class="report-reason">📝 Reason: ${escapeHtml(report.reason)}</div>
                <div class="report-time">🕒 ${new Date(report.timestamp * 1000).toLocaleString()}</div>
            </div>
            <div class="report-actions">
                <button class="delete-report-btn" data-idx="${idx}">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.getAttribute('data-idx'));
            await apiCall('deleteReport', { index: idx });
            await renderReports();
            if (!document.getElementById('userView').classList.contains('hidden')) await renderUsers();
        });
    });
}

async function renderUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;
    await loadData();
    const otherUsers = users.filter(u => u.username !== currentAdmin?.username);
    if (otherUsers.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">No other users found</div>';
        return;
    }
    container.innerHTML = otherUsers.map((user, idx) => `
        <div class="user-item" data-username="${escapeHtml(user.username)}">
            <div class="user-info">
                ${idx+1}. <strong>${escapeHtml(user.displayName || user.username)}</strong> (${escapeHtml(user.username)})
                ${getRoleBadge(user.permissionLevel)}
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

async function renderRoleManagement() {
    const container = document.getElementById('roleUsersList');
    if (!container) return;
    await loadData();
    const otherUsers = users.filter(u => u.username !== currentAdmin?.username);
    if (otherUsers.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">No other users</div>';
        return;
    }
    container.innerHTML = otherUsers.map(user => {
        const canModify = adminPermissionLevel === LEVEL_OWNER && user.permissionLevel !== LEVEL_OWNER;
        const isAdmin = user.permissionLevel === LEVEL_ADMIN;
        return `
            <div class="role-user-item">
                <div>
                    <strong>${escapeHtml(user.displayName || user.username)}</strong> (${escapeHtml(user.username)})
                    ${getRoleBadge(user.permissionLevel)}
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
        cb.addEventListener('change', async () => {
            const username = cb.getAttribute('data-username');
            // Role change would need an endpoint
            alert('Role change feature coming soon');
            await renderRoleManagement();
            await renderUsers();
        });
    });
}

async function openUserDetailModal(username) {
    await loadData();
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
                <div>Time: ${new Date(r.timestamp * 1000).toLocaleString()}</div>
            </div>
        `).join('');
    }
    document.getElementById('userDetailModal').setAttribute('data-current-username', username);
    openModal('userDetailModal');
    
    const canModify = canBanSuspend(adminPermissionLevel, user.permissionLevel);
    const banBtn = document.getElementById('banUserBtn');
    const suspendBtn = document.getElementById('suspendUserBtn');
    if (banBtn) banBtn.style.display = canModify ? 'flex' : 'none';
    if (suspendBtn) suspendBtn.style.display = canModify ? 'flex' : 'none';
}

async function confirmBan(username) {
    if (!confirm(`Are you sure you want to ban ${username}?`)) return;
    const result = await apiCall('banUser', { username });
    if (result.success) {
        alert(`User ${username} has been banned.`);
        await renderUsers();
        await renderRoleManagement();
        closeModal('banConfirmModal');
        closeModal('userDetailModal');
    } else {
        alert('Failed to ban user.');
    }
}

async function confirmSuspend(username) {
    const hours = parseInt(document.getElementById('suspendHours')?.value || 24);
    const result = await apiCall('suspendUser', { username, hours });
    if (result.success) {
        alert(`User ${username} suspended for ${hours} hours.`);
        closeModal('suspendConfirmModal');
        closeModal('userDetailModal');
    } else {
        alert('Failed to suspend user.');
    }
}

// Modal helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Navigation
async function showAdminApp() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('adminMainView').style.display = 'block';
    document.getElementById('adminMenu').style.display = 'flex';
    await showHome();
}

async function showHome() {
    document.getElementById('homeView').classList.remove('hidden');
    document.getElementById('userView').classList.add('hidden');
    document.getElementById('roleView').classList.add('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('home');
    await renderReports();
}

async function showUser() {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('userView').classList.remove('hidden');
    document.getElementById('roleView').classList.add('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('user');
    await renderUsers();
}

async function showRole() {
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('userView').classList.add('hidden');
    document.getElementById('roleView').classList.remove('hidden');
    document.getElementById('settingsView').classList.add('hidden');
    setActiveMenu('role');
    await renderRoleManagement();
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
    if (active === 'home') document.getElementById('homeMenuBtn')?.classList.add('active');
    else if (active === 'user') document.getElementById('userMenuBtn')?.classList.add('active');
    else if (active === 'role') document.getElementById('roleMenuBtn')?.classList.add('active');
    else if (active === 'settings') document.getElementById('settingsMenuBtn')?.classList.add('active');
}

// Theme
function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('leblox_admin_theme', theme);
}
const savedTheme = localStorage.getItem('leblox_admin_theme');
applyTheme(savedTheme === 'light' ? 'light' : 'dark');
document.getElementById('whiteThemeBtn')?.addEventListener('click', () => applyTheme('light'));
document.getElementById('blackThemeBtn')?.addEventListener('click', () => applyTheme('dark'));

// Event Listeners
document.getElementById('adminLoginBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('adminUsername')?.value.trim() || '';
    const password = document.getElementById('adminPassword')?.value || '';
    if (await adminLogin(username, password)) {
        document.getElementById('adminLoginError').innerText = '';
        await showAdminApp();
    } else {
        document.getElementById('adminLoginError').innerText = 'Invalid credentials or not an admin';
    }
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
    await adminLogout();
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('adminMainView').style.display = 'none';
    document.getElementById('adminMenu').style.display = 'none';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminPassword').value = '';
});

document.getElementById('homeMenuBtn')?.addEventListener('click', () => showHome());
document.getElementById('userMenuBtn')?.addEventListener('click', () => showUser());
document.getElementById('roleMenuBtn')?.addEventListener('click', () => showRole());
document.getElementById('settingsMenuBtn')?.addEventListener('click', () => showSettings());

document.getElementById('refreshDataBtn')?.addEventListener('click', async () => {
    await loadData();
    await renderReports();
    await renderUsers();
    await renderRoleManagement();
    alert('Data refreshed!');
});

document.getElementById('closeUserDetailBtn')?.addEventListener('click', () => closeModal('userDetailModal'));
document.getElementById('banUserBtn')?.addEventListener('click', () => {
    const username = document.getElementById('userDetailModal')?.getAttribute('data-current-username');
    if (username) confirmBan(username);
});
document.getElementById('suspendUserBtn')?.addEventListener('click', () => {
    const username = document.getElementById('userDetailModal')?.getAttribute('data-current-username');
    if (username) {
        openModal('suspendConfirmModal');
        document.getElementById('confirmSuspendBtn').onclick = () => confirmSuspend(username);
        document.getElementById('cancelSuspendBtn').onclick = () => closeModal('suspendConfirmModal');
    }
});

// Ban Confirm Modal
document.getElementById('confirmBanBtn')?.addEventListener('click', () => {
    const username = document.getElementById('banConfirmModal')?.getAttribute('data-ban-username');
    if (username) confirmBan(username);
});
document.getElementById('cancelBanBtn')?.addEventListener('click', () => closeModal('banConfirmModal'));

// Initial load
async function init() {
    document.getElementById('loginView').style.display = 'flex';
    document.getElementById('adminMainView').style.display = 'none';
    document.getElementById('adminMenu').style.display = 'none';
    await loadData();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

init();