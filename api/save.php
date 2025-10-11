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
    
} elseif ($type === 'trial_logs') {
    $trialLog = $input['trialLog'];
    $trialLog['id'] = uniqid();
    $trialLog['created'] = date('c');
    
    $file = $dataDir . 'trial_logs.json';
    $logs = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $logs = $content ? json_decode($content, true) : [];
        if (!is_array($logs)) $logs = [];
    }
    
    $logs[] = $trialLog;
    
    if (file_put_contents($file, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot write to trial_logs.json']);
        exit;
    }
    
    chmod($file, 0644);
    echo json_encode(['success' => true, 'id' => $trialLog['id']]);
    
} elseif ($type === 'update_trial') {
    $logId = $input['logId'];
    $result = $input['result'];
    
    $file = $dataDir . 'trial_logs.json';
    $logs = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $logs = $content ? json_decode($content, true) : [];
    }
    
    foreach ($logs as &$log) {
        if ($log['id'] === $logId) {
            $log['trialResult'] = $result;
            $log['updated'] = date('c');
            break;
        }
    }
    
    if (file_put_contents($file, json_encode($logs, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot update trial log']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'website_control') {
    $action = $input['action'];
    $data = $input['data'] ?? [];
    
    $file = $dataDir . 'website_control.json';
    $control = ['locked' => false, 'emergency_popup' => null];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $control = $content ? json_decode($content, true) : $control;
    }
    
    if ($action === 'lock') {
        $control['locked'] = $data['locked'];
    } elseif ($action === 'emergency') {
        $control['emergency_popup'] = $data['message'] ? ['message' => $data['message'], 'created' => date('c')] : null;
    }
    
    if (file_put_contents($file, json_encode($control, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot update website control']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'trainings') {
    $training = $input['training'];
    $training['id'] = uniqid();
    $training['created'] = date('c');
    $training['attendees'] = [];
    
    $file = $dataDir . 'trainings.json';
    $trainings = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $trainings = $content ? json_decode($content, true) : [];
        if (!is_array($trainings)) $trainings = [];
    }
    
    $trainings[] = $training;
    
    if (file_put_contents($file, json_encode($trainings, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot write to trainings.json']);
        exit;
    }
    
    chmod($file, 0644);
    echo json_encode(['success' => true, 'id' => $training['id']]);
    
} elseif ($type === 'training_attendance') {
    $trainingId = $input['trainingId'];
    $deviceId = $input['deviceId'];
    
    $file = $dataDir . 'trainings.json';
    $trainings = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $trainings = $content ? json_decode($content, true) : [];
    }
    
    foreach ($trainings as &$training) {
        if ($training['id'] === $trainingId) {
            if (!isset($training['attendees'])) $training['attendees'] = [];
            
            $index = array_search($deviceId, $training['attendees']);
            if ($index !== false) {
                array_splice($training['attendees'], $index, 1);
            } else {
                $training['attendees'][] = $deviceId;
            }
            break;
        }
    }
    
    if (file_put_contents($file, json_encode($trainings, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot update attendance']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'delete_training') {
    $trainingId = $input['trainingId'];
    
    $file = $dataDir . 'trainings.json';
    $trainings = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $trainings = $content ? json_decode($content, true) : [];
    }
    
    $trainings = array_filter($trainings, function($training) use ($trainingId) {
        return $training['id'] !== $trainingId;
    });
    
    $trainings = array_values($trainings);
    
    if (file_put_contents($file, json_encode($trainings, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot delete training']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'ban_ip') {
    $ip = $input['ip'];
    $reason = $input['reason'];
    $bannedBy = $input['bannedBy'];
    
    $file = $dataDir . 'banned_ips.json';
    $bannedIps = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $bannedIps = $content ? json_decode($content, true) : [];
        if (!is_array($bannedIps)) $bannedIps = [];
    }
    
    $newBan = [
        'id' => uniqid(),
        'ip' => $ip,
        'reason' => $reason,
        'bannedBy' => $bannedBy,
        'timestamp' => date('c')
    ];
    
    $bannedIps[] = $newBan;
    
    if (file_put_contents($file, json_encode($bannedIps, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot ban IP']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'unban_ip') {
    $ip = $input['ip'];
    
    $file = $dataDir . 'banned_ips.json';
    $bannedIps = [];
    if (file_exists($file)) {
        $content = file_get_contents($file);
        $bannedIps = $content ? json_decode($content, true) : [];
    }
    
    $bannedIps = array_filter($bannedIps, function($ban) use ($ip) {
        return $ban['ip'] !== $ip;
    });
    
    $bannedIps = array_values($bannedIps);
    
    if (file_put_contents($file, json_encode($bannedIps, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot unban IP']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} else {
    echo json_encode(['error' => 'Invalid type']);
}
?>