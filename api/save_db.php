<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../backend/connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? '';

if ($type === 'announcements') {
    $announcement = $input['announcement'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO announcements (id, title, content, icon, postedBy) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $id, $announcement['title'], $announcement['content'], $announcement['icon'], $announcement['postedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save announcement']);
    }

} elseif ($type === 'forms') {
    $form = $input['form'];
    $id = uniqid();
    $pin = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    
    $stmt = $conn->prepare("INSERT INTO forms (id, name, fields, pin, createdBy) VALUES (?, ?, ?, ?, ?)");
    $fieldsJson = json_encode($form['fields']);
    $stmt->bind_param("sssss", $id, $form['name'], $fieldsJson, $pin, $form['createdBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id, 'pin' => $pin]);
    } else {
        echo json_encode(['error' => 'Cannot create form']);
    }

} elseif ($type === 'response') {
    $formId = $input['formId'];
    $response = $input['response'];
    
    $stmt = $conn->prepare("INSERT INTO form_responses (form_id, response_data) VALUES (?, ?)");
    $responseJson = json_encode($response);
    $stmt->bind_param("ss", $formId, $responseJson);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save response']);
    }

} elseif ($type === 'trial_logs') {
    $trialLog = $input['trialLog'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO trial_logs (id, username, rank, notes, createdBy) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $id, $trialLog['username'], $trialLog['rank'], $trialLog['notes'], $trialLog['createdBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save trial log']);
    }



} elseif ($type === 'save_notes') {
    $userId = $input['userId'];
    $notes = $input['notes'];
    
    $stmt = $conn->prepare("UPDATE users SET notes = ? WHERE id = ?");
    $stmt->bind_param("ss", $notes, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save notes']);
    }

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>