// ==================== LOADING SCREEN ====================
const loadingScreen = document.getElementById('loadingScreen');
const offlineMsg = document.getElementById('offlineMessage');
const retryBtn = document.getElementById('retryBtn');
const welcomePage = document.getElementById('welcomePage');
const appContainer = document.getElementById('appContainer');
let loadingTimer = null;

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
retryBtn.onclick = () => {
    offlineMsg.style.display = 'none';
    document.querySelector('.loading-spinner').style.display = 'block';
    startLoadingCheck();
};
window.addEventListener('online', () => { if (loadingScreen.style.display !== 'none') startLoadingCheck(); });
window.addEventListener('offline', () => { if (loadingScreen.style.display !== 'none') showOfflineMode(); });
startLoadingCheck();

// Connect to Account Role Network
if (typeof AccountRoleNetwork !== 'undefined') {
    console.log('Connected to Account Role Network');
    AccountRoleNetwork.on('suspendedUpdated', function() {
        if (currentUser && AccountRoleNetwork.isSuspended(currentUser.username)) {
            logout();
            alert('Your account has been suspended by an admin.');
        }
    });
}

// ==================== ACCOUNT SYSTEM ====================
let currentUser = null;
let users = [];

const STORAGE_USERS = 'leblox_users';
const STORAGE_CURRENT = 'leblox_currentUser';
const STORAGE_NEXT_ID = 'leblox_nextId';
const STORAGE_REPORTS = 'leblox_reports';
const STORAGE_SUSPENDED = 'leblox_suspended';

const ROLE_OWNER = 'owner';
const ROLE_ADMIN = 'admin';
const ROLE_MEMBER = 'member';

function addReport(reportedUser, reason) {
    let reports = JSON.parse(localStorage.getItem(STORAGE_REPORTS) || '[]');
    reports.push({
        reportedUser: reportedUser,
        reporter: currentUser.username,
        reason: reason,
        timestamp: Date.now()
    });
    localStorage.setItem(STORAGE_REPORTS, JSON.stringify(reports));
    alert('Report sent to admin.');
    if (typeof AccountRoleNetwork !== 'undefined') {
        AccountRoleNetwork.addReport({ reportedUser, reporter: currentUser.username, reason });
    }
}

function loadUsers() {
    const stored = localStorage.getItem(STORAGE_USERS);
    if (stored) users = JSON.parse(stored);
    else users = [];
    let nextId = localStorage.getItem(STORAGE_NEXT_ID);
    if (!nextId) {
        nextId = 1;
        localStorage.setItem(STORAGE_NEXT_ID, nextId);
    }
    const testAccounts = [
        { username: 'LEOwner', password: 'LEOwner@2011', avatar: '👑', role: ROLE_OWNER },
        { username: 'LETester', password: 'LETester@2024', avatar: '🧪', role: ROLE_ADMIN }
    ];
    for (let acc of testAccounts) {
        if (!users.find(u => u.username === acc.username)) {
            const newId = parseInt(localStorage.getItem(STORAGE_NEXT_ID));
            const userIdStr = `LE${String(newId).padStart(8, '0')}`;
            users.push({
                username: acc.username,
                password: acc.password,
                displayName: acc.username,
                userId: userIdStr,
                createdAt: Date.now(),
                friends: [],
                sentRequests: [],
                receivedRequests: [],
                description: "",
                avatar: acc.avatar,
                privacy: { userId: "everyone", friendsList: "everyone" },
                role: acc.role
            });
            localStorage.setItem(STORAGE_NEXT_ID, newId + 1);
        }
    }
    users.forEach(u => {
        if (!u.friends) u.friends = [];
        if (!u.sentRequests) u.sentRequests = [];
        if (!u.receivedRequests) u.receivedRequests = [];
        if (!u.description) u.description = "";
        if (!u.avatar) u.avatar = "👤";
        if (!u.privacy) u.privacy = { userId: "everyone", friendsList: "everyone" };
        if (!u.role) u.role = ROLE_MEMBER;
    });
    saveUsers();
}
function saveUsers() { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }

function getNextUserId() {
    let next = parseInt(localStorage.getItem(STORAGE_NEXT_ID)) || 1;
    const idStr = `LE${String(next).padStart(8, '0')}`;
    localStorage.setItem(STORAGE_NEXT_ID, next + 1);
    return idStr;
}
function validatePassword(pwd) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,16}$/;
    return regex.test(pwd);
}
function register(username, password) {
    if (users.find(u => u.username === username)) return { success: false, msgKey: 'usernameExists' };
    if (!validatePassword(password)) return { success: false, msgKey: 'invalidPassword' };
    const userId = getNextUserId();
    const newUser = {
        username, password, displayName: username, userId, createdAt: Date.now(),
        friends: [], sentRequests: [], receivedRequests: [],
        description: "", avatar: "👤",
        privacy: { userId: "everyone", friendsList: "everyone" },
        role: ROLE_MEMBER
    };
    users.push(newUser);
    saveUsers();
    return { success: true, user: newUser };
}

function getRoleBadge(role) {
    if (role === ROLE_OWNER) return '<span class="role-badge owner">👑 Owner</span>';
    if (role === ROLE_ADMIN) return '<span class="role-badge admin">⚙️ Admin</span>';
    return '<span class="role-badge member">👤 Member</span>';
}

let suspendedModal = null;

function showSuspendedModal(username, remainingMs) {
    if (suspendedModal) suspendedModal.remove();
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    suspendedModal = document.createElement('div');
    suspendedModal.className = 'modal active';
    suspendedModal.innerHTML = `
        <div class="modal-content suspended-modal">
            <div class="suspended-icon">⛔</div>
            <h3>Your account is suspended</h3>
            <div class="suspended-timer">
                <span class="timer-label">Time remaining:</span>
                <span class="timer-value">${hours}h ${minutes}m</span>
            </div>
            <p>Please wait until the suspension ends.</p>
            <div class="modal-buttons">
                <button id="suspendedLogoutBtn" class="logout-suspend-btn">Log out</button>
            </div>
        </div>
    `;
    document.body.appendChild(suspendedModal);
    document.getElementById('suspendedLogoutBtn').onclick = () => {
        suspendedModal.remove();
        suspendedModal = null;
        closeModal(loginModal);
    };
}

function login(username, password) {
    const suspended = JSON.parse(localStorage.getItem(STORAGE_SUSPENDED) || '{}');
    if (suspended[username] && suspended[username] > Date.now()) {
        const remainingMs = suspended[username] - Date.now();
        showSuspendedModal(username, remainingMs);
        return { success: false, msgKey: 'suspended' };
    }
    if (suspended[username] && suspended[username] <= Date.now()) {
        delete suspended[username];
        localStorage.setItem(STORAGE_SUSPENDED, JSON.stringify(suspended));
    }
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return { success: false, msgKey: 'loginError' };
    return { success: true, user };
}
function updatePassword(username, newPassword) {
    const user = users.find(u => u.username === username);
    if (!user) return false;
    if (!validatePassword(newPassword)) return false;
    user.password = newPassword;
    saveUsers();
    return true;
}
function logout() {
    localStorage.removeItem(STORAGE_CURRENT);
    currentUser = null;
    welcomePage.style.display = 'flex';
    appContainer.style.display = 'none';
}
function checkAuthAndShow() {
    const saved = localStorage.getItem(STORAGE_CURRENT);
    if (saved) {
        const user = users.find(u => u.username === saved);
        if (user) {
            currentUser = user;
            welcomePage.style.display = 'none';
            appContainer.style.display = 'flex';
            loadMainApp();
            updateSettingsUI();
            updateProfileInfoUI();
            updateFriendRequestsUI();
            updateFriendsListUI();
            return;
        }
    }
    welcomePage.style.display = 'flex';
    appContainer.style.display = 'none';
}
loadUsers();

// ==================== FRIEND SYSTEM ====================
function sendFriendRequest(toUsername) {
    if (toUsername === currentUser.username) return;
    const targetUser = users.find(u => u.username === toUsername);
    if (!targetUser) return;
    if (currentUser.friends.includes(toUsername)) return;
    if (currentUser.sentRequests.includes(toUsername)) return;
    currentUser.sentRequests.push(toUsername);
    targetUser.receivedRequests.push(currentUser.username);
    saveUsers();
    updateExploreResults();
    updateFriendRequestsUI();
    updateFriendsListUI();
}

function acceptFriendRequest(fromUsername) {
    const fromUser = users.find(u => u.username === fromUsername);
    if (!fromUser) return;
    currentUser.receivedRequests = currentUser.receivedRequests.filter(u => u !== fromUsername);
    fromUser.sentRequests = fromUser.sentRequests.filter(u => u !== currentUser.username);
    if (!currentUser.friends.includes(fromUsername)) currentUser.friends.push(fromUsername);
    if (!fromUser.friends.includes(currentUser.username)) fromUser.friends.push(currentUser.username);
    saveUsers();
    updateFriendRequestsUI();
    updateFriendsListUI();
    updateExploreResults();
}

function declineFriendRequest(fromUsername) {
    const fromUser = users.find(u => u.username === fromUsername);
    if (fromUser) {
        fromUser.sentRequests = fromUser.sentRequests.filter(u => u !== currentUser.username);
    }
    currentUser.receivedRequests = currentUser.receivedRequests.filter(u => u !== fromUsername);
    saveUsers();
    updateFriendRequestsUI();
    updateFriendsListUI();
    updateExploreResults();
}

function updateFriendRequestsUI() {
    const container = document.getElementById('friendRequestsList');
    if (!container) return;
    if (!currentUser.receivedRequests.length) {
        container.innerHTML = `<div class="empty-placeholder" data-i18n="noRequests">No pending requests</div>`;
    } else {
        container.innerHTML = currentUser.receivedRequests.map(req => `
            <div class="friend-request-item">
                <span class="friend-username">${escapeHtml(req)}</span>
                <div>
                    <button class="accept-btn" data-username="${escapeHtml(req)}">Accept</button>
                    <button class="decline-btn" data-username="${escapeHtml(req)}">Decline</button>
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.accept-btn').forEach(btn => btn.onclick = () => acceptFriendRequest(btn.getAttribute('data-username')));
        document.querySelectorAll('.decline-btn').forEach(btn => btn.onclick = () => declineFriendRequest(btn.getAttribute('data-username')));
    }
    applyLanguageOnlyText();
}

function updateFriendsListUI() {
    const container = document.getElementById('friendsList');
    if (!container) return;
    if (!currentUser.friends.length) {
        container.innerHTML = `<div class="empty-placeholder" data-i18n="noFriends">No friends yet</div>`;
    } else {
        container.innerHTML = currentUser.friends.map(friend => {
            const friendUser = users.find(u => u.username === friend);
            const roleBadge = friendUser ? getRoleBadge(friendUser.role) : '';
            return `
                <div class="friend-item clickable" data-username="${escapeHtml(friend)}">
                    <span class="friend-username">${escapeHtml(friend)} ${roleBadge}</span>
                </div>
            `;
        }).join('');
        document.querySelectorAll('#friendsList .friend-item').forEach(item => {
            const username = item.getAttribute('data-username');
            item.addEventListener('click', () => {
                const targetUser = users.find(u => u.username === username);
                if (targetUser) showUserInfo(targetUser);
            });
        });
    }
    applyLanguageOnlyText();
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
    const noRequestsDiv = document.querySelector('#friendRequestsList .empty-placeholder');
    if (noRequestsDiv && t.noRequests) noRequestsDiv.textContent = t.noRequests;
    const noFriendsDiv = document.querySelector('#friendsList .empty-placeholder');
    if (noFriendsDiv && t.noFriends) noFriendsDiv.textContent = t.noFriends;
}

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('leblox_lang', lang);
    applyLanguageOnlyText();
    const activeCat = document.querySelector('.category-card.active')?.getAttribute('data-category') || 'all';
    updateCategoryText(activeCat);
    if (document.getElementById('exploreView') && !document.getElementById('exploreView').classList.contains('hidden')) {
        updateExploreResults();
    }
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

function openModal(modal) { modal.classList.add('active'); }
function closeModal(modal) { modal.classList.remove('active'); }
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
document.getElementById('savePrivacyBtn').onclick = () => {
    currentUser.privacy.userId = document.getElementById('userIdVisibility').value;
    currentUser.privacy.friendsList = document.getElementById('friendsVisibility').value;
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) users[userIndex].privacy = currentUser.privacy;
    saveUsers();
    closeModal(privacyModal);
};

document.getElementById('registerSubmitBtn').onclick = () => {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const res = register(username, password);
    if (res.success) {
        closeModal(registerModal);
        openModal(loginModal);
        document.getElementById('registerError').innerHTML = '';
    } else {
        const errorKey = res.msgKey;
        const errorMsg = translations[currentLang][errorKey] || 'Registration failed';
        document.getElementById('registerError').innerHTML = errorMsg;
    }
};

document.getElementById('loginSubmitBtn').onclick = () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const res = login(username, password);
    if (res.success) {
        currentUser = res.user;
        localStorage.setItem(STORAGE_CURRENT, currentUser.username);
        closeModal(loginModal);
        welcomePage.style.display = 'none';
        appContainer.style.display = 'flex';
        loadMainApp();
        updateSettingsUI();
        updateProfileInfoUI();
        updateFriendRequestsUI();
        updateFriendsListUI();
        document.getElementById('loginError').innerHTML = '';
    } else if (res.msgKey === 'suspended') {
        document.getElementById('loginError').innerHTML = '';
    } else {
        const t = translations[currentLang];
        document.getElementById('loginError').innerHTML = `${t.loginError}<br><button id="loginErrorRegisterBtn" style="margin-top:8px; background:#3b82f6; border:none; padding:6px 16px; border-radius:30px; color:white; cursor:pointer;">${t.registerNow}</button>`;
        const errorRegisterBtn = document.getElementById('loginErrorRegisterBtn');
        if (errorRegisterBtn) errorRegisterBtn.onclick = () => { closeModal(loginModal); openModal(registerModal); };
    }
};

document.getElementById('changePwdSubmitBtn').onclick = () => {
    const oldPwd = document.getElementById('oldPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    if (oldPwd !== currentUser.password) {
        document.getElementById('changePwdError').innerText = 'Current password incorrect';
        return;
    }
    if (newPwd !== confirm) {
        document.getElementById('changePwdError').innerText = 'New passwords do not match';
        return;
    }
    if (!validatePassword(newPwd)) {
        document.getElementById('changePwdError').innerText = translations[currentLang].invalidPassword;
        return;
    }
    if (updatePassword(currentUser.username, newPwd)) {
        currentUser.password = newPwd;
        localStorage.setItem(STORAGE_CURRENT, currentUser.username);
        closeModal(changePwdModal);
        alert('Password changed successfully');
        document.getElementById('changePwdError').innerHTML = '';
        document.getElementById('oldPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } else {
        document.getElementById('changePwdError').innerText = 'Update failed';
    }
};

document.getElementById('showPasswordBtn').onclick = () => {
    document.getElementById('showPasswordValue').innerText = currentUser.password;
    openModal(showPwdModal);
};

document.getElementById('logoutBtn').onclick = () => { logout(); };

// ==================== PROFILE UI ====================
function updateSettingsUI() {
    if (!currentUser) return;
    document.getElementById('accountDisplay').innerText = currentUser.displayName;
    document.getElementById('accountUsername').innerText = currentUser.username;
    document.getElementById('accountUserId').innerText = currentUser.userId;
}

function updateProfileInfoUI() {
    if (!currentUser) return;
    document.getElementById('profileDisplayName').innerText = currentUser.displayName;
    document.getElementById('profileUsername').innerText = currentUser.username;
    document.getElementById('profileDescription').innerText = currentUser.description || "(no description)";
    document.getElementById('profileAvatarPreview').innerText = currentUser.avatar;
    document.getElementById('avatarLargePreview').innerText = currentUser.avatar;
}

const avatarOptions = ['👤', '😀', '😎', '🐱', '🐶', '🦊', '🐼', '⭐', '❤️', '🔥', '👍', '🎮'];
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
            const userIndex = users.findIndex(u => u.username === currentUser.username);
            if (userIndex !== -1) users[userIndex].avatar = currentUser.avatar;
            saveUsers();
            updateProfileInfoUI();
            modal.remove();
        };
    });
    modal.querySelector('#cancelAvatarBtn').onclick = () => modal.remove();
};

document.getElementById('editDescriptionBtn').onclick = () => {
    const newDesc = prompt('Enter your description (max 200 characters):', currentUser.description);
    if (newDesc !== null && newDesc.length <= 200) {
        currentUser.description = newDesc;
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) users[userIndex].description = newDesc;
        saveUsers();
        updateProfileInfoUI();
    } else if (newDesc && newDesc.length > 200) alert('Description too long (max 200 chars)');
};
document.getElementById('clearDescriptionBtn').onclick = () => {
    if (confirm('Clear your description?')) {
        currentUser.description = "";
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) users[userIndex].description = "";
        saveUsers();
        updateProfileInfoUI();
    }
};

document.getElementById('changeDisplayNameBtn').onclick = () => {
    const newName = prompt('Enter new display name:', currentUser.displayName);
    if (newName && newName.trim()) {
        currentUser.displayName = newName.trim();
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) users[userIndex].displayName = newName.trim();
        saveUsers();
        updateProfileInfoUI();
        updateSettingsUI();
        alert('Display name updated!');
    }
};
document.getElementById('changeUsernameBtn').onclick = () => openModal(changeUsernameModal);
document.getElementById('profileSettingsBtn').onclick = () => {
    document.getElementById('userIdVisibility').value = currentUser.privacy.userId;
    document.getElementById('friendsVisibility').value = currentUser.privacy.friendsList;
    openModal(privacyModal);
};

const profileInfoBtn = document.getElementById('profileInfoBtn');
const avatarInfoBtn = document.getElementById('avatarInfoBtn');
const profileInfoPanel = document.getElementById('profileInfoPanel');
const avatarPanel = document.getElementById('avatarPanel');
profileInfoBtn.onclick = () => {
    profileInfoBtn.classList.add('active');
    avatarInfoBtn.classList.remove('active');
    profileInfoPanel.classList.remove('hidden');
    avatarPanel.classList.add('hidden');
};
avatarInfoBtn.onclick = () => {
    avatarInfoBtn.classList.add('active');
    profileInfoBtn.classList.remove('active');
    profileInfoPanel.classList.add('hidden');
    avatarPanel.classList.remove('hidden');
};

const closetTabBtn = document.getElementById('closetTabBtn');
const shopTabBtn = document.getElementById('shopTabBtn');
const closetPanel = document.getElementById('closetPanel');
const shopPanel = document.getElementById('shopPanel');
closetTabBtn.onclick = () => {
    closetTabBtn.classList.add('active');
    shopTabBtn.classList.remove('active');
    closetPanel.classList.remove('hidden');
    shopPanel.classList.add('hidden');
};
shopTabBtn.onclick = () => {
    shopTabBtn.classList.add('active');
    closetTabBtn.classList.remove('active');
    closetPanel.classList.add('hidden');
    shopPanel.classList.remove('hidden');
};

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
    [homeMenuBtn, exploreMenuBtn, profileMenuBtn, chatMenuBtn, settingsMenuBtn].forEach(btn => btn.classList.remove('active'));
    if (active === 'home') homeMenuBtn.classList.add('active');
    else if (active === 'explore') exploreMenuBtn.classList.add('active');
    else if (active === 'profile') profileMenuBtn.classList.add('active');
    else if (active === 'chat') chatMenuBtn.classList.add('active');
    else if (active === 'settings') settingsMenuBtn.classList.add('active');
}
function showHome() { homeView.classList.remove('hidden'); exploreView.classList.add('hidden'); profileView.classList.add('hidden'); chatView.classList.add('hidden'); settingsView.classList.add('hidden'); setActiveMenu('home'); }
function showExplore() { homeView.classList.add('hidden'); exploreView.classList.remove('hidden'); profileView.classList.add('hidden'); chatView.classList.add('hidden'); settingsView.classList.add('hidden'); setActiveMenu('explore'); updateExploreResults(); }
function showProfile() { homeView.classList.add('hidden'); exploreView.classList.add('hidden'); profileView.classList.remove('hidden'); chatView.classList.add('hidden'); settingsView.classList.add('hidden'); setActiveMenu('profile'); }
function showChat() { homeView.classList.add('hidden'); exploreView.classList.add('hidden'); profileView.classList.add('hidden'); chatView.classList.remove('hidden'); settingsView.classList.add('hidden'); setActiveMenu('chat'); }
function showSettings() { homeView.classList.add('hidden'); exploreView.classList.add('hidden'); profileView.classList.add('hidden'); chatView.classList.add('hidden'); settingsView.classList.remove('hidden'); setActiveMenu('settings'); }
homeMenuBtn.onclick = showHome;
exploreMenuBtn.onclick = showExplore;
profileMenuBtn.onclick = showProfile;
chatMenuBtn.onclick = showChat;
settingsMenuBtn.onclick = showSettings;

// ==================== EXPLORE ====================
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const exploreResults = document.getElementById('exploreResults');
let currentFilter = 'all';

function showUserInfo(user) {
    document.getElementById('infoAvatar').innerHTML = user.avatar;
    document.getElementById('infoDisplayName').innerText = user.displayName;
    document.getElementById('infoUsername').innerText = user.username;
    const canSeeId = (user.privacy.userId === 'everyone') ||
                     (user.privacy.userId === 'friends' && currentUser.friends.includes(user.username));
    document.getElementById('infoUserId').innerText = canSeeId ? user.userId : 'Hidden';
    document.getElementById('infoDescription').innerText = user.description || '(no description)';
    openModal(userInfoModal);
}

function updateExploreResults() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (currentFilter === 'all') {
        const otherUsers = users.filter(u => u.username !== currentUser.username);
        let filteredUsers = otherUsers;
        if (searchTerm) {
            filteredUsers = otherUsers.filter(u => u.username.toLowerCase().includes(searchTerm) || u.displayName.toLowerCase().includes(searchTerm));
        }
        const usersHtml = filteredUsers.map(user => `
            <div class="user-list-item clickable" data-username="${escapeHtml(user.username)}">
                <span class="user-list-username">${escapeHtml(user.displayName)} (${escapeHtml(user.username)}) ${getRoleBadge(user.role)}</span>
            </div>
        `).join('');
        const gamesHtml = `<div class="user-list-item">🎮 Sample Game - Tester Only</div><div class="user-list-item">🕹️ Another Game - Coming Soon</div>`;
        exploreResults.innerHTML = `
            <div class="all-users-section"><h4 data-i18n="usersTitle">Users</h4>${usersHtml || '<div>No users found</div>'}</div>
            <div class="all-games-section"><h4 data-i18n="gamesTitle">Games</h4>${gamesHtml}</div>
        `;
        document.querySelectorAll('.all-users-section .user-list-item').forEach(item => {
            const username = item.getAttribute('data-username');
            item.addEventListener('click', () => {
                const targetUser = users.find(u => u.username === username);
                if (targetUser) showUserInfo(targetUser);
            });
        });
        applyLanguageOnlyText();
        return;
    } else if (currentFilter === 'user') {
        const otherUsers = users.filter(u => u.username !== currentUser.username);
        let filtered = otherUsers;
        if (searchTerm) {
            filtered = otherUsers.filter(u => u.username.toLowerCase().includes(searchTerm) || u.displayName.toLowerCase().includes(searchTerm));
        }
        if (filtered.length === 0) {
            exploreResults.innerHTML = `<p data-i18n="noUsersFound">No users found</p>`;
            applyLanguageOnlyText();
            return;
        }
        const t = translations[currentLang];
        exploreResults.innerHTML = filtered.map(user => {
            let buttonText = t.addFriend;
            let disabled = false;
            let extraClass = '';
            if (currentUser.friends.includes(user.username)) {
                buttonText = t.friendsStatus;
                disabled = true;
                extraClass = 'disabled';
            } else if (currentUser.sentRequests.includes(user.username)) {
                buttonText = t.requestSent;
                disabled = true;
                extraClass = 'pending';
            }
            return `
                <div class="user-list-item clickable" data-username="${escapeHtml(user.username)}">
                    <div>
                        <span class="user-list-username">${escapeHtml(user.displayName)} (${escapeHtml(user.username)}) ${getRoleBadge(user.role)}</span>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="friend-action-btn ${extraClass}" data-username="${escapeHtml(user.username)}" ${disabled ? 'disabled' : ''}>${buttonText}</button>
                        <button class="report-user-btn" data-username="${escapeHtml(user.username)}">🚩 Report</button>
                    </div>
                </div>
            `;
        }).join('');
        document.querySelectorAll('.user-list-item').forEach(item => {
            const username = item.getAttribute('data-username');
            item.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                const targetUser = users.find(u => u.username === username);
                if (targetUser) showUserInfo(targetUser);
            });
        });
        document.querySelectorAll('.friend-action-btn:not(.disabled):not(.pending)').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                sendFriendRequest(btn.getAttribute('data-username'));
            };
        });
        document.querySelectorAll('.report-user-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const reportedUsername = btn.getAttribute('data-username');
                const reason = prompt(`Why are you reporting ${reportedUsername}?`, "Spam, harassment, etc.");
                if (reason && reason.trim()) {
                    addReport(reportedUsername, reason);
                }
            };
        });
        applyLanguageOnlyText();
    } else if (currentFilter === 'game') {
        exploreResults.innerHTML = `<p data-i18n="gamePlaceholder">Games - Tester Only</p><div class="user-list-item">🎮 Sample Game</div><div class="user-list-item">🕹️ Another Game</div>`;
        applyLanguageOnlyText();
    }
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        updateExploreResults();
    });
});
searchBtn.addEventListener('click', updateExploreResults);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') updateExploreResults(); });

const catCards = document.querySelectorAll('.category-card');
catCards.forEach(card => {
    card.onclick = () => {
        catCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateCategoryText(card.getAttribute('data-category'));
    };
});

const whiteThemeBtn = document.getElementById('whiteThemeBtn');
const blackThemeBtn = document.getElementById('blackThemeBtn');
function applyTheme(theme) {
    if (theme === 'light') document.body.classList.add('light-theme');
    else document.body.classList.remove('light-theme');
    localStorage.setItem('leblox_theme', theme);
}
const savedTheme = localStorage.getItem('leblox_theme');
applyTheme(savedTheme === 'light' ? 'light' : 'dark');
whiteThemeBtn.onclick = () => applyTheme('light');
blackThemeBtn.onclick = () => applyTheme('dark');

const langSelect = document.getElementById('languageSelect');
function loadSavedLanguage() {
    const saved = localStorage.getItem('leblox_lang');
    if (saved && translations[saved]) { currentLang = saved; langSelect.value = saved; }
    else { currentLang = 'en'; langSelect.value = 'en'; }
    applyLanguage(currentLang);
}
langSelect.onchange = (e) => applyLanguage(e.target.value);

function loadMainApp() {
    showHome();
    updateSettingsUI();
    updateProfileInfoUI();
    profileInfoBtn.classList.add('active');
    avatarInfoBtn.classList.remove('active');
    profileInfoPanel.classList.remove('hidden');
    avatarPanel.classList.add('hidden');
    closetTabBtn.classList.add('active');
    shopTabBtn.classList.remove('active');
    closetPanel.classList.remove('hidden');
    shopPanel.classList.add('hidden');
    applyLanguage(currentLang);
    updateFriendRequestsUI();
    updateFriendsListUI();
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