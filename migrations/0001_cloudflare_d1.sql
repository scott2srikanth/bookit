PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '',
  premise TEXT NOT NULL DEFAULT '', genre TEXT NOT NULL DEFAULT 'Fiction',
  audience TEXT NOT NULL DEFAULT 'Adult', tone TEXT NOT NULL DEFAULT 'Engaging',
  language TEXT NOT NULL DEFAULT 'English', status TEXT NOT NULL DEFAULT 'draft',
  description TEXT NOT NULL DEFAULT '', keywords TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, title TEXT NOT NULL, summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'planned',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS chapter_versions (
  id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  content TEXT NOT NULL, created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS story_items (
  id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  type TEXT NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, email TEXT NOT NULL,
  created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL, blocked_until INTEGER
);

CREATE INDEX IF NOT EXISTS idx_chapters_book_position ON chapters(book_id, position);
CREATE INDEX IF NOT EXISTS idx_story_items_book_type ON story_items(book_id, type);
CREATE INDEX IF NOT EXISTS idx_versions_chapter_created ON chapter_versions(chapter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
