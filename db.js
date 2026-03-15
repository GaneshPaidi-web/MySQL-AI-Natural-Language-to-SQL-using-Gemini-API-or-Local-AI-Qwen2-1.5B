import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

class Database {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "test",
      multipleStatements: true
    });
    this.config = null;
  }

  async verifyPassword(inputPassword) {
    const host = this.config ? this.config.host : (process.env.DB_HOST || "localhost");
    const user = this.config ? this.config.user : (process.env.DB_USER || "root");
    const port = this.config ? this.config.port : 3306;

    console.log(`[DEBUG] Verifying password for ${user}@${host}:${port}`);

    try {
      const tempConnection = await mysql.createConnection({
        host,
        user,
        password: inputPassword,
        port
      });
      await tempConnection.end();
      console.log(`[DEBUG] Password verification SUCCESS for ${user}`);
      return true;
    } catch (error) {
      console.error(`[DEBUG] Password verification FAILED for ${user}:`, error.message);
      return false;
    }
  }

  async setConnection(config) {
    this.config = config;
    const testPool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database || null,
      port: config.port || 3306,
      multipleStatements: true
    });

    const connection = await testPool.getConnection();
    connection.release();
    this.pool = testPool;
  }

  async getDatabases() {
    const [rows] = await this.pool.query("SHOW DATABASES");
    const ignore = ["information_schema", "mysql", "performance_schema", "sys"];
    return rows
      .map(r => Object.values(r)[0])
      .filter(db => !ignore.includes(db));
  }

  async useDatabase(dbName) {
    if (!this.config) throw new Error("Connection not established");
    this.config = { ...this.config, database: dbName };
    await this.setConnection(this.config);
  }

  async query(sql, params) {
    return this.pool.query(sql, params);
  }

  async createDatabase(dbName) {
    await this.pool.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  }

  async deleteDatabase(dbName) {
    await this.pool.query(`DROP DATABASE \`${dbName}\``);
  }

  async getSchema() {
    try {
      // Use DATABASE() directly to ensure we're looking at the current connection's DB
      const [columns] = await this.pool.query(`
        SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `);

      if (columns.length === 0) {
        // Fallback: If no columns found, at least try to get table names
        const [tables] = await this.pool.query("SHOW TABLES");
        if (tables.length > 0) {
          const tableList = tables.map(t => Object.values(t)[0]).join(", ");
          return `Tables in database: ${tableList} (No column metadata available)`;
        }

        const [currentDb] = await this.pool.query("SELECT DATABASE()");
        const dbName = currentDb[0] ? Object.values(currentDb[0])[0] : "unknown";
        return `Database '${dbName}' is empty or no tables found.`;
      }

      // Group by table for a compact, token-efficient prompt
      const tableMap = {};
      columns.forEach(c => {
        if (!tableMap[c.TABLE_NAME]) tableMap[c.TABLE_NAME] = [];
        let colDef = `${c.COLUMN_NAME} ${c.COLUMN_TYPE}`;
        if (c.COLUMN_KEY === "PRI") colDef += " PRIMARY KEY";
        tableMap[c.TABLE_NAME].push(colDef);
      });

      // Format as: table1(col1 type, col2 type); table2(col1 type);
      return Object.entries(tableMap)
        .map(([table, cols]) => `${table}(${cols.join(", ")})`)
        .join(";\n");
    } catch (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
  }
}

const db = new Database();
export default db;
