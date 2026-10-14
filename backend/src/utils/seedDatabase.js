// Database seeding script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed database with sample data
 */
async function seedDatabase() {
  const connection = await mysql.createConnection({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    multipleStatements: true,
  });

  try {
    console.log('Seeding database...');

    // Read and execute seed
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = seed
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }

    console.log('Database seeded successfully');

    // Verify data
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [favCount] = await connection.query('SELECT COUNT(*) as count FROM favorites');
    const [planCount] = await connection.query('SELECT COUNT(*) as count FROM travel_plans');

    console.log('\nSeed data summary:');
    console.log(`  Users: ${userCount[0].count}`);
    console.log(`  Favorites: ${favCount[0].count}`);
    console.log(`  Travel Plans: ${planCount[0].count}`);

  } catch (error) {
    console.error('Database seeding failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('\n✓ Database seeding complete');
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { seedDatabase };