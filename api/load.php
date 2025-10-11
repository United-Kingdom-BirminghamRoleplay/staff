<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$type = $_GET['type'] ?? '';
$dataDir = __DIR__ . '/../data/';

if ($type === 'forms') {
    $file = $dataDir . 'forms.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $data = $content ? json_decode($content, true) : [];
        
        // Convert old format to array
        $forms = [];
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                if (is_numeric($key) && is_array($value) && isset($value['id'])) {
                    $forms[] = $value;
                }
            }
        }
        
        echo json_encode($forms);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'announcements') {
    $file = $dataDir . 'announcements.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $data = $content ? json_decode($content, true) : [];
        
        // Extract announcements from numbered keys and existing array
        $announcements = [];
        if (is_array($data)) {
            // Get from numbered keys (0, 1, 2...)
            foreach ($data as $key => $value) {
                if (is_numeric($key) && is_array($value) && isset($value['id'])) {
                    $announcements[] = $value;
                }
            }
            // Also get from 'announcements' array if it exists
            if (isset($data['announcements']) && is_array($data['announcements'])) {
                $announcements = array_merge($announcements, $data['announcements']);
            }
        }
        
        // Sort by created date (newest first)
        usort($announcements, function($a, $b) {
            $dateA = isset($a['created']) ? strtotime($a['created']) : 0;
            $dateB = isset($b['created']) ? strtotime($b['created']) : 0;
            return $dateB - $dateA;
        });
        
        echo json_encode($announcements);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'trial_logs') {
    $file = $dataDir . 'trial_logs.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $logs = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($logs) ? $logs : []);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'website_control') {
    $file = $dataDir . 'website_control.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $control = $content ? json_decode($content, true) : ['locked' => false, 'emergency_popup' => null];
        echo json_encode($control);
    } else {
        echo json_encode(['locked' => false, 'emergency_popup' => null]);
    }
    
} elseif ($type === 'trainings') {
    $file = $dataDir . 'trainings.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $trainings = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($trainings) ? $trainings : []);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'ip_logs') {
    $file = $dataDir . 'ip_logs.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $logs = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($logs) ? $logs : []);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'files') {
    $file = $dataDir . 'files.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $files = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($files) ? $files : []);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'file_download') {
    $fileId = $_GET['id'] ?? '';
    $file = $dataDir . 'files.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $files = $content ? json_decode($content, true) : [];
        
        foreach ($files as $f) {
            if ($f['id'] === $fileId && $f['status'] === 'approved') {
                echo json_encode($f);
                exit;
            }
        }
    }
    echo json_encode(['error' => 'File not found']);
    
} elseif ($type === 'users') {
    $file = $dataDir . 'users.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $users = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($users) ? $users : []);
    } else {
        echo json_encode([]);
    }
    
} elseif ($type === 'user_details') {
    $userId = $_GET['userId'] ?? '';
    $file = $dataDir . 'users.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $users = $content ? json_decode($content, true) : [];
        
        foreach ($users as $user) {
            if ($user['id'] === $userId) {
                echo json_encode(['success' => true, 'user' => $user]);
                exit;
            }
        }
    }
    echo json_encode(['success' => false, 'message' => 'User not found']);
    
} elseif ($type === 'party_mode') {
    $file = $dataDir . 'party_mode.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $partyData = $content ? json_decode($content, true) : ['active' => false];
        echo json_encode($partyData);
    } else {
        echo json_encode(['active' => false]);
    }
    
} elseif ($type === 'banned_ips') {
    $file = $dataDir . 'banned_ips.json';
    if (file_exists($file) && is_readable($file)) {
        $content = file_get_contents($file);
        $bannedIps = $content ? json_decode($content, true) : [];
        echo json_encode(is_array($bannedIps) ? $bannedIps : []);
    } else {
        echo json_encode([]);
    }
    
} else {
    echo json_encode(['error' => 'Invalid type']);
}
?>