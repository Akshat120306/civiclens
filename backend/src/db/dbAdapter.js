import Database from 'better-sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqliteDb = null;
let pgPool = null;
let activeEngine = 'sqlite';
let isInitializing = null;

export async function initDb() {
  if (isInitializing) return isInitializing;

  isInitializing = (async () => {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    if (config.databaseUrl) {
      try {
        console.log('Connecting to PostgreSQL database...');
        pgPool = new pg.Pool({ connectionString: config.databaseUrl });
        const client = await pgPool.connect();
        console.log('Connected to PostgreSQL successfully.');
        
        // Execute schema
        await client.query(schemaSql);
        client.release();
        activeEngine = 'postgres';
        await autoSeedIfEmpty();
        return;
      } catch (err) {
        console.warn('PostgreSQL connection failed. Falling back to local SQLite engine.', err.message);
      }
    }

    // SQLite Fallback (handle /tmp for Vercel / serverless environments)
    let dbPath = path.resolve(__dirname, '../../civiclens.db');
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      dbPath = path.join(os.tmpdir(), 'civiclens.db');
    }

    try {
      console.log(`Initializing SQLite database at: ${dbPath}`);
      sqliteDb = new Database(dbPath);
      sqliteDb.pragma('foreign_keys = ON');
      sqliteDb.exec(schemaSql);
      activeEngine = 'sqlite';
      console.log('Database schema initialized successfully.');
      await autoSeedIfEmpty();
    } catch (sqliteErr) {
      console.error('Failed to initialize SQLite:', sqliteErr.message);
    }
  })();

  return isInitializing;
}

async function autoSeedIfEmpty() {
  try {
    const check = await query('SELECT COUNT(*) as count FROM users');
    const count = Number(check.rows[0]?.count || check.rows[0]?.COUNT || 0);
    if (count === 0) {
      console.log('Empty database detected. Running automatic demo seed...');
      // Import seed helper dynamically
      const seedModule = await import('./seed.js');
      if (typeof seedModule.runSeed === 'function') {
        await seedModule.runSeed();
      }
    }
  } catch (err) {
    console.warn('Auto-seed check note:', err.message);
  }
}

export function getEngine() {
  return activeEngine;
}

export async function query(text, params = []) {
  if (!sqliteDb && !pgPool) {
    await initDb();
  }

  if (activeEngine === 'postgres' && pgPool) {
    const res = await pgPool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount,
    };
  }

  if (!sqliteDb) {
    throw new Error('Database not initialized');
  }

  // Convert PostgreSQL $1, $2 placeholders to SQLite ?
  let sqliteQuery = text.replace(/\$(\d+)/g, '?');

  const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteQuery);
  const isReturning = /RETURNING/i.test(sqliteQuery);

  if (isSelect || isReturning) {
    try {
      const stmt = sqliteDb.prepare(sqliteQuery);
      const rows = stmt.all(...params);
      return {
        rows: rows || [],
        rowCount: rows ? rows.length : 0,
      };
    } catch (err) {
      const stmt = sqliteDb.prepare(sqliteQuery.replace(/\s+RETURNING\s+.*$/i, ''));
      const info = stmt.run(...params);
      return {
        rows: info.lastInsertRowid ? [{ id: Number(info.lastInsertRowid) }] : [],
        rowCount: info.changes,
        lastInsertRowid: info.lastInsertRowid,
      };
    }
  } else {
    const stmt = sqliteDb.prepare(sqliteQuery);
    const info = stmt.run(...params);
    return {
      rows: [],
      rowCount: info.changes,
      lastInsertRowid: Number(info.lastInsertRowid),
    };
  }
}

export default {
  initDb,
  query,
  getEngine,
};
