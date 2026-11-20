CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, slug)
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('command', 'block', 'cloze', 'quiz')),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    target TEXT NOT NULL,
    explanation TEXT,
    image_url TEXT,
    cloze_data TEXT,
    quiz_options TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    repetitions INTEGER DEFAULT 0,
    interval_days INTEGER DEFAULT 0,
    ease_factor REAL DEFAULT 2.5,
    due_date DATETIME NOT NULL,
    total_drilled_count INTEGER DEFAULT 0,
    last_reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_topic ON modules(topic_id);
CREATE INDEX IF NOT EXISTS idx_items_module ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_progress_due ON user_progress(due_date);
