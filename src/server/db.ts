import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'db.json');

export interface DbStore {
  entries: any[];
  users: any[];
  pledges?: any[];
  badges?: any[];
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// In-memory cache — db.json is read from disk exactly once at startup.
// All reads after that are served from this cache (O(1) memory access).
// Writes update the cache synchronously and flush to disk asynchronously.
// ---------------------------------------------------------------------------
let _cache: DbStore | null = null;
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function normalise(parsed: any): DbStore {
  return {
    ...parsed,
    entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    users:   Array.isArray(parsed.users)   ? parsed.users   : [],
    pledges: Array.isArray(parsed.pledges) ? parsed.pledges : [],
    badges:  Array.isArray(parsed.badges)  ? parsed.badges  : [],
  };
}

/** Read from in-memory cache. Populates cache from disk on first call. */
export function readDb(): DbStore {
  if (_cache) return _cache;
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    _cache = normalise(JSON.parse(raw));
    console.log(`[db] Loaded db.json from disk (${_cache.entries.length} entries, ${_cache.users.length} users)`);
  } catch {
    _cache = { entries: [], users: [], pledges: [], badges: [] };
    console.warn('[db] db.json not found or invalid — starting with empty store');
  }
  return _cache;
}

/**
 * Write to in-memory cache immediately, then schedule an async disk flush.
 * Debounced: multiple rapid writes coalesce into a single fs.writeFile call.
 */
export function writeDb(data: DbStore): void {
  _cache = data;
  if (_flushTimer) clearTimeout(_flushTimer);
  _flushTimer = setTimeout(() => {
    const json = JSON.stringify(_cache, null, 2);
    fs.writeFile(DB_FILE, json, 'utf-8', (err) => {
      if (err) console.error('[db] Async flush failed:', err);
    });
    _flushTimer = null;
  }, 200); // 200ms debounce — coalesces burst writes
}

/** Force an immediate synchronous flush to disk (used on process exit). */
export function flushDb(): void {
  if (!_cache) return;
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(_cache, null, 2), 'utf-8');
  } catch (e) {
    console.error('[db] Sync flush on exit failed:', e);
  }
}

// Flush to disk before the process exits so no writes are lost
process.on('SIGINT',  () => { flushDb(); process.exit(0); });
process.on('SIGTERM', () => { flushDb(); process.exit(0); });

