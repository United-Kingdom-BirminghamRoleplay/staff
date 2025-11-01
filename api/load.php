<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../backend/connect.php';

$type = $_GET['type'] ?? '';

if ($type === 'announcements') {
    $stmt = $conn->prepare("SELECT * FROM announcements ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }
    
    echo json_encode($announcements);

} elseif ($type === 'forms') {
    $stmt = $conn->prepare("SELECT * FROM forms ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $forms = [];
    while ($row = $result->fetch_assoc()) {
        $row['fields'] = json_decode($row['fields'], true);
        $forms[] = $row;
    }
    
    echo json_encode($forms);

} elseif ($type === 'trial_logs') {
    $stmt = $conn->prepare("SELECT * FROM trial_logs ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    echo json_encode($logs);

} elseif ($type === 'users') {
    $stmt = $conn->prepare("SELECT id, robloxUsername, discordUsername, requestedRank, rank, status, registeredAt, approvedAt, approvedBy, notes FROM users ORDER BY registeredAt DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode($users);

} elseif ($type === 'files') {
    $stmt = $conn->prepare("SELECT * FROM files ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $files = [];
    while ($row = $result->fetch_assoc()) {
        $files[] = $row;
    }
    
    echo json_encode($files);

} elseif ($type === 'file_download') {
    $fileId = $_GET['id'] ?? '';
    
    $stmt = $conn->prepare("SELECT * FROM files WHERE id = ?");
    $stmt->bind_param("s", $fileId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $file = $result->fetch_assoc();
        echo json_encode($file);
    } else {
        echo json_encode(['error' => 'File not found']);
    }

} elseif ($type === 'security_logs') {
    $stmt = $conn->prepare("SELECT * FROM security_logs ORDER BY created DESC LIMIT 100");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $row['data'] = json_decode($row['data'], true);
        $logs[] = $row;
    }
    
    echo json_encode($logs);

} elseif ($type === 'user_details') {
    $userId = $_GET['userId'] ?? '';
    
    $stmt = $conn->prepare("SELECT id, robloxUsername, discordUsername, rank, registeredAt, approvedAt, notes FROM users WHERE id = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>