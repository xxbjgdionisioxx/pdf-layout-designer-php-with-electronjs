<?php
require_once __DIR__ . '/loader.php';

$config = load_config();
$dbUrl = $config['DATABASE_URL'] ?? '';

if (empty($dbUrl)) {
    http_response_code(500);
    echo json_encode(["error" => "Database configuration missing."]);
    exit;
}

// Parse URL
$dbOpts = parse_url($dbUrl);

$host = $dbOpts["host"];
$port = $dbOpts["port"];
$user = $dbOpts["user"];
$pass = $dbOpts["pass"];
$dbname = ltrim($dbOpts["path"], '/');

$dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Setup isolated architecture 
    // WARNING: This will drop the existing projects table first
    $pdo->exec("
        
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_verified BOOLEAN DEFAULT FALSE,
            otp_code VARCHAR(10),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);

        CREATE TABLE IF NOT EXISTS projects (
            id VARCHAR(100) PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255),
            appname VARCHAR(100),
            updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            data JSONB
        );
    ");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit;
}
