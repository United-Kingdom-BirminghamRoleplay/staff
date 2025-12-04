<?php
header('Content-Type: application/json');

try {
    require_once '../backend/connect.php';
    
    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
        exit;
    }
    
    // Test simple query
    $result = $conn->query("SELECT 1 as test");
    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Database connection working']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Query failed: ' . $conn->error]);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Exception: ' . $e->getMessage()]);
}
?>