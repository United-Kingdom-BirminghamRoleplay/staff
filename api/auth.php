<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../backend/connect.php';
 // <-- new database connection file

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

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

    // Check if Roblox username already exists
    $check = $conn->prepare("SELECT id FROM users WHERE LOWER(robloxUsername) = LOWER(?)");
    $check->bind_param("s", $robloxUsername);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Roblox username already registered']);
        exit;
    }

    $check->close();

    $newUserId = generateUserId();
    $hashedPassword = hashPassword($password);
    $status = 'pending';
    $registeredAt = date('c');
    $null = null;
    $empty = '';

    $stmt = $conn->prepare("
        INSERT INTO users 
        (id, robloxUsername, discordUsername, requestedRank, rank, password, status, registeredAt, approvedAt, approvedBy, notes, actions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $rank = null;
    $actions = json_encode([]);

    $stmt->bind_param(
        "ssssssssssss",
        $newUserId,
        $robloxUsername,
        $discordUsername,
        $requestedRank,
        $rank,
        $hashedPassword,
        $status,
        $registeredAt,
        $null,
        $null,
        $empty,
        $actions
    );

    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $stmt->error]);
    }

    $stmt->close();

} elseif ($action === 'login') {
    $robloxUsername = trim($input['robloxUsername'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($robloxUsername) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password required']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE LOWER(robloxUsername) = LOWER(?) LIMIT 1");
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

    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
