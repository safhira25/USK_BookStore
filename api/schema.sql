-- File: api/schema.sql
-- Deskripsi: Struktur tabel basis data toko buku.
CREATE DATABASE IF NOT EXISTS bookstore CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE bookstore;

-- Menyimpan data buku yang dijual.
CREATE TABLE IF NOT EXISTS buku (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan pesan antara pengguna dan admin.
CREATE TABLE IF NOT EXISTS chat (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan rincian barang pada satu pesanan.
CREATE TABLE IF NOT EXISTS detail_pesanan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pesanan_id INT NOT NULL,
    buku_id INT DEFAULT NULL,
    judul VARCHAR(200) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    harga INT NOT NULL DEFAULT 0,
    subtotal INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan nama kategori buku.
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan buku yang belum dibayar.
CREATE TABLE IF NOT EXISTS keranjang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    buku_id INT NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan pesanan pelanggan.
CREATE TABLE IF NOT EXISTS pesanan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer VARCHAR(200) NOT NULL,
    book VARCHAR(200) NOT NULL,
    total INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Menyimpan akun pengguna dan admin.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO users (name, email, password, role)
VALUES
    ('Admin', 'admin@usk.com', '$2y$10$kCg2Wg1P.ez1Fwo4gAb0RuUp7UleWz7V6Vd7kxv6Yv71T6nUX7wvK', 'admin'),
    ('Safhira Ardelia.P', 'user@usk.com', '$2y$10$ztnhfV1dz2V1O2mEL2nq2OQ9mxC9bLw0Kp1uLyn6Z06i3JrWZ4X7i', 'user')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role);

INSERT INTO kategori (nama)
VALUES ('Novel'), ('Komik'), ('Cerpen')
ON DUPLICATE KEY UPDATE nama = VALUES(nama);
