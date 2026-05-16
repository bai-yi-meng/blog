// ============================================
// Talk API: list, page, publish, update, delete, comments, upload-images
// ============================================

import { success, failure, unauthorized, forbidden, requireAuth, first, all, run } from '../../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    // /api/talk/list
    if (method === 'GET' && path.endsWith('/list')) {
        return handleList(env);
    }
    // /api/talk/page
    if (method === 'GET' && path.endsWith('/page')) {
        return handlePage(url, env);
    }
    // /api/talk/:talkId/comments (GET)
    if (method === 'GET' && path.includes('/comments') && !path.includes('/comment/')) {
        return handleGetComments(path, env);
    }
    // /api/talk/:talkId/comment (POST)
    if (method === 'POST' && path.includes('/comment') && !path.includes('/comment/')) {
        return handleAddComment(request, path, env);
    }
    // /api/talk/comment/:commentId (DELETE)
    if (method === 'DELETE' && path.includes('/comment/')) {
        return handleDeleteComment(request, path, env);
    }
    // /api/talk/upload-images (POST)
    if (method === 'POST' && path.endsWith('/upload-images')) {
        return failure(400, '图片上传在Cloudflare Functions中请使用R2存储');
    }
    // /api/talk (DELETE /:id)
    if (method === 'DELETE') {
        return handleDelete(path, env);
    }
    // /api/talk (PUT /update)
    if (method === 'PUT') {
        return handleUpdate(request, env);
    }
    // /api/talk/publish (POST)
    if (method === 'POST' && path.endsWith('/publish')) {
        return handlePublish(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleList(env) {
    const talks = await all(env.DB, 'SELECT * FROM db_talk ORDER BY create_time DESC');
    const list = talks.map(t => ({
        id: t.id,
        content: t.content,
        images: t.images,
        userId: t.user_id,
        createTime: t.create_time,
        likes: t.likes,
        comments: t.comments,
        views: t.views
    }));
    return success(list);
}

async function handlePage(url, env) {
    const pageNum = parseInt(url.searchParams.get('pageNum') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const offset = (pageNum - 1) * pageSize;

    const talks = await all(env.DB, 'SELECT * FROM db_talk ORDER BY create_time DESC LIMIT ? OFFSET ?', pageSize, offset);
    const count = await first(env.DB, 'SELECT COUNT(*) as total FROM db_talk');

    const list = talks.map(t => ({
        id: t.id, content: t.content, images: t.images,
        userId: t.user_id, createTime: t.create_time,
        likes: t.likes, comments: t.comments, views: t.views
    }));

    return success({
        records: list,
        total: count ? count.total : 0,
        size: pageSize,
        current: pageNum
    });
}

async function handlePublish(request, env) {
    try {
        const data = await request.json();
        await run(env.DB, 'INSERT INTO db_talk (content, images, user_id, create_time) VALUES (?, ?, ?, datetime("now"))',
            data.content || '', data.images || '', data.userId || 0);
        return success();
    } catch (e) {
        return failure(500, '发布失败');
    }
}

async function handleUpdate(request, env) {
    try {
        const data = await request.json();
        await run(env.DB, 'UPDATE db_talk SET content = ?, images = ? WHERE id = ?',
            data.content || '', data.images || '', data.id);
        return success();
    } catch (e) {
        return failure(500, '更新失败');
    }
}

async function handleDelete(path, env) {
    const parts = path.split('/');
    const id = parseInt(parts[parts.length - 1]);
    if (!id) return failure(400, 'ID无效');
    await run(env.DB, 'DELETE FROM db_talk WHERE id = ?', id);
    return success();
}

async function handleGetComments(path, env) {
    const parts = path.split('/');
    const talkId = parseInt(parts[parts.length - 2]);
    if (!talkId) return failure(400, '参数错误');

    const comments = await all(env.DB, 'SELECT * FROM db_talk_comment WHERE talk_id = ? ORDER BY create_time ASC', talkId);
    const list = comments.map(c => ({
        id: c.id, talkId: c.talk_id, content: c.content,
        userId: c.user_id, username: c.username, createTime: c.create_time
    }));
    return success(list);
}

async function handleAddComment(request, path, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();

    try {
        const parts = path.split('/');
        const talkId = parseInt(parts[parts.length - 2]);
        if (!talkId) return failure(400, '参数错误');

        const data = await request.json();
        await run(env.DB, 'INSERT INTO db_talk_comment (talk_id, content, user_id, username, create_time) VALUES (?, ?, ?, ?, datetime("now"))',
            talkId, data.content || '', jwt.userId, jwt.username);

        await run(env.DB, 'UPDATE db_talk SET comments = comments + 1 WHERE id = ?', talkId);
        return success();
    } catch (e) {
        return failure(500, '评论失败');
    }
}

async function handleDeleteComment(request, path, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();

    const parts = path.split('/');
    const commentId = parseInt(parts[parts.length - 1]);
    if (!commentId) return failure(400, '参数错误');

    const comment = await first(env.DB, 'SELECT * FROM db_talk_comment WHERE id = ?', commentId);
    if (!comment) return failure(404, '评论不存在');

    if (comment.username !== jwt.username && jwt.role !== 'admin') return forbidden();

    await run(env.DB, 'DELETE FROM db_talk_comment WHERE id = ?', commentId);
    await run(env.DB, 'UPDATE db_talk SET comments = MAX(0, comments - 1) WHERE id = ?', comment.talk_id);
    return success();
}
