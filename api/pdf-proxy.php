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

// Get file from database instead of filesystem
try {
    require_once '../backend/connect.php';
    
    $stmt = $conn->prepare("SELECT name, fileData FROM files WHERE name = ? AND status = 'approved'");
    $stmt->bind_param("s", $file);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo 'File not found';
        exit;
    }
    
    $fileData = $result->fetch_assoc();
    $base64Data = $fileData['fileData'];
    
    // Extract base64 content (remove data:application/pdf;base64, prefix)
    if (strpos($base64Data, 'data:') === 0) {
        $base64Data = substr($base64Data, strpos($base64Data, ',') + 1);
    }
    
    $pdfContent = base64_decode($base64Data);
    
    if ($pdfContent === false) {
        http_response_code(400);
        echo 'Invalid file data';
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo 'Database error';
    exit;
}

// Check if it's a PDF
$fileInfo = pathinfo($file);
if (strtolower($fileInfo['extension']) !== 'pdf') {
    http_response_code(400);
    echo 'Not a PDF file';
    exit;
}

// Set proper headers for PDF
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="' . basename($file) . '"');
header('Content-Length: ' . strlen($pdfContent));

// Output the PDF
echo $pdfContent;
?>