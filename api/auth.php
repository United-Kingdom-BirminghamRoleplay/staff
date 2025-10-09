<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

$input = json_decode(file_get_contents('php://input'), true);
$rank = $input['rank'] ?? '';
$password = $input['password'] ?? '';

if (!$rank || !$password) {
    http_response_code(400);
    exit('{"error": "Missing rank or password"}');
}

$auth_file = '../data/auth.json';
if (!file_exists($auth_file)) {
    http_response_code(500);
    exit('{"error": "Auth file not found"}');
}

$auth_data = json_decode(file_get_contents($auth_file), true);
$passwords = $auth_data['passwords'] ?? [];

if (!isset($passwords[$rank]) || $passwords[$rank] !== $password) {
    http_response_code(401);
    exit('{"error": "Invalid credentials"}');
}

// Log successful login
$log_entry = [
    'rank' => $rank,
    'timestamp' => date('Y-m-d H:i:s'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

$log_file = '../data/login_logs.json';
$logs = [];
if (file_exists($log_file)) {
    $logs = json_decode(file_get_contents($log_file), true) ?: [];
}
$logs[] = $log_entry;
file_put_contents($log_file, json_encode($logs, JSON_PRETTY_PRINT));

echo json_encode(['success' => true, 'rank' => $rank]);
?>