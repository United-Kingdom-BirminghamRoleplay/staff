<?php
// Re-enable rate limiter for DDoS protection
require_once 'rate-limiter.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    require_once '../backend/connect.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Request validation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? '';

if ($type === 'forms') {
    try {
        $form = $input['form'];
        $id = uniqid();
        $pin = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        
        // Create forms table if it doesn't exist
        $createTable = $conn->query("CREATE TABLE IF NOT EXISTS forms (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            fields TEXT,
            pin VARCHAR(4),
            createdBy VARCHAR(100),
            created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");
        

        
        if (!$createTable) {
            throw new Exception('Failed to create forms table: ' . $conn->error);
        }
        
        $stmt = $conn->prepare("INSERT INTO forms (id, title, description, fields, pin, createdBy) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception('Failed to prepare statement: ' . $conn->error);
        }
        
        $fieldsJson = json_encode($form['fields']);
        $title = $form['title'] ?? $form['name'] ?? 'Untitled Form';
        $description = $form['description'] ?? '';
        $createdBy = $form['createdBy'] ?? 'System';
        
        $stmt->bind_param("ssssss", $id, $title, $description, $fieldsJson, $pin, $createdBy);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $id, 'pin' => $pin]);
        } else {
            throw new Exception('Failed to execute statement: ' . $stmt->error);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Form creation failed: ' . $e->getMessage()]);
    }

} elseif ($type === 'response') {
    $formId = $input['formId'];
    $response = $input['response'];
    
    // Create form_responses table if it doesn't exist
    $conn->query("CREATE TABLE IF NOT EXISTS form_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id VARCHAR(50),
        response_data JSON,
        submittedBy VARCHAR(100),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("INSERT INTO form_responses (form_id, response_data, submittedBy, submitted_at) VALUES (?, ?, ?, NOW())");
    $responseJson = json_encode($response);
    $submittedBy = $response['submittedBy'] ?? 'Anonymous';
    $stmt->bind_param("sss", $formId, $responseJson, $submittedBy);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save response']);
    }

} elseif ($type === 'announcements') {
    $announcement = $input['announcement'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO announcements (id, title, content, icon, postedBy, submittedBy, created) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssssss", $id, $announcement['title'], $announcement['content'], $announcement['icon'], $announcement['postedBy'], $announcement['submittedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save announcement']);
    }

} elseif ($type === 'trial_logs') {
    $trialLog = $input['trialLog'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO trial_logs (id, trialLogNum, staffMember, oldRank, newRank, trialStartDate, trialEndDate, trialResult, signedBy, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("sssssssss", $id, $trialLog['trialLogNum'], $trialLog['staffMember'], $trialLog['oldRank'], $trialLog['newRank'], $trialLog['trialStartDate'], $trialLog['trialEndDate'], $trialLog['trialResult'], $trialLog['signedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save trial log: ' . $conn->error]);
    }

} elseif ($type === 'trainings') {
    $training = $input['training'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO trainings (id, title, description, date, time, postedBy, created) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssssss", $id, $training['title'], $training['description'], $training['date'], $training['time'], $training['postedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot create training: ' . $conn->error]);
    }

} elseif ($type === 'general_report') {
    $report = $input['report'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO reports (id, robloxUsername, discordUsername, reportType, description, evidence, submittedBy, created) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("sssssss", $id, $report['robloxUsername'], $report['discordUsername'], $report['reportType'], $report['description'], $report['evidence'], $report['submittedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save report: ' . $conn->error]);
    }

} elseif ($type === 'update_trial') {
    $logId = $input['logId'];
    $result = $input['result'];
    
    $stmt = $conn->prepare("UPDATE trial_logs SET trialResult = ? WHERE id = ?");
    $stmt->bind_param("ss", $result, $logId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot update trial']);
    }

} elseif ($type === 'delete_trial_log') {
    $logId = $input['logId'];
    $deletedBy = $input['deletedBy'] ?? 'Unknown';
    
    $stmt = $conn->prepare("DELETE FROM trial_logs WHERE id = ?");
    $stmt->bind_param("s", $logId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete trial log']);
    }

} elseif ($type === 'delete_training') {
    $trainingId = $input['trainingId'];
    $deletedBy = $input['deletedBy'] ?? 'Unknown';
    
    // Get training details before deletion
    $getStmt = $conn->prepare("SELECT title FROM trainings WHERE id = ?");
    $getStmt->bind_param("s", $trainingId);
    $getStmt->execute();
    $training = $getStmt->get_result()->fetch_assoc();
    
    $stmt = $conn->prepare("DELETE FROM trainings WHERE id = ?");
    $stmt->bind_param("s", $trainingId);
    
    if ($stmt->execute()) {
        // Log deletion to security events
        $logStmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, created) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $logData = json_encode([
            'action' => 'delete_training',
            'trainingId' => $trainingId,
            'trainingTitle' => $training['title'] ?? 'Unknown',
            'deletedBy' => $deletedBy,
            'timestamp' => date('c')
        ]);
        $logStmt->bind_param("sssssss", 
            $deleteType = 'DELETE_TRAINING',
            $logData,
            $sessionId = 'deletion_action',
            $fingerprint = 'delete_action',
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $url = $_SERVER['HTTP_REFERER'] ?? 'unknown'
        );
        $logStmt->execute();
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete training']);
    }

} elseif ($type === 'approve_user') {
    $userId = $input['userId'];
    $rank = $input['rank'];
    
    $stmt = $conn->prepare("UPDATE users SET status = 'approved', rank = ?, approvedAt = NOW() WHERE id = ?");
    $stmt->bind_param("ss", $rank, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot approve user']);
    }

} elseif ($type === 'reject_user') {
    $userId = $input['userId'];
    
    // Instead of deleting, mark as rejected
    $stmt = $conn->prepare("UPDATE users SET status = 'rejected' WHERE id = ?");
    $stmt->bind_param("s", $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot reject user']);
    }

} elseif ($type === 'change_rank') {
    $userId = $input['userId'];
    $newRank = $input['newRank'];
    
    $stmt = $conn->prepare("UPDATE users SET rank = ? WHERE id = ?");
    $stmt->bind_param("ss", $newRank, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot change rank']);
    }

} elseif ($type === 'reset_password') {
    $userId = $input['userId'];
    $newPassword = $input['newPassword'];
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("ss", $hashedPassword, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot reset password']);
    }

} elseif ($type === 'suspend_user') {
    $userId = $input['userId'];
    
    $stmt = $conn->prepare("UPDATE users SET status = 'suspended' WHERE id = ?");
    $stmt->bind_param("s", $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot suspend user']);
    }

} elseif ($type === 'delete_user') {
    // SECURITY: Account deletion disabled
    echo json_encode(['error' => 'Account deletion disabled for security']);


} elseif ($type === 'save_notes') {
    $userId = $input['userId'];
    $notes = $input['notes'];
    
    $stmt = $conn->prepare("UPDATE users SET notes = ? WHERE id = ?");
    $stmt->bind_param("ss", $notes, $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save notes']);
    }

} elseif ($type === 'files') {
    $file = $input['file'];
    $id = uniqid();
    
    // Create files table if it doesn't exist
    $conn->query("CREATE TABLE IF NOT EXISTS files (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        size INT,
        type VARCHAR(100),
        description TEXT,
        uploadedBy VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        accessLevel INT DEFAULT 1,
        fileData LONGTEXT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("INSERT INTO files (id, name, size, type, description, uploadedBy, status, accessLevel, fileData) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssissssis", $id, $file['name'], $file['size'], $file['type'], $file['description'], $file['uploadedBy'], $file['status'], $file['accessLevel'], $file['fileData']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Database error: ' . $conn->error]);
    }

} elseif ($type === 'change_password') {
    $userId = $input['userId'];
    $currentPassword = $input['currentPassword'];
    $newPassword = $input['newPassword'];
    
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    if (password_verify($currentPassword, $user['password'])) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->bind_param("ss", $hashedPassword, $userId);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Cannot save new password']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    }

} elseif ($type === 'delete_announcement') {
    $announcementId = $input['announcementId'];
    $deletedBy = $input['deletedBy'] ?? 'Unknown';
    
    // Get announcement details before deletion
    $getStmt = $conn->prepare("SELECT title FROM announcements WHERE id = ?");
    $getStmt->bind_param("s", $announcementId);
    $getStmt->execute();
    $announcement = $getStmt->get_result()->fetch_assoc();
    
    $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
    $stmt->bind_param("s", $announcementId);
    
    if ($stmt->execute()) {
        // Log deletion to security events
        $logStmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, created) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $logData = json_encode([
            'action' => 'delete_announcement',
            'announcementId' => $announcementId,
            'announcementTitle' => $announcement['title'] ?? 'Unknown',
            'deletedBy' => $deletedBy,
            'timestamp' => date('c')
        ]);
        $logStmt->bind_param("sssssss", 
            $deleteType = 'DELETE_ANNOUNCEMENT',
            $logData,
            $sessionId = 'deletion_action',
            $fingerprint = 'delete_action',
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $url = $_SERVER['HTTP_REFERER'] ?? 'unknown'
        );
        $logStmt->execute();
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete announcement']);
    }

} elseif ($type === 'security_event_batch') {
    $events = $input['events'];
    $ip = $input['ip'];
    $userAgent = $input['userAgent'];
    
    // Create security_events table if it doesn't exist
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
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    $criticalEvents = [];
    $successCount = 0;
    
    foreach ($events as $event) {
        $dataJson = json_encode($event['data']);
        $userId = null;
        
        $stmt->bind_param("ssssssss", 
            $event['type'], 
            $dataJson, 
            $event['sessionId'], 
            $event['fingerprint'], 
            $ip, 
            $userAgent, 
            $event['url'], 
            $userId
        );
        
        if ($stmt->execute()) {
            $successCount++;
            
            // Collect critical events for batch alerting
            $criticalEventTypes = ['FORCED_LOGOUT', 'DEVICE_CHANGE', 'RATE_LIMIT_EXCEEDED', 'BRUTE_FORCE_DETECTED'];
            if (in_array($event['type'], $criticalEventTypes)) {
                $criticalEvents[] = $event;
            }
        }
    }
    
    // Send batch alert for critical events
    if (!empty($criticalEvents)) {
        $webhookData = [
            'embeds' => [[
                'title' => '🚨 Critical Security Events Batch',
                'color' => 0xff0000,
                'fields' => [
                    ['name' => 'Events Count', 'value' => count($criticalEvents), 'inline' => true],
                    ['name' => 'IP Address', 'value' => $ip, 'inline' => true],
                    ['name' => 'Event Types', 'value' => implode(', ', array_unique(array_column($criticalEvents, 'type'))), 'inline' => false]
                ],
                'timestamp' => date('c')
            ]]
        ];
        
        $ch = curl_init('https://discord.com/api/webhooks/1425515405513855067/sf52yCMSFc6EZgHzJLWHheoUhCbKt12Nf7GF5sUhCRq26EyrClQbALK7neJQGCvjm37T');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_exec($ch);
        curl_close($ch);
    }
    
    echo json_encode(['success' => true, 'processed' => $successCount]);

} elseif ($type === 'security_event') {
    // Legacy single event support
    $event = $input['event'];
    
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
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $dataJson = json_encode($event['data']);
    $userId = null;
    
    $stmt->bind_param("ssssssss", 
        $event['type'], 
        $dataJson, 
        $event['sessionId'], 
        $event['fingerprint'], 
        $event['ip'], 
        $event['userAgent'], 
        $event['url'], 
        $userId
    );
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save security event']);
    }

} elseif ($type === 'approve_file') {
    $fileId = $input['fileId'];
    
    $stmt = $conn->prepare("UPDATE files SET status = 'approved' WHERE id = ?");
    $stmt->bind_param("s", $fileId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot approve file']);
    }

} elseif ($type === 'update_file') {
    $fileId = $input['fileId'];
    $name = $input['name'];
    $accessLevel = $input['accessLevel'];
    
    $stmt = $conn->prepare("UPDATE files SET name = ?, accessLevel = ? WHERE id = ?");
    $stmt->bind_param("sis", $name, $accessLevel, $fileId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot update file']);
    }

} elseif ($type === 'delete_file') {
    $fileId = $input['fileId'];
    $deletedBy = $input['deletedBy'] ?? 'Unknown';
    
    // Get file details before deletion
    $getStmt = $conn->prepare("SELECT name FROM files WHERE id = ?");
    $getStmt->bind_param("s", $fileId);
    $getStmt->execute();
    $file = $getStmt->get_result()->fetch_assoc();
    
    $stmt = $conn->prepare("DELETE FROM files WHERE id = ?");
    $stmt->bind_param("s", $fileId);
    
    if ($stmt->execute()) {
        // Log deletion to security events
        $logStmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, created) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $logData = json_encode([
            'action' => 'delete_file',
            'fileId' => $fileId,
            'fileName' => $file['name'] ?? 'Unknown',
            'deletedBy' => $deletedBy,
            'timestamp' => date('c')
        ]);
        $logStmt->bind_param("sssssss", 
            $deleteType = 'DELETE_FILE',
            $logData,
            $sessionId = 'deletion_action',
            $fingerprint = 'delete_action',
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $url = $_SERVER['HTTP_REFERER'] ?? 'unknown'
        );
        $logStmt->execute();
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete file']);
    }

} elseif ($type === 'clear_security_logs') {
    $stmt = $conn->prepare("DELETE FROM security_events");
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot clear security logs']);
    }

} elseif ($type === 'clear_logs') {
    // Clear IP logs - create empty table for now
    $conn->query("CREATE TABLE IF NOT EXISTS ip_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45),
        user VARCHAR(100),
        userAgent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("DELETE FROM ip_logs");
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot clear IP logs']);
    }

} elseif ($type === 'clear_all_security_events') {
    // Get count before deleting
    $countStmt = $conn->prepare("SELECT COUNT(*) as count FROM security_events");
    $countStmt->execute();
    $count = $countStmt->get_result()->fetch_assoc()['count'];
    
    $stmt = $conn->prepare("DELETE FROM security_events");
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'deleted' => $count]);
    } else {
        echo json_encode(['error' => 'Cannot clear security events']);
    }

} elseif ($type === 'touchpoint') {
    $touchpoint = $input['touchpoint'];
    $id = uniqid();
    $key = 'ukbrum_secure_key_2025';
    
    $target = $touchpoint['department'];
    if ($touchpoint['department'] === 'Specific Person' && $touchpoint['specificPerson']) {
        $target = $touchpoint['specificPerson'];
    }
    
    $encryptedMessage = base64_encode(openssl_encrypt($touchpoint['message'], 'AES-256-CBC', $key, 0, substr(hash('sha256', $key), 0, 16)));
    $encryptedContact = base64_encode(openssl_encrypt($touchpoint['contact'], 'AES-256-CBC', $key, 0, substr(hash('sha256', $key), 0, 16)));
    
    $stmt = $conn->prepare("INSERT INTO touchpoints (id, name, rank, department, target, priority, subject, message, contact, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')");
    $stmt->bind_param("sssssssss", $id, $touchpoint['name'], $touchpoint['rank'], $touchpoint['department'], $target, $touchpoint['priority'], $touchpoint['subject'], $encryptedMessage, $encryptedContact);
    
    if ($stmt->execute()) {
        // Send Discord webhook for touchpoint
        $webhookData = [
            'embeds' => [[
                'title' => '🤝 New Touchpoint Request',
                'color' => 0x3b82f6,
                'fields' => [
                    ['name' => 'From', 'value' => $touchpoint['name'] . ' (' . $touchpoint['rank'] . ')', 'inline' => true],
                    ['name' => 'Department', 'value' => $target, 'inline' => true],
                    ['name' => 'Priority', 'value' => $touchpoint['priority'], 'inline' => true],
                    ['name' => 'Subject', 'value' => $touchpoint['subject'], 'inline' => false]
                ],
                'timestamp' => date('c')
            ]]
        ];
        
        $ch = curl_init('https://discord.com/api/webhooks/1445841990607437946/3EZ2eyH4Q88mQnYX7y5n0FbTZQVUNkaGiYxLFgbnv3pHconIH_6e_Wv0wmGPc0EnqbcN');
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($webhookData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_exec($ch);
        curl_close($ch);
        
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save touchpoint: ' . $conn->error]);
    }

} elseif ($type === 'touchpoint_reply') {
    $touchpointId = $input['touchpointId'];
    $reply = $input['reply'];
    $repliedBy = $input['repliedBy'];
    $key = 'ukbrum_secure_key_2025';
    
    $encryptedReply = base64_encode(openssl_encrypt($reply, 'AES-256-CBC', $key, 0, substr(hash('sha256', $key), 0, 16)));
    
    $stmt = $conn->prepare("SELECT replies FROM touchpoints WHERE id = ?");
    $stmt->bind_param("s", $touchpointId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    $replies = $result['replies'] ? json_decode($result['replies'], true) : [];
    $replies[] = [
        'message' => $encryptedReply,
        'repliedBy' => $repliedBy,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $stmt = $conn->prepare("UPDATE touchpoints SET replies = ?, status = 'in_progress', assigned_to = ? WHERE id = ?");
    $repliesJson = json_encode($replies);
    $stmt->bind_param("sss", $repliesJson, $repliedBy, $touchpointId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save reply']);
    }

} elseif ($type === 'update_touchpoint_status') {
    $touchpointId = $input['touchpointId'];
    $status = $input['status'];
    
    $stmt = $conn->prepare("UPDATE touchpoints SET status = ? WHERE id = ?");
    $stmt->bind_param("ss", $status, $touchpointId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot update status']);
    }

} elseif ($type === 'delete_touchpoint') {
    $touchpointId = $input['touchpointId'];
    
    $stmt = $conn->prepare("DELETE FROM touchpoints WHERE id = ?");
    $stmt->bind_param("s", $touchpointId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete touchpoint']);
    }

} elseif ($type === 'assessment') {
    $assessment = $input['assessment'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO assessments (id, title, description, sections, totalMarks, passMarks, created) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $sectionsJson = json_encode($assessment['sections']);
    $stmt->bind_param("ssssii", $id, $assessment['title'], $assessment['description'], $sectionsJson, $assessment['totalMarks'], $assessment['passMarks']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot create assessment: ' . $conn->error]);
    }

} elseif ($type === 'verify_emergency_code') {
    $passcode = $input['passcode'] ?? '';
    
    // Create emergency codes table if it doesn't exist
    $conn->query("CREATE TABLE IF NOT EXISTS emergency_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code_hash VARCHAR(255),
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Check if any codes exist, if not create default
    $checkStmt = $conn->prepare("SELECT COUNT(*) as count FROM emergency_codes");
    $checkStmt->execute();
    $count = $checkStmt->get_result()->fetch_assoc()['count'];
    
    if ($count == 0) {
        $defaultHash = password_hash('EMERGENCY_' . date('Ymd'), PASSWORD_DEFAULT);
        $insertStmt = $conn->prepare("INSERT INTO emergency_codes (code_hash) VALUES (?)");
        $insertStmt->bind_param("s", $defaultHash);
        $insertStmt->execute();
    }
    
    // Verify passcode
    $stmt = $conn->prepare("SELECT code_hash FROM emergency_codes");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $valid = false;
    while ($row = $result->fetch_assoc()) {
        if (password_verify($passcode, $row['code_hash'])) {
            $valid = true;
            break;
        }
    }
    
    echo json_encode(['success' => $valid]);

} elseif ($type === 'emergency_lock') {
    $locked = $input['locked'] ? '1' : '0';
    
    // Create table if it doesn't exist
    $conn->query("CREATE TABLE IF NOT EXISTS website_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE,
        setting_value TEXT,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    
    $stmt = $conn->prepare("INSERT INTO website_settings (setting_key, setting_value) VALUES ('site_locked', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("ss", $locked, $locked);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot update site lock: ' . $conn->error]);
    }

} elseif ($type === 'assessment_response') {
    $response = $input['response'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO assessment_responses (id, assessmentId, userId, username, answers, timeTaken, totalQuestions, answeredQuestions, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $answersJson = json_encode($response['answers']);
    $stmt->bind_param("sssssiis", $id, $response['assessmentId'], $response['userId'], $response['username'], $answersJson, $response['timeTaken'], $response['totalQuestions'], $response['answeredQuestions']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save assessment response']);
    }

} elseif ($type === 'grade_assessment') {
    $responseId = $input['responseId'];
    $status = $input['status'];
    $totalScore = $input['totalScore'] ?? 0;
    $maxScore = $input['maxScore'] ?? 0;
    $marks = $input['marks'] ?? '';
    $gradedBy = $input['gradedBy'];
    
    $stmt = $conn->prepare("UPDATE assessment_responses SET status = ?, totalScore = ?, maxScore = ?, marks = ?, gradedBy = ?, gradedAt = NOW() WHERE id = ?");
    $stmt->bind_param("siisss", $status, $totalScore, $maxScore, $marks, $gradedBy, $responseId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot grade assessment']);
    }

} elseif ($type === 'delete_assessment') {
    $assessmentId = $input['assessmentId'];
    $deletedBy = $input['deletedBy'] ?? 'Unknown';
    
    // Get assessment details before deletion
    $getStmt = $conn->prepare("SELECT title FROM assessments WHERE id = ?");
    $getStmt->bind_param("s", $assessmentId);
    $getStmt->execute();
    $assessment = $getStmt->get_result()->fetch_assoc();
    
    // Delete assessment responses first
    $stmt = $conn->prepare("DELETE FROM assessment_responses WHERE assessmentId = ?");
    $stmt->bind_param("s", $assessmentId);
    $stmt->execute();
    
    // Delete assessment
    $stmt = $conn->prepare("DELETE FROM assessments WHERE id = ?");
    $stmt->bind_param("s", $assessmentId);
    
    if ($stmt->execute()) {
        // Log deletion to security events
        $logStmt = $conn->prepare("INSERT INTO security_events (type, data, session_id, fingerprint, ip_address, user_agent, url, created) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $logData = json_encode([
            'action' => 'delete_assessment',
            'assessmentId' => $assessmentId,
            'assessmentTitle' => $assessment['title'] ?? 'Unknown',
            'deletedBy' => $deletedBy,
            'timestamp' => date('c')
        ]);
        $logStmt->bind_param("sssssss", 
            $deleteType = 'DELETE_ASSESSMENT',
            $logData,
            $sessionId = 'deletion_action',
            $fingerprint = 'delete_action',
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $url = $_SERVER['HTTP_REFERER'] ?? 'unknown'
        );
        $logStmt->execute();
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete assessment']);
    }

} elseif ($type === 'delete_assessment_response') {
    $responseId = $input['responseId'];
    
    $stmt = $conn->prepare("DELETE FROM assessment_responses WHERE id = ?");
    $stmt->bind_param("s", $responseId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete response']);
    }

} elseif ($type === 'temporary_block') {
    $ip = $input['ip'];
    $reason = $input['reason'];
    $duration = $input['duration'] ?? 1800; // 30 minutes default
    
    // Create temporary blocks table
    $conn->query("CREATE TABLE IF NOT EXISTS temporary_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45),
        reason TEXT,
        expires TIMESTAMP,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
    
    $expiresAt = date('Y-m-d H:i:s', time() + $duration);
    
    $stmt = $conn->prepare("INSERT INTO temporary_blocks (ip, reason, expires) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $ip, $reason, $expiresAt);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'expires' => $expiresAt]);
    } else {
        echo json_encode(['error' => 'Cannot create temporary block']);
    }

} elseif ($type === 'ban_ip') {
    $ip = $input['ip'];
    $reason = $input['reason'];
    $bannedBy = $input['bannedBy'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO banned_ips (id, ip, reason, bannedBy, created) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssss", $id, $ip, $reason, $bannedBy);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot ban IP']);
    }

} elseif ($type === 'unban_ip') {
    $ip = $input['ip'];
    
    $stmt = $conn->prepare("DELETE FROM banned_ips WHERE ip = ?");
    $stmt->bind_param("s", $ip);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot unban IP']);
    }

} elseif ($type === 'check_health') {
    // Simple health check endpoint
    echo json_encode(['status' => 'healthy', 'timestamp' => time()]);

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>