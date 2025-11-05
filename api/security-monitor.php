<?php
// Security Monitoring Dashboard API
require_once 'rate-limiter.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../backend/connect.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get_stats':
        // Get security statistics
        $stats = [
            'total_requests' => 0,
            'blocked_requests' => 0,
            'banned_ips' => 0,
            'security_events' => 0,
            'active_sessions' => 0
        ];
        
        // Count banned IPs
        $banFile = '../data/banned_ips.json';
        if (file_exists($banFile)) {
            $bans = json_decode(file_get_contents($banFile), true) ?: [];
            $stats['banned_ips'] = count($bans);
        }
        
        // Count security events from database
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM security_events WHERE created > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $stats['security_events'] = $row['count'];
            }
        }
        
        // Count rate limit files (approximate active sessions)
        $rateLimitDir = '../data/rate_limits/';
        if (is_dir($rateLimitDir)) {
            $files = glob($rateLimitDir . '*.json');
            $activeFiles = 0;
            $now = time();
            
            foreach ($files as $file) {
                if (($now - filemtime($file)) < 3600) { // Active in last hour
                    $activeFiles++;
                }
            }
            $stats['active_sessions'] = $activeFiles;
        }
        
        echo json_encode($stats);
        break;
        
    case 'get_recent_events':
        $limit = min(100, intval($_GET['limit'] ?? 50));
        
        $stmt = $conn->prepare("SELECT type, data, ip_address, created FROM security_events ORDER BY created DESC LIMIT ?");
        if ($stmt) {
            $stmt->bind_param("i", $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = [
                    'type' => $row['type'],
                    'data' => json_decode($row['data'], true),
                    'ip' => $row['ip_address'],
                    'time' => $row['created']
                ];
            }
            
            echo json_encode($events);
        } else {
            echo json_encode([]);
        }
        break;
        
    case 'get_banned_ips':
        $banFile = '../data/banned_ips.json';
        if (file_exists($banFile)) {
            $bans = json_decode(file_get_contents($banFile), true) ?: [];
            echo json_encode($bans);
        } else {
            echo json_encode([]);
        }
        break;
        
    case 'unban_ip':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $ipToUnban = $input['ip'] ?? '';
        
        if (empty($ipToUnban)) {
            echo json_encode(['error' => 'IP address required']);
            break;
        }
        
        $banFile = '../data/banned_ips.json';
        if (file_exists($banFile)) {
            $bans = json_decode(file_get_contents($banFile), true) ?: [];
            $bans = array_filter($bans, function($ban) use ($ipToUnban) {
                return $ban['ip'] !== $ipToUnban;
            });
            
            file_put_contents($banFile, json_encode(array_values($bans), JSON_PRETTY_PRINT));
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => 'No bans file found']);
        }
        break;
        
    case 'clear_old_data':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        
        // Clear old security events (older than 30 days)
        $stmt = $conn->prepare("DELETE FROM security_events WHERE created < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        if ($stmt) {
            $stmt->execute();
            $deletedEvents = $stmt->affected_rows;
        } else {
            $deletedEvents = 0;
        }
        
        // Clear old rate limit files
        $rateLimitDir = '../data/rate_limits/';
        $deletedFiles = 0;
        if (is_dir($rateLimitDir)) {
            $files = glob($rateLimitDir . '*.json');
            $now = time();
            
            foreach ($files as $file) {
                if (($now - filemtime($file)) > 86400) { // Older than 24 hours
                    unlink($file);
                    $deletedFiles++;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'deleted_events' => $deletedEvents,
            'deleted_files' => $deletedFiles
        ]);
        break;
        
    case 'check_threats':
        // Simple threat level assessment
        $threatLevel = 'low';
        
        // Check recent security events
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM security_events WHERE type IN ('BRUTE_FORCE_DETECTED', 'DDOS_ATTACK', 'RATE_LIMIT_EXCEEDED') AND created > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        if ($stmt) {
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                if ($row['count'] > 10) {
                    $threatLevel = 'high';
                } elseif ($row['count'] > 5) {
                    $threatLevel = 'medium';
                }
            }
        }
        
        echo json_encode(['risk_level' => $threatLevel]);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}

$conn->close();
?>