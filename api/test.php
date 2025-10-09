<?php
header('Content-Type: application/json');

$info = [
    'php_version' => phpversion(),
    'current_dir' => __DIR__,
    'parent_dir' => dirname(__DIR__),
    'data_dir' => __DIR__ . '/../data/',
    'data_dir_exists' => is_dir(__DIR__ . '/../data/'),
    'data_dir_writable' => is_writable(dirname(__DIR__)),
    'forms_file_exists' => file_exists(__DIR__ . '/../data/forms.json'),
    'announcements_file_exists' => file_exists(__DIR__ . '/../data/announcements.json')
];

$dataDir = __DIR__ . '/../data/';
if (!is_dir($dataDir)) {
    $created = mkdir($dataDir, 0755, true);
    $info['data_dir_created'] = $created;
    $info['data_dir_exists'] = is_dir($dataDir);
}

$testFile = $dataDir . 'test.json';
$testData = ['test' => true, 'timestamp' => date('c')];
$writeResult = file_put_contents($testFile, json_encode($testData));
$info['test_write'] = $writeResult !== false;

if (file_exists($testFile)) {
    unlink($testFile);
}

echo json_encode($info, JSON_PRETTY_PRINT);
?>