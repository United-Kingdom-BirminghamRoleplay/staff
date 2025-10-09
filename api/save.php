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
$type = $input['type'] ?? '';
$data = $input['data'] ?? null;

if (!$data) {
    http_response_code(400);
    exit('No data provided');
}

switch ($type) {
    case 'forms':
        file_put_contents('../data/forms.json', json_encode($data, JSON_PRETTY_PRINT));
        break;
    case 'announcements':
        file_put_contents('../data/announcements.json', json_encode($data, JSON_PRETTY_PRINT));
        break;
    case 'responses':
        file_put_contents('../data/responses.json', json_encode($data, JSON_PRETTY_PRINT));
        break;
    default:
        http_response_code(400);
        exit('Invalid type');
}

echo json_encode(['success' => true]);
?>