<?php
header('Content-Type: application/json');

$dataDir = __DIR__ . '/../data/';

$info = [
    'php_version' => phpversion(),
    'current_dir' => __DIR__,
    'data_dir' => $dataDir,
    'data_dir_exists' => is_dir($dataDir),
    'data_dir_writable' => is_writable(dirname($dataDir)),
    'parent_writable' => is_writable(__DIR__ . '/..'),
    'forms_exists' => file_exists($dataDir . 'forms.json'),
    'announcements_exists' => file_exists($dataDir . 'announcements.json')
];

// Try to create data directory
if (!is_dir($dataDir)) {
    $created = mkdir($dataDir, 0755, true);
    $info['mkdir_result'] = $created;
    $info['mkdir_error'] = $created ? null : error_get_last()['message'];
}

// Test file write
$testFile = $dataDir . 'test.json';
$writeResult = file_put_contents($testFile, '{"test":true}');
$info['write_test'] = $writeResult !== false;
$info['write_bytes'] = $writeResult;

if ($writeResult !== false) {
    chmod($testFile, 0644);
    $info['read_test'] = file_get_contents($testFile) !== false;
    unlink($testFile);
}

echo json_encode($info, JSON_PRETTY_PRINT);
?>