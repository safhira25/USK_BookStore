<?php
/*
 * File: api/bootstrap_tables.php
 * Deskripsi: Penyiapan tabel dan data awal toko buku.
 */

require __DIR__ . '/db.php';

try {
    $pdo = ensureDatabaseAndSchema();

    $seed = [
        [
            'Layangan Putus', 'Mommy ASF', 'Novel', 89000, 'assets/covers/layangan-putus.png', 40,
            'Kisah perjalanan spiritual dan cinta yang penuh makna, mengajarkan arti ikhlas dan kekuatan doa.',
            4.5, 12500, 'Bahasa Indonesia', 320, 2021, 'Reynald Media'
        ],
        [
            'Laskar Pelangi', 'Andrea Hirata', 'Novel', 79000, 'assets/covers/laskar-pelangi.png', 55,
            'Kisah inspiratif sepuluh anak dari Pulau Belitong yang berjuang meraih pendidikan di tengah keterbatasan.',
            4.5, 28000, 'Bahasa Indonesia', 534, 2005, 'Bentang Pustaka'
        ],
        [
            'Sebelas', 'Tere Liye', 'Novel', 85000, 'assets/covers/sebelas.png', 32,
            'Novel tentang persahabatan, sepak bola, dan perjuangan sebelas pemain muda mengejuar mimpi mereka.',
            4.5, 6400, 'Bahasa Indonesia', 384, 2016, 'Gramedia Pustaka Utama'
        ],
        [
            'Cerita dari Negeri Dongeng', 'Sacha', 'Cerpen', 68000, 'assets/covers/cerita-dari-negeri-dongeng.png', 30,
            'Kumpulan cerita fantasi penuh keajaiban dari negeri dongeng yang membawa pembaca ke dunia imajinasi.',
            4.5, 2100, 'Bahasa Indonesia', 180, 2022, 'Gramedia Pustaka Utama'
        ],
        [
            'Doraemon', 'Fujiko F. Fujio', 'Komik', 75000, 'assets/covers/doraemon.png', 48,
            'Petualangan Doraemon, kucing robot dari masa depan, bersama Nobita dan teman-temannya.',
            4.5, 9800, 'Bahasa Indonesia', 192, 2014, 'Elex Media Komputindo'
        ],
    ];

    $pdo->exec(
        "INSERT INTO kategori (nama) VALUES ('Novel'), ('Komik'), ('Cerpen')
         ON DUPLICATE KEY UPDATE nama = VALUES(nama)"
    );

    $count = (int) $pdo->query('SELECT COUNT(*) FROM buku')->fetchColumn();
    if ($count === 0) {
        $stmt = $pdo->prepare(
            'INSERT INTO buku (title, author, category, price, cover, stock, description, rating, reviews, language, pages, year, publisher)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        foreach ($seed as $row) {
            $stmt->execute($row);
        }
    }

    $orderCount = (int) $pdo->query('SELECT COUNT(*) FROM pesanan')->fetchColumn();
    if ($orderCount === 0) {
        $pdo->exec(
            "INSERT INTO pesanan (customer, book, total, status, date) VALUES
            ('Safhira Ardelia.P', 'Fairy Tale', 189000, 'completed', '2026-07-20'),
            ('Sarah Wijaya', 'Laskar Pelangi', 79000, 'shipped', '2026-07-22'),
            ('Ahmad Rizki', 'Atomic Habits', 168000, 'pending', '2026-07-24'),
            ('Maria Santos', 'Harry Potter', 210000, 'completed', '2026-07-24')"
        );
    }

    echo "Database tables and seed data prepared successfully.\n";
} catch (Throwable $e) {
    echo 'Bootstrap failed: ' . $e->getMessage() . PHP_EOL;
    exit(1);
}
