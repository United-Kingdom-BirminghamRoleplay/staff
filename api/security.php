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

// Create security tables if they don't exist
$conn->query("CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100),
    data JSON,
    session_id VARCHAR(100),
    fingerprint TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    url TEXT,
    user_id VARCHAR(100),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_session (session_id),
    INDEX idx_ip (ip_address),
    INDEX idx_created (created)
)");

$conn->query("CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE,
    user_id VARCHAR(100),
    fingerprint TEXT,
    ip_address VARCHAR(45),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    INDEX idx_activity (last_activity)
)");

$conn->query("CREATE TABLE IF NOT EXISTS security_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_type VARCHAR(50),
    rule_value TEXT,
    action VARCHAR(50),
    enabled BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS threat_intelligence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45),
    threat_type VARCHAR(50),
    severity INT,
    source VARCHAR(100),
    expires_at TIMESTAMP,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip (ip_address),
    INDEX idx_expires (expires_at)
)");

// Insert default security rules
$conn->query("INSERT IGNORE INTO security_rules (rule_type, rule_value, action) VALUES 
    ('max_failed_logins', '5', 'ban_ip'),
    ('session_timeout', '1800', 'force_logout'),
    ('max_requests_per_minute', '60', 'rate_limit'),
    ('suspicious_user_agents', 'bot,crawler,spider', 'block'),
    ('blocked_countries', 'CN,RU,KP', 'block')");

if ($action === 'validate_session') {
    $sessionId = $input['sessionId'] ?? '';
    $fingerprint = $input['fingerprint'] ?? '';
    
    $stmt = $conn->prepare("SELECT user_id, fingerprint FROM active_sessions WHERE session_id = ? AND last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)");
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $session = $result->fetch_assoc();
        $valid = ($session['fingerprint'] === $fingerprint);
        
        if ($valid) {
            // Update last activity
            $updateStmt = $conn->prepare("UPDATE active_sessions SET last_activity = NOW() WHERE session_id = ?");
            $updateStmt->bind_param("s", $sessionId);
            $updateStmt->execute();
        }
        
        echo json_encode(['valid' => $valid]);
    } else {
        echo json_encode(['valid' => false]);
    }

} elseif ($action === 'create_session') {
    $sessionId = $input['sessionId'] ?? '';
    $userId = $input['userId'] ?? '';
    $fingerprint = $input['fingerprint'] ?? '';
    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Check for existing sessions
    $stmt = $conn->prepare("DELETE FROM active_sessions WHERE user_id = ? OR session_id = ?");
    $stmt->bind_param("ss", $userId, $sessionId);
    $stmt->execute();
    
    // Create new session
    $stmt = $conn->prepare("INSERT INTO active_sessions (session_id, user_id, fingerprint, ip_address) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $sessionId, $userId, $fingerprint, $ipAddress);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }

} elseif ($action === 'check_threats') {
    $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    // Check threat intelligence
    $stmt = $conn->prepare("SELECT threat_type, severity FROM threat_intelligence WHERE ip_address = ? AND expires_at > NOW()");
    $stmt->bind_param("s", $ipAddress);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $threats = [];
    while ($row = $result->fetch_assoc()) {
        $threats[] = $row;
    }
    
    // Check security events for suspicious patterns
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM security_events WHERE ip_address = ? AND created > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $stmt->bind_param("s", $ipAddress);
    $stmt->execute();
    $eventCount = $stmt->get_result()->fetch_assoc()['count'];
    
    echo json_encode([
        'threats' => $threats,
        'event_count' => $eventCount,
        'risk_level' => count($threats) > 0 ? 'high' : ($eventCount > 50 ? 'medium' : 'low')
    ]);

} elseif ($action === 'get_security_dashboard') {
    // Get recent security events
    $stmt = $conn->prepare("SELECT type, COUNT(*) as count FROM security_events WHERE created > DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY type ORDER BY count DESC LIMIT 10");
    $stmt->execute();
    $events = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    
    // Get active sessions
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM active_sessions WHERE last_activity > DATE_SUB(NOW(), INTERVAL 30 MINUTE)");
    $stmt->execute();
    $activeSessions = $stmt->get_result()->fetch_assoc()['count'];
    
    // Get threat count
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM threat_intelligence WHERE expires_at > NOW()");
    $stmt->execute();
    $threatCount = $stmt->get_result()->fetch_assoc()['count'];
    
    // Get banned IPs
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM banned_ips");
    $stmt->execute();
    $bannedIPs = $stmt->get_result()->fetch_assoc()['count'];
    
    echo json_encode([
        'events' => $events,
        'active_sessions' => $activeSessions,
        'threat_count' => $threatCount,
        'banned_ips' => $bannedIPs
    ]);

} else {
    echo json_encode(['error' => 'Invalid action']);
}

$conn->close();
?>