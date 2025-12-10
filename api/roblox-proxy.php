<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

if (!isset($_GET['username'])) {
    echo json_encode(['error' => 'Username required']);
    exit;
}

$username = $_GET['username'];

// Search for user
$searchUrl = "https://users.roblox.com/v1/users/search?keyword=" . urlencode($username) . "&limit=1";
$searchResponse = fetchUrl($searchUrl);

if ($searchResponse === false) {
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
$avatarResponse = fetchUrl($avatarUrl);
$avatarData = json_decode($avatarResponse, true);

$result = [
    'id' => $user['id'],
    'name' => $user['name'],
    'displayName' => $user['displayName'],
    'avatar' => $avatarData['data'][0]['imageUrl'] ?? null
];

echo json_encode($result);
?>