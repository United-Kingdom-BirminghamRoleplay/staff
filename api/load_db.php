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

} elseif ($type === 'trainings') {
    $stmt = $conn->prepare("SELECT * FROM trainings ORDER BY date ASC, time ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trainings = [];
    while ($row = $result->fetch_assoc()) {
        $row['attendees'] = json_decode($row['attendees'], true) ?: [];
        $trainings[] = $row;
    }
    
    echo json_encode($trainings);

} elseif ($type === 'website_control') {
    $stmt = $conn->prepare("SELECT * FROM website_settings WHERE id = 1");
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $settings = $result->fetch_assoc();
        $settings['emergency_popup'] = $settings['emergency_popup'] ? json_decode($settings['emergency_popup'], true) : null;
        echo json_encode($settings);
    } else {
        echo json_encode(['locked' => false, 'emergency_popup' => null, 'party_mode' => false]);
    }

} elseif ($type === 'ip_logs') {
    $stmt = $conn->prepare("SELECT * FROM ip_logs ORDER BY timestamp DESC LIMIT 1000");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    echo json_encode($logs);

} elseif ($type === 'banned_ips') {
    $stmt = $conn->prepare("SELECT * FROM banned_ips ORDER BY timestamp DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $banned = [];
    while ($row = $result->fetch_assoc()) {
        $banned[] = $row;
    }
    
    echo json_encode($banned);

} elseif ($type === 'files') {
    $stmt = $conn->prepare("SELECT * FROM files ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $files = [];
    while ($row = $result->fetch_assoc()) {
        $files[] = $row;
    }
    
    echo json_encode($files);

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>