const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

async function setupAuth() {
    const client = await pool.connect();
    try {
        console.log('Setting up Authentication...');

        // 1. Create Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created users table');

        // 2. Create Seed User
        const name = 'Tahir Mahmood';
        const username = 'tahirmahmood';
        const password = 'Tahir1980';
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if user exists
        const userCheck = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (userCheck.rows.length === 0) {
            await client.query(
                'INSERT INTO users (name, username, password_hash) VALUES ($1, $2, $3)',
                [name, username, passwordHash]
            );
            console.log('Created seed user:', username);
        } else {
            console.log('Seed user already exists');
            // Optionally update password to ensure it matches
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE username = $2',
                [passwordHash, username]
            );
            console.log('Updated seed user password');
        }

        console.log('Auth setup completed successfully');
    } catch (err) {
        console.error('Auth setup failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

setupAuth();
