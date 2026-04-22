<?php
// api/loader.php

function load_config() {
    $config_file = __DIR__ . '/config.php';
    
    // If a compiled/obfuscated config exists, use it
    if (file_exists($config_file)) {
        return include $config_file;
    }
    
    // Fallback to .env for development
    require_once __DIR__ . '/../vendor/autoload.php';
    try {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
        $dotenv->safeLoad();
    } catch (Exception $e) {
        // Dotenv might not be available in some environments
    }
    
    return [
        'DATABASE_URL' => $_ENV['DATABASE_URL'] ?? '',
        'SMTP_HOST'    => $_ENV['SMTP_HOST'] ?? '',
        'SMTP_USER'    => $_ENV['SMTP_USER'] ?? '',
        'SMTP_PASS'    => $_ENV['SMTP_PASS'] ?? '',
        'SMTP_PORT'    => $_ENV['SMTP_PORT'] ?? 587,
    ];
}
