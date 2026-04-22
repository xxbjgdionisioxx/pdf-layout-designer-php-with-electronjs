<?php
// api/projects.php
session_start();
header("Content-Type: application/json");
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get single project ONLY for this user
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$_GET['id'], $user_id]);
        $project = $stmt->fetch();
        
        if ($project) {
            $data = json_decode($project['data'], true);
            echo json_encode($data);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Project not found"]);
        }
    } else {
        // List projects for this user
        $stmt = $pdo->prepare("SELECT id, name, appname, updatedat FROM projects WHERE user_id = ? ORDER BY updatedat DESC");
        $stmt->execute([$user_id]);
        $projects = $stmt->fetchAll();
        
        $result = array_map(function($p) {
            return [
                "id" => $p['id'],
                "name" => $p['name'],
                "appName" => $p['appname'],
                "updatedAt" => $p['updatedat']
            ];
        }, $projects);
        
        echo json_encode($result);
    }
} elseif ($method === 'POST') {
    // Save project strictly matching user_id
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }
    
    $id = $data['id'];
    $name = $data['name'] ?? 'Untitled Project';
    $appName = $data['appName'] ?? 'FPDF Layout Designer';
    $updatedAt = $data['updatedAt'] ?? date('Y-m-d H:i:s');
    
    $stmt = $pdo->prepare("
        INSERT INTO projects (id, user_id, name, appname, updatedat, data)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name,
            appname = EXCLUDED.appname,
            updatedat = EXCLUDED.updatedat,
            data = EXCLUDED.data
    ");
    
    try {
        $stmt->execute([$id, $user_id, $name, $appName, $updatedAt, $input]);
        echo json_encode(["success" => true]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save: " . $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    // Delete project ONLY if owned by user
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id = $_GET['id'] ?? ($data['id'] ?? null);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "Missing ID"]);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user_id]);
    echo json_encode(["success" => true]);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
