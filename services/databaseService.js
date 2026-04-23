const { Pool } = require('pg');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.pool = null;
    this.available = false;
  }

  async init() {
    if (!config.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not set — status tracking disabled');
      return;
    }

    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await this.createTables();
      this.available = true;
      console.log('✅ PostgreSQL connected');
    } catch (err) {
      console.warn('⚠️  Database init failed:', err.message);
      this.pool = null;
    }
  }

  async createTables() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS issue_status (
        id SERIAL PRIMARY KEY,
        execution_id TEXT NOT NULL,
        client TEXT NOT NULL,
        category TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(execution_id, category, type)
      )
    `);
  }

  async updateIssueStatus(executionId, client, category, type, status) {
    if (!this.pool) return { id: null };
    const result = await this.pool.query(
      `INSERT INTO issue_status (execution_id, client, category, type, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT(execution_id, category, type) DO UPDATE SET
         status = EXCLUDED.status,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [executionId, client, category, type, status]
    );
    return { id: result.rows[0]?.id };
  }

  async getIssueStatus(executionId, client, category, type) {
    if (!this.pool) return 'open';
    const result = await this.pool.query(
      `SELECT status FROM issue_status
       WHERE execution_id = $1 AND client = $2 AND category = $3 AND type = $4`,
      [executionId, client, category, type]
    );
    return result.rows[0]?.status || 'open';
  }

  async getAllIssueStatuses(client) {
    if (!this.pool) return [];
    const result = await this.pool.query(
      `SELECT execution_id, category, type, status FROM issue_status WHERE client = $1`,
      [client]
    );
    return result.rows;
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}

module.exports = new DatabaseService();
