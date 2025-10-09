<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$type = $_GET['type'] ?? '';

if (!$type) {
    http_response_code(400);
    exit(json_encode(['error' => 'Type parameter required']));
}

$dataDir = __DIR__ . '/../data/';
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

if (!file_exists($file)) {
    $default = ($type === 'forms') ? ['forms' => []] : ['announcements' => []];
    echo json_encode($default);
    exit;
}

$content = file_get_contents($file);
if ($content === false) {
    http_response_code(500);
    exit(json_encode(['error' => 'Failed to read file']));
}

$data = json_decode($content, true);
if ($data === null) {
    $default = ($type === 'forms') ? ['forms' => []] : ['announcements' => []];
    echo json_encode($default);
    exit;
}

echo json_encode($data);
?>