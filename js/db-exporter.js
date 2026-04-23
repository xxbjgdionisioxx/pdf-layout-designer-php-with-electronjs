// ============================================================
// PDF Layout Designer — DB Schema Exporter
// Generates CREATE TABLE SQL from canvas element labels
// Supports: MySQL, PostgreSQL, SQLite, SQL Server, MariaDB
// ============================================================

import { state } from './state.js';
import { showToast } from './cursor.js';

// ─── Helpers ───────────────────────────────────────────────

/**
 * Convert any string to a safe snake_case identifier.
 * e.g. "Patient Name" → "patient_name", "DOB:" → "dob"
 */
function slugify(str) {
    return (str || 'field')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        || 'field';
}

/** Ensure unique column names by appending _N suffixes. */
function uniqueify(names) {
    const seen = {};
    return names.map(n => {
        seen[n] = (seen[n] || 0) + 1;
        return seen[n] > 1 ? `${n}_${seen[n]}` : n;
    });
}

// ─── Dialect definitions ────────────────────────────────────

const DIALECTS = {
    mysql: {
        label: 'MySQL',
        quote: '`',
        pk: '`id` INT AUTO_INCREMENT PRIMARY KEY',
        ts: '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        ifNotExists: 'IF NOT EXISTS',
        terminator: ';',
        mapType: t => t,
    },
    mariadb: {
        label: 'MariaDB',
        quote: '`',
        pk: '`id` INT AUTO_INCREMENT PRIMARY KEY',
        ts: '`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        ifNotExists: 'IF NOT EXISTS',
        terminator: ';',
        mapType: t => t,
    },
    postgres: {
        label: 'PostgreSQL',
        quote: '"',
        pk: '"id" SERIAL PRIMARY KEY',
        ts: '"created_at" TIMESTAMPTZ DEFAULT NOW()',
        ifNotExists: 'IF NOT EXISTS',
        terminator: ';',
        mapType: t => {
            // PostgreSQL type adjustments
            if (t === 'INT AUTO_INCREMENT') return 'SERIAL';
            if (t === 'BOOLEAN') return 'BOOLEAN';
            if (/^VARCHAR/i.test(t)) return t;
            if (t === 'TEXT') return 'TEXT';
            if (t === 'INT') return 'INTEGER';
            if (t === 'DECIMAL') return 'NUMERIC';
            return t;
        },
    },
    sqlite: {
        label: 'SQLite',
        quote: '"',
        pk: '"id" INTEGER PRIMARY KEY AUTOINCREMENT',
        ts: '"created_at" TEXT DEFAULT (datetime(\'now\'))',
        ifNotExists: 'IF NOT EXISTS',
        terminator: ';',
        mapType: t => {
            // SQLite type affinity
            if (t === 'BOOLEAN') return 'INTEGER';
            if (/^VARCHAR/i.test(t)) return 'TEXT';
            if (t === 'DECIMAL') return 'REAL';
            if (t === 'DATE') return 'TEXT';
            return t;
        },
    },
    sqlserver: {
        label: 'SQL Server',
        quote: '[',
        quoteClose: ']',
        pk: '[id] INT IDENTITY(1,1) PRIMARY KEY',
        ts: '[created_at] DATETIME DEFAULT GETDATE()',
        ifNotExists: '', // SQL Server doesn't support IF NOT EXISTS directly — wrapped in a comment
        terminator: ';',
        mapType: t => {
            if (t === 'BOOLEAN') return 'BIT';
            if (/^VARCHAR/i.test(t)) return t;
            if (t === 'TEXT') return 'NVARCHAR(MAX)';
            if (t === 'DATE') return 'DATE';
            if (t === 'DECIMAL') return 'DECIMAL(18,2)';
            return t;
        },
    },
};

// ─── Column descriptor extraction ─────────────────────────

/**
 * Derive a default SQL type from the element type.
 * This mirrors what the PHP exporter outputs:
 *   - image label  → the filename/variable → VARCHAR(255)
 *   - point label  → the Cell() value      → VARCHAR(255)
 *   - text content → static label          → VARCHAR(255)
 *   - rect label   → user guide / name     → VARCHAR(255)
 *   - inputbox     → text input field      → VARCHAR(255)
 *   - checkbox     → boolean flag          → BOOLEAN
 *   - table        → → separate CREATE TABLE
 */
function defaultSqlType(elType) {
    switch (elType) {
        case 'checkbox': return 'BOOLEAN';
        default:         return 'VARCHAR(255)';
    }
}

/**
 * Human-readable type annotation for the SQL comment.
 */
function elementTypeLabel(el) {
    const labels = {
        point:    'point / Cell()',
        image:    'image / Image()',
        rect:     'rect / Rect()',
        text:     'text / MultiCell()',
        inputbox: 'input field',
        checkbox: 'checkbox / boolean',
        line:     'line',
        table:    'table',
    };
    return labels[el.type] || el.type;
}

/**
 * Gather column descriptors from all canvas elements across all pages.
 *
 * Every element that has a label becomes a DB column. The column name is
 * derived from the label — exactly the same string that appears in the
 * exported PHP code, e.g.:
 *
 *   $pdf->Image('bday', 110, 170, 75, 25);  →  column: bday  VARCHAR(255)
 *   $pdf->Cell(0, 10, '$patient_name');      →  column: patient_name  VARCHAR(255)
 *   (checkbox "is_insured")                  →  column: is_insured  BOOLEAN
 *
 * Table elements get their own CREATE TABLE statement.
 */
function gatherColumns(dialect) {
    const flatCols = [];   // columns for the main form_data table
    const tableDefs = [];  // one CREATE TABLE per canvas Table element

    for (const [pageNum, elements] of state.elements) {
        for (const el of elements) {
            // Determine the raw label — prefer explicit dbColumn, then el.label (image/point/rect/checkbox/inputbox),
            // then el.content (text elements — their "name" is the text content they display)
            const rawLabel = (el.dbColumn || el.label || (el.type === 'text' ? el.content : '') || '').trim();

            // ── Table elements → separate CREATE TABLE ──────────────────
            if (el.type === 'table') {
                if (!rawLabel) continue; // skip unlabeled tables
                const tableName = slugify(rawLabel);
                const numCols = el.cols || 3;
                const colHeaders = el.colHeaders && el.colHeaders.length === numCols
                    ? el.colHeaders
                    : null;
                const cols = Array.from({ length: numCols }, (_, i) => ({
                    colName: colHeaders ? (slugify(colHeaders[i]) || `col_${i + 1}`) : `col_${i + 1}`,
                    sqlType: el.dbType || 'VARCHAR(255)',
                    comment: colHeaders ? colHeaders[i] : '',
                }));
                tableDefs.push({ tableName, cols });
                continue;
            }

            // ── Lines have no meaningful DB column ─────────────────────
            if (el.type === 'line') continue;

            // ── All other labeled elements → flat column ────────────────
            if (!rawLabel) continue;

            // Strip leading $ from PHP variable names (e.g. '$patient_name' → 'patient_name')
            const cleanLabel = rawLabel.replace(/^\$/, '');
            const colName  = slugify(cleanLabel);
            const sqlType  = el.dbType || defaultSqlType(el.type);
            const comment  = `${elementTypeLabel(el)} — label: ${rawLabel}`;

            flatCols.push({ colName, sqlType, comment });
        }
    }

    return { flatCols, tableDefs };
}


// ─── SQL Generation ─────────────────────────────────────────

function quoteIdent(d, name) {
    const open = d.quote;
    const close = d.quoteClose || d.quote;
    return `${open}${name}${close}`;
}

function buildCreateTable(d, tableName, cols, opts = {}) {
    const q = n => quoteIdent(d, n);
    const mapType = d.mapType || (t => t);
    const ine = d.ifNotExists ? `${d.ifNotExists} ` : '';

    const isSqlServer = tableName && d.label === 'SQL Server';
    let sql = '';

    if (isSqlServer) {
        sql += `-- SQL Server: wrap in existence check\n`;
        sql += `IF OBJECT_ID(N'dbo.${tableName}', N'U') IS NULL\nBEGIN\n`;
    }

    sql += `CREATE TABLE ${ine}${q(tableName)} (\n`;

    const lines = [];
    // Primary key
    lines.push(`    ${d.pk}`);

    // Columns
    const uniqueColNames = uniqueify(cols.map(c => c.colName));
    cols.forEach((col, i) => {
        const resolvedName = uniqueColNames[i];
        const resolvedType = mapType(col.sqlType);
        const comment = col.comment ? ` -- ${col.comment}` : '';
        lines.push(`    ${q(resolvedName)} ${resolvedType}${comment}`);
    });

    // Timestamps
    if (opts.includeTimestamps) {
        lines.push(`    ${d.ts}`);
    }

    sql += lines.join(',\n');
    sql += `\n)${d.terminator}`;

    if (isSqlServer) {
        sql += `\nEND`;
    }

    return sql;
}

function generateSQL(engine, tableName, includeTimestamps) {
    const d = DIALECTS[engine] || DIALECTS.mysql;
    const { flatCols, tableDefs } = gatherColumns(d);

    const parts = [];
    parts.push(`-- Generated by PDF Layout Designer`);
    parts.push(`-- Engine: ${d.label}  |  ${new Date().toISOString().slice(0, 10)}`);
    parts.push('');

    // Main flat table (form fields)
    if (flatCols.length > 0) {
        parts.push(`-- Main form data table`);
        parts.push(buildCreateTable(d, tableName || 'form_data', flatCols, { includeTimestamps }));
    } else if (tableDefs.length === 0) {
        parts.push(`-- No labeled elements found on the canvas.\n-- Give any element a Label in the Inspector to generate a DB column.\n-- Example: an Image labeled 'bday' → \`bday\` VARCHAR(255)`);
    }

    // Additional per-table CREATE TABLE statements
    for (const { tableName: tName, cols } of tableDefs) {
        parts.push('');
        parts.push(`-- Table element: ${tName}`);
        parts.push(buildCreateTable(d, tName, cols, { includeTimestamps: false }));
    }

    return parts.join('\n');
}

// ─── Exporter class ─────────────────────────────────────────

class DbExporter {
    constructor() {
        this.engine = 'mysql';
        this.tableName = 'form_data';
        this.includeTimestamps = true;
    }

    init() {
        const btn = document.getElementById('btn-db-export');
        if (btn) btn.addEventListener('click', () => this.show());

        const copyBtn = document.getElementById('btn-copy-db-code');
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyCode());

        const engineSel = document.getElementById('db-engine-select');
        if (engineSel) {
            engineSel.addEventListener('change', e => {
                this.engine = e.target.value;
                this.refresh();
            });
        }

        const tableInput = document.getElementById('db-table-name');
        if (tableInput) {
            tableInput.addEventListener('input', e => {
                this.tableName = slugify(e.target.value) || 'form_data';
                this.refresh();
            });
        }

        const tsCheck = document.getElementById('db-include-timestamps');
        if (tsCheck) {
            tsCheck.addEventListener('change', e => {
                this.includeTimestamps = e.target.checked;
                this.refresh();
            });
        }

        // Auto-update the SQL preview whenever any element is added, renamed, or deleted.
        // Only re-renders if the modal is currently open (no-op if hidden).
        state.on('elementsChanged', () => this.refreshIfOpen());
        state.on('pageChanged',     () => this.refreshIfOpen());
    }

    /** Regenerate SQL and update the code block. */
    refresh() {
        const codeEl = document.getElementById('db-export-code');
        if (codeEl) {
            codeEl.textContent = generateSQL(this.engine, this.tableName, this.includeTimestamps);
        }
    }

    /** Only refresh if the modal is currently visible — avoids wasted work. */
    refreshIfOpen() {
        const modal = document.getElementById('modal-db-export');
        if (modal && modal.style.display !== 'none') {
            this.refresh();
        }
    }

    show() {
        const modal = document.getElementById('modal-db-export');
        if (!modal) return;
        this.refresh(); // Always regenerate fresh SQL on open
        modal.style.display = 'flex';
    }

    async copyCode() {
        const code = document.getElementById('db-export-code')?.textContent;
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            showToast('SQL copied to clipboard!', 'success');
        } catch {
            showToast('Failed to copy SQL', 'error');
        }
    }
}


export const dbExporter = new DbExporter();
