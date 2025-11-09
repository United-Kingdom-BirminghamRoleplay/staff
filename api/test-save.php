<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../backend/connect.php';
    
    $input = json_decode(file_get_contents('php://input'), true);
    $type = $input['type'] ?? '';
    
    if ($type === 'forms') {
        $form = $input['form'];
        $id = uniqid();
        $pin = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        
        $stmt = $conn->prepare("INSERT INTO forms (id, title, description, fields, pin, createdBy) VALUES (?, ?, ?, ?, ?, ?)");
        $fieldsJson = json_encode($form['fields']);
        $title = $form['title'] ?? 'Untitled Form';
        $description = $form['description'] ?? '';
        $createdBy = $form['createdBy'] ?? 'System';
        
        $stmt->bind_param("ssssss", $id, $title, $description, $fieldsJson, $pin, $createdBy);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $id, 'pin' => $pin]);
        } else {
            echo json_encode(['error' => 'Execute failed: ' . $stmt->error]);
        }
    } else {
        echo json_encode(['error' => 'Invalid type']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>