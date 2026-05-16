// ============================================
// Notification API: show, modify, update, delete
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

    if (method === 'GET' && path.endsWith('/show')) {
        return handleShow(env);
    }
    if (method === 'POST' && path.endsWith('/modify')) {
        return handleModify(request, env);
    }
    if (method === 'POST' && path.endsWith('/update')) {
        return handleUpdate(request, env);
    }
    if (method === 'POST' && path.endsWith('/delete')) {
        return handleDelete(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleShow(env) {
    const notifications = await all(env.DB, 'SELECT * FROM db_notification ORDER BY create_time DESC');
    const list = notifications.map(n => ({
        id: n.id, versionId: n.version_id, title: n.title,
        content: n.content, readNum: n.read_num,
        adminName: n.admin_name, createTime: n.create_time
    }));
    return success(list);
}

async function handleModify(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();
        await run(env.DB, 'INSERT INTO db_notification (version_id, title, content, admin_name, create_time) VALUES (?, ?, ?, ?, datetime("now"))',
            data.versionId || '', data.title || '', data.content || '', jwt.username);
        return success();
    } catch (e) {
        return failure(500, '添加失败');
    }
}

async function handleUpdate(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const data = await request.json();

        await run(env.DB, 'UPDATE db_notification SET title = ?, content = ?, version_id = ? WHERE id = ?',
            data.title || '', data.content || '', data.versionId || '', parseInt(id));
        return success();
    } catch (e) {
        return failure(500, '更新失败');
    }
}

async function handleDelete(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const id = params.get('id');
        await run(env.DB, 'DELETE FROM db_notification WHERE id = ?', parseInt(id));
        return success();
    } catch (e) {
        return failure(500, '删除失败');
    }
}
