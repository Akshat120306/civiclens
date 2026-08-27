import Database from 'better-sqlite3';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sqliteDb = null;
let pgPool = null;
let activeEngine = 'sqlite';

export async function initDb() {
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
      return;
    } catch (err) {
      console.warn('PostgreSQL connection failed. Falling back to local high-performance SQLite engine.', err.message);
    }
  }

  // Fallback / Default to SQLite
  const dbPath = path.resolve(__dirname, '../../civiclens.db');
  console.log(`Initializing SQLite database at: ${dbPath}`);
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');

  // Execute schema
  sqliteDb.exec(schemaSql);
  activeEngine = 'sqlite';
  console.log('Database schema initialized successfully.');
}

export function getEngine() {
  return activeEngine;
}

export async function query(text, params = []) {
  if (activeEngine === 'postgres' && pgPool) {
    // text is already in $1, $2 format
    const res = await pgPool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount,
    };
  }

  if (!sqliteDb) {
    await initDb();
  }

  // Convert PostgreSQL $1, $2 placeholders to SQLite ?
  let sqliteQuery = text.replace(/\$(\d+)/g, '?');

  // If query returns rows (SELECT, RETURNING, etc.)
  const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sqliteQuery);
  const isReturning = /RETURNING/i.test(sqliteQuery);

  if (isSelect || isReturning) {
    // If it has RETURNING in sqlite (SQLite 3.35+ supports RETURNING)
    try {
      const stmt = sqliteDb.prepare(sqliteQuery);
      const rows = stmt.all(...params);
      return {
        rows: rows || [],
        rowCount: rows ? rows.length : 0,
      };
    } catch (err) {
      // If RETURNING failed or fallback needed
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
