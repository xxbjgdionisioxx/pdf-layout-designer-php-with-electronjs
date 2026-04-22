const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const rootDir = path.join(__dirname, '..');
const electronDir = __dirname;
const outputDir = path.join(electronDir, 'dist-obfuscated');

// Configuration for obfuscation
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    numbersToExpressions: true,
    simplify: true,
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 10,
    unicodeEscapeSequence: false
};

// Ensure output directory exists
if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir);

function obfuscateFile(sourcePath, targetPath) {
    const code = fs.readFileSync(sourcePath, 'utf8');
    const result = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, result.getObfuscatedCode());
}

function copyFile(sourcePath, targetPath) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
}

function processDirectory(srcBase, relativePath, isJSOnly = false) {
    const fullSrcPath = path.join(srcBase, relativePath);
    const items = fs.readdirSync(fullSrcPath);

    items.forEach(item => {
        const itemPath = path.join(relativePath, item);
        const fullItemPath = path.join(srcBase, itemPath);
        const stat = fs.statSync(fullItemPath);

        if (stat.isDirectory()) {
            processDirectory(srcBase, itemPath, isJSOnly);
        } else {
            const ext = path.extname(item);
            const targetPath = path.join(outputDir, itemPath);

            if (ext === '.js') {
                console.log(`Obfuscating: ${itemPath}`);
                obfuscateFile(fullItemPath, targetPath);
            } else if (!isJSOnly) {
                console.log(`Copying: ${itemPath}`);
                copyFile(fullItemPath, targetPath);
            }
        }
    });
}

console.log('--- Starting Obfuscation ---');

// 1. Obfuscate Electron main files
console.log('Processing Electron main files...');
obfuscateFile(path.join(electronDir, 'main.js'), path.join(outputDir, 'electron-main.js'));
obfuscateFile(path.join(electronDir, 'preload.js'), path.join(outputDir, 'preload.js'));

// 2. Process JS folder
console.log('Processing Frontend JS files...');
processDirectory(rootDir, 'js', true);

// 3. Process API and other dependencies
console.log('Copying PHP and assets...');
processDirectory(rootDir, 'api');
copyFile(path.join(rootDir, 'index.php'), path.join(outputDir, 'index.php'));
copyFile(path.join(rootDir, 'login.php'), path.join(outputDir, 'login.php'));
copyFile(path.join(rootDir, 'style.css'), path.join(outputDir, 'style.css'));

// 4. Generate protected PHP config for release
console.log('Generating protected PHP config...');
const dotenv = require('dotenv');
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    const configContent = `<?php
/**
 * AUTO-GENERATED RELEASE CONFIGURATION
 * This file is generated during the build process.
 */
return [
    'DATABASE_URL' => base64_decode('${Buffer.from(envConfig.DATABASE_URL || '').toString('base64')}'),
    'SMTP_HOST'    => base64_decode('${Buffer.from(envConfig.SMTP_HOST || '').toString('base64')}'),
    'SMTP_USER'    => base64_decode('${Buffer.from(envConfig.SMTP_USER || '').toString('base64')}'),
    'SMTP_PASS'    => base64_decode('${Buffer.from(envConfig.SMTP_PASS || '').toString('base64')}'),
    'SMTP_PORT'    => ${envConfig.SMTP_PORT || 587},
];
`;
    fs.writeFileSync(path.join(outputDir, 'api', 'config.php'), configContent);
}

console.log('--- Obfuscation Complete ---');
console.log(`Output directory: ${outputDir}`);
