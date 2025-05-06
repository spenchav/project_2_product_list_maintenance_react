require('dotenv').config(); // Load environment variables from .env file
const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  queueLimit: 0
});

// Test the connection (optional, but good for setup)
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database via pool.');
    connection.release();
  })
  .catch(err => {
    console.error('[ERROR] Failed to connect to the database:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[HINT] Check your database username and password in the .env file.');
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('[HINT] Check your database host and port in the .env file.');
    }
    // You might want to exit the process if the DB connection fails critically at startup
    // process.exit(1);
  });

module.exports = pool; 