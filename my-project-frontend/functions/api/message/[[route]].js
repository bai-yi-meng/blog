// ============================================
// Message API: list, add, delete
// ============================================

import { success, failure, requireAuth, forbidden, unauthorized, first, all, run } from '../../_shared/db.js';

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
    if (method === 'POST' && path.includes('/delete/')) {
        return handleDelete(request, path, env);
    }

    return failure(404, '接口不存在');
}

async function handleList(env) {
    const messages = await all(env.DB, 'SELECT id, content, author, create_time FROM db_messages ORDER BY create_time DESC');
    const list = messages.map(m => ({
        id: m.id,
        content: m.content,
        author: m.author,
        createTime: m.create_time
    }));
    return success(list);
}

async function handleAdd(request, env) {
    try {
        const data = await request.json();
        const content = data.content || '';
        const author = data.author || '匿名';

        await run(env.DB, 'INSERT INTO db_messages (content, author, create_time) VALUES (?, ?, datetime("now"))', content, author);
        return success();
    } catch (e) {
        return failure(500, '添加失败: ' + e.message);
    }
}

async function handleDelete(request, path, env) {
    await requireAuth(request);
    // Allow admin or just proceed (modify as needed)
    const parts = path.split('/');
    const id = parseInt(parts[parts.length - 1]);
    if (!id) return failure(400, 'ID无效');

    await run(env.DB, 'DELETE FROM db_messages WHERE id = ?', id);
    return success();
}
