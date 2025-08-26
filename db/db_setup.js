const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true // Allows executing multiple SQL statements from the file
};

async function setupDatabase() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await connection.query(schemaSql);
        console.log('Database schema created successfully!');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
