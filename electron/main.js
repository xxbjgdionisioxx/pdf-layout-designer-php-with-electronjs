// ============================================================
// FPDF Layout Designer — Electron Main Process
// Spawns a local PHP server and opens the app in a BrowserWindow
// ============================================================

const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const os = require('os');

let phpProcess = null;
let mainWindow = null;
const PORT = 54321;

// ─── Resolve paths ───
// In development: go one level up from electron/
// In production (packaged): resources/app/
function getAppRoot() {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'app');
    }
    return path.join(__dirname, '..');
}

function getPhpBin() {
    // In packaged production build, always use the bundled portable PHP
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'php', 'php.exe');
    }

    // In development: try bundled php/ first, then fall back to system PHP (Laragon, XAMPP, etc.)
    const bundledPhp = path.join(__dirname, '..', 'php', 'php.exe');
    const fs = require('fs');
    if (fs.existsSync(bundledPhp)) {
        return bundledPhp;
    }

    // Fall back to PHP on system PATH (works with Laragon, XAMPP, WSL, etc.)
    return 'php';
}

// ─── Start PHP built-in server ───
function startPhpServer() {
    return new Promise((resolve, reject) => {
        const phpBin  = getPhpBin();
        const appRoot = getAppRoot();

        console.log(`[PHP] Binary: ${phpBin}`);
        console.log(`[PHP] App root: ${appRoot}`);
        console.log(`[PHP] Starting server on 127.0.0.1:${PORT}`);

        phpProcess = spawn(phpBin, ['-S', `127.0.0.1:${PORT}`, '-t', appRoot], {
            cwd: appRoot,
            windowsHide: true,
        });

        phpProcess.stdout.on('data', (data) => console.log(`[PHP stdout] ${data}`));
        phpProcess.stderr.on('data', (data) => console.log(`[PHP] ${data}`));

        phpProcess.on('error', (err) => {
            console.error('[PHP] Failed to spawn process:', err.message);
            reject(new Error(
                `Could not start PHP.\n\nBinary tried: "${phpBin}"\nError: ${err.message}\n\n` +
                `Make sure PHP is installed and available on your PATH.`
            ));
        });

        // Poll until the server is accepting connections (up to ~15 seconds)
        let attempts = 0;
        const poll = setInterval(() => {
            attempts++;
            const req = http.get(`http://127.0.0.1:${PORT}/`, (res) => {
                clearInterval(poll);
                console.log(`[PHP] Server ready after ${attempts} attempt(s)`);
                resolve();
            });
            req.on('error', () => {
                if (attempts > 50) {
                    clearInterval(poll);
                    reject(new Error(
                        `PHP server did not respond after ${attempts} attempts.\n\n` +
                        `Binary: "${phpBin}"\nPort: ${PORT}\nApp root: "${appRoot}"`
                    ));
                }
            });
            req.end();
        }, 300);
    });
}

// ─── Create the app window ───
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: 'PDF Layout Designer',
        icon: path.join(__dirname, 'build/icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#1a1a2e',
        show: false,
    });

    mainWindow.loadURL(`http://127.0.0.1:${PORT}/login.php`);

    // Open external links in system browser, not inside the app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ─── App lifecycle ───
app.whenReady().then(async () => {
    try {
        Menu.setApplicationMenu(null);
        await startPhpServer();
        createWindow();
    } catch (err) {
        dialog.showErrorBox(
            'PDF Layout Designer — Startup Error',
            `Failed to start the PHP server.\n\n${err.message}\n\nMake sure the app is installed correctly.`
        );
        app.quit();
    }
});

app.on('window-all-closed', () => {
    // Kill PHP server when the app window closes
    if (phpProcess) {
        phpProcess.kill();
        phpProcess = null;
    }
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
    if (phpProcess) {
        phpProcess.kill();
        phpProcess = null;
    }
});
