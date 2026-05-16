// ============================================
// Auth API: login, logout, verify-role
// ============================================

import { success, failure, unauthorized, createJWT, verifyJWT, getExpireTime, verifyPassword, requireAuth, first } from '../../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    if (method === 'POST' && path.endsWith('/login')) {
        return handleLogin(request, env);
    }
    if (method === 'GET' && path.endsWith('/logout')) {
        return handleLogout();
    }
    if (method === 'POST' && path.endsWith('/verify-role')) {
        return handleVerifyRole(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleLogin(request, env) {
    try {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const username = params.get('username');
        const password = params.get('password');

        if (!username || !password) return failure(400, '用户名和密码不能为空');

        const account = await first(env.DB, 'SELECT * FROM db_account WHERE username = ? OR email = ?', username, username);
        if (!account) return failure(400, '用户名或密码错误');

        const valid = await verifyPassword(password, account.password);
        if (!valid) return failure(400, '用户名或密码错误');

        const token = await createJWT({ username: account.username, role: account.role, userId: account.id });
        return success({
            username: account.username,
            role: account.role,
            token,
            expire: getExpireTime()
        });
    } catch (e) {
        return failure(500, '登录失败: ' + e.message);
    }
}

function handleLogout() {
    return success();
}

async function handleVerifyRole(request, env) {
    try {
        const data = await request.json();
        const username = data.username;
        if (!username) return failure(400, '用户名不能为空');

        const account = await first(env.DB, 'SELECT role FROM db_account WHERE username = ?', username);
        if (!account) return failure(400, '用户不存在');

        return success(account.role);
    } catch (e) {
        return failure(500, '查询失败');
    }
}
