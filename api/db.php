<?php
/*
 * File: api/db.php
 * Deskripsi: Koneksi basis data dan pembuatan tabel.
 */


// Konfigurasi koneksi database MySQL untuk aplikasi BookStore.
// DB_HOST menentukan alamat server database.
define('DB_HOST', 'localhost');
// DB_NAME menentukan nama database yang akan digunakan.
define('DB_NAME', 'bookstore');
// DB_USER dan DB_PASS berisi kredensial untuk mengakses database.
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Membuat koneksi PDO ke server MySQL.
 *
 * Koneksi awal menunjuk ke host agar database dapat dibuat
 * sebelum koneksi berikutnya menggunakan database BookStore.
 */
function connectPdo(): PDO
{
    // Atur koneksi menggunakan UTF-8 dan konfigurasi PDO.
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            // Jadikan kesalahan database sebagai exception.
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Ambil hasil query sebagai array asosiatif secara default.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    // Kembalikan koneksi PDO ke pemanggil.
    return $pdo;
}

/**
 * Menyiapkan database dan tabel BookStore serta memastikan akun awal tersedia.
 *
 * @return PDO Koneksi PDO yang terhubung ke database BookStore.
 */
function ensureDatabaseAndSchema(): PDO
{
    // Hubungkan ke server terlebih dahulu untuk membuat database bila belum ada.
    $pdo = connectPdo();
    $pdo->exec(
        'CREATE DATABASE IF NOT EXISTS ' . DB_NAME . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
    );

    // Buat koneksi baru yang secara langsung menggunakan database BookStore.
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            // Jadikan kesalahan database sebagai exception.
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            // Gunakan array asosiatif saat mengambil hasil query.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    // Buat semua tabel aplikasi yang belum tersedia.
    createBookstoreTables($pdo);

    // Buat hash kata sandi untuk akun admin dan pengguna contoh.
    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);
    $userHash = password_hash('user123', PASSWORD_DEFAULT);

    // Masukkan akun awal; perbarui data jika email sudah terdaftar.
    $pdo->exec(
        'INSERT INTO users (name, email, password, role)
        VALUES
            ("Admin", "admin@usk.com", "' . $adminHash . '", "admin"),
            ("Safhira Ardelia.P", "user@usk.com", "' . $userHash . '", "user")
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            password = VALUES(password),
            role = VALUES(role)'
    );

    // Kembalikan koneksi siap pakai kepada pemanggil.
    return $pdo;
}

/**
 * Membuat tabel-tabel yang diperlukan aplikasi jika belum tersedia.
 *
 * Setiap elemen array berisi satu perintah SQL untuk satu tabel.
 */
function createBookstoreTables(PDO $pdo): void
{
    // Skema katalog buku beserta informasi harga, stok, dan detailnya.
    $statements = [
        'CREATE TABLE IF NOT EXISTS buku (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            author VARCHAR(200) NOT NULL,
            category VARCHAR(50) NOT NULL,
            price INT NOT NULL,
            cover VARCHAR(300) DEFAULT NULL,
            stock INT NOT NULL DEFAULT 0,
            description TEXT,
            rating DECIMAL(3,1) DEFAULT 0,
            reviews INT DEFAULT 0,
            language VARCHAR(100) DEFAULT NULL,
            pages INT DEFAULT 0,
            year INT DEFAULT 0,
            publisher VARCHAR(200) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema pesan chat, data pengirim, status baca, dan indeks percakapan.
        'CREATE TABLE IF NOT EXISTS chat (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id VARCHAR(64) NOT NULL,
            sender_id VARCHAR(64) NOT NULL,
            sender_role VARCHAR(20) NOT NULL,
            sender_name VARCHAR(120) NOT NULL,
            sender_email VARCHAR(120) DEFAULT NULL,
            text TEXT NOT NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_conversation (conversation_id),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema buku dan jumlah barang pada setiap detail pesanan.
        'CREATE TABLE IF NOT EXISTS detail_pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pesanan_id INT NOT NULL,
            buku_id INT DEFAULT NULL,
            judul VARCHAR(200) NOT NULL,
            qty INT NOT NULL DEFAULT 1,
            harga INT NOT NULL DEFAULT 0,
            subtotal INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema kategori buku; nama kategori harus unik.
        'CREATE TABLE IF NOT EXISTS kategori (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(50) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema isi keranjang untuk pengguna dan buku yang dipilih.
        'CREATE TABLE IF NOT EXISTS keranjang (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            buku_id INT NOT NULL,
            qty INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema pesanan, termasuk pelanggan, total pembayaran, status, dan tanggal.
        'CREATE TABLE IF NOT EXISTS pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer VARCHAR(200) NOT NULL,
            book VARCHAR(200) NOT NULL,
            total INT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT "pending",
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        // Skema akun pengguna, termasuk email, kata sandi, dan peran akun.
        'CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT "user",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
    ];

    // Jalankan perintah pembuatan tabel satu per satu.
    foreach ($statements as $sql) {
        $pdo->exec($sql);
    }
}
