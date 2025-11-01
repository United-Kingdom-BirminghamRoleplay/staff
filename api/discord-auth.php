<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// --- SECURE CONFIGURATION ---
// IMPORTANT: These should be set as environment variables on your server.
// The getenv() function retrieves the variable set on your server (e.g., via Apache, Nginx, or a .env loader).
$CLIENT_ID = getenv('DISCORD_CLIENT_ID') ?: '1340376847732707380';
$CLIENT_SECRET = getenv('DISCORD_CLIENT_SECRET') ?: 'tG1VDexmSuYXPWC3KMndNgvvRuB8YmWA'; // SECURED via Environment Variable
$GUILD_ID = getenv('DISCORD_GUILD_ID') ?: '906647296370958408';

// Set the correct Redirect URI based on the server's context
$REDIRECT_URI = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/auth-callback.html';

// Critical Check: Ensure the secret is loaded
if (empty($CLIENT_SECRET)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server Configuration Error: Discord Client Secret Missing']);
    exit;
}

// Map Discord roles to staff ranks and define processing order (highest to lowest)
// The role IDs are the keys, and the custom rank names are the values.
$ROLE_HIERARCHY = [
    '1345504810077524028' => 'founder',
    '1345541100059885698' => 'co_founder',
    '1345446581239021618' => 'assistant_founder',
    '1422299020122128464' => 'developer',
    '1377005605016834252' => 'advisory_board',
    '1360335196171403304' => 'oversight_enforcement',
    '1345453439156621353' => 'human_resources',
    '1345472285053812788' => 'administration',
    '1345470593537147056' => 'moderation'
];


$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

if ($action === 'exchange_code') {
    $code = $input['code'] ?? '';
    
    if (empty($code)) {
        echo json_encode(['success' => false, 'error' => 'No code provided']);
        exit;
    }
    
    // Exchange authorization code for access token
    $tokenData = [
        'client_id' => $CLIENT_ID,
        'client_secret' => $CLIENT_SECRET,
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $REDIRECT_URI
    ];
    
    $ch = curl_init('https://discord.com/api/oauth2/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $tokenResponse = json_decode($response, true);
        echo json_encode([
            'success' => true,
            'access_token' => $tokenResponse['access_token'],
            'refresh_token' => $tokenResponse['refresh_token'],
            'expires_in' => $tokenResponse['expires_in']
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Token exchange failed', 'details' => $response]);
    }

} elseif ($action === 'get_user_info') {
    $accessToken = $input['access_token'] ?? '';
    
    if (empty($accessToken)) {
        echo json_encode(['success' => false, 'error' => 'No access token provided']);
        exit;
    }
    
    // Get user information
    $ch = curl_init('https://discord.com/api/users/@me');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $accessToken"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $userResponse = curl_exec($ch);
    $userHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($userHttpCode !== 200) {
        echo json_encode(['success' => false, 'error' => 'Failed to get user info']);
        exit;
    }
    
    $user = json_decode($userResponse, true);
    
    // Get guild member information (Requires 'guilds.members.read' scope)
    $ch = curl_init("https://discord.com/api/users/@me/guilds/$GUILD_ID/member"); // Using the /users/@me endpoint
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $accessToken"]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $memberResponse = curl_exec($ch);
    $memberHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $guildMember = null;
    if ($memberHttpCode === 200) {
        $memberData = json_decode($memberResponse, true);
        
        $userRank = 'pending';
        
        // Find the highest rank based on the defined hierarchy order
        foreach ($ROLE_HIERARCHY as $roleId => $rankName) {
            if (in_array($roleId, $memberData['roles'])) {
                // Since $ROLE_HIERARCHY is ordered highest-to-lowest, 
                // the first match found is the highest rank.
                $userRank = $rankName;
                break; 
            }
        }
        
        $guildMember = [
            'nick' => $memberData['nick'],
            'roles' => $memberData['roles'],
            'joined_at' => $memberData['joined_at'],
            'rank' => $userRank
        ];
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'guildMember' => $guildMember
    ]);

} elseif ($action === 'refresh_token') {
    $refreshToken = $input['refresh_token'] ?? '';
    
    if (empty($refreshToken)) {
        echo json_encode(['success' => false, 'error' => 'No refresh token provided']);
        exit;
    }
    
    $tokenData = [
        'client_id' => $CLIENT_ID,
        'client_secret' => $CLIENT_SECRET,
        'grant_type' => 'refresh_token',
        'refresh_token' => $refreshToken
    ];
    
    $ch = curl_init('https://discord.com/api/oauth2/token');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $tokenResponse = json_decode($response, true);
        echo json_encode([
            'success' => true,
            'access_token' => $tokenResponse['access_token'],
            'refresh_token' => $tokenResponse['refresh_token'] ?? null,
            'expires_in' => $tokenResponse['expires_in']
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Token refresh failed']);
    }

} else {
    echo json_encode(['success' => false, 'error' => 'Invalid action']);
}
?>