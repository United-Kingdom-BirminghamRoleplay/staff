<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$backup_dir = '../backups/';
if (!is_dir($backup_dir)) {
    mkdir($backup_dir, 0755, true);
}

$timestamp = date('Y-m-d_H-i-s');
$files_to_backup = [
    '../data/forms.json',
    '../data/announcements.json', 
    '../data/responses.json',
    '../data/auth.json'
];

$backup_data = [];
foreach ($files_to_backup as $file) {
    if (file_exists($file)) {
        $filename = basename($file);
        $backup_data[$filename] = json_decode(file_get_contents($file), true);
    }
}

$backup_file = $backup_dir . "backup_$timestamp.json";
file_put_contents($backup_file, json_encode($backup_data, JSON_PRETTY_PRINT));

// Keep only last 10 backups
$backups = glob($backup_dir . 'backup_*.json');
if (count($backups) > 10) {
    sort($backups);
    $old_backups = array_slice($backups, 0, -10);
    foreach ($old_backups as $old_backup) {
        unlink($old_backup);
    }
}

echo json_encode(['success' => true, 'backup_file' => $backup_file]);
?>