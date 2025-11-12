<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

try {
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
    
    echo "Raw data:\n";
    print_r($responses);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>