<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_GET['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username required']);
    exit;
}

$username = $_GET['username'];

// Search for user
$searchUrl = "https://users.roblox.com/v1/users/search?keyword=" . urlencode($username) . "&limit=1";
$searchResponse = file_get_contents($searchUrl);

if ($searchResponse === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to search user']);
    exit;
}

$searchData = json_decode($searchResponse, true);

if (empty($searchData['data'])) {
    echo json_encode(['error' => 'User not found']);
    exit;
}

$user = $searchData['data'][0];

// Get avatar
$avatarUrl = "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" . $user['id'] . "&size=150x150&format=Png";
$avatarResponse = file_get_contents($avatarUrl);
$avatarData = json_decode($avatarResponse, true);

$result = [
    'id' => $user['id'],
    'name' => $user['name'],
    'displayName' => $user['displayName'],
    'avatar' => $avatarData['data'][0]['imageUrl'] ?? null
];

echo json_encode($result);
?>