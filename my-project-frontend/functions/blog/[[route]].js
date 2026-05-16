// ============================================
// Blog Task API: getTask, setTask, getTaskByUser, setTaskByUser, updateTask, deleteTask
// ============================================

import { success, failure, unauthorized, forbidden, requireAuth, first, all, run } from '../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    if (method === 'POST' && path.endsWith('/getTask')) {
        return handleGetTask(env);
    }
    if (method === 'POST' && path.endsWith('/setTask')) {
        return handleSetTask(request, env);
    }
    if (method === 'POST' && path.endsWith('/getTaskByUser')) {
        return handleGetTaskByUser(env);
    }
    if (method === 'POST' && path.endsWith('/setTaskByUser')) {
        return handleSetTaskByUser(request, env);
    }
    if (method === 'POST' && path.endsWith('/updateTask')) {
        return handleUpdateTask(request, env);
    }
    if (method === 'POST' && path.endsWith('/deleteTask')) {
        return handleDeleteTask(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleGetTask(env) {
    const tasks = await all(env.DB, 'SELECT * FROM db_tasks WHERE title IS NOT NULL AND title != \'\' AND description IS NOT NULL AND description != \'\' AND del_flag = 0 ORDER BY create_time DESC LIMIT 100');
    const list = tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status || 0
    }));
    return success(list);
}

async function handleSetTask(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();
        await run(env.DB, 'INSERT INTO db_tasks (title, description, status, username, create_time, del_flag) VALUES (?, ?, ?, ?, datetime("now"), 0)',
            data.title || '', data.description || '', data.status || 0, jwt.username);
        return success();
    } catch (e) {
        return failure(500, '添加失败');
    }
}

async function handleGetTaskByUser(env) {
    const tasks = await all(env.DB, 'SELECT * FROM db_tasks WHERE title_byuser IS NOT NULL AND title_byuser != \'\' AND description_byuser IS NOT NULL AND description_byuser != \'\' AND del_flag = 0 ORDER BY create_time_byuser DESC LIMIT 100');
    const list = tasks.map(t => ({
        id: t.id,
        titleByuser: t.title_byuser,
        descriptionByuser: t.description_byuser,
        username: t.username
    }));
    return success(list);
}

async function handleSetTaskByUser(request, env) {
    try {
        const data = await request.json();
        let name = data.username;
        if (!name || name === '') {
            name = '游客' + Math.floor(1000 + Math.random() * 9000);
        }
        await run(env.DB, 'INSERT INTO db_tasks (title_byuser, description_byuser, username, create_time_byuser, del_flag, status) VALUES (?, ?, ?, datetime("now"), 0, 0)',
            data.titleByuser || '', data.descriptionByuser || '', name);
        return success();
    } catch (e) {
        return failure(500, '提交失败');
    }
}

async function handleUpdateTask(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();
        let name = data.username;
        if (!name || name === '') {
            name = '游客' + Math.floor(1000 + Math.random() * 9000);
        }

        // Update both admin fields and user fields based on what's provided
        if (data.title !== undefined || data.description !== undefined) {
            // Admin task update
            await run(env.DB, 'UPDATE db_tasks SET title = ?, description = ?, status = ?, username = ?, create_time = datetime("now") WHERE id = ?',
                data.title || '', data.description || '', data.status || 0, name, data.id);
        } else if (data.titleByuser !== undefined || data.descriptionByuser !== undefined) {
            // User task update
            await run(env.DB, 'UPDATE db_tasks SET title_byuser = ?, description_byuser = ?, username = ? WHERE id = ?',
                data.titleByuser || '', data.descriptionByuser || '', name, data.id);
        } else {
            // Fallback: update all possible fields
            await run(env.DB, 'UPDATE db_tasks SET title = ?, description = ?, status = ?, title_byuser = ?, description_byuser = ?, username = ? WHERE id = ?',
                data.title || '', data.description || '', data.status || 0, data.titleByuser || '', data.descriptionByuser || '', name, data.id);
        }
        return success();
    } catch (e) {
        return failure(500, '更新失败');
    }
}

async function handleDeleteTask(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        let id, role;
        const contentType = request.headers.get('Content-Type') || '';

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const text = await request.text();
            const params = new URLSearchParams(text);
            id = params.get('id');
            role = params.get('role');
        } else {
            const data = await request.json();
            id = data.id;
            role = data.role;
        }

        if (role !== 'admin') return forbidden();
        await run(env.DB, 'UPDATE db_tasks SET del_flag = 1 WHERE id = ?', parseInt(id));
        return success();
    } catch (e) {
        return failure(500, '删除失败');
    }
}
