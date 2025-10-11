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