-- ============================================
-- Baiyimeng's Blog - D1 Database Schema
-- MySQL → SQLite migration for Cloudflare D1
-- ============================================

-- 用户账户表
CREATE TABLE IF NOT EXISTS db_account (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    register_time TEXT DEFAULT (datetime('now')),
    del_flag TEXT DEFAULT '0'
);

-- 插入默认管理员（密码: cui051021，PBKDF2）
INSERT OR IGNORE INTO db_account (username, password, email, role, register_time, del_flag)
VALUES ('baiyimeng', 'pbkdf2:100000:iIdAJePRKqC1Pg+5c+K5MQ==:Hi28sZGqOPZWX3p0O9QDlecN9Up4sHsym5LGUSt8fys=', 'admin@baiyimeng.blog', 'admin', datetime('now'), '0');

-- 文章基础信息表
CREATE TABLE IF NOT EXISTS db_article_baseinfo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT DEFAULT (datetime('now')),
    update_time TEXT DEFAULT (datetime('now')),
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    star INTEGER DEFAULT 0,
    read_num INTEGER DEFAULT 0,
    del_flag INTEGER DEFAULT 0
);

-- 文章标签关联表
CREATE TABLE IF NOT EXISTS db_article_tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL
);

-- 标签表
CREATE TABLE IF NOT EXISTS db_tag (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- 留言表
CREATE TABLE IF NOT EXISTS db_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    author TEXT DEFAULT '匿名',
    create_time TEXT DEFAULT (datetime('now'))
);

-- 随笔表
CREATE TABLE IF NOT EXISTS db_talk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    images TEXT DEFAULT '',
    user_id INTEGER,
    create_time TEXT DEFAULT (datetime('now')),
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0
);

-- 随笔评论表
CREATE TABLE IF NOT EXISTS db_talk_comment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talk_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER,
    username TEXT DEFAULT '匿名',
    create_time TEXT DEFAULT (datetime('now'))
);

-- 友链表
CREATE TABLE IF NOT EXISTS db_friend_link (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    is_default INTEGER DEFAULT 0,
    create_time TEXT DEFAULT (datetime('now'))
);

-- 网站通知表
CREATE TABLE IF NOT EXISTS db_notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read_num INTEGER DEFAULT 0,
    admin_name TEXT DEFAULT 'baiyimeng',
    create_time TEXT DEFAULT (datetime('now'))
);

-- 网站基础信息表
CREATE TABLE IF NOT EXISTS db_baseinfo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_visits INTEGER DEFAULT 0,
    current_online INTEGER DEFAULT 0,
    start_runtime TEXT DEFAULT (datetime('now')),
    update_runtime TEXT DEFAULT (datetime('now')),
    total_articles INTEGER DEFAULT 0
);

-- 插入默认基础信息
INSERT OR IGNORE INTO db_baseinfo (id, total_visits, current_online, start_runtime, update_runtime, total_articles)
VALUES (1, 0, 0, datetime('now'), datetime('now'), 0);

-- 网站开发任务表
CREATE TABLE IF NOT EXISTS db_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    status INTEGER DEFAULT 0,
    title_byuser TEXT DEFAULT '',
    description_byuser TEXT DEFAULT '',
    create_time TEXT DEFAULT (datetime('now')),
    create_time_byuser TEXT DEFAULT (datetime('now')),
    del_flag INTEGER DEFAULT 0,
    username TEXT DEFAULT ''
);
