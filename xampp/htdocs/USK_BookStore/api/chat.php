<?php
header('Content-Type: application/json; charset=utf-8');

require __DIR__ . '/db.php';

function sendJson(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function ensureChatTable(PDO $pdo): void
{
    $pdo->exec(
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
        ) ENGINE=InnoDB'
    );
}

function mapMessage(array $row): array
{
    return [
        'id' => (string) $row['id'],
        'conversationId' => (string) $row['conversation_id'],
        'senderId' => (string) $row['sender_id'],
        'senderRole' => $row['sender_role'],
        'senderName' => $row['sender_name'],
        'senderEmail' => $row['sender_email'],
        'text' => $row['text'],
        'isRead' => (bool) ((int) $row['is_read']),
        'createdAt' => date('c', strtotime($row['created_at'])),
    ];
}

try {
    $pdo = ensureDatabaseAndSchema();
    ensureChatTable($pdo);
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

$action = $body['action'] ?? ($_GET['action'] ?? '');

if ($action === 'send') {
    $conversationId = trim((string) ($body['conversationId'] ?? ''));
    $senderId = trim((string) ($body['senderId'] ?? ''));
    $senderRole = in_array(($body['senderRole'] ?? ''), ['user', 'admin'], true)
        ? $body['senderRole']
        : 'user';
    $senderName = trim((string) ($body['senderName'] ?? ''));
    $senderEmail = trim((string) ($body['senderEmail'] ?? ''));
    $text = trim((string) ($body['text'] ?? ''));

    if ($conversationId === '' || $senderId === '' || $senderName === '' || $text === '') {
        sendJson(['success' => false, 'message' => 'Pesan tidak lengkap.'], 400);
    }

    if (mb_strlen($text) > 2000) {
        sendJson(['success' => false, 'message' => 'Pesan terlalu panjang.'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO chat (conversation_id, sender_id, sender_role, sender_name, sender_email, text)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$conversationId, $senderId, $senderRole, $senderName, $senderEmail, $text]);

    $id = (string) $pdo->lastInsertId();
    $row = $pdo->query('SELECT * FROM chat WHERE id = ' . (int) $id)->fetch();

    sendJson([
        'success' => true,
        'message' => mapMessage($row),
    ], 201);
}

if ($action === 'messages') {
    $conversationId = trim((string) ($body['conversationId'] ?? ''));
    if ($conversationId === '') {
        sendJson(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 400);
    }

    $stmt = $pdo->prepare(
        'SELECT * FROM chat WHERE conversation_id = ? ORDER BY id ASC'
    );
    $stmt->execute([$conversationId]);
    $messages = array_map('mapMessage', $stmt->fetchAll());

    sendJson([
        'success' => true,
        'messages' => $messages,
    ]);
}

if ($action === 'conversations') {
    $sql = 'SELECT c.*,
            (
                SELECT COUNT(*)
                FROM chat u
                WHERE u.conversation_id = c.conversation_id
                  AND u.sender_role = "user"
                  AND u.is_read = 0
            ) AS unread
            FROM chat c
            INNER JOIN (
                SELECT conversation_id, MAX(id) AS max_id
                FROM chat
                GROUP BY conversation_id
            ) t ON c.id = t.max_id
            ORDER BY c.created_at DESC';

    $rows = $pdo->query($sql)->fetchAll();
    $conversations = [];

    foreach ($rows as $row) {
        $userStmt = $pdo->prepare(
            'SELECT sender_name, sender_email
             FROM chat
             WHERE conversation_id = ? AND sender_role = "user"
             ORDER BY id DESC
             LIMIT 1'
        );
        $userStmt->execute([$row['conversation_id']]);
        $userRow = $userStmt->fetch() ?: [];

        $userLookup = $pdo->prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1');
        $userLookup->execute([(int) $row['conversation_id']]);
        $dbUser = $userLookup->fetch() ?: [];

        $conversations[] = [
            'conversationId' => (string) $row['conversation_id'],
            'userName' => $dbUser['name'] ?? ($userRow['sender_name'] ?? $row['sender_name']),
            'userEmail' => $dbUser['email'] ?? ($userRow['sender_email'] ?? $row['sender_email']),
            'lastText' => $row['text'],
            'lastAt' => date('c', strtotime($row['created_at'])),
            'lastRole' => $row['sender_role'],
            'unread' => (int) $row['unread'],
        ];
    }

    sendJson([
        'success' => true,
        'conversations' => $conversations,
    ]);
}

if ($action === 'mark_read') {
    $conversationId = trim((string) ($body['conversationId'] ?? ''));
    $readerRole = in_array(($body['readerRole'] ?? ''), ['user', 'admin'], true)
        ? $body['readerRole']
        : 'admin';

    if ($conversationId === '') {
        sendJson(['success' => false, 'message' => 'Percakapan tidak ditemukan.'], 400);
    }

    $targetRole = $readerRole === 'admin' ? 'user' : 'admin';
    $stmt = $pdo->prepare(
        'UPDATE chat
         SET is_read = 1
         WHERE conversation_id = ? AND sender_role = ? AND is_read = 0'
    );
    $stmt->execute([$conversationId, $targetRole]);

    sendJson(['success' => true]);
}

sendJson(['success' => false, 'message' => 'Action tidak valid.'], 400);
