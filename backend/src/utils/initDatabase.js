// Database initialization script
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mysql from 'mysql2/promise';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize database schema
 */
async function initDatabase() {
  // Create connection without database first
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    multipleStatements: true,
  });

  try {
    console.log('Connecting to MySQL...');

    // Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.name}\` 
      DEFAULT CHARACTER SET utf8mb4 
      DEFAULT COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${config.database.name}' created or already exists`);

    // Use the database
    await connection.query(`USE \`${config.database.name}\``);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await connection.query(schema);

    console.log('Database schema initialized successfully');

    // Verify tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nCreated tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if executed directly
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  initDatabase()
    .then(() => {
      console.log('\n✓ Database initialization complete');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { initDatabase };