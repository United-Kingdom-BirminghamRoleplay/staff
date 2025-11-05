<?php
// Include rate limiter for DDoS protection
require_once 'rate-limiter.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getUserIP() {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function isIpBanned($ip) {
    $bannedFile = '../data/banned_ips.json';
    if (!file_exists($bannedFile)) {
        return false;
    }
    
    $bannedIps = json_decode(file_get_contents($bannedFile), true) ?: [];
    
    foreach ($bannedIps as $ban) {
        if ($ban['ip'] === $ip) {
            return true;
        }
    }
    return false;
}

function logAccess($ip, $userAgent, $user = null) {
    $logsFile = '../data/ip_logs.json';
    $logs = [];
    
    if (file_exists($logsFile)) {
        $logs = json_decode(file_get_contents($logsFile), true) ?: [];
    }
    
    // Location tracking disabled for security
    
    $logEntry = [
        'ip' => $ip,
        'timestamp' => date('Y-m-d H:i:s'),
        'userAgent' => $userAgent,
        'user' => $user
    ];
    
    array_unshift($logs, $logEntry);
    
    // Keep only last 1000 entries
    $logs = array_slice($logs, 0, 1000);
    
    if (!is_dir('../data')) {
        mkdir('../data', 0755, true);
    }
    
    file_put_contents($logsFile, json_encode($logs, JSON_PRETTY_PRINT));
}

$ip = getUserIP();
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// Check if IP is banned
if (isIpBanned($ip)) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied. Your IP has been banned.']);
    exit;
}

// Log the access
$user = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $user = $input['user'] ?? null;
}

logAccess($ip, $userAgent, $user);

echo json_encode(['success' => true, 'ip' => $ip]);
?>