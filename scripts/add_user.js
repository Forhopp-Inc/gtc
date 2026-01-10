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

async function addUser() {
    const client = await pool.connect();
    try {
        const name = "Tahir Mahmood";
        const username = "tahirmahmood83";
        const password = "Tahir1980";
        
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        console.log(`Adding user: ${username}`);
        
        const res = await client.query(
            `INSERT INTO users (name, username, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (username) DO NOTHING
             RETURNING id`,
            [name, username, hash]
        );
        
        if (res.rows.length > 0) {
            console.log('User added successfully with ID:', res.rows[0].id);
        } else {
            console.log('User already exists');
        }
    } catch (err) {
        console.error('Error adding user:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

addUser();
