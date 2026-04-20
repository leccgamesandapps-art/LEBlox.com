<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

$dataFile = 'database.json';

// ==================== DATA FUNCTIONS ====================
function loadData() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        $defaultData = ['users' => [], 'reports' => [], 'suspended' => [], 'nextId' => 1];
        file_put_contents($dataFile, json_encode($defaultData));
        return $defaultData;
    }
    return json_decode(file_get_contents($dataFile), true);
}

function saveData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

// ==================== PERMISSION LEVELS ====================
define('LEVEL_OWNER', 1);
define('LEVEL_ADMIN', 2);
define('LEVEL_MEMBER', 3);

function getUserPermissionLevel($username) {
    if ($username === 'LEOwner') return LEVEL_OWNER;
    if ($username === 'LETester') return LEVEL_ADMIN;
    return LEVEL_MEMBER;
}

function canAccessAdminPanel($username) {
    $level = getUserPermissionLevel($username);
    return $level === LEVEL_OWNER || $level === LEVEL_ADMIN;
}

function canBanSuspend($adminUsername, $targetUsername) {
    $adminLevel = getUserPermissionLevel($adminUsername);
    $targetLevel = getUserPermissionLevel($targetUsername);
    if ($adminLevel === LEVEL_OWNER && $targetLevel === LEVEL_OWNER) return false;
    if ($adminLevel === LEVEL_OWNER) return true;
    return false;
}

// ==================== USER FUNCTIONS ====================
function getUser($username) {
    $data = loadData();
    foreach ($data['users'] as $user) {
        if ($user['username'] === $username) return $user;
    }
    return null;
}

function getAllUsers() {
    $data = loadData();
    return $data['users'];
}

function addUser($username, $password, $displayName = null) {
    $data = loadData();
    foreach ($data['users'] as $user) {
        if ($user['username'] === $username) return false;
    }
    
    $level = getUserPermissionLevel($username);
    $role = $level === LEVEL_OWNER ? 'owner' : ($level === LEVEL_ADMIN ? 'admin' : 'member');
    
    $newUser = [
        'username' => $username,
        'password' => password_hash($password, PASSWORD_DEFAULT),
        'displayName' => $displayName ?: $username,
        'userId' => 'LE' . str_pad($data['nextId'], 8, '0', STR_PAD_LEFT),
        'createdAt' => time(),
        'friends' => [],
        'sentRequests' => [],
        'receivedRequests' => [],
        'description' => '',
        'avatar' => '👤',
        'privacy' => ['userId' => 'everyone', 'friendsList' => 'everyone'],
        'role' => $role,
        'permissionLevel' => $level
    ];
    
    $data['users'][] = $newUser;
    $data['nextId']++;
    saveData($data);
    return $newUser;
}

function updateUser($username, $updates) {
    $data = loadData();
    foreach ($data['users'] as &$user) {
        if ($user['username'] === $username) {
            foreach ($updates as $key => $value) {
                if ($key !== 'username') $user[$key] = $value;
            }
            saveData($data);
            return $user;
        }
    }
    return null;
}

function deleteUser($username) {
    $level = getUserPermissionLevel($username);
    if ($level === LEVEL_OWNER || $level === LEVEL_ADMIN) return false;
    $data = loadData();
    $data['users'] = array_values(array_filter($data['users'], fn($u) => $u['username'] !== $username));
    saveData($data);
    return true;
}

// ==================== REPORT FUNCTIONS ====================
function addReport($reportedUser, $reporter, $reason) {
    $data = loadData();
    $data['reports'][] = [
        'reportedUser' => $reportedUser,
        'reporter' => $reporter,
        'reason' => $reason,
        'timestamp' => time()
    ];
    saveData($data);
    return true;
}

function getReports() {
    $data = loadData();
    return $data['reports'] ?? [];
}

function deleteReport($index) {
    $data = loadData();
    if (isset($data['reports'][$index])) {
        array_splice($data['reports'], $index, 1);
        saveData($data);
        return true;
    }
    return false;
}

// ==================== SUSPENSION FUNCTIONS ====================
function suspendUser($username, $hours) {
    $level = getUserPermissionLevel($username);
    if ($level === LEVEL_OWNER || $level === LEVEL_ADMIN) return false;
    $data = loadData();
    $data['suspended'][$username] = time() + ($hours * 3600);
    saveData($data);
    return $data['suspended'][$username];
}

function unsuspendUser($username) {
    $data = loadData();
    if (isset($data['suspended'][$username])) {
        unset($data['suspended'][$username]);
        saveData($data);
        return true;
    }
    return false;
}

function isSuspended($username) {
    $data = loadData();
    if (isset($data['suspended'][$username]) && $data['suspended'][$username] > time()) {
        return $data['suspended'][$username];
    }
    if (isset($data['suspended'][$username])) {
        unsuspendUser($username);
    }
    return false;
}

// ==================== AUTH FUNCTIONS ====================
function login($username, $password) {
    $user = getUser($username);
    if (!$user) return false;
    if (password_verify($password, $user['password'])) {
        $_SESSION['user'] = $username;
        $_SESSION['permissionLevel'] = getUserPermissionLevel($username);
        return $user;
    }
    return false;
}

function logout() { session_destroy(); return true; }
function isLoggedIn() { return isset($_SESSION['user']); }
function getCurrentUser() { return isLoggedIn() ? getUser($_SESSION['user']) : null; }

// ==================== REQUEST HANDLER ====================
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'register':
        echo json_encode(['success' => addUser($input['username'] ?? '', $input['password'] ?? '') !== false]);
        break;
    case 'login':
        $user = login($input['username'] ?? '', $input['password'] ?? '');
        echo json_encode($user ? ['success' => true, 'user' => $user, 'permissionLevel' => $_SESSION['permissionLevel']] : ['success' => false]);
        break;
    case 'logout':
        logout();
        echo json_encode(['success' => true]);
        break;
    case 'getSession':
        echo json_encode(isLoggedIn() ? ['success' => true, 'user' => getCurrentUser(), 'permissionLevel' => $_SESSION['permissionLevel']] : ['success' => false]);
        break;
    case 'getAllUsers':
        echo json_encode(canAccessAdminPanel($_SESSION['user'] ?? '') ? ['success' => true, 'users' => getAllUsers()] : ['success' => false]);
        break;
    case 'getReports':
        echo json_encode(canAccessAdminPanel($_SESSION['user'] ?? '') ? ['success' => true, 'reports' => getReports()] : ['success' => false]);
        break;
    case 'addReport':
        echo json_encode(isLoggedIn() ? ['success' => addReport($input['reportedUser'] ?? '', $_SESSION['user'], $input['reason'] ?? '')] : ['success' => false]);
        break;
    case 'deleteReport':
        echo json_encode(canAccessAdminPanel($_SESSION['user'] ?? '') ? ['success' => deleteReport($input['index'] ?? -1)] : ['success' => false]);
        break;
    case 'banUser':
        $username = $input['username'] ?? '';
        echo json_encode(canBanSuspend($_SESSION['user'] ?? '', $username) ? ['success' => deleteUser($username)] : ['success' => false]);
        break;
    case 'suspendUser':
        $username = $input['username'] ?? '';
        $hours = $input['hours'] ?? 24;
        echo json_encode(canBanSuspend($_SESSION['user'] ?? '', $username) ? ['success' => true, 'until' => suspendUser($username, $hours)] : ['success' => false]);
        break;
    case 'checkSuspended':
        echo json_encode(['success' => true, 'suspended' => isSuspended($input['username'] ?? ''), 'until' => isSuspended($input['username'] ?? '')]);
        break;
    default:
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
        break;
}
?>