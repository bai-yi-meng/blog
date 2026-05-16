// ============================================
// Article API: getArticleInfoById, getArticleList, modifyReadOrStar, add, update, delete, addWithFile
// ============================================

import { success, failure, forbidden, unauthorized, requireAuth, first, all, run } from '../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    if (method === 'GET' && path.endsWith('/getArticleInfoById')) {
        return handleGetById(url, env);
    }
    if (method === 'GET' && path.endsWith('/getArticleList')) {
        return handleGetList(env);
    }
    if (method === 'POST' && path.endsWith('/modifyReadOrStar')) {
        return handleModifyReadOrStar(url);
    }
    if (method === 'POST' && path.endsWith('/add')) {
        return handleAdd(request, env);
    }
    if (method === 'POST' && path.endsWith('/update')) {
        return handleUpdate(request, env);
    }
    if (method === 'POST' && path.endsWith('/delete')) {
        return handleDelete(request, env);
    }
    if (method === 'POST' && path.endsWith('/addWithFile')) {
        return handleAddWithFile(request, env);
    }

    return failure(404, '接口不存在');
}

async function handleGetById(url, env) {
    const id = url.searchParams.get('id');
    if (!id) return failure(400, '文章ID不能为空');

    const article = await first(env.DB, 'SELECT * FROM db_article_baseinfo WHERE article_id = ? AND del_flag = 0', parseInt(id));
    if (!article) return failure(404, '文章不存在');

    let tags = [];
    try { tags = JSON.parse(article.tags || '[]'); } catch {}

    return success({
        articleId: article.article_id,
        startTime: article.start_time,
        updateTime: article.update_time,
        title: article.title,
        description: article.description,
        star: article.star,
        readNum: article.read_num,
        tags,
        role: null
    });
}

async function handleGetList(env) {
    const articles = await all(env.DB, 'SELECT article_id, title, start_time, update_time, description, star, read_num, tags FROM db_article_baseinfo WHERE del_flag = 0 ORDER BY update_time DESC');
    const list = articles.map(a => {
        let tags = [];
        try { tags = JSON.parse(a.tags || '[]'); } catch {}
        return {
            articleId: a.article_id,
            title: a.title,
            startTime: a.start_time,
            updateTime: a.update_time,
            description: a.description,
            star: a.star,
            readNum: a.read_num,
            tags
        };
    });
    return success(list);
}

async function handleModifyReadOrStar(url) {
    return success();
}

async function handleAdd(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();
        if (data.role !== 'admin') return forbidden();

        const maxId = await first(env.DB, 'SELECT COALESCE(MAX(article_id), 0) as max_id FROM db_article_baseinfo');
        const articleId = maxId.max_id + 1;

        const tags = JSON.stringify(data.tags || []);
        await run(env.DB,
            'INSERT INTO db_article_baseinfo (article_id, title, description, tags, start_time, update_time) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))',
            articleId, data.title, data.description || '', tags
        );

        // Update total articles count
        await run(env.DB, 'UPDATE db_baseinfo SET total_articles = total_articles + 1, update_runtime = datetime("now") WHERE id = 1');

        return success({ articleId });
    } catch (e) {
        return failure(500, '添加失败: ' + e.message);
    }
}

async function handleAddWithFile(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const formData = await request.formData();
        const title = formData.get('title');
        const description = formData.get('description');
        const tagsRaw = formData.get('tags');
        const role = formData.get('role');
        const file = formData.get('file');

        if (role !== 'admin') return forbidden();
        if (!title) return failure(400, '标题不能为空');

        let tagList = [];
        try { tagList = JSON.parse(tagsRaw); } catch { tagList = []; }
        if (!Array.isArray(tagList)) tagList = [];

        const maxId = await first(env.DB, 'SELECT COALESCE(MAX(article_id), 0) as max_id FROM db_article_baseinfo');
        const articleId = maxId.max_id + 1;

        let content = '';
        if (file) {
            content = await file.text();
        }

        await run(env.DB,
            'INSERT INTO db_article_baseinfo (article_id, title, description, tags, content, start_time, update_time) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
            articleId, title, description || '', JSON.stringify(tagList), content
        );

        await run(env.DB, 'UPDATE db_baseinfo SET total_articles = total_articles + 1, update_runtime = datetime("now") WHERE id = 1');

        return success({ articleId });
    } catch (e) {
        return failure(500, '添加失败: ' + e.message);
    }
}

async function handleUpdate(request, env) {
    const jwt = await requireAuth(request);
    if (!jwt) return unauthorized();
    if (jwt.role !== 'admin') return forbidden();

    try {
        const data = await request.json();
        if (data.role !== 'admin') return forbidden();

        const tags = JSON.stringify(data.tags || []);
        await run(env.DB,
            'UPDATE db_article_baseinfo SET title = ?, description = ?, tags = ?, update_time = datetime("now") WHERE article_id = ? AND del_flag = 0',
            data.title, data.description || '', tags, data.articleId
        );
        return success();
    } catch (e) {
        return failure(500, '更新失败: ' + e.message);
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
        const role = params.get('role');

        if (role !== 'admin') return forbidden();

        await run(env.DB, 'UPDATE db_article_baseinfo SET del_flag = 1 WHERE article_id = ?', parseInt(id));
        await run(env.DB, 'UPDATE db_baseinfo SET total_articles = MAX(0, total_articles - 1), update_runtime = datetime("now") WHERE id = 1');
        return success();
    } catch (e) {
        return failure(500, '删除失败: ' + e.message);
    }
}
