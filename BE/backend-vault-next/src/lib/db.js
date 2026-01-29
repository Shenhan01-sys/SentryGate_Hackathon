import mysql from 'mysql2/promise';

// Membuat pool koneksi ke MySQL XAMPP
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Kosongkan jika menggunakan XAMPP default
  database: 'secure_vault',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;