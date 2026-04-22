<?php
// api/auth.php
session_start();
header("Content-Type: application/json");
require_once 'db.php';
require_once 'mailer.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($action === 'register') {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["error" => "Email and password are required"]);
            exit;
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $otp = sprintf("%06d", mt_rand(1, 999999));
        
        // Use RETURNING id because PDO::lastInsertId() is unreliable with PostgreSQL
        $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, otp_code, is_verified) VALUES (?, ?, ?, FALSE) RETURNING id");
        try {
            $stmt->execute([$email, $hash, $otp]);
            $row = $stmt->fetch();
            $user_id = $row['id'];
            
            // Send OTP - do not log user in yet
            $sent = send_otp_email($email, $otp);
            
            // Return require_otp=true WITHOUT success=true so frontend shows OTP form
            echo json_encode(["require_otp" => true, "email" => $email, "sent" => $sent]);
        } catch (PDOException $e) {
            http_response_code(500);
            if ($e->getCode() === '23505') {
                echo json_encode(["error" => "An account with this email already exists."]);
            } else {
                echo json_encode(["error" => "Registration failed: " . $e->getMessage()]);
            }
        }
    } 
    elseif ($action === 'login') {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        
        $stmt = $pdo->prepare("SELECT id, email, password_hash, is_verified FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            if (!$user['is_verified']) {
                // Generate a fresh OTP just in case they need a new one
                $otp = sprintf("%06d", mt_rand(1, 999999));
                $pdo->prepare("UPDATE users SET otp_code = ? WHERE id = ?")->execute([$otp, $user['id']]);
                send_otp_email($email, $otp);
                
                echo json_encode(["success" => false, "require_otp" => true, "email" => $user['email'], "error" => "Account not verified. A new OTP has been sent."]);
                exit;
            }
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            echo json_encode(["success" => true, "user" => ["id" => $user['id'], "email" => $user['email']]]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Invalid email or password"]);
        }
    } 
    elseif ($action === 'verify_otp') {
        $email = trim($data['email'] ?? '');
        $otp = trim($data['otp'] ?? '');
        
        $stmt = $pdo->prepare("SELECT id, email, otp_code FROM users WHERE email = ? AND is_verified = FALSE");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && $user['otp_code'] === $otp) {
            $pdo->prepare("UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE id = ?")->execute([$user['id']]);
            
            // Log user in securely bypassing password strictly via internal validation
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['email'];
            
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Invalid or expired OTP."]);
        }
    }
    elseif ($action === 'resend_otp') {
        $email = trim($data['email'] ?? '');
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND is_verified = FALSE");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            $otp = sprintf("%06d", mt_rand(1, 999999));
            $pdo->prepare("UPDATE users SET otp_code = ? WHERE id = ?")->execute([$otp, $user['id']]);
            send_otp_email($email, $otp);
        }
        // Always return success to prevent account enumeration
        echo json_encode(["success" => true]);
    }
    elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(["success" => true]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid action"]);
    }
} else {
    // Return current session info
    if ($action === 'me') {
        if (isset($_SESSION['user_id'])) {
            echo json_encode(["user" => ["id" => $_SESSION['user_id'], "email" => $_SESSION['email']]]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Not authenticated"]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["error" => "Method not allowed"]);
    }
}
