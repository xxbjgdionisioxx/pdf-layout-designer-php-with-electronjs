<?php
// api/db-schema.php
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

if (!$config || !isset($config['host'], $config['port'], $config['user'], $config['password'], $config['dbname'])) {
    http_response_code(400);
    echo "Bad Request: Missing connection parameters.";
    exit;
}

$host = $config['host'];
$port = $config['port'];
$user = $config['user'];
$pass = $config['password'];
$dbname = $config['dbname'];

try {
    // We only support MySQL for now
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Fetch tables
    $tablesQuery = $pdo->query("SHOW TABLES");
    $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);

    $schema = [
        'tables' => []
    ];

    foreach ($tables as $tableName) {
        // Fetch columns for each table
        $columnsQuery = $pdo->query("SHOW COLUMNS FROM `$tableName`");
        $columnsData = $columnsQuery->fetchAll();

        $columns = [];
        foreach ($columnsData as $col) {
            $columns[] = [
                'name' => $col['Field'],
                'type' => $col['Type']
            ];
        }

        $schema['tables'][] = [
            'name' => $tableName,
            'columns' => $columns
        ];
    }

    // Return the schema
    header('Content-Type: application/json');
    echo json_encode($schema);

} catch (PDOException $e) {
    http_response_code(500);
    echo "Database Error: " . $e->getMessage();
}
