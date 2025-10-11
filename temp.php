<?php
require_once 'connect.php';

$json = file_get_contents('data/users.json');
$users = json_decode($json, true);

foreach ($users as $user) {
    $stmt = $conn->prepare("INSERT INTO users 
        (id, robloxUsername, discordUsername, requestedRank, rank, password, status, registeredAt, approvedAt, approvedBy, notes, actions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->bind_param(
        'ssssssssssss',
        $user['id'],
        $user['robloxUsername'],
        $user['discordUsername'],
        $user['requestedRank'],
        $user['rank'],
        $user['password'],
        $user['status'],
        $user['registeredAt'],
        $user['approvedAt'],
        $user['approvedBy'],
        $user['notes'],
        json_encode($user['actions'])
    );
    $stmt->execute();
}
echo "Users imported!";
?>
