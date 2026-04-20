// ==================== CLIENT API LIBRARY ====================
const API_URL = window.location.origin + '/server.php';

class LEBloxAPI {
    static async request(action, data = {}) {
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
    
    static async register(username, password) { return this.request('register', { username, password }); }
    static async login(username, password) { return this.request('login', { username, password }); }
    static async logout() { return this.request('logout'); }
    static async getSession() { return this.request('getSession'); }
    static async getAllUsers() { return this.request('getAllUsers'); }
    static async getReports() { return this.request('getReports'); }
    static async addReport(reportedUser, reason) { return this.request('addReport', { reportedUser, reason }); }
    static async deleteReport(index) { return this.request('deleteReport', { index }); }
    static async banUser(username) { return this.request('banUser', { username }); }
    static async suspendUser(username, hours) { return this.request('suspendUser', { username, hours }); }
    static async checkSuspended(username) { return this.request('checkSuspended', { username }); }
}

// Permission Levels
const PERMISSION = { OWNER: 1, ADMIN: 2, MEMBER: 3 };

function canAccessAdminPanel(level) { return level === PERMISSION.OWNER || level === PERMISSION.ADMIN; }
function getRoleBadge(level) {
    if (level === PERMISSION.OWNER) return '<span class="role-badge owner">👑 Owner</span>';
    if (level === PERMISSION.ADMIN) return '<span class="role-badge admin">⚙️ Admin</span>';
    return '<span class="role-badge member">👤 Member</span>';
}

// Export for use in other scripts
window.LEBloxAPI = LEBloxAPI;
window.PERMISSION = PERMISSION;
window.canAccessAdminPanel = canAccessAdminPanel;
window.getRoleBadge = getRoleBadge;