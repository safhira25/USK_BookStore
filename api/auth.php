<?php
/*
 * File: api/auth.php
 * Deskripsi: Jalur masuk akun, pendaftaran, dan pemeriksaan sesi.
 */

header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

// Mengirim jawaban berupa data ke pemanggil.
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

$raw = file_get_contents('php://input');
$body = $raw ? json_decode($raw, true) : [];
if (!is_array($body)) {
    $body = [];
}

$action = $body['action'] ?? '';

// Memeriksa apakah layanan autentikasi masih aktif.
if ($action === 'health') {
    sendJson(['success' => true, 'message' => 'API aktif']);
}

// Memproses masuk akun.
if ($action === 'signin') {
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        sendJson(['success' => false, 'message' => 'Email dan password wajib diisi.'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        sendJson(['success' => false, 'message' => 'Email atau password salah.'], 401);
    }

    sendJson([
        'success' => true,
        'user' => [
            'id' => (string) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
    ]);
}

// Memproses pendaftaran akun baru.
if ($action === 'signup') {
    $name = trim((string) ($body['name'] ?? ''));
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $role = 'user';

    if ($name === '' || $email === '' || $password === '') {
        sendJson(['success' => false, 'message' => 'Nama, email, dan password wajib diisi.'], 400);
    }

    if (strlen($password) < 6) {
        sendJson(['success' => false, 'message' => 'Password minimal 6 karakter.'], 400);
    }

    $count = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $count->execute([$email]);
    if ((int) $count->fetchColumn() > 0) {
        sendJson(['success' => false, 'message' => 'Email sudah terdaftar.'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $email, $hash, $role]);

    $userId = (string) $pdo->lastInsertId();

    sendJson([
        'success' => true,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => $role,
        ],
    ], 201);
}

sendJson(['success' => false, 'message' => 'Action tidak valid.'], 400);
