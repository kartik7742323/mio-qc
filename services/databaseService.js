const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(config.DB_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Table to store issue status (resolved/unresolved)
        this.db.run(
          `CREATE TABLE IF NOT EXISTS issue_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            execution_id TEXT NOT NULL,
            client TEXT NOT NULL,
            category TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(execution_id, category, type)
          )`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });
  }

  async updateIssueStatus(executionId, client, category, type, status) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO issue_status (execution_id, client, category, type, status)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(execution_id, category, type) DO UPDATE SET
         status = excluded.status,
         updated_at = CURRENT_TIMESTAMP`,
        [executionId, client, category, type, status],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  async getIssueStatus(executionId, client, category, type) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT status FROM issue_status
         WHERE execution_id = ? AND client = ? AND category = ? AND type = ?`,
        [executionId, client, category, type],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.status || 'open');
        }
      );
    });
  }

  async getAllIssueStatuses(client) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT execution_id, category, type, status FROM issue_status WHERE client = ?`,
        [client],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();
