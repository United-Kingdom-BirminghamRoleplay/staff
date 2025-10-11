<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

$dataDir = __DIR__ . '/../data/';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

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
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
        if (!is_array($users)) $users = [];
    }
    
    // Check if user already exists
    foreach ($users as $user) {
        if (strtolower($user['robloxUsername']) === strtolower($robloxUsername)) {
            echo json_encode(['success' => false, 'message' => 'Roblox username already registered']);
            exit;
        }
    }
    
    $newUser = [
        'id' => generateUserId(),
        'robloxUsername' => $robloxUsername,
        'discordUsername' => $discordUsername,
        'requestedRank' => $requestedRank,
        'rank' => null,
        'password' => hashPassword($password),
        'status' => 'pending',
        'registeredAt' => date('c'),
        'approvedAt' => null,
        'approvedBy' => null,
        'notes' => '',
        'actions' => []
    ];
    
    $users[] = $newUser;
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($action === 'login') {
    $robloxUsername = trim($input['robloxUsername'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($robloxUsername) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password required']);
        exit;
    }
    
    $usersFile = $dataDir . 'users.json';
    if (!file_exists($usersFile)) {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
        exit;
    }
    
    $users = json_decode(file_get_contents($usersFile), true) ?: [];
    
    foreach ($users as $user) {
        if (strtolower($user['robloxUsername']) === strtolower($robloxUsername)) {
            if ($user['status'] === 'pending') {
                echo json_encode(['success' => false, 'message' => 'Account pending approval']);
                exit;
            }
            
            if ($user['status'] === 'suspended') {
                echo json_encode(['success' => false, 'message' => 'Account suspended']);
                exit;
            }
            
            if ($user['status'] === 'approved' && verifyPassword($password, $user['password'])) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'robloxUsername' => $user['robloxUsername'],
                        'discordUsername' => $user['discordUsername'],
                        'rank' => $user['rank']
                    ]
                ]);
                exit;
            }
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>