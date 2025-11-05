<?php
// Advanced Rate Limiter with DDoS Protection
class RateLimiter {
    private $redisEnabled = false;
    private $dataDir;
    
    public function __construct() {
        $this->dataDir = dirname(__DIR__) . '/data/rate_limits/';
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }
    
    public function checkRateLimit($identifier, $maxRequests = 60, $timeWindow = 60) {
        $now = time();
        $windowStart = $now - $timeWindow;
        
        $file = $this->dataDir . md5($identifier) . '.json';
        $requests = [];
        
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            $requests = $data['requests'] ?? [];
        }
        
        // Remove old requests
        $requests = array_filter($requests, function($timestamp) use ($windowStart) {
            return $timestamp > $windowStart;
        });
        
        // Check if limit exceeded
        if (count($requests) >= $maxRequests) {
            return false;
        }
        
        // Add current request
        $requests[] = $now;
        
        // Save updated requests
        file_put_contents($file, json_encode(['requests' => $requests]));
        
        return true;
    }
    
    public function isDDoSAttack($ip) {
        // Check for DDoS patterns
        $file = $this->dataDir . 'ddos_' . md5($ip) . '.json';
        $now = time();
        
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            $requests = $data['requests'] ?? [];
            
            // Remove requests older than 5 minutes
            $requests = array_filter($requests, function($timestamp) use ($now) {
                return ($now - $timestamp) < 300;
            });
            
            // DDoS if more than 500 requests in 5 minutes
            if (count($requests) > 500) {
                return true;
            }
            
            $requests[] = $now;
            file_put_contents($file, json_encode(['requests' => $requests]));
        } else {
            file_put_contents($file, json_encode(['requests' => [$now]]));
        }
        
        return false;
    }
    
    public function banIP($ip, $reason = 'Rate limit exceeded') {
        $banFile = dirname(__DIR__) . '/data/banned_ips.json';
        $bans = [];
        
        if (file_exists($banFile)) {
            $bans = json_decode(file_get_contents($banFile), true) ?: [];
        }
        
        $bans[] = [
            'ip' => $ip,
            'reason' => $reason,
            'timestamp' => date('Y-m-d H:i:s'),
            'bannedBy' => 'Auto-Security'
        ];
        
        file_put_contents($banFile, json_encode($bans, JSON_PRETTY_PRINT));
    }
    
    public function isIPBanned($ip) {
        $banFile = dirname(__DIR__) . '/data/banned_ips.json';
        
        if (!file_exists($banFile)) {
            return false;
        }
        
        $bans = json_decode(file_get_contents($banFile), true) ?: [];
        
        foreach ($bans as $ban) {
            if ($ban['ip'] === $ip) {
                return true;
            }
        }
        
        return false;
    }
}

function getUserIP() {
    $ipKeys = ['HTTP_CF_CONNECTING_IP', 'HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function isIPTemporarilyBlocked($ip, $conn) {
    try {
        $conn->query("DELETE FROM temporary_blocks WHERE expires < NOW()");
        
        $stmt = $conn->prepare("SELECT expires FROM temporary_blocks WHERE ip = ? AND expires > NOW()");
        $stmt->bind_param("s", $ip);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->num_rows > 0;
    } catch (Exception $e) {
        return false;
    }
}

// Initialize rate limiter
$rateLimiter = new RateLimiter();
$clientIP = getUserIP();

// Check if IP is banned
if ($rateLimiter->isIPBanned($clientIP)) {
    header('Location: ../banned.html');
    exit;
}

// Check temporary blocks
try {
    require_once '../backend/connect.php';
    if (isIPTemporarilyBlocked($clientIP, $conn)) {
        header('Location: ../banned.html');
        exit;
    }
} catch (Exception $e) {
    // Continue if database check fails
}

// Check for DDoS attack
if ($rateLimiter->isDDoSAttack($clientIP)) {
    $rateLimiter->banIP($clientIP, 'DDoS attack detected');
    http_response_code(429);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'DDoS attack detected. IP banned.']);
    exit;
}

// Check rate limits based on endpoint
$endpoint = $_SERVER['REQUEST_URI'];
$limits = [
    '/api/save.php' => [30, 60],      // 30 requests per minute
    '/api/load_db.php' => [120, 60],  // 120 requests per minute
    '/api/discord-auth.php' => [10, 60], // 10 requests per minute
    'default' => [60, 60]             // 60 requests per minute default
];

$limit = $limits['default'];
foreach ($limits as $path => $pathLimit) {
    if (strpos($endpoint, $path) !== false) {
        $limit = $pathLimit;
        break;
    }
}

if (!$rateLimiter->checkRateLimit($clientIP . '_' . $endpoint, $limit[0], $limit[1])) {
    http_response_code(429);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Rate limit exceeded. Please slow down.']);
    exit;
}
?>