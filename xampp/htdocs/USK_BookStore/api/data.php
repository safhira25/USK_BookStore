<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

function sendJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = ensureDatabaseAndSchema();
} catch (Throwable $e) {
    sendJson([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $e->getMessage(),
    ], 500);
}

$action = $_GET['action'] ?? 'books';

if ($action === 'books') {
    $stmt = $pdo->query('SELECT * FROM buku ORDER BY id');
    sendJson([
        'success' => true,
        'books' => $stmt->fetchAll(),
    ]);
}

if ($action === 'orders') {
    $stmt = $pdo->query('SELECT * FROM pesanan ORDER BY id DESC');
    sendJson([
        'success' => true,
        'orders' => $stmt->fetchAll(),
    ]);
}

sendJson(['success' => false, 'message' => 'Action tidak valid.'], 400);
