<?php
// api/db-schema.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/loader.php';

// Ensure this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Method Not Allowed";
    exit;
}

// Ensure the user is authenticated
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo "Unauthorized";
    exit;
}

// Get the JSON payload
$json = file_get_contents('php://input');
$config = json_decode($json, true);

if (!$config || !isset($config['driver'], $config['dbname'])) {
    http_response_code(400);
    echo "Bad Request: Missing connection parameters.";
    exit;
}

$driver = $config['driver'];
$host = $config['host'] ?? '';
$port = $config['port'] ?? '';
$user = $config['user'] ?? '';
$pass = $config['password'] ?? '';
$dbname = $config['dbname'];

try {
    $dsn = "";
    if ($driver === 'mysql') {
        $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    } elseif ($driver === 'pgsql') {
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
    } elseif ($driver === 'sqlite') {
        $dsn = "sqlite:$dbname";
    } else {
        throw new Exception("Unsupported driver: $driver");
    }

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5, // 5 second timeout
    ];
    
    // MySQL specific timeout
    if ($driver === 'mysql') {
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES utf8mb4";
        $options[PDO::ATTR_TIMEOUT] = 5;
    }

    $pdo = new PDO($dsn, $user, $pass, $options);

    $schema = ['tables' => []];

    if ($driver === 'mysql' || $driver === 'mariadb') {
        $tablesQuery = $pdo->query("SHOW TABLES");
        $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as $tableName) {
            $columnsQuery = $pdo->query("SHOW COLUMNS FROM `$tableName`");
            $columnsData = $columnsQuery->fetchAll();
            $columns = [];
            foreach ($columnsData as $col) {
                $columns[] = ['name' => $col['Field'], 'type' => $col['Type']];
            }
            $schema['tables'][] = ['name' => $tableName, 'columns' => $columns];
        }
    } elseif ($driver === 'pgsql') {
        $tablesQuery = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as $tableName) {
            $stmt = $pdo->prepare("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ?");
            $stmt->execute([$tableName]);
            $columnsData = $stmt->fetchAll();
            $columns = [];
            foreach ($columnsData as $col) {
                $columns[] = ['name' => $col['column_name'], 'type' => $col['data_type']];
            }
            $schema['tables'][] = ['name' => $tableName, 'columns' => $columns];
        }
    } elseif ($driver === 'sqlite') {
        $tablesQuery = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

        foreach ($tables as $tableName) {
            $columnsQuery = $pdo->query("PRAGMA table_info(`$tableName`)");
            $columnsData = $columnsQuery->fetchAll();
            $columns = [];
            foreach ($columnsData as $col) {
                $columns[] = ['name' => $col['name'], 'type' => $col['type']];
            }
            $schema['tables'][] = ['name' => $tableName, 'columns' => $columns];
        }
    }

    header('Content-Type: application/json');
    echo json_encode($schema);

} catch (Exception $e) {
    http_response_code(500);
    echo "Database Error: " . $e->getMessage();
}
