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
    
} else {
    echo json_encode(['error' => 'Invalid type']);
}
?>