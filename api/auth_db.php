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
$action = $input['action'] ?? '';

function generateUserId() {
    return 'user_' . uniqid() . '_' . time();
}

if ($action === 'register') {
    $robloxUsername = trim($input['robloxUsername'] ?? '');
    $discordUsername = trim($input['discordUsername'] ?? '');
    $requestedRank = $input['requestedRank'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($robloxUsername) || empty($discordUsername) || empty($requestedRank) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    // Check if user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE robloxUsername = ?");
    $stmt->bind_param("s", $robloxUsername);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Roblox username already registered']);
        exit;
    }
    
    $userId = generateUserId();
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("INSERT INTO users (id, robloxUsername, discordUsername, requestedRank, password, status, registeredAt) VALUES (?, ?, ?, ?, ?, 'pending', NOW())");
    $stmt->bind_param("sssss", $userId, $robloxUsername, $discordUsername, $requestedRank, $hashedPassword);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
    
} elseif ($action === 'login') {
    $robloxUsername = trim($input['robloxUsername'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($robloxUsername) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT id, robloxUsername, discordUsername, rank, password, status FROM users WHERE robloxUsername = ?");
    $stmt->bind_param("s", $robloxUsername);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    if ($user['status'] === 'pending') {
        echo json_encode(['success' => false, 'message' => 'Account pending approval']);
        exit;
    }
    
    if ($user['status'] === 'suspended') {
        echo json_encode(['success' => false, 'message' => 'Account suspended']);
        exit;
    }
    
    if ($user['status'] === 'approved' && password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'robloxUsername' => $user['robloxUsername'],
                'discordUsername' => $user['discordUsername'],
                'rank' => $user['rank']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>