<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LEBlox Client Test</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0c12;
            font-family: system-ui, sans-serif;
            color: #eef2ff;
            padding: 20px;
        }
        .card {
            background: rgba(18,22,32,0.9);
            border-radius: 1rem;
            padding: 1.5rem;
            max-width: 500px;
            margin: 0 auto;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .role-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; margin-left: 6px; }
        .role-badge.owner { background: #f59e0b; color: #000; }
        .role-badge.admin { background: #3b82f6; color: white; }
        .role-badge.member { background: #6b7280; color: white; }
        input, button {
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 30px;
            border: none;
        }
        input { background: rgba(255,255,255,0.1); color: white; width: 100%; }
        button { background: #3b82f6; color: white; cursor: pointer; }
        .hidden { display: none; }
    </style>
    <script src="client.js"></script>
</head>
<body>
    <div class="card">
        <h1>LEBlox Client Test</h1>
        <div id="authSection">
            <input type="text" id="username" placeholder="Username">
            <input type="password" id="password" placeholder="Password">
            <button id="loginBtn">Login</button>
            <button id="registerBtn">Register</button>
            <div id="errorMsg"></div>
        </div>
        <div id="appSection" class="hidden">
            <p>Welcome, <span id="displayName"></span></p>
            <p>Role: <span id="roleBadge"></span></p>
            <p>Permission Level: <span id="level"></span></p>
            <button id="logoutBtn">Logout</button>
            <div id="adminSection" class="hidden">
                <h3>Admin Controls</h3>
                <div id="usersList"></div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;
        let permissionLevel = null;

        async function updateUI() {
            const session = await LEBloxAPI.getSession();
            if (session.success) {
                currentUser = session.user;
                permissionLevel = session.permissionLevel;
                document.getElementById('authSection').classList.add('hidden');
                document.getElementById('appSection').classList.remove('hidden');
                document.getElementById('displayName').innerText = currentUser.displayName;
                document.getElementById('roleBadge').innerHTML = getRoleBadge(permissionLevel);
                document.getElementById('level').innerText = permissionLevel === 1 ? 'Owner' : (permissionLevel === 2 ? 'Admin' : 'Member');
                
                if (canAccessAdminPanel(permissionLevel)) {
                    document.getElementById('adminSection').classList.remove('hidden');
                    const users = await LEBloxAPI.getAllUsers();
                    if (users.success) {
                        document.getElementById('usersList').innerHTML = users.users.map(u => `
                            <div>${u.displayName} (${u.username}) ${getRoleBadge(u.permissionLevel)}</div>
                        `).join('');
                    }
                }
            } else {
                document.getElementById('authSection').classList.remove('hidden');
                document.getElementById('appSection').classList.add('hidden');
            }
        }

        document.getElementById('loginBtn').onclick = async () => {
            const result = await LEBloxAPI.login(
                document.getElementById('username').value,
                document.getElementById('password').value
            );
            if (result.success) updateUI();
            else document.getElementById('errorMsg').innerText = 'Login failed';
        };

        document.getElementById('registerBtn').onclick = async () => {
            const result = await LEBloxAPI.register(
                document.getElementById('username').value,
                document.getElementById('password').value
            );
            if (result.success) {
                alert('Registered! Please login.');
                document.getElementById('errorMsg').innerText = '';
            } else {
                document.getElementById('errorMsg').innerText = 'Registration failed';
            }
        };

        document.getElementById('logoutBtn').onclick = async () => {
            await LEBloxAPI.logout();
            updateUI();
        };

        updateUI();
    </script>
</body>
</html>