<?php
// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Referrer-Policy: strict-origin-when-cross-origin');

// Rate limiting
session_start();
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$current_time = time();
$rate_limit_key = "rate_limit_$ip";

if (!isset($_SESSION[$rate_limit_key])) {
    $_SESSION[$rate_limit_key] = [];
}

// Clean old requests (older than 1 minute)
$_SESSION[$rate_limit_key] = array_filter($_SESSION[$rate_limit_key], function($timestamp) use ($current_time) {
    return ($current_time - $timestamp) < 60;
});

// Check if rate limit exceeded (max 30 requests per minute)
if (count($_SESSION[$rate_limit_key]) >= 30) {
    http_response_code(429);
    exit('{"error": "Rate limit exceeded"}');
}

// Add current request
$_SESSION[$rate_limit_key][] = $current_time;

// Input validation
function validateInput($data, $type = 'string') {
    if ($data === null || $data === '') {
        return false;
    }
    
    switch ($type) {
        case 'email':
            return filter_var($data, FILTER_VALIDATE_EMAIL);
        case 'url':
            return filter_var($data, FILTER_VALIDATE_URL);
        case 'int':
            return filter_var($data, FILTER_VALIDATE_INT);
        default:
            return htmlspecialchars(strip_tags(trim($data)));
    }
}

// CSRF protection
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
?>