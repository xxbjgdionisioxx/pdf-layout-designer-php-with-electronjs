<?php
// api/db-config.php
session_start();
header("Content-Type: application/json");
require_once 'db.php';

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // We expect the whole config object to be saved
    $config = json_encode($data);
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET db_config = ? WHERE id = ?");
        $stmt->execute([$config, $user_id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save configuration: " . $e->getMessage()]);
    }
} else if ($method === 'GET') {
    try {
        $stmt = $pdo->prepare("SELECT db_config FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        
        $config = $row['db_config'] ? json_decode($row['db_config'], true) : null;
        echo json_encode(["config" => $config]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to retrieve configuration: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
