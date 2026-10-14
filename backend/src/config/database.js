// Database connection pool using mysql2/promise
import mysql from 'mysql2/promise';
import config from '../config/index.js';

/**
 * Creates and exports a MySQL connection pool
 * The pool is configured with connection limits and keep-alive settings
 */
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: config.database.waitForConnections,
  connectionLimit: config.database.connectionLimit,
  queueLimit: config.database.queueLimit,
  enableKeepAlive: config.database.enableKeepAlive,
  keepAliveInitialDelay: config.database.keepAliveInitialDelay,
  // Enable named placeholders for easier query building
  namedPlaceholders: true,
  // Return dates as Date objects
  dateStrings: false,
  // Timezone handling
  timezone: 'Z',
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✓ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Execute a query with automatic connection management
 * @param {string} sql - SQL query string
 * @param {Object|Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Execute a query and return a single row
 * @param {string} sql - SQL query string
 * @param {Object|Array} params - Query parameters
 * @returns {Promise<Object|null>} Single row or null
 */
export async function queryOne(sql, params = {}) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Execute an insert query and return the insert ID
 * @param {string} sql - SQL insert statement
 * @param {Object|Array} params - Query parameters
 * @returns {Promise<number>} Insert ID
 */
export async function insert(sql, params = {}) {
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Function that receives connection and executes queries
 * @returns {Promise<any>} Result of the callback
 */
export async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close the connection pool gracefully
 * @returns {Promise<void>}
 */
export async function closePool() {
  await pool.end();
  console.log('Database connection pool closed');
}

export default pool;