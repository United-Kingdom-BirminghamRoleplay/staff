<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Method not allowed']));
}

$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? '';
$data = $input['data'] ?? null;

if (!$data) {
    http_response_code(400);
    exit(json_encode(['error' => 'No data provided']));
}

$dataDir = __DIR__ . '/../data/';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$file = '';
switch ($type) {
    case 'forms':
        $file = $dataDir . 'forms.json';
        break;
    case 'announcements':
        $file = $dataDir . 'announcements.json';
        break;
    default:
        http_response_code(400);
        exit(json_encode(['error' => 'Invalid type: ' . $type]));
}

$result = file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));

if ($result === false) {
    http_response_code(500);
    exit(json_encode(['error' => 'Failed to save file', 'file' => $file]));
}

echo json_encode(['success' => true, 'bytes' => $result, 'file' => $file]);
?>