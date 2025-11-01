<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../backend/connect.php';

$input = json_decode(file_get_contents('php://input'), true);
$type = $input['type'] ?? '';

if ($type === 'forms') {
    $form = $input['form'];
    $id = uniqid();
    $pin = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
    
    $stmt = $conn->prepare("INSERT INTO forms (id, name, fields, pin, createdBy) VALUES (?, ?, ?, ?, ?)");
    $fieldsJson = json_encode($form['fields']);
    $stmt->bind_param("sssss", $id, $form['name'], $fieldsJson, $pin, $form['createdBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id, 'pin' => $pin]);
    } else {
        echo json_encode(['error' => 'Cannot create form']);
    }

} elseif ($type === 'response') {
    $formId = $input['formId'];
    $response = $input['response'];
    
    $stmt = $conn->prepare("INSERT INTO form_responses (form_id, response_data) VALUES (?, ?)");
    $responseJson = json_encode($response);
    $stmt->bind_param("ss", $formId, $responseJson);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save response']);
    }

} elseif ($type === 'announcements') {
    $announcement = $input['announcement'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO announcements (id, title, content, icon, postedBy) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $id, $announcement['title'], $announcement['content'], $announcement['icon'], $announcement['postedBy']);
    
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
    
    $stmt = $conn->prepare("INSERT INTO reports (id, robloxUsername, discordUsername, reportType, description, evidence, created) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssssss", $id, $report['robloxUsername'], $report['discordUsername'], $report['reportType'], $report['description'], $report['evidence']);
    
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

} elseif ($type === 'delete_training') {
    $trainingId = $input['trainingId'];
    
    $stmt = $conn->prepare("DELETE FROM trainings WHERE id = ?");
    $stmt->bind_param("s", $trainingId);
    
    if ($stmt->execute()) {
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
    
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
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
    $userId = $input['userId'];
    
    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param("s", $userId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete user']);
    }

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
    
    $stmt = $conn->prepare("INSERT INTO files (id, name, size, type, description, uploadedBy, status, fileData, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssisssss", $id, $file['name'], $file['size'], $file['type'], $file['description'], $file['uploadedBy'], $file['status'], $file['fileData']);
    
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
    
    $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
    $stmt->bind_param("s", $announcementId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete announcement']);
    }

} elseif ($type === 'security_log') {
    $logType = $input['logType'];
    $data = $input['data'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO security_logs (id, type, data, created) VALUES (?, ?, ?, NOW())");
    $stmt->bind_param("sss", $id, $logType, $data);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save security log']);
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

} elseif ($type === 'delete_file') {
    $fileId = $input['fileId'];
    
    $stmt = $conn->prepare("DELETE FROM files WHERE id = ?");
    $stmt->bind_param("s", $fileId);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot delete file']);
    }

} elseif ($type === 'clear_security_logs') {
    $stmt = $conn->prepare("DELETE FROM security_logs");
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot clear security logs']);
    }

} elseif ($type === 'touchpoint') {
    $data = $input['data'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO touchpoint (id, senderName, subject, priority, message, created) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->bind_param("sssss", $id, $data['senderName'], $data['subject'], $data['priority'], $data['message']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot save touchpoint']);
    }

} elseif ($type === 'assessment') {
    $assessment = $input['assessment'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO assessments (id, title, description, sections, totalMarks, created) VALUES (?, ?, ?, ?, ?, NOW())");
    $sectionsJson = json_encode($assessment['sections']);
    $stmt->bind_param("ssssi", $id, $assessment['title'], $assessment['description'], $sectionsJson, $assessment['totalMarks']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot create assessment']);
    }

} elseif ($type === 'website_control') {
    $action = $input['action'];
    $data = $input['data'];
    
    if ($action === 'lock') {
        $stmt = $conn->prepare("INSERT INTO website_settings (setting_key, setting_value) VALUES ('locked', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $locked = $data['locked'] ? '1' : '0';
        $stmt->bind_param("ss", $locked, $locked);
    } elseif ($action === 'emergency') {
        $message = $data['message'] ?? null;
        $stmt = $conn->prepare("INSERT INTO website_settings (setting_key, setting_value) VALUES ('emergency_message', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->bind_param("ss", $message, $message);
    }
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Cannot update website settings']);
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
    $reason = $input['reason'];
    $gradedBy = $input['gradedBy'];
    
    $stmt = $conn->prepare("UPDATE assessment_responses SET status = ?, reason = ?, gradedBy = ?, gradedAt = NOW() WHERE id = ?");
    $stmt->bind_param("ssss", $status, $reason, $gradedBy, $responseId);
    
    if ($stmt->execute()) {
        $stmt2 = $conn->prepare("SELECT ar.*, a.title as assessmentTitle FROM assessment_responses ar LEFT JOIN assessments a ON ar.assessmentId = a.id WHERE ar.id = ?");
        $stmt2->bind_param("s", $responseId);
        $stmt2->execute();
        $responseData = $stmt2->get_result()->fetch_assoc();
        
        echo json_encode(['success' => true, 'responseData' => $responseData]);
    } else {
        echo json_encode(['error' => 'Cannot grade assessment']);
    }

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>