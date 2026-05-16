// ============================================
// Base Info API: get-info, increment-visits, current-online
// ============================================

import { success, failure, first, run } from '../_shared/db.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
    }

    if (method === 'GET' && path.endsWith('/get-info')) {
        return handleGetInfo(env);
    }
    if (method === 'POST' && path.endsWith('/increment-visits')) {
        return handleIncrementVisits(env);
    }
    if (method === 'GET' && path.endsWith('/current-online')) {
        return handleCurrentOnline(env);
    }

    return failure(404, '接口不存在');
}

async function handleGetInfo(env) {
    try {
        const info = await first(env.DB, 'SELECT * FROM db_baseinfo WHERE id = 1');
        if (!info) {
            // Initialize if not exists
            await run(env.DB, 'INSERT OR IGNORE INTO db_baseinfo (id, total_visits, current_online, start_runtime, update_runtime, total_articles) VALUES (1, 0, 0, datetime("now"), datetime("now"), 0)');
            const fresh = await first(env.DB, 'SELECT * FROM db_baseinfo WHERE id = 1');
            return success({
                totalVisits: fresh.total_visits || 0,
                currentOnline: 1,
                startRuntime: fresh.start_runtime,
                updateRuntime: fresh.update_runtime,
                totalArticles: fresh.total_articles || 0
            });
        }
        return success({
            totalVisits: info.total_visits || 0,
            currentOnline: 1,
            startRuntime: info.start_runtime,
            updateRuntime: info.update_runtime,
            totalArticles: info.total_articles || 0
        });
    } catch (e) {
        return failure(500, '获取基础信息失败');
    }
}

async function handleIncrementVisits(env) {
    try {
        await run(env.DB, 'UPDATE db_baseinfo SET total_visits = total_visits + 1, update_runtime = datetime("now") WHERE id = 1');
        return success();
    } catch (e) {
        return failure(500, '增加访问量失败');
    }
}

async function handleCurrentOnline(env) {
    // D1 doesn't support real-time online count without WebSocket
    // Return a default value
    return success(1);
}
