<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'bookstore');
define('DB_USER', 'root');
define('DB_PASS', '');

function connectPdo(): PDO
{
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}

function ensureDatabaseAndSchema(): PDO
{
    $pdo = connectPdo();
    $pdo->exec(
        'CREATE DATABASE IF NOT EXISTS ' . DB_NAME . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci'
    );

    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    createBookstoreTables($pdo);

    $adminHash = password_hash('admin123', PASSWORD_DEFAULT);

    $pdo->exec(
        'INSERT INTO users (name, email, password, role)
        VALUES
            ("Admin", "admin@usk.com", "' . $adminHash . '", "admin")
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            role = VALUES(role)'
    );

    return $pdo;
}

function createBookstoreTables(PDO $pdo): void
{
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
        'CREATE TABLE IF NOT EXISTS detail_pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pesanan_id INT NOT NULL,
            buku_id INT DEFAULT NULL,
            judul VARCHAR(200) NOT NULL,
            qty INT NOT NULL DEFAULT 1,
            harga INT NOT NULL DEFAULT 0,
            subtotal INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        'CREATE TABLE IF NOT EXISTS kategori (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(50) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        'CREATE TABLE IF NOT EXISTS keranjang (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            buku_id INT NOT NULL,
            qty INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        'CREATE TABLE IF NOT EXISTS pesanan (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer VARCHAR(200) NOT NULL,
            book VARCHAR(200) NOT NULL,
            total INT NOT NULL,
            status VARCHAR(30) NOT NULL DEFAULT "pending",
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
        'CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT "user",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci',
    ];

    foreach ($statements as $sql) {
        $pdo->exec($sql);
    }
}
