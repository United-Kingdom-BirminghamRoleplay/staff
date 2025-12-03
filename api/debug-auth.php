<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

$CLIENT_ID = '1340376847732707380';
$CLIENT_SECRET = 'tG1VDexmSuYXPWC3KMndNgvvRuB8YmWA';
$REDIRECT_URI = 'https://staff.ukbrum.co.uk/auth-callback.html';

$input = json_decode(file_get_contents('php://input'), true);
$code = $input['code'] ?? '';

echo "=== DEBUG INFO ===\n";
echo "Client ID: " . $CLIENT_ID . "\n";
echo "Redirect URI: " . $REDIRECT_URI . "\n";
echo "Code received: " . substr($code, 0, 20) . "...\n";
echo "Code length: " . strlen($code) . "\n";

$tokenData = [
    'client_id' => $CLIENT_ID,
    'client_secret' => $CLIENT_SECRET,
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => $REDIRECT_URI
];

echo "\n=== REQUEST DATA ===\n";
echo "POST data: " . http_build_query($tokenData) . "\n";

$ch = curl_init('https://discord.com/api/oauth2/token');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\n=== DISCORD RESPONSE ===\n";
echo "HTTP Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";
?>