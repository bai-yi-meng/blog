// ============================================
// Friend Link API: list, list-by-admin, add
// ============================================

import { success, failure, all, run } from '../../_shared/db.js';

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
    if (method === 'GET' && path.endsWith('/list-by-admin')) {
        return handleListByAdmin(env);
    }
    if (method === 'POST' && path.endsWith('/add')) {
        return handleAdd(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleList(env) {
    const links = await all(env.DB, 'SELECT * FROM db_friend_link WHERE is_default = 0 ORDER BY create_time DESC');
    const list = links.map(l => ({
        id: l.id, name: l.name, url: l.url, description: l.description,
        avatar: l.avatar, isDefault: l.is_default, createTime: l.create_time
    }));
    return success(list);
}

async function handleListByAdmin(env) {
    const links = await all(env.DB, 'SELECT * FROM db_friend_link ORDER BY create_time DESC');
    const list = links.map(l => ({
        id: l.id, name: l.name, url: l.url, description: l.description,
        avatar: l.avatar, isDefault: l.is_default, createTime: l.create_time
    }));
    return success(list);
}

async function handleAdd(request, env) {
    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const url = formData.get('url');
        const description = formData.get('description');
        const avatarFile = formData.get('avatar');

        let avatar = '';
        if (avatarFile && avatarFile.size > 0) {
            const bytes = await avatarFile.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
            avatar = `data:${avatarFile.type};base64,${base64}`;
        }

        await run(env.DB, 'INSERT INTO db_friend_link (name, url, description, avatar, create_time) VALUES (?, ?, ?, ?, datetime("now"))',
            name || '', url || '', description || '', avatar);
        return success();
    } catch (e) {
        return failure(500, '添加失败: ' + e.message);
    }
}
