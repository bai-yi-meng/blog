// ============================================
// Baiyimeng's Blog - Shared Utilities
// Database helpers, JWT, password, response format
// ============================================

const JWT_SECRET = 'abcdefghijklmn';
const JWT_EXPIRE_HOURS = 72;

// ==================== Response Helpers ====================

function success(data = null) {
    const body = { code: 200, data, message: '请求成功' };
    // FastJSON-style: always include data even if null
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

function failure(code, message) {
    return new Response(JSON.stringify({ code, data: null, message }), {
        status: code >= 500 ? 500 : 400,
        headers: { 'Content-Type': 'application/json' }
    });
}

function unauthorized(message = '未登录或登录已过期') {
    return new Response(JSON.stringify({ code: 401, data: null, message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
    });
}

function forbidden(message = '无权限') {
    return new Response(JSON.stringify({ code: 403, data: null, message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    });
}

// ==================== CORS ====================

function corsHeaders() {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
}

function corsResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: corsHeaders()
    });
}

// ==================== Base64 URL helpers ====================

function base64url(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

function stringToUint8(str) {
    return new TextEncoder().encode(str);
}

function uint8ToString(buf) {
    return new TextDecoder().decode(buf);
}

// ==================== JWT ====================

async function createJWT(payload, secret = JWT_SECRET, expireHours = JWT_EXPIRE_HOURS) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = { ...payload, iat: now, exp: now + (expireHours * 3600) };

    const encHeader = base64url(JSON.stringify(header));
    const encPayload = base64url(JSON.stringify(fullPayload));
    const data = `${encHeader}.${encPayload}`;

    const key = await crypto.subtle.importKey(
        'raw', stringToUint8(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, stringToUint8(data));
    const encSig = base64url(String.fromCharCode(...new Uint8Array(sig)));

    return `${data}.${encSig}`;
}

async function verifyJWT(token, secret = JWT_SECRET) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, payload, signature] = parts;
        const data = `${header}.${payload}`;

        const key = await crypto.subtle.importKey(
            'raw', stringToUint8(secret),
            { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );

        const sigBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, stringToUint8(data));
        if (!valid) return null;

        const decoded = JSON.parse(base64urlDecode(payload));
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
        return decoded;
    } catch {
        return null;
    }
}

function getExpireTime() {
    return new Date(Date.now() + JWT_EXPIRE_HOURS * 3600 * 1000).toISOString();
}

// ==================== Password (PBKDF2) ====================

async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', stringToUint8(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
    );
    const saltB64 = btoa(String.fromCharCode(...salt));
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return `pbkdf2:100000:${saltB64}:${hashB64}`;
}

async function verifyPassword(password, stored) {
    if (!stored) return false;
    try {
        const parts = stored.split(':');
        if (parts[0] === 'pbkdf2' && parts.length === 4) {
            const iterations = parseInt(parts[1]);
            const salt = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
            const expectedHash = atob(parts[3]);

            const key = await crypto.subtle.importKey('raw', stringToUint8(password), 'PBKDF2', false, ['deriveBits']);
            const hash = await crypto.subtle.deriveBits(
                { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256
            );
            const hashStr = String.fromCharCode(...new Uint8Array(hash));
            return hashStr === expectedHash;
        }
        // Fallback: plain text comparison (for initial setup)
        if (!stored.includes(':')) {
            return password === stored;
        }
        return false;
    } catch {
        return false;
    }
}

// ==================== Auth Middleware ====================

async function requireAuth(request) {
    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7);
    return await verifyJWT(token);
}

// ==================== DB Helpers ====================

async function first(db, sql, ...params) {
    const result = await db.prepare(sql).bind(...params).first();
    return result || null;
}

async function all(db, sql, ...params) {
    const result = await db.prepare(sql).bind(...params).all();
    return result.results || [];
}

async function run(db, sql, ...params) {
    return await db.prepare(sql).bind(...params).run();
}

// ==================== Exports ====================

export {
    success, failure, unauthorized, forbidden,
    corsHeaders, corsResponse,
    createJWT, verifyJWT, getExpireTime,
    hashPassword, verifyPassword,
    requireAuth,
    first, all, run,
    JWT_SECRET
};
