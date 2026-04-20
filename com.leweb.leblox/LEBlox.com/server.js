const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({ secret: 'leblox_secret', resave: false, saveUninitialized: false }));

const LEVEL_OWNER = 1, LEVEL_ADMIN = 2, LEVEL_MEMBER = 3;
const dataFile = path.join(__dirname, 'database.json');

function loadData() {
    if (!fs.existsSync(dataFile)) {
        const defaultData = { users: [], reports: [], suspended: {}, nextId: 1 };
        fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) { fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); }

function getUserPermissionLevel(username) {
    if (username === 'LEOwner') return LEVEL_OWNER;
    if (username === 'LETester') return LEVEL_ADMIN;
    return LEVEL_MEMBER;
}

function canAccessAdminPanel(username) {
    const level = getUserPermissionLevel(username);
    return level === LEVEL_OWNER || level === LEVEL_ADMIN;
}

function canBanSuspend(adminUsername, targetUsername) {
    const adminLevel = getUserPermissionLevel(adminUsername);
    const targetLevel = getUserPermissionLevel(targetUsername);
    if (adminLevel === LEVEL_OWNER && targetLevel === LEVEL_OWNER) return false;
    if (adminLevel === LEVEL_OWNER) return true;
    return false;
}

app.post('/api/:action', async (req, res) => {
    const { action } = req.params;
    const data = loadData();
    
    switch (action) {
        case 'register':
            if (data.users.find(u => u.username === req.body.username)) {
                return res.json({ success: false });
            }
            const newUser = {
                username: req.body.username,
                password: await bcrypt.hash(req.body.password, 10),
                displayName: req.body.username,
                userId: 'LE' + String(data.nextId).padStart(8, '0'),
                createdAt: Date.now(),
                friends: [], sentRequests: [], receivedRequests: [],
                description: '', avatar: '👤',
                privacy: { userId: 'everyone', friendsList: 'everyone' },
                role: getUserPermissionLevel(req.body.username) === LEVEL_OWNER ? 'owner' : (getUserPermissionLevel(req.body.username) === LEVEL_ADMIN ? 'admin' : 'member'),
                permissionLevel: getUserPermissionLevel(req.body.username)
            };
            data.users.push(newUser);
            data.nextId++;
            saveData(data);
            res.json({ success: true });
            break;
            
        case 'login':
            const user = data.users.find(u => u.username === req.body.username);
            if (user && await bcrypt.compare(req.body.password, user.password)) {
                req.session.user = req.body.username;
                req.session.permissionLevel = getUserPermissionLevel(req.body.username);
                res.json({ success: true, user, permissionLevel: req.session.permissionLevel });
            } else {
                res.json({ success: false });
            }
            break;
            
        case 'logout':
            req.session.destroy();
            res.json({ success: true });
            break;
            
        case 'getSession':
            if (req.session.user) {
                const user = data.users.find(u => u.username === req.session.user);
                res.json({ success: true, user, permissionLevel: req.session.permissionLevel });
            } else {
                res.json({ success: false });
            }
            break;
            
        case 'getAllUsers':
            if (req.session.user && canAccessAdminPanel(req.session.user)) {
                res.json({ success: true, users: data.users });
            } else {
                res.json({ success: false });
            }
            break;
            
        default:
            res.json({ success: false });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));