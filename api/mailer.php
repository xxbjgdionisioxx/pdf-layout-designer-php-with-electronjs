<?php
require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/loader.php';

/**
 * Send an OTP verification email using PHPMailer.
 */
function send_otp_email($to_email, $otp_code)
{
    $config = load_config();
    $smtp_host = $config['SMTP_HOST'] ?? '';
    $smtp_user = $config['SMTP_USER'] ?? '';
    $smtp_pass = $config['SMTP_PASS'] ?? '';
    $smtp_port = $config['SMTP_PORT'] ?? 587;

    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_user;
        $mail->Password   = $smtp_pass;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $smtp_port;

        $mail->setFrom($smtp_user, 'FPDF Designer Admin');
        $mail->addAddress($to_email);

        $mail->isHTML(true);
        $mail->Subject = 'Your FPDF Designer Verification Code';
        $mail->Body    = "
            <html>
            <body style='font-family: sans-serif; line-height: 1.6; color: #333;'>
                <h2>Verify Your Account</h2>
                <p>Welcome to FPDF Layout Designer!</p>
                <p>Your one-time verification code is: <strong style='font-size: 24px; color: #2563eb;'>{$otp_code}</strong></p>
                <p>Enter this code on the application to verify your account.</p>
            </body>
            </html>
        ";
        $mail->AltBody = "Your verification code is: {$otp_code}";

        $mail->send();
        return true;
    } catch (Exception $e) {
        // Fallback log or standard false return
        return false;
    }
}