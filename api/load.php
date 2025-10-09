<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$type = $_GET['type'] ?? '';

switch ($type) {
    case 'forms':
        $file = '../data/forms.json';
        break;
    case 'announcements':
        $file = '../data/announcements.json';
        break;
    case 'responses':
        $file = '../data/responses.json';
        break;
    default:
        http_response_code(400);
        exit('{"error": "Invalid type"}');
}

if (!file_exists($file)) {
    echo '{}';
    exit;
}

echo file_get_contents($file);
?>