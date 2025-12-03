<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$file = $_GET['file'] ?? '';

if (empty($file)) {
    http_response_code(400);
    echo 'No file specified';
    exit;
}

// Security: Only allow files from uploads directory
$uploadsDir = '../uploads/';
$filePath = $uploadsDir . basename($file);

if (!file_exists($filePath)) {
    http_response_code(404);
    echo 'File not found';
    exit;
}

// Check if it's a PDF
$fileInfo = pathinfo($filePath);
if (strtolower($fileInfo['extension']) !== 'pdf') {
    http_response_code(400);
    echo 'Not a PDF file';
    exit;
}

// Set proper headers for PDF
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . basename($file) . '"');
header('Content-Length: ' . filesize($filePath));

// Output the PDF
readfile($filePath);
?>