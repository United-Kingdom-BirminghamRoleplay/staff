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
    
} elseif ($type === 'response') {
    $formId = $input['formId'];
    $response = $input['response'];
    
    $file = $dataDir . 'forms.json';
    $forms = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $forms = $content ? json_decode($content, true) : [];
    }
    
    foreach ($forms as &$form) {
        if ($form['id'] === $formId) {
            if (!isset($form['responses'])) $form['responses'] = [];
            $form['responses'][] = $response;
            break;
        }
    }
    
    if (file_put_contents($file, json_encode($forms, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot save response']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'delete_form') {
    $formId = $input['formId'];
    
    $file = $dataDir . 'forms.json';
    $forms = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $forms = $content ? json_decode($content, true) : [];
    }
    
    $forms = array_filter($forms, function($form) use ($formId) {
        return $form['id'] !== $formId;
    });
    
    $forms = array_values($forms);
    
    if (file_put_contents($file, json_encode($forms, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot delete form']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'update_form') {
    $formId = $input['formId'];
    $updates = $input['updates'];
    
    $file = $dataDir . 'forms.json';
    $forms = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $forms = $content ? json_decode($content, true) : [];
    }
    
    foreach ($forms as &$form) {
        if ($form['id'] === $formId) {
            foreach ($updates as $key => $value) {
                $form[$key] = $value;
            }
            break;
        }
    }
    
    if (file_put_contents($file, json_encode($forms, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot update form']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
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
    
    array_unshift($announcements, $announcement);
    
    if (file_put_contents($file, json_encode($announcements, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot write to announcements.json']);
        exit;
    }
    
    chmod($file, 0644);
    echo json_encode(['success' => true, 'id' => $announcement['id']]);
    
} elseif ($type === 'delete_announcement') {
    $announcementId = $input['announcementId'];
    
    $file = $dataDir . 'announcements.json';
    $announcements = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $announcements = $content ? json_decode($content, true) : [];
    }
    
    $announcements = array_filter($announcements, function($announcement) use ($announcementId) {
        return $announcement['id'] !== $announcementId;
    });
    
    $announcements = array_values($announcements);
    
    if (file_put_contents($file, json_encode($announcements, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot delete announcement']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} else {
    echo json_encode(['error' => 'Invalid type']);
}
?>