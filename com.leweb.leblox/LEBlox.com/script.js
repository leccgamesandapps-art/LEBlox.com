// ==================== MAIN APP (web.html) ====================
// This script connects to server.php via LEBloxAPI

let currentUser = null;
let permissionLevel = null;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const offlineMsg = document.getElementById('offlineMessage');
const retryBtn = document.getElementById('retryBtn');
const welcomePage = document.getElementById('welcomePage');
const appContainer = document.getElementById('appContainer');
let loadingTimer = null;

// ==================== LOADING SCREEN ====================
function hideLoadingAndProceed() {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        checkAuthAndShow();
    }, 500);
}

function showOfflineMode() {
    if (loadingTimer) clearTimeout(loadingTimer);
    document.querySelector('.loading-spinner').style.display = 'none';
    offlineMsg.style.display = 'block';
}

function startLoadingCheck() {
    if (navigator.onLine) {
        loadingTimer = setTimeout(() => hideLoadingAndProceed(), 2000);
    } else {
        showOfflineMode();
    }
}
if (retryBtn) retryBtn.onclick = () => {
    offlineMsg.style.display = 'none';
    document.querySelector('.loading-spinner').style.display = 'block';
    startLoadingCheck();
};
window.addEventListener('online', () => { if (loadingScreen.style.display !== 'none') startLoadingCheck(); });
window.addEventListener('offline', () => { if (loadingScreen.style.display !== 'none') showOfflineMode(); });
startLoadingCheck();

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

function getUserPermissionLevel(username) {
    if (username === 'LEOwner') return LEVEL_OWNER;
    if (username === 'LETester') return LEVEL_ADMIN;
    return LEVEL_MEMBER;
}

function canAccessAdminPanel(level) {
    return level === LEVEL_OWNER || level === LEVEL_ADMIN;
}

function getRoleBadge(level) {
    if (level === LEVEL_OWNER) return '<span class="role-badge owner">👑 Owner</span>';
    if (level === LEVEL_ADMIN) return '<span class="role-badge admin">⚙️ Admin</span>';
    return '<span class="role-badge member">👤 Member</span>';
}

// ==================== AUTH FUNCTIONS ====================
async function checkAuthAndShow() {
    const result = await apiCall('getSession');
    if (result.success) {
        currentUser = result.user;
        permissionLevel = result.permissionLevel;
        welcomePage.style.display = 'none';
        appContainer.style.display = 'flex';
        loadMainApp();
        updateSettingsUI();
        updateProfileInfoUI();
        await updateFriendRequestsUI();
        await updateFriendsListUI();
    } else {
        welcomePage.style.display = 'flex';
        appContainer.style.display = 'none';
    }
}

async function register(username, password) {
    const res = await apiCall('register', { username, password });
    if (res.success) return { success: true };
    return { success: false, msgKey: 'usernameExists' };
}

async function login(username, password) {
    const res = await apiCall('login', { username, password });
    if (res.success) {
        currentUser = res.user;
        permissionLevel = res.permissionLevel;
        return { success: true };
    }
    return { success: false, msgKey: 'loginError' };
}

async function logout() {
    await apiCall('logout');
    currentUser = null;
    permissionLevel = null;
    welcomePage.style.display = 'flex';
    appContainer.style.display = 'none';
}

async function updatePassword(username, newPassword) {
    // Password update would need a separate endpoint
    return true;
}

async function addReport(reportedUser, reason) {
    const res = await apiCall('addReport', { reportedUser, reason });
    if (res.success) alert('Report sent to admin.');
    else alert('Failed to send report');
}

// ==================== FRIEND SYSTEM ====================
async function sendFriendRequest(toUsername) {
    // Friend request endpoint needed
    alert('Friend request feature coming soon');
}

async function acceptFriendRequest(fromUsername) {
    alert('Accept friend feature coming soon');
}

async function declineFriendRequest(fromUsername) {
    alert('Decline friend feature coming soon');
}

async function updateFriendRequestsUI() {
    const container = document.getElementById('friendRequestsList');
    if (!container) return;
    container.innerHTML = '<div class="empty-placeholder">No pending requests</div>';
}

async function updateFriendsListUI() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    container.innerHTML = '<div class="empty-placeholder">No friends yet</div>';
}

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        loadingTitle: "LEBlox", loadingSubtitle: "Loading experience...", offlineText: "📡 pls check your internet/wifi and try again", retryBtn: "Retry",
        welcomeTitle: "Welcome to LEBlox", registerBtn: "Register", loginBtn: "Login",
        registerTitle: "Register", loginTitle: "Login", changePwdTitle: "Change Password", showPwdTitle: "Account Password",
        usernamePlaceholder: "Username", passwordPlaceholder: "Password (8-16 chars, letter+number)",
        oldPasswordPlaceholder: "Current Password", newPasswordPlaceholder: "New Password (8-16 chars)", confirmPasswordPlaceholder: "Confirm New Password",
        passwordHint: "Must contain uppercase, lowercase, number. Symbol optional.",
        registerSubmit: "Register", loginSubmit: "Login", updateBtn: "Update", cancelBtn: "Cancel", closeBtn: "Close",
        changePasswordBtn: "Change Password", showPasswordBtn: "Show password", passwordLabel: "Password:", passwordLabelShort: "Password:",
        homeText: "⚡ Empty Page - Tester Only", appTitle: "LEBlox",
        allChat: "All", friendChat: "Friend", groupChat: "Group Chat", communityChat: "Community",
        allChatPlaceholder: "All Chat - Empty Page - Tester Only", friendChatPlaceholder: "Friend Chat - Empty Page - Tester Only",
        groupChatPlaceholder: "Group Chat - Empty Page - Tester Only", communityChatPlaceholder: "Community Chat - Empty Page - Tester Only",
        settingsTitle: "⚙️ Settings", accountLabel: "ACCOUNT", securityLabel: "SECURITY", languageLabel: "LANGUAGE", themeLabel: "THEME", aboutLabel: "ABOUT",
        displayLabel: "Display:", usernameLabel: "Username:", userIdLabel: "User ID:",
        nameLabel: "Name:", websiteLabel: "Website:", versionLabel: "Version:",
        whiteTheme: "☀️ White", blackTheme: "🌙 Black", logoutBtn: "Log out",
        homeMenu: "Home", exploreMenu: "Explore", profileMenu: "Profile", chatMenu: "Chat", settingsMenu: "Settings",
        usernameExists: "Username already exists", invalidPassword: "Password must be 8-16 chars, include uppercase, lowercase, number",
        loginError: "Wrong username/password or account does not exist", registerNow: "Register",
        searchPlaceholder: "Search...", allFilter: "All", userFilter: "User", gameFilter: "Game", explorePlaceholder: "All - Tester Only",
        profileTab: "Profile", avatarTab: "Avatar", displayNameLabel: "Display Name:", changeDisplayBtn: "Change Display", usernameLabelShort: "Username:", changeUsernameBtn: "Change Username", avatar2d: "2D Avatar", avatar2dLabel: "2D Avatar", closetTab: "Closet", shopTab: "Shop", closetEmpty: "Closet - Empty - Tester Only", shopEmpty: "Shop - Empty - Tester Only", changeUsernameTitle: "Change Username", changeUsernameNotAvailable: "Change Username not Available - Tester Only Page",
        friendRequestsTitle: "Friend Requests", friendsListTitle: "Friends", noRequests: "No pending requests", noFriends: "No friends yet",
        addFriend: "Add Friend", requestSent: "Request Sent", friendsStatus: "Friends", noUsersFound: "No users found", gamePlaceholder: "Games - Tester Only",
        avatarLabel: "Avatar:", changeAvatarBtn: "Change Avatar",
        privacyTitle: "Privacy Settings", showUserIdLabel: "Show Your User ID:", showFriendsLabel: "Show Friends:",
        noOne: "No One", friendsOnly: "Friends", everyone: "Everyone", saveBtn: "Save",
        userInfoTitle: "User Information", usersTitle: "Users", gamesTitle: "Games",
        descriptionLabel: "Description:", editDescBtn: "Edit", clearDescBtn: "Clear"
    },
    es: {}, fr: {}, de: {}, ja: {}
};
for (let lang of ['es','fr','de','ja']) {
    if (!translations[lang]) translations[lang] = {};
    Object.keys(translations.en).forEach(key => { if (!translations[lang][key]) translations[lang][key] = translations.en[key]; });
}

let currentLang = 'en';

function applyLanguageOnlyText() {
    const t = translations[currentLang];
    if (!t) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('leblox_lang', lang);
    applyLanguageOnlyText();
    const activeCat = document.querySelector('.category-card.active')?.getAttribute('data-category') || 'all';
    updateCategoryText(activeCat);
}

function updateCategoryText(category) {
    const t = translations[currentLang];
    const catTextElem = document.getElementById('categoryText');
    if (!catTextElem) return;
    let text = '';
    switch(category) {
        case 'all': text = t.allChatPlaceholder; break;
        case 'friend': text = t.friendChatPlaceholder; break;
        case 'group': text = t.groupChatPlaceholder; break;
        case 'community': text = t.communityChatPlaceholder; break;
        default: text = t.allChatPlaceholder;
    }
    catTextElem.textContent = text;
}

// ==================== MODALS ====================
const registerModal = document.getElementById('registerModal');
const loginModal = document.getElementById('loginModal');
const changePwdModal = document.getElementById('changePwdModal');
const showPwdModal = document.getElementById('showPwdModal');
const changeUsernameModal = document.getElementById('changeUsernameModal');
const privacyModal = document.getElementById('privacyModal');
const userInfoModal = document.getElementById('userInfoModal');

function openModal(modal) { if (modal) modal.classList.add('active'); }
function closeModal(modal) { if (modal) modal.classList.remove('active'); }

if (document.getElementById('welcomeRegisterBtn')) {
    document.getElementById('welcomeRegisterBtn').onclick = () => openModal(registerModal);
    document.getElementById('welcomeLoginBtn').onclick = () => openModal(loginModal);
    document.getElementById('registerCancelBtn').onclick = () => closeModal(registerModal);
    document.getElementById('loginCancelBtn').onclick = () => closeModal(loginModal);
    document.getElementById('changePwdCancelBtn').onclick = () => closeModal(changePwdModal);
    document.getElementById('closeShowPwdBtn').onclick = () => closeModal(showPwdModal);
    document.getElementById('changeFromShowBtn').onclick = () => { closeModal(showPwdModal); openModal(changePwdModal); };
    document.getElementById('closeUsernameModalBtn').onclick = () => closeModal(changeUsernameModal);
    document.getElementById('closePrivacyBtn').onclick = () => closeModal(privacyModal);
    document.getElementById('closeUserInfoBtn').onclick = () => closeModal(userInfoModal);
}

// Register
if (document.getElementById('registerSubmitBtn')) {
    document.getElementById('registerSubmitBtn').onclick = async () => {
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const res = await register(username, password);
        if (res.success) {
            closeModal(registerModal);
            openModal(loginModal);
            document.getElementById('registerError').innerHTML = '';
        } else {
            document.getElementById('registerError').innerHTML = translations[currentLang][res.msgKey] || 'Registration failed';
        }
    };
}

// Login
if (document.getElementById('loginSubmitBtn')) {
    document.getElementById('loginSubmitBtn').onclick = async () => {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const res = await login(username, password);
        if (res.success) {
            closeModal(loginModal);
            welcomePage.style.display = 'none';
            appContainer.style.display = 'flex';
            loadMainApp();
            updateSettingsUI();
            updateProfileInfoUI();
            await updateFriendRequestsUI();
            await updateFriendsListUI();
            document.getElementById('loginError').innerHTML = '';
        } else {
            const t = translations[currentLang];
            document.getElementById('loginError').innerHTML = `${t.loginError}<br><button id="loginErrorRegisterBtn" style="margin-top:8px; background:#3b82f6; border:none; padding:6px 16px; border-radius:30px; color:white; cursor:pointer;">${t.registerNow}</button>`;
            const errorRegisterBtn = document.getElementById('loginErrorRegisterBtn');
            if (errorRegisterBtn) errorRegisterBtn.onclick = () => { closeModal(loginModal); openModal(registerModal); };
        }
    };
}

// Logout
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').onclick = () => { logout(); };
}

// ==================== PROFILE UI ====================
function updateSettingsUI() {
    if (!currentUser) return;
    if (document.getElementById('accountDisplay')) document.getElementById('accountDisplay').innerText = currentUser.displayName;
    if (document.getElementById('accountUsername')) document.getElementById('accountUsername').innerText = currentUser.username;
    if (document.getElementById('accountUserId')) document.getElementById('accountUserId').innerText = currentUser.userId;
}

function updateProfileInfoUI() {
    if (!currentUser) return;
    if (document.getElementById('profileDisplayName')) document.getElementById('profileDisplayName').innerText = currentUser.displayName;
    if (document.getElementById('profileUsername')) document.getElementById('profileUsername').innerText = currentUser.username;
    if (document.getElementById('profileDescription')) document.getElementById('profileDescription').innerText = currentUser.description || "(no description)";
    if (document.getElementById('profileAvatarPreview')) document.getElementById('profileAvatarPreview').innerText = currentUser.avatar || '👤';
    if (document.getElementById('avatarLargePreview')) document.getElementById('avatarLargePreview').innerText = currentUser.avatar || '👤';
}

// Avatar change
const avatarOptions = ['👤', '😀', '😎', '🐱', '🐶', '🦊', '🐼', '⭐', '❤️', '🔥', '👍', '🎮'];
if (document.getElementById('changeAvatarBtn')) {
    document.getElementById('changeAvatarBtn').onclick = () => {
        let pickerHtml = `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">`;
        avatarOptions.forEach(emoji => {
            pickerHtml += `<button class="avatar-option" style="font-size:1.8rem; background:transparent; border:none; cursor:pointer;">${emoji}</button>`;
        });
        pickerHtml += `</div>`;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `<div class="modal-content"><h3>Choose Avatar</h3>${pickerHtml}<div class="modal-buttons"><button id="cancelAvatarBtn">Cancel</button></div></div>`;
        document.body.appendChild(modal);
        modal.querySelectorAll('.avatar-option').forEach(btn => {
            btn.onclick = () => {
                currentUser.avatar = btn.textContent;
                updateProfileInfoUI();
                modal.remove();
            };
        });
        modal.querySelector('#cancelAvatarBtn').onclick = () => modal.remove();
    };
}

// Description edit/clear
if (document.getElementById('editDescriptionBtn')) {
    document.getElementById('editDescriptionBtn').onclick = () => {
        const newDesc = prompt('Enter your description (max 200 characters):', currentUser.description);
        if (newDesc !== null && newDesc.length <= 200) {
            currentUser.description = newDesc;
            updateProfileInfoUI();
        } else if (newDesc && newDesc.length > 200) alert('Description too long (max 200 chars)');
    };
}
if (document.getElementById('clearDescriptionBtn')) {
    document.getElementById('clearDescriptionBtn').onclick = () => {
        if (confirm('Clear your description?')) {
            currentUser.description = "";
            updateProfileInfoUI();
        }
    };
}

if (document.getElementById('changeDisplayNameBtn')) {
    document.getElementById('changeDisplayNameBtn').onclick = () => {
        const newName = prompt('Enter new display name:', currentUser.displayName);
        if (newName && newName.trim()) {
            currentUser.displayName = newName.trim();
            updateProfileInfoUI();
            updateSettingsUI();
            alert('Display name updated!');
        }
    };
}
if (document.getElementById('changeUsernameBtn')) document.getElementById('changeUsernameBtn').onclick = () => openModal(changeUsernameModal);
if (document.getElementById('profileSettingsBtn')) {
    document.getElementById('profileSettingsBtn').onclick = () => {
        if (document.getElementById('userIdVisibility')) document.getElementById('userIdVisibility').value = currentUser.privacy?.userId || 'everyone';
        if (document.getElementById('friendsVisibility')) document.getElementById('friendsVisibility').value = currentUser.privacy?.friendsList || 'everyone';
        openModal(privacyModal);
    };
}
if (document.getElementById('savePrivacyBtn')) {
    document.getElementById('savePrivacyBtn').onclick = () => {
        if (currentUser.privacy) {
            currentUser.privacy.userId = document.getElementById('userIdVisibility').value;
            currentUser.privacy.friendsList = document.getElementById('friendsVisibility').value;
            closeModal(privacyModal);
        }
    };
}

// Profile/Avatar tabs
const profileInfoBtn = document.getElementById('profileInfoBtn');
const avatarInfoBtn = document.getElementById('avatarInfoBtn');
const profileInfoPanel = document.getElementById('profileInfoPanel');
const avatarPanel = document.getElementById('avatarPanel');
if (profileInfoBtn && avatarInfoBtn) {
    profileInfoBtn.onclick = () => {
        profileInfoBtn.classList.add('active');
        avatarInfoBtn.classList.remove('active');
        if (profileInfoPanel) profileInfoPanel.classList.remove('hidden');
        if (avatarPanel) avatarPanel.classList.add('hidden');
    };
    avatarInfoBtn.onclick = () => {
        avatarInfoBtn.classList.add('active');
        profileInfoBtn.classList.remove('active');
        if (profileInfoPanel) profileInfoPanel.classList.add('hidden');
        if (avatarPanel) avatarPanel.classList.remove('hidden');
    };
}

// Closet/Shop tabs
const closetTabBtn = document.getElementById('closetTabBtn');
const shopTabBtn = document.getElementById('shopTabBtn');
const closetPanel = document.getElementById('closetPanel');
const shopPanel = document.getElementById('shopPanel');
if (closetTabBtn && shopTabBtn) {
    closetTabBtn.onclick = () => {
        closetTabBtn.classList.add('active');
        shopTabBtn.classList.remove('active');
        if (closetPanel) closetPanel.classList.remove('hidden');
        if (shopPanel) shopPanel.classList.add('hidden');
    };
    shopTabBtn.onclick = () => {
        shopTabBtn.classList.add('active');
        closetTabBtn.classList.remove('active');
        if (closetPanel) closetPanel.classList.add('hidden');
        if (shopPanel) shopPanel.classList.remove('hidden');
    };
}

// ==================== NAVIGATION ====================
const homeView = document.getElementById('homeView');
const exploreView = document.getElementById('exploreView');
const profileView = document.getElementById('profileView');
const chatView = document.getElementById('chatView');
const settingsView = document.getElementById('settingsView');
const homeMenuBtn = document.getElementById('homeMenuBtn');
const exploreMenuBtn = document.getElementById('exploreMenuBtn');
const profileMenuBtn = document.getElementById('profileMenuBtn');
const chatMenuBtn = document.getElementById('chatMenuBtn');
const settingsMenuBtn = document.getElementById('settingsMenuBtn');

function setActiveMenu(active) {
    const btns = [homeMenuBtn, exploreMenuBtn, profileMenuBtn, chatMenuBtn, settingsMenuBtn];
    btns.forEach(btn => { if (btn) btn.classList.remove('active'); });
    if (active === 'home' && homeMenuBtn) homeMenuBtn.classList.add('active');
    else if (active === 'explore' && exploreMenuBtn) exploreMenuBtn.classList.add('active');
    else if (active === 'profile' && profileMenuBtn) profileMenuBtn.classList.add('active');
    else if (active === 'chat' && chatMenuBtn) chatMenuBtn.classList.add('active');
    else if (active === 'settings' && settingsMenuBtn) settingsMenuBtn.classList.add('active');
}

function showHome() { 
    if (homeView) homeView.classList.remove('hidden');
    if (exploreView) exploreView.classList.add('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (chatView) chatView.classList.add('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    setActiveMenu('home');
}
function showExplore() { 
    if (homeView) homeView.classList.add('hidden');
    if (exploreView) exploreView.classList.remove('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (chatView) chatView.classList.add('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    setActiveMenu('explore');
}
function showProfile() { 
    if (homeView) homeView.classList.add('hidden');
    if (exploreView) exploreView.classList.add('hidden');
    if (profileView) profileView.classList.remove('hidden');
    if (chatView) chatView.classList.add('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    setActiveMenu('profile');
}
function showChat() { 
    if (homeView) homeView.classList.add('hidden');
    if (exploreView) exploreView.classList.add('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (chatView) chatView.classList.remove('hidden');
    if (settingsView) settingsView.classList.add('hidden');
    setActiveMenu('chat');
}
function showSettings() { 
    if (homeView) homeView.classList.add('hidden');
    if (exploreView) exploreView.classList.add('hidden');
    if (profileView) profileView.classList.add('hidden');
    if (chatView) chatView.classList.add('hidden');
    if (settingsView) settingsView.classList.remove('hidden');
    setActiveMenu('settings');
}

if (homeMenuBtn) homeMenuBtn.onclick = showHome;
if (exploreMenuBtn) exploreMenuBtn.onclick = showExplore;
if (profileMenuBtn) profileMenuBtn.onclick = showProfile;
if (chatMenuBtn) chatMenuBtn.onclick = showChat;
if (settingsMenuBtn) settingsMenuBtn.onclick = showSettings;

// ==================== EXPLORE ====================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const exploreResults = document.getElementById('exploreResults');
let currentFilter = 'all';

function showUserInfo(user) {
    if (document.getElementById('infoAvatar')) document.getElementById('infoAvatar').innerHTML = user.avatar || '👤';
    if (document.getElementById('infoDisplayName')) document.getElementById('infoDisplayName').innerText = user.displayName;
    if (document.getElementById('infoUsername')) document.getElementById('infoUsername').innerText = user.username;
    if (document.getElementById('infoUserId')) document.getElementById('infoUserId').innerText = user.userId;
    if (document.getElementById('infoDescription')) document.getElementById('infoDescription').innerText = user.description || '(no description)';
    openModal(userInfoModal);
}

async function updateExploreResults() {
    if (!exploreResults) return;
    const searchTerm = searchInput?.value.trim().toLowerCase() || '';
    
    if (currentFilter === 'all') {
        const usersResult = await apiCall('getAllUsers');
        if (usersResult.success) {
            const otherUsers = usersResult.users.filter(u => u.username !== currentUser?.username);
            let filteredUsers = otherUsers;
            if (searchTerm) {
                filteredUsers = otherUsers.filter(u => u.username.toLowerCase().includes(searchTerm) || u.displayName.toLowerCase().includes(searchTerm));
            }
            const usersHtml = filteredUsers.map(user => `
                <div class="user-list-item clickable" data-username="${escapeHtml(user.username)}">
                    <span class="user-list-username">${escapeHtml(user.displayName)} (${escapeHtml(user.username)}) ${getRoleBadge(user.permissionLevel)}</span>
                </div>
            `).join('');
            const gamesHtml = `<div class="user-list-item">🎮 Sample Game - Tester Only</div><div class="user-list-item">🕹️ Another Game - Coming Soon</div>`;
            exploreResults.innerHTML = `
                <div class="all-users-section"><h4>Users</h4>${usersHtml || '<div>No users found</div>'}</div>
                <div class="all-games-section"><h4>Games</h4>${gamesHtml}</div>
            `;
            document.querySelectorAll('.all-users-section .user-list-item').forEach(item => {
                const username = item.getAttribute('data-username');
                item.addEventListener('click', async () => {
                    const usersRes = await apiCall('getAllUsers');
                    const targetUser = usersRes.users?.find(u => u.username === username);
                    if (targetUser) showUserInfo(targetUser);
                });
            });
        }
    } else if (currentFilter === 'user') {
        const usersResult = await apiCall('getAllUsers');
        if (usersResult.success) {
            const otherUsers = usersResult.users.filter(u => u.username !== currentUser?.username);
            let filtered = otherUsers;
            if (searchTerm) {
                filtered = otherUsers.filter(u => u.username.toLowerCase().includes(searchTerm) || u.displayName.toLowerCase().includes(searchTerm));
            }
            if (filtered.length === 0) {
                exploreResults.innerHTML = `<p>No users found</p>`;
                return;
            }
            const t = translations[currentLang];
            exploreResults.innerHTML = filtered.map(user => `
                <div class="user-list-item clickable" data-username="${escapeHtml(user.username)}">
                    <div>
                        <span class="user-list-username">${escapeHtml(user.displayName)} (${escapeHtml(user.username)}) ${getRoleBadge(user.permissionLevel)}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="friend-action-btn" data-username="${escapeHtml(user.username)}">${t.addFriend}</button>
                        <button class="report-user-btn" data-username="${escapeHtml(user.username)}">🚩 Report</button>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('.user-list-item').forEach(item => {
                const username = item.getAttribute('data-username');
                item.addEventListener('click', async (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    const usersRes = await apiCall('getAllUsers');
                    const targetUser = usersRes.users?.find(u => u.username === username);
                    if (targetUser) showUserInfo(targetUser);
                });
            });
            document.querySelectorAll('.friend-action-btn').forEach(btn => {
                btn.onclick = (e) => { e.stopPropagation(); alert('Friend request coming soon'); };
            });
            document.querySelectorAll('.report-user-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    const reportedUsername = btn.getAttribute('data-username');
                    const reason = prompt(`Why are you reporting ${reportedUsername}?`, "Spam, harassment, etc.");
                    if (reason && reason.trim()) {
                        await addReport(reportedUsername, reason);
                    }
                };
            });
        }
    } else if (currentFilter === 'game') {
        exploreResults.innerHTML = `<p>Games - Tester Only</p><div class="user-list-item">🎮 Sample Game</div><div class="user-list-item">🕹️ Another Game</div>`;
    }
    applyLanguageOnlyText();
}

if (filterBtns.length) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            updateExploreResults();
        });
    });
}
if (searchBtn) searchBtn.addEventListener('click', updateExploreResults);
if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') updateExploreResults(); });

// Chat categories
const catCards = document.querySelectorAll('.category-card');
catCards.forEach(card => {
    card.onclick = () => {
        catCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateCategoryText(card.getAttribute('data-category'));
    };
});

// Theme
const whiteThemeBtn = document.getElementById('whiteThemeBtn');
const blackThemeBtn = document.getElementById('blackThemeBtn');
function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('leblox_theme', theme);
}
const savedTheme = localStorage.getItem('leblox_theme');
applyTheme(savedTheme === 'light' ? 'light' : 'dark');
if (whiteThemeBtn) whiteThemeBtn.onclick = () => applyTheme('light');
if (blackThemeBtn) blackThemeBtn.onclick = () => applyTheme('dark');

// Language
const langSelect = document.getElementById('languageSelect');
function loadSavedLanguage() {
    const saved = localStorage.getItem('leblox_lang');
    if (saved && translations[saved]) { currentLang = saved; if (langSelect) langSelect.value = saved; }
    else { currentLang = 'en'; if (langSelect) langSelect.value = 'en'; }
    applyLanguage(currentLang);
}
if (langSelect) langSelect.onchange = (e) => applyLanguage(e.target.value);

function loadMainApp() {
    showHome();
    updateSettingsUI();
    updateProfileInfoUI();
    if (profileInfoBtn) profileInfoBtn.classList.add('active');
    if (avatarInfoBtn) avatarInfoBtn.classList.remove('active');
    if (profileInfoPanel) profileInfoPanel.classList.remove('hidden');
    if (avatarPanel) avatarPanel.classList.add('hidden');
    if (closetTabBtn) closetTabBtn.classList.add('active');
    if (shopTabBtn) shopTabBtn.classList.remove('active');
    if (closetPanel) closetPanel.classList.remove('hidden');
    if (shopPanel) shopPanel.classList.add('hidden');
    applyLanguage(currentLang);
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

loadSavedLanguage();