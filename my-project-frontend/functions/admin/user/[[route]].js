// ============================================
// Admin User API: list, add, update, delete, update-role
// ============================================

import { success, failure, unauthorized, forbidden, requireAuth, first, all, run, hashPassword } from '../../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    if (method === 'GET' && path.endsWith('/list')) {
        return handleList(env);
    }
    if (method === 'POST' && path.endsWith('/add')) {
        return handleAdd(request, env);
    }
    if (method === 'POST' && path.endsWith('/update')) {
        return handleUpdate(request, env);
    }
    if (method === 'POST' && path.includes('/update-role/')) {
        return handleUpdateRole(request, path, env);
    }
    if (method === 'POST' && path.includes('/delete/')) {
        return handleDelete(request, path, env);
    }

    return failure(404, '接口不存在');
}

async function handleList(env) {
    try {
        const users = await all(env.DB, 'SELECT id, username, email, role, register_time, del_flag FROM db_account WHERE del_flag = ?', '0');
        // Clear password field for security
        const list = users.map(u => ({
            id: u.id,
            username: u.username,
            password: null,
            email: u.email,
            role: u.role,
            registerTime: u.register_time,
            delFlag: u.del_flag
        }));
        return success(list);
    } catch (e) {
        return failure(500, '获取用户列表失败');
    }
}

async function handleAdd(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();

        // Check if username already exists
        const existingUser = await first(env.DB, 'SELECT id FROM db_account WHERE username = ?', data.username);
        if (existingUser) return failure(400, '用户名已被使用');

        // Check if email already exists
        const existingEmail = await first(env.DB, 'SELECT id FROM db_account WHERE email = ?', data.email);
        if (existingEmail) return failure(400, '邮箱已被使用');

        if (data.role === 'admin') return failure(400, '不能将用户设置为管理员');

        const hashedPwd = await hashPassword(data.password);
        await run(env.DB, 'INSERT INTO db_account (username, password, email, role, register_time, del_flag) VALUES (?, ?, ?, ?, datetime("now"), ?)',
            data.username, hashedPwd, data.email, data.role || 'user', '0');
        return success();
    } catch (e) {
        return failure(500, '添加用户失败');
    }
}

async function handleUpdate(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();

        // Check if user exists
        const account = await first(env.DB, 'SELECT * FROM db_account WHERE id = ?', data.id);
        if (!account) return failure(400, '用户不存在');

        // Check if username is taken by another user
        if (data.username && data.username !== account.username) {
            const existingUser = await first(env.DB, 'SELECT id FROM db_account WHERE username = ? AND id != ?', data.username, data.id);
            if (existingUser) return failure(400, '用户名已被使用');
        }

        // Check if email is taken by another user
        if (data.email && data.email !== account.email) {
            const existingEmail = await first(env.DB, 'SELECT id FROM db_account WHERE email = ? AND id != ?', data.email, data.id);
            if (existingEmail) return failure(400, '邮箱已被使用');
        }

        if (data.role === 'admin') return failure(400, '不能将用户设置为管理员');

        // Build update SQL dynamically based on provided fields
        const updates = [];
        const params = [];

        if (data.username) {
            updates.push('username = ?');
            params.push(data.username);
        }
        if (data.email) {
            updates.push('email = ?');
            params.push(data.email);
        }
        if (data.password) {
            const hashedPwd = await hashPassword(data.password);
            updates.push('password = ?');
            params.push(hashedPwd);
        }
        if (data.role) {
            updates.push('role = ?');
            params.push(data.role);
        }

        if (updates.length === 0) return failure(400, '没有要更新的字段');

        params.push(data.id);
        await run(env.DB, `UPDATE db_account SET ${updates.join(', ')} WHERE id = ?`, ...params);
        return success();
    } catch (e) {
        return failure(500, '更新用户信息失败');
    }
}

async function handleDelete(request, path, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const parts = path.split('/');
        const id = parseInt(parts[parts.length - 1]);
        if (!id) return failure(400, 'ID无效');

        const account = await first(env.DB, 'SELECT * FROM db_account WHERE id = ?', id);
        if (!account) return failure(400, '用户不存在');
        if (account.role === 'admin') return failure(400, '不能删除管理员账户');

        await run(env.DB, 'UPDATE db_account SET del_flag = ? WHERE id = ?', '1', id);
        return success();
    } catch (e) {
        return failure(500, '删除用户失败');
    }
}

async function handleUpdateRole(request, path, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const parts = path.split('/');
        const id = parseInt(parts[parts.length - 1]);
        if (!id) return failure(400, 'ID无效');

        const url = new URL(request.url);
        const role = url.searchParams.get('role') || (await request.json()).role;

        const account = await first(env.DB, 'SELECT * FROM db_account WHERE id = ?', id);
        if (!account) return failure(400, '用户不存在');
        if (role === 'admin') return failure(400, '不能将用户设置为管理员');

        await run(env.DB, 'UPDATE db_account SET role = ? WHERE id = ?', role, id);
        return success();
    } catch (e) {
        return failure(500, '更新用户角色失败');
    }
}
