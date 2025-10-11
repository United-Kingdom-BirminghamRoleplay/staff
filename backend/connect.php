<?php
$servername = "localhost";
$username = "ukbrcqzn_admin";
$password = "UKBRUMKaram@12345";
$dbname = "ukbrcqzn_users";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
  die("Database connection failed: " . $conn->connect_error);
}
?>
