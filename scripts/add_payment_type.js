const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        let cleanValue = value.trim();
        if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
            (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
            cleanValue = cleanValue.slice(1, -1);
        }
        envConfig[key.trim()] = cleanValue;
    }
});

const pool = new Pool({
    connectionString: envConfig.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');

        await client.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'credit';
        `);
        console.log('Added type to payments');

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
