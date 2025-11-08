<?php
header('Content-Type: application/javascript');
header('Access-Control-Allow-Origin: *');

// Include the Firebase config from backend
$config = file_get_contents('../backend/firebase-config.js');

// Convert ES6 module to v8 format
$config = str_replace('import { initializeApp } from "firebase/app";', '', $config);
$config = str_replace('import { getFirestore } from "firebase/firestore";', '', $config);
$config = str_replace('const app = initializeApp(firebaseConfig);', 'firebase.initializeApp(firebaseConfig);', $config);
$config = str_replace('const db = getFirestore(app);', 'window.db = firebase.firestore();', $config);
$config = str_replace('export { db };', '', $config);

echo $config;
?>