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

if ($type === 'announcements') {
    $announcement = $input['announcement'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO announcements (id, title, content, icon, postedBy) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $id, $announcement['title'], $announcement['content'], $announcement['icon'], $announcement['postedBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save announcement']);
    }

} elseif ($type === 'forms') {
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

} elseif ($type === 'trial_logs') {
    $trialLog = $input['trialLog'];
    $id = uniqid();
    
    $stmt = $conn->prepare("INSERT INTO trial_logs (id, username, rank, notes, createdBy) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $id, $trialLog['username'], $trialLog['rank'], $trialLog['notes'], $trialLog['createdBy']);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'id' => $id]);
    } else {
        echo json_encode(['error' => 'Cannot save trial log']);
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

} else {
    echo json_encode(['error' => 'Invalid type']);
}

$conn->close();
?>