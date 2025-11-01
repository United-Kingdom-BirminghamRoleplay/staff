<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$slideshowDir = __DIR__ . '/../images/slideshow/';
$images = [];

if (is_dir($slideshowDir)) {
    $files = scandir($slideshowDir);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..' && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) {
            $images[] = $file;
        }
    }
}

echo json_encode($images);
?>