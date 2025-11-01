<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../backend/connect.php';

$type = $_GET['type'] ?? '';

if ($type === 'announcements') {
    $stmt = $conn->prepare("SELECT * FROM announcements ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }
    
    echo json_encode($announcements);

} elseif ($type === 'forms') {
    $stmt = $conn->prepare("SELECT * FROM forms ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $forms = [];
    while ($row = $result->fetch_assoc()) {
        $row['fields'] = json_decode($row['fields'], true);
        $forms[] = $row;
    }
    
    echo json_encode($forms);

} elseif ($type === 'trial_logs') {
    $stmt = $conn->prepare("SELECT * FROM trial_logs ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    
    echo json_encode($logs);

} elseif ($type === 'trainings') {
    $stmt = $conn->prepare("SELECT * FROM trainings ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trainings = [];
    while ($row = $result->fetch_assoc()) {
        $trainings[] = $row;
    }
    
    echo json_encode($trainings);

} elseif ($type === 'reports') {
    $stmt = $conn->prepare("SELECT * FROM reports ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    
    echo json_encode($reports);

} elseif ($type === 'website_control') {
    $stmt = $conn->prepare("SELECT * FROM website_settings");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $settings = ['locked' => false, 'emergency_popup' => null];
    while ($row = $result->fetch_assoc()) {
        if ($row['setting_key'] === 'locked') {
            $settings['locked'] = $row['setting_value'] === '1';
        } elseif ($row['setting_key'] === 'emergency_message') {
            $settings['emergency_popup'] = $row['setting_value'];
        }
    }
    
    echo json_encode($settings);

} elseif ($type === 'users') {
    $stmt = $conn->prepare("SELECT id, robloxUsername, discordUsername, requestedRank, rank, status, registeredAt, approvedAt, approvedBy, notes FROM users ORDER BY registeredAt DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    
    echo json_encode($users);

} elseif ($type === 'files') {
    $stmt = $conn->prepare("SELECT * FROM files ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $files = [];
    while ($row = $result->fetch_assoc()) {
        $files[] = $row;
    }
    
    echo json_encode($files);

} elseif ($type === 'file_download') {
    $fileId = $_GET['id'] ?? '';
    
    $stmt = $conn->prepare("SELECT * FROM files WHERE id = ?");
    $stmt->bind_param("s", $fileId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $file = $result->fetch_assoc();
        echo json_encode($file);
    } else {
        echo json_encode(['error' => 'File not found']);
    }

} elseif ($type === 'security_logs') {
    $stmt = $conn->prepare("SELECT * FROM security_logs ORDER BY created DESC LIMIT 100");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $row['data'] = json_decode($row['data'], true);
        $logs[] = $row;
    }
    
    echo json_encode($logs);

} elseif ($type === 'user_details') {
    $userId = $_GET['userId'] ?? '';
    
    $stmt = $conn->prepare("SELECT id, robloxUsername, discordUsername, rank, registeredAt, approvedAt, notes FROM users WHERE id = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        echo json_encode(['success' => true, 'user' => $user]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

} elseif ($type === 'assessment' && isset($_GET['id'])) {
    $assessmentId = $_GET['id'];
    
    $stmt = $conn->prepare("SELECT * FROM assessments WHERE id = ?");
    $stmt->bind_param("s", $assessmentId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $assessment = $result->fetch_assoc();
        $assessment['sections'] = json_decode($assessment['sections'], true);
        echo json_encode($assessment);
    } else {
        echo json_encode(['error' => 'Assessment not found']);
    }

} elseif ($type === 'assessment_responses') {
    $stmt = $conn->prepare("SELECT ar.*, a.title as assessmentTitle FROM assessment_responses ar LEFT JOIN assessments a ON ar.assessmentId = a.id ORDER BY ar.created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $responses = [];
    while ($row = $result->fetch_assoc()) {
        $responses[] = $row;
    }
    
    echo json_encode($responses);

} elseif ($type === 'assessments') {
    $stmt = $conn->prepare("SELECT * FROM assessments ORDER BY created DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $assessments = [];
    while ($row = $result->fetch_assoc()) {
        $assessments[] = $row;
    }
    
    echo json_encode($assessments);

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>