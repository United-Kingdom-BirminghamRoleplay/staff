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
    
} elseif ($type === 'upload_file') {
    $file = $input['file'];
    
    $filesFile = $dataDir . 'files.json';
    $files = [];
    if (file_exists($filesFile)) {
        $content = file_get_contents($filesFile);
        $files = $content ? json_decode($content, true) : [];
        if (!is_array($files)) $files = [];
    }
    
    $files[] = $file;
    
    if (file_put_contents($filesFile, json_encode($files, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot upload file']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'approve_file') {
    $fileId = $input['fileId'];
    
    $filesFile = $dataDir . 'files.json';
    $files = [];
    if (file_exists($filesFile)) {
        $content = file_get_contents($filesFile);
        $files = $content ? json_decode($content, true) : [];
    }
    
    foreach ($files as &$file) {
        if ($file['id'] === $fileId) {
            $file['status'] = 'approved';
            break;
        }
    }
    
    if (file_put_contents($filesFile, json_encode($files, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot approve file']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'delete_file') {
    $fileId = $input['fileId'];
    
    $filesFile = $dataDir . 'files.json';
    $files = [];
    if (file_exists($filesFile)) {
        $content = file_get_contents($filesFile);
        $files = $content ? json_decode($content, true) : [];
    }
    
    $files = array_filter($files, function($file) use ($fileId) {
        return $file['id'] !== $fileId;
    });
    
    $files = array_values($files);
    
    if (file_put_contents($filesFile, json_encode($files, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot delete file']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'approve_user') {
    $userId = $input['userId'];
    $rank = $input['rank'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            $user['status'] = 'approved';
            $user['rank'] = $rank;
            $user['approvedAt'] = date('c');
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot approve user']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'reject_user') {
    $userId = $input['userId'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    $users = array_filter($users, function($user) use ($userId) {
        return $user['id'] !== $userId;
    });
    
    $users = array_values($users);
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot reject user']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'change_rank') {
    $userId = $input['userId'];
    $newRank = $input['newRank'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            $user['rank'] = $newRank;
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot change rank']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'reset_password') {
    $userId = $input['userId'];
    $newPassword = $input['newPassword'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            $user['password'] = password_hash($newPassword, PASSWORD_DEFAULT);
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot reset password']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'suspend_user') {
    $userId = $input['userId'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            $user['status'] = 'suspended';
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot suspend user']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'delete_user') {
    $userId = $input['userId'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    $users = array_filter($users, function($user) use ($userId) {
        return $user['id'] !== $userId;
    });
    
    $users = array_values($users);
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot delete user']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'save_notes') {
    $userId = $input['userId'];
    $notes = $input['notes'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            $user['notes'] = $notes;
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot save notes']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'change_password') {
    $userId = $input['userId'];
    $currentPassword = $input['currentPassword'];
    $newPassword = $input['newPassword'];
    
    $usersFile = $dataDir . 'users.json';
    $users = [];
    if (file_exists($usersFile)) {
        $content = file_get_contents($usersFile);
        $users = $content ? json_decode($content, true) : [];
    }
    
    foreach ($users as &$user) {
        if ($user['id'] === $userId) {
            if (password_verify($currentPassword, $user['password'])) {
                $user['password'] = password_hash($newPassword, PASSWORD_DEFAULT);
                
                if (file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT), LOCK_EX) !== false) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Cannot save new password']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
            }
            exit;
        }
    }
    
    echo json_encode(['success' => false, 'message' => 'User not found']);
    
} elseif ($type === 'party_mode') {
    $active = $input['active'] ?? false;
    
    $file = $dataDir . 'party_mode.json';
    $partyData = ['active' => $active, 'timestamp' => date('c')];
    
    if (file_put_contents($file, json_encode($partyData, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot update party mode']);
        exit;
    }
    
    echo json_encode(['success' => true]);
    
} elseif ($type === 'clear_logs') {
    $file = $dataDir . 'ip_logs.json';
    if (file_put_contents($file, json_encode([], JSON_PRETTY_PRINT), LOCK_EX) === false) {
        echo json_encode(['error' => 'Cannot clear logs']);
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