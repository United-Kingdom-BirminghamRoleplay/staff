<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../backend/connect.php';

$formId = $_GET['formId'] ?? '';

echo "Form ID: " . $formId . "\n";

$stmt = $conn->prepare("SELECT * FROM form_responses WHERE form_id = ? ORDER BY created DESC");
$stmt->bind_param("s", $formId);
$stmt->execute();
$result = $stmt->get_result();

echo "Rows found: " . $result->num_rows . "\n";

$responses = [];
while ($row = $result->fetch_assoc()) {
    $responses[] = $row;
}

echo json_encode($responses);
?>