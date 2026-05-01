# PDF Visual Layout Designer ◩

A professional, multi-user **web + desktop** visual designer for creating PHP PDF layouts. Design PDF documents visually using an intuitive drag-and-drop canvas, save projects to the cloud, export production-ready PHP code — all behind a secure, OTP-verified authentication system.

> Also ships as a **standalone Windows desktop app** (Electron + portable PHP 8.3) — no server setup required for end users.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-purple.svg)
![Postgres](https://img.shields.io/badge/database-PostgreSQL-316192.svg)
![Electron](https://img.shields.io/badge/desktop-Electron-47848f.svg)

---

## 📸 Screenshots

![Login Page](images/login.png) 
![OTP Page](images/otp.png)
![New Project Page](images/new-project.png)
![Add Point Marker](images/add-point-marker.png)
![Add Table](images/table-loop-mode.png)
![Add Image](images/add-image.png)
![Export FPDF](images/export-fpdf.png) 
![Export mPDF](images/export-mpdf.png)
![Export database](images/export-db.png)
![Import database](images/import-database.png)
![Database columns](images/database-columns.png)
![Import PHP](images/import-php.png)


---

## ✨ Features

### 🎨 Visual Design Tools

| Tool | Description |
|------|-------------|
| **Select / Transform** | Move and resize any element with precision |
| **Point Tool** | Mark exact coordinates with `$pdf->Cell()` label output |
| **Rectangle Tool** | Draw borders and shapes (`$pdf->Rect()`) |
| **Text / MultiCell** | Add wrapping text blocks with font style & size controls |
| **Line Tool** | Draw dividers and paths (`$pdf->Line()`) |
| **Image Placeholder** | Position image slots for dynamic injection |
| **Table Tool** | Create data grids — supports **static** and **dynamic loop** (`foreach`) mode |
| **Checkbox** | Render boolean tick boxes (`$pdf->Rect()` / `☑`) |
| **Input Box** | Render text fields with underline accents |
| **Button Group** | Click-to-place Radio buttons or Checkboxes. Options with the same Group Name are automatically merged into a single DB column. Exporter uses `if/elseif/else` logic for radios and independent `if` statements for checkboxes using `$pdf->Cell()`. Supports quick duplication via `[+ Add Option (Clone)]`. |

### 🗑️ Workspace Controls
- **Delete All**: Instantly clear all drawn elements from the current page via the Inspector's "Delete All" button.

### ☁️ Cloud Project Management
- **Supabase PostgreSQL** backend — projects saved remotely, not in the browser
- Projects are **user-scoped**: each account only sees their own layouts
- Auto-save on every change (debounced)
- Load, switch, and delete projects from a clean modal browser

### 🔐 Authentication & Security
- **Email + Password** sign-up and login
- **OTP Email Verification** on registration (6-digit code via PHPMailer / Gmail SMTP)
- Sessions managed server-side via PHP `$_SESSION`
- Unverified accounts are blocked from accessing the designer
- Resend OTP and "back to login" recovery flow
- Credentials stored in `.env` — never hardcoded

### 🔁 Dynamic Data Loops (Loop Mode)
Enable **Loop Mode** on any Table element and set a PHP variable (e.g. `$items`) to auto-generate a `foreach` loop in the exported code:

```php
foreach ($items as $item) {
    $pdf->SetXY($tableX, $tableY + ($rowIndex * $rowH));
    // ... cell rendering per column
    $rowIndex++;
}
```

### 🚀 Multi-Library PDF Export
One-click PHP code generation from your entire canvas layout. Switch between 4 PDF libraries in the Export modal:

| Library | Output Type | Best For |
|---------|-------------|----------|
| **FPDF** | Coordinate-based | Lightweight, classic PHP PDF |
| **TCPDF** | Coordinate-based | UTF-8 text, unicode fonts |
| **Dompdf** | HTML + CSS | Familiar HTML templating |
| **mPDF** | HTML + CSS | Rich CSS support, easy layouts |

- Inline PHP comments per element (labels / user guides)
- Supports multi-page layouts
- Copy-to-clipboard with one click

### 📐 Design Aids
- **Rulers** with millimeter markings
- **Snap-to-grid** with configurable spacing (1mm, 2mm, 5mm, 10mm)
- **Margin visualizers** (configurable T/R/B/L)
- **Zoom** in/out/fit/reset controls
- **Full Undo / Redo** history

### 📥 Database Schema Importer
Connect your own database directly within the designer to import table structures.
- **Auto-Fetch Schema:** Instantly retrieve table columns and types.
- **Live Sync:** Drag and drop imported database fields onto your PDF layout.
- **Support for Multiple Dialects:** MySQL, MariaDB, PostgreSQL, and SQLite.

### 🗄️ Database Schema Exporter
Generate `CREATE TABLE` SQL statements instantly from your canvas layout.
- **Auto-syncs live** as you add, rename, or delete elements.
- **Multi-dialect support:** MySQL, MariaDB, PostgreSQL, SQLite, SQL Server.
- Maps element labels directly to `snake_case` database column names.
- Automatically infers SQL data types (Checkboxes → `BOOLEAN`, Text/Images → `VARCHAR(255)`).
- Canvas Table elements generate their own separate relational `CREATE TABLE` definitions.

### 📄 PDF Form Auto-Detection
Upload an existing PDF with AcroForm fields, and the designer will automatically:
- Parse `Widget` annotations via PDF.js.
- Auto-generate `checkbox` and `inputbox` elements on your canvas.
- Map original PDF field names directly to element labels.
- Convert PDF coordinate space to standard millimeter bounds automatically.

### 🔄 Import PHP Code (Reverse Engineering)
Paste your existing FPDF or TCPDF code, and the designer will automatically map it back to the canvas:
- Parses absolute coordinates (`SetXY`, `Cell`, `MultiCell`, `Rect`, `Line`, `Image`).
- Instantly reconstructs your visual canvas based on coordinate commands.
- Automatically generates the corresponding UI elements in the Elements panel.

### 🖼️ PDF & Image Background Templates
Upload both `.pdf` and image files (`.jpg`, `.jpeg`, `.png`) to act as your background canvas:
- Automatically scales the page canvas to the uploaded file's native resolution.
- Allows perfect tracing and alignment of forms using a visual reference.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES6+), HTML5 Canvas |
| Styling | Vanilla CSS — Dark Theme, Glassmorphism |
| Backend | PHP 8.0+ |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| Email | [PHPMailer](https://github.com/PHPMailer/PHPMailer) + Gmail SMTP |
| PDF Preview | [PDF.js](https://mozilla.github.io/pdf.js/) (template background) |
| Desktop | [Electron](https://www.electronjs.org/) + portable PHP 8.3 |
| Config | [phpdotenv](https://github.com/vlucas/phpdotenv) for environment variables |

---

## 🚀 Getting Started (Web / Browser)

### Prerequisites
- **PHP 8.0+** with the `pdo_pgsql` extension enabled
- **Composer** (for PHP dependencies)
- A **Supabase** project (free tier works)
- A **Gmail account** with an [App Password](https://support.google.com/accounts/answer/185833) for SMTP
- A PHP-capable local server — [Laragon](https://laragon.org), XAMPP, or WAMP

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xxbjgdionisioxx/pdf-layout-designer.git
   cd pdf-layout-designer
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Set up your environment file**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/database"

   SMTP_HOST="smtp.gmail.com"
   SMTP_USER="your@gmail.com"
   SMTP_PASS="your-app-password"
   SMTP_PORT=587
   ```
   > **Supabase tip:** Use the **Transaction Pooler** URL from your Supabase project settings (IPv4-compatible) if your host doesn't support IPv6.

4. **Enable `pdo_pgsql`** in your `php.ini`:
   ```ini
   extension=pdo_pgsql
   ```
   Then restart your PHP server.

5. **Open the app** in your browser:
   ```
   http://localhost/pdf-layout-designer/login.php
   ```
   Register an account, verify your email with the OTP, and start designing!

---

## 📖 Usage Guide

1. **Sign Up** at `/login.php` — verify your email with the 6-digit OTP sent to your inbox.
2. **Upload a Template** *(optional)* — use the **Upload** button to load a PDF as a background guide.
3. **Design your Layout** — pick tools from the toolbar and draw elements on the canvas.
4. **Refine in the Inspector** — select any element to adjust coordinates, size, labels, and loop settings.
5. **Projects are auto-saved** to the cloud. Use **Projects** to switch between layouts.
6. **Export** — click **Export** to generate and copy your PHP PDF code.

---

## 🗄️ Database Schema

The app automatically creates these tables on first run:

```sql
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified   BOOLEAN DEFAULT FALSE,
    otp_code      VARCHAR(10),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
    id         VARCHAR(100) PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255),
    appname    VARCHAR(100),
    updatedat  TIMESTAMPTZ DEFAULT NOW(),
    data       JSONB
);
```

---

## 🌐 Deployment (Web)

> Vercel and Netlify do **not** support PHP. Use one of the following instead:

| Platform | Notes |
|----------|-------|
| **Railway** | Easiest — push to GitHub, auto-deploys PHP |
| **Render** | Free tier (cold starts); set start command to `php -S 0.0.0.0:$PORT` |
| **Shared cPanel hosting** | Upload files, run `composer install` via SSH |
| **DigitalOcean / VPS** | Full control with Apache or Nginx + PHP-FPM |

Set your `.env` variables in the platform's environment settings instead of committing the file.

---

## 🖥️ Desktop App (Windows — Electron)

You can ship this app as a **standalone Windows `.exe` installer** — no Laragon, no XAMPP, no browser tab needed.

### How it works
The Electron wrapper bundles a **portable PHP 8.3** binary and spawns a local server at `127.0.0.1:54321` on launch. The app window loads from that local server, so everything works exactly as it does in the browser — including cloud login, Supabase sync, and PHPMailer OTP.

### Build the installer

> **Prerequisite:** [Node.js](https://nodejs.org) must be installed.

1. Open PowerShell or Command Prompt in the project root.
2. Run the build script:
   ```bat
   build-electron.bat
   ```
   The script will automatically:
   - Download **portable PHP 8.3** (~30 MB) into `php/`
   - Enable `pdo_pgsql`, `openssl`, `mbstring`, and `curl` extensions
   - Install Electron and `electron-builder` dependencies
   - Run `composer install` for PHPMailer
   - Build a Windows NSIS installer into `dist/`

3. Find your installer at:
   ```
   dist\PDF Layout Designer Setup 2.1.0.exe
   ```

### Test without building
```bat
cd electron
npm install
npm start
```

---

## 📁 Project Structure

```
pdf-layout-designer/
├── api/                    # PHP backend endpoints
│   ├── auth.php            # Login, register, OTP, session
│   ├── db.php              # PDO database connection (reads .env)
│   ├── loader.php          # phpdotenv bootstrap
│   ├── mailer.php          # PHPMailer SMTP config (reads .env)
│   └── projects.php        # CRUD for user projects
├── electron/               # Electron desktop wrapper
│   ├── assets/             # App icons
│   ├── build/              # Electron-builder resources
│   ├── main.js             # Main process (spawns PHP server)
│   ├── preload.js          # Preload script
│   ├── obfuscate.js        # Pre-build JS obfuscation
│   └── package.json        # Electron dependencies & build config
├── js/                     # Frontend JavaScript (canvas, tools, UI)
├── vendor/                 # Composer dependencies (git-ignored)
├── index.php               # Main designer page
├── login.php               # Auth page (login / register / OTP)
├── style.css               # Global styles (dark theme + glassmorphism)
├── composer.json           # PHP dependencies
├── build-electron.bat      # One-click Windows desktop build script
├── .env.example            # Environment variable template
└── .env                    # Your local credentials (git-ignored)
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

Please make sure `.env` credentials are **never committed**. Use `.env.example` to document new variables.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by **Bryan James Dionisio** for the PHP community.
