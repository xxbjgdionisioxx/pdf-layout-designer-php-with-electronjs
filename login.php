<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <link rel='shortcut icon' type='image/x-icon' href='assets/24x24.png' />
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - PDF Layout Designer</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: var(--bg-color);
            font-family: 'Inter', sans-serif;
        }

        .auth-container {
            width: 100%;
            max-width: 420px;
            background: var(--panel-bg);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 36px 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(16px);
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .auth-logo {
            text-align: center;
            margin-bottom: 28px;
            font-size: 22px;
            font-weight: 700;
            color: var(--text-base);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .auth-logo svg {
            color: var(--primary-color);
        }

        .auth-toggle {
            display: flex;
            background: var(--bg-color);
            border-radius: 8px;
            padding: 4px;
            margin-bottom: 24px;
            border: 1px solid var(--border-color);
        }

        .auth-toggle button {
            flex: 1;
            padding: 9px 16px;
            border: none;
            background: transparent;
            color: var(--text-muted);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }

        .auth-toggle button.active {
            background: var(--primary-color);
            color: white;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-group label {
            display: block;
            margin-bottom: 6px;
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input {
            width: 100%;
            padding: 11px 14px;
            background: var(--bg-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-base);
            font-family: inherit;
            font-size: 14px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .auth-btn {
            width: 100%;
            padding: 13px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
            transition: background 0.2s, transform 0.1s;
            font-family: inherit;
        }

        .auth-btn:hover {
            background: #2563eb;
        }

        .auth-btn:active {
            transform: scale(0.99);
        }

        .auth-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .auth-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            font-size: 13px;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 16px;
            text-align: center;
            display: none;
        }

        .auth-success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
            font-size: 13px;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 16px;
            text-align: center;
            display: none;
        }

        /* ── OTP Page ── */
        .otp-page {
            display: none;
            text-align: center;
        }

        .otp-icon {
            width: 68px;
            height: 68px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .otp-icon svg {
            color: var(--primary-color);
        }

        .otp-page h3 {
            font-size: 19px;
            font-weight: 700;
            color: var(--text-base);
            margin: 0 0 8px;
        }

        .otp-page p {
            font-size: 13px;
            color: var(--text-muted);
            margin: 0 0 24px;
            line-height: 1.6;
        }

        .otp-page p strong {
            color: var(--text-base);
        }

        .otp-input-wrapper {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-bottom: 20px;
        }

        .otp-input-wrapper input {
            width: 48px;
            height: 58px;
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            background: var(--bg-color);
            border: 2px solid var(--border-color);
            border-radius: 10px;
            color: var(--text-base);
            font-family: 'JetBrains Mono', monospace;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .otp-input-wrapper input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .otp-input-wrapper input.filled {
            border-color: var(--primary-color);
            background: rgba(59, 130, 246, 0.05);
        }

        .otp-resend {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 16px;
        }

        .otp-resend a {
            color: var(--primary-color);
            cursor: pointer;
            text-decoration: none;
            font-weight: 600;
        }

        .otp-resend a:hover {
            text-decoration: underline;
        }

        .otp-back {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 14px;
            cursor: pointer;
            transition: color 0.2s;
        }

        .otp-back:hover {
            color: var(--text-base);
        }

        .auth-logo {
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }

        .logo-icon {
            color: #0d6efd;
        }

        .logo-text .fw-semibold {
            letter-spacing: 0.3px;
        }

        .logo-text small {
            display: block;
            font-size: 0.75rem;
            margin-top: -2px;
        }
    </style>
</head>

<body>

    <div class="auth-container">
        <!-- Logo -->
        <div class="auth-logo d-flex align-items-center gap-2">
            <div class="logo-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            </div>

            <div class="logo-text">
                <div class="fw-semibold fs-5">PDF Layout Designer</div>
                <small class="text-muted">by Bryan James Dionisio</small>
            </div>
        </div>

        <!-- Toggle -->
        <div class="auth-toggle" id="auth-toggle">
            <button id="btn-show-login" class="active">Log In</button>
            <button id="btn-show-register">Sign Up</button>
        </div>

        <!-- Messages -->
        <div id="auth-error" class="auth-error"></div>
        <div id="auth-success" class="auth-success"></div>

        <!-- Login / Register Form -->
        <form id="auth-form">
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" required placeholder="you@example.com" autocomplete="email">
            </div>
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" required placeholder="••••••••" autocomplete="current-password">
            </div>
            <button type="submit" class="auth-btn" id="btn-submit">Log In</button>
        </form>

        <!-- OTP Verification View -->
        <div id="otp-page" class="otp-page">
            <div class="otp-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
            </div>
            <h3>Check Your Email</h3>
            <p>We sent a 6-digit verification code to<br><strong id="otp-email-display"></strong></p>

            <div class="otp-input-wrapper">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
                <input type="text" maxlength="1" inputmode="numeric" class="otp-digit">
            </div>

            <button class="auth-btn" id="btn-verify" type="button">Verify &amp; Continue</button>

            <p class="otp-resend">Didn't receive it? <a id="btn-resend">Resend code</a></p>
            <p class="otp-back" id="btn-back-login">← Back to login</p>
        </div>
    </div>

    <script>
        let isLogin = true;
        let pendingEmail = '';

        const btnLogin = document.getElementById('btn-show-login');
        const btnRegister = document.getElementById('btn-show-register');
        const btnSubmit = document.getElementById('btn-submit');
        const btnVerify = document.getElementById('btn-verify');
        const btnResend = document.getElementById('btn-resend');
        const btnBackLogin = document.getElementById('btn-back-login');

        const authForm = document.getElementById('auth-form');
        const otpPage = document.getElementById('otp-page');
        const errBox = document.getElementById('auth-error');
        const successBox = document.getElementById('auth-success');
        const authToggle = document.getElementById('auth-toggle');
        const otpInputs = Array.from(document.querySelectorAll('.otp-digit'));

        function showError(msg) { errBox.textContent = msg; errBox.style.display = 'block'; successBox.style.display = 'none'; }
        function showSuccess(msg) { successBox.textContent = msg; successBox.style.display = 'block'; errBox.style.display = 'none'; }
        function clearMsgs() { errBox.style.display = 'none'; successBox.style.display = 'none'; }

        function showOtpPage(email) {
            pendingEmail = email;
            document.getElementById('otp-email-display').textContent = email;
            authForm.style.display = 'none';
            authToggle.style.display = 'none';
            otpPage.style.display = 'block';
            clearMsgs();
            otpInputs[0].focus();
        }

        function showAuthForm() {
            authForm.style.display = 'block';
            authToggle.style.display = 'flex';
            otpPage.style.display = 'none';
            clearMsgs();
        }

        // Toggle login/register
        btnLogin.addEventListener('click', () => {
            isLogin = true;
            btnLogin.classList.add('active');
            btnRegister.classList.remove('active');
            btnSubmit.textContent = 'Log In';
            clearMsgs();
        });
        btnRegister.addEventListener('click', () => {
            isLogin = false;
            btnRegister.classList.add('active');
            btnLogin.classList.remove('active');
            btnSubmit.textContent = 'Create Account';
            clearMsgs();
        });

        btnBackLogin.addEventListener('click', showAuthForm);

        // OTP digit auto-advance
        otpInputs.forEach((input, i) => {
            input.addEventListener('input', (e) => {
                const val = e.target.value.replace(/\D/g, '');
                e.target.value = val.slice(-1); // keep only last digit
                e.target.classList.toggle('filled', e.target.value !== '');
                if (val && i < 5) otpInputs[i + 1].focus();
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && i > 0) {
                    otpInputs[i - 1].value = '';
                    otpInputs[i - 1].classList.remove('filled');
                    otpInputs[i - 1].focus();
                }
            });
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
                pasted.split('').forEach((ch, idx) => {
                    if (otpInputs[idx]) { otpInputs[idx].value = ch; otpInputs[idx].classList.add('filled'); }
                });
                otpInputs[Math.min(pasted.length, 5)].focus();
            });
        });

        // Auth form submit (login / register)
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            btnSubmit.disabled = true;
            clearMsgs();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const action = isLogin ? 'login' : 'register';

            try {
                const res = await fetch('api/auth.php?action=' + action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                // OTP required — show verification screen (register always, login if unverified)
                if (data.require_otp) {
                    showOtpPage(data.email || email);
                    return;
                }

                if (res.ok && data.success) {
                    window.location.href = 'index.php';
                } else {
                    showError(data.error || 'Authentication failed.');
                }
            } catch (err) {
                showError('Network error. Please try again.');
            } finally {
                btnSubmit.disabled = false;
            }
        });

        // Verify OTP
        btnVerify.addEventListener('click', async () => {
            const otp = otpInputs.map(i => i.value).join('');
            if (otp.length < 6) { showError('Please enter all 6 digits.'); return; }

            btnVerify.disabled = true;
            clearMsgs();

            try {
                const res = await fetch('api/auth.php?action=verify_otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail, otp })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    window.location.href = 'index.php';
                } else {
                    showError(data.error || 'Invalid code. Please try again.');
                    otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
                    otpInputs[0].focus();
                }
            } catch (err) {
                showError('Network error. Please try again.');
            } finally {
                btnVerify.disabled = false;
            }
        });

        // Resend OTP — create a dedicated resend endpoint call
        btnResend.addEventListener('click', async () => {
            btnResend.textContent = 'Sending...';
            clearMsgs();
            try {
                const res = await fetch('api/auth.php?action=resend_otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail })
                });
                const data = await res.json();
                showSuccess('A new verification code has been sent to your email.');
            } catch (err) {
                showError('Failed to resend. Please try again.');
            } finally {
                btnResend.textContent = 'Resend code';
                otpInputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
                otpInputs[0].focus();
            }
        });
    </script>
</body>

</html>