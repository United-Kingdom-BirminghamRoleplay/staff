<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? '';

$dataDir = __DIR__ . '/../data/';
if (!is_dir($dataDir)) {
    if (!mkdir($dataDir, 0755, true)) {
        echo json_encode(['error' => 'Cannot create data directory']);
        exit;
    }
}

if ($type === 'forms') {
    $form = $input['form'];
    $form['id'] = uniqid();
    $form['created'] = date('c');
    
    $file = $dataDir . 'forms.json';
    $forms = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $forms = $content ? json_decode($content, true) : [];
        if (!is_array($forms)) $forms = [];
    }
    
    $forms[] = $form;
    
    if (file_put_contents($file, json_encode($forms, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot write to forms.json']);
        exit;
    }
    
    chmod($file, 0644);
    echo json_encode(['success' => true, 'id' => $form['id'], 'pin' => $form['pin']]);
    
} elseif ($type === 'announcements') {
    $announcement = $input['announcement'];
    $announcement['id'] = uniqid();
    $announcement['created'] = date('c');
    
    $file = $dataDir . 'announcements.json';
    $announcements = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $announcements = $content ? json_decode($content, true) : [];
        if (!is_array($announcements)) $announcements = [];
    }
    
    $announcements[] = $announcement;
    
    if (file_put_contents($file, json_encode($announcements, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot write to announcements.json']);
        exit;
    }
    
    chmod($file, 0644);
    echo json_encode(['success' => true, 'id' => $announcement['id']]);
    
} else {
    echo json_encode(['error' => 'Invalid type']);
}
?>