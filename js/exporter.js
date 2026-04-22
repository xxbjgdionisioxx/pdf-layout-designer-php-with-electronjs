// ============================================================
// FPDF Visual Layout Designer — Multi-Library Code Exporter
// Supports: FPDF, TCPDF, Dompdf, mPDF
// ============================================================

import { state } from './state.js';
import { showToast } from './cursor.js';

// ─────────────────────────────────────────────
// Shared helpers used by all generators
// ─────────────────────────────────────────────
class BaseGenerator {
    getOrientation() {
        return state.pageWidth > state.pageHeight ? 'L' : 'P';
    }

    getPageFormat() {
        if ((state.pageWidth === 210 && state.pageHeight === 297) ||
            (state.pageWidth === 297 && state.pageHeight === 210)) return 'A4';
        if ((state.pageWidth === 215.9 && state.pageHeight === 279.4) ||
            (state.pageWidth === 279.4 && state.pageHeight === 215.9)) return 'Letter';
        return null; // custom — subclasses handle array vs string
    }

    getPages() {
        const pages = new Map();
        for (const [pageNum, elements] of state.elements) {
            if (elements.length > 0) pages.set(pageNum, elements);
        }
        return pages;
    }

    getSortedPages() {
        return [...this.getPages().keys()].sort((a, b) => a - b);
    }

    esc(str) {
        return (str || '').replace(/'/g, "\\'");
    }
}

// ─────────────────────────────────────────────
// FPDF Generator
// ─────────────────────────────────────────────
class FpdfGenerator extends BaseGenerator {
    generate() {
        const orient = this.getOrientation();
        const fmt = this.getPageFormat() || `array(${state.pageWidth}, ${state.pageHeight})`;
        let code = `<?php\nrequire('fpdf.php');\n\n`;
        code += `$pdf = new FPDF('${orient}', 'mm', '${fmt}');\n`;
        code += `$pdf->SetAutoPageBreak(false);\n\n`;
        code += this.buildPages();
        code += `$pdf->Output('F', 'output.pdf');\n`;
        return code;
    }

    buildPages() {
        const pages = this.getPages();
        let code = '';
        if (pages.size === 0) return `$pdf->AddPage();\n\n`;
        for (const pageNum of this.getSortedPages()) {
            code += `// --- Page ${pageNum} ---\n$pdf->AddPage();\n\n`;
            for (const el of pages.get(pageNum)) code += this.elToCode(el);
            code += '\n';
        }
        return code;
    }

    elToCode(el) {
        let c = '';
        switch (el.type) {
            case 'rect':
                if (el.label) c += `// User Guide: ${this.esc(el.label)}\n`;
                c += `// Rectangle at (${el.x}, ${el.y})\n`;
                c += `$pdf->Rect(${el.x}, ${el.y}, ${el.w}, ${el.h});\n\n`;
                break;

            case 'text': {
                const style = el.fontStyle || '';
                const size = el.fontSize || 12;
                const cellW = el.w ? parseFloat(el.w.toFixed(1)) : 0;
                const cellH = parseFloat((size * 0.352778 * 1.2).toFixed(1));
                c += `// Text: "${el.content}"\n`;
                c += `$pdf->SetFont('Arial', '${style}', ${size});\n`;
                c += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                c += `$pdf->MultiCell(${cellW}, ${cellH}, '${this.esc(el.content)}');\n\n`;
                break;
            }

            case 'line':
                c += `// Line from (${el.x1}, ${el.y1}) to (${el.x2}, ${el.y2})\n`;
                c += `$pdf->Line(${el.x1}, ${el.y1}, ${el.x2}, ${el.y2});\n\n`;
                break;

            case 'image': {
                const label = this.esc(el.label || 'image.png');
                if (el.label) c += `// User Guide: ${label}\n`;
                c += `// Image placeholder\n`;
                c += `$pdf->Image('${label}', ${el.x}, ${el.y}, ${el.w}, ${el.h});\n\n`;
                break;
            }

            case 'table':
                c += this.tableCode(el, '$pdf->SetFont', '$pdf->SetXY', '$pdf->Cell', '$pdf->Rect');
                break;

            case 'point': {
                const ptLabel = this.esc(el.label || '');
                const ptFontSize = el.fontSize || 11;
                const ptCellW = el.cellW ?? 0;
                const ptCellH = el.cellH ?? 10;
                c += `// Point: "${el.label}" at (${el.x}, ${el.y})\n`;
                c += `$pdf->SetFont('Arial', '', ${ptFontSize});\n`;
                c += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                c += `$pdf->Cell(${ptCellW}, ${ptCellH}, '${ptLabel}');\n\n`;
                break;
            }
        }
        return c;
    }

    tableCode(el) {
        const rows = el.rows || 3;
        const cols = el.cols || 3;
        const colW = parseFloat((el.w / cols).toFixed(1));
        const rowH = parseFloat((el.h / rows).toFixed(1));
        let c = '';
        if (el.label) c += `// User Guide: ${this.esc(el.label)}\n`;

        if (el.isLoop) {
            const lVar = el.loopVar || '$items';
            c += `// Dynamic Table Loop: ${lVar} at (${el.x}, ${el.y})\n`;
            c += `$pdf->SetFont('Arial', '', 10);\n`;
            c += `$tableX = ${el.x}; $tableY = ${el.y};\n`;
            c += `$colW = ${colW}; $rowH = ${rowH};\n\n`;
            c += `$rowIndex = 0;\nforeach (${lVar} as $item) {\n`;
            c += `    $pdf->SetXY($tableX, $tableY + ($rowIndex * $rowH));\n`;
            c += `    for ($c = 0; $c < ${cols}; $c++) {\n`;
            c += `        $cellData = isset($item['col_'.$c]) ? $item['col_'.$c] : '';\n`;
            c += `        $pdf->Cell($colW, $rowH, $cellData, 1);\n`;
            c += `    }\n    $rowIndex++;\n}\n\n`;
        } else {
            c += `// Table ${rows}×${cols} at (${el.x}, ${el.y})\n`;
            c += `$pdf->SetFont('Arial', '', 10);\n`;
            c += `$tableX = ${el.x}; $tableY = ${el.y};\n`;
            c += `$colW = ${colW}; $rowH = ${rowH};\n\n`;
            c += `for ($r = 0; $r < ${rows}; $r++) {\n`;
            c += `    $pdf->SetXY($tableX, $tableY + ($r * $rowH));\n`;
            c += `    for ($c = 0; $c < ${cols}; $c++) {\n`;
            c += `        $pdf->Cell($colW, $rowH, '', 1);\n`;
            c += `    }\n}\n\n`;
        }
        return c;
    }
}

// ─────────────────────────────────────────────
// TCPDF Generator
// ─────────────────────────────────────────────
class TcpdfGenerator extends FpdfGenerator {
    generate() {
        const orient = this.getOrientation();
        const fmt = this.getPageFormat() || `array(${state.pageWidth}, ${state.pageHeight})`;
        const fmtStr = this.getPageFormat() ? `'${fmt}'` : fmt;
        let code = `<?php\nrequire_once('tcpdf.php');\n\n`;
        code += `$pdf = new TCPDF('${orient}', 'mm', ${fmtStr}, true, 'UTF-8', false);\n`;
        code += `$pdf->SetCreator('FPDF Layout Designer');\n`;
        code += `$pdf->SetAuthor('');\n`;
        code += `$pdf->SetTitle('Document');\n`;
        code += `$pdf->SetAutoPageBreak(false, 0);\n`;
        code += `$pdf->setPrintHeader(false);\n`;
        code += `$pdf->setPrintFooter(false);\n\n`;
        code += this.buildPages();
        code += `$pdf->Output('output.pdf', 'F');\n`;
        return code;
    }

    // TCPDF uses same coordinate API — override element methods for minor differences
    elToCode(el) {
        let c = '';
        switch (el.type) {
            case 'rect':
                if (el.label) c += `// User Guide: ${this.esc(el.label)}\n`;
                c += `// Rectangle at (${el.x}, ${el.y})\n`;
                c += `$pdf->Rect(${el.x}, ${el.y}, ${el.w}, ${el.h}, 'D');\n\n`;
                break;

            case 'text': {
                const style = el.fontStyle || '';
                const size = el.fontSize || 11;
                const cellW = el.w ? parseFloat(el.w.toFixed(1)) : 0;
                const cellH = parseFloat((size * 0.352778 * 1.2).toFixed(1));
                c += `// Text: "${el.content}"\n`;
                c += `$pdf->SetFont('arial', '${style}', ${size});\n`;
                c += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                c += `$pdf->MultiCell(${cellW}, ${cellH}, '${this.esc(el.content)}', 0, 'L', false, 1);\n\n`;
                break;
            }

            case 'line':
                c += `// Line from (${el.x1}, ${el.y1}) to (${el.x2}, ${el.y2})\n`;
                c += `$pdf->Line(${el.x1}, ${el.y1}, ${el.x2}, ${el.y2});\n\n`;
                break;

            case 'image': {
                const label = this.esc(el.label || 'image.png');
                if (el.label) c += `// User Guide: ${label}\n`;
                c += `// Image placeholder\n`;
                c += `$pdf->Image('${label}', ${el.x}, ${el.y}, ${el.w}, ${el.h}, '', '', '', false, 300);\n\n`;
                break;
            }

            case 'table':
                c += this.tableCode(el);
                break;

            case 'point': {
                const ptLabel = this.esc(el.label || '');
                const ptFontSize = el.fontSize || 11;
                const ptCellW = el.cellW ?? 0;
                const ptCellH = el.cellH ?? 10;
                c += `// Point: "${el.label}" at (${el.x}, ${el.y})\n`;
                c += `$pdf->SetFont('arial', '', ${ptFontSize});\n`;
                c += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                c += `$pdf->Cell(${ptCellW}, ${ptCellH}, '${ptLabel}', 0, 0, 'L');\n\n`;
                break;
            }
        }
        return c;
    }

    tableCode(el) {
        const rows = el.rows || 3;
        const cols = el.cols || 3;
        const colW = parseFloat((el.w / cols).toFixed(1));
        const rowH = parseFloat((el.h / rows).toFixed(1));
        let c = '';
        if (el.label) c += `// User Guide: ${this.esc(el.label)}\n`;

        if (el.isLoop) {
            const lVar = el.loopVar || '$items';
            c += `// Dynamic Table Loop: ${lVar} at (${el.x}, ${el.y})\n`;
            c += `$pdf->SetFont('arial', '', 10);\n`;
            c += `$tableX = ${el.x}; $tableY = ${el.y};\n`;
            c += `$colW = ${colW}; $rowH = ${rowH};\n\n`;
            c += `$rowIndex = 0;\nforeach (${lVar} as $item) {\n`;
            c += `    $pdf->SetXY($tableX, $tableY + ($rowIndex * $rowH));\n`;
            c += `    for ($c = 0; $c < ${cols}; $c++) {\n`;
            c += `        $cellData = isset($item['col_'.$c]) ? $item['col_'.$c] : '';\n`;
            c += `        $pdf->Cell($colW, $rowH, $cellData, 1, 0, 'L');\n`;
            c += `    }\n    $rowIndex++;\n}\n\n`;
        } else {
            c += `// Table ${rows}×${cols} at (${el.x}, ${el.y})\n`;
            c += `$pdf->SetFont('arial', '', 10);\n`;
            c += `$tableX = ${el.x}; $tableY = ${el.y};\n`;
            c += `$colW = ${colW}; $rowH = ${rowH};\n\n`;
            c += `for ($r = 0; $r < ${rows}; $r++) {\n`;
            c += `    $pdf->SetXY($tableX, $tableY + ($r * $rowH));\n`;
            c += `    for ($c = 0; $c < ${cols}; $c++) {\n`;
            c += `        $pdf->Cell($colW, $rowH, '', 1, 0, 'L');\n`;
            c += `    }\n}\n\n`;
        }
        return c;
    }
}

// ─────────────────────────────────────────────
// Dompdf Generator (HTML-based)
// ─────────────────────────────────────────────
class DompdfGenerator extends BaseGenerator {
    generate() {
        const orient = this.getOrientation() === 'L' ? 'landscape' : 'portrait';
        const fmt = this.getPageFormat() || 'A4';
        const fmtStr = this.getPageFormat() ? `'${fmt}'` : `[${state.pageWidth}, ${state.pageHeight}]`;

        let code = `<?php\nrequire_once 'vendor/autoload.php';\n\n`;
        code += `use Dompdf\\Dompdf;\nuse Dompdf\\Options;\n\n`;
        code += `$options = new Options();\n`;
        code += `$options->set('defaultFont', 'Arial');\n`;
        code += `$options->set('isHtml5ParserEnabled', true);\n\n`;
        code += `$dompdf = new Dompdf($options);\n\n`;

        const pages = this.getPages();
        const allElements = pages.size > 0
            ? [...this.getSortedPages()].flatMap(p => pages.get(p))
            : [];

        code += `$html = <<<HTML\n`;
        code += `<!DOCTYPE html>\n<html>\n<head>\n`;
        code += `<style>\n`;
        code += `  body { margin: 0; padding: 0; position: relative; }\n`;
        code += `  .page { position: relative; width: ${state.pageWidth}mm; height: ${state.pageHeight}mm; overflow: hidden; }\n`;
        code += `  .abs { position: absolute; }\n`;
        code += `</style>\n</head>\n<body>\n<div class="page">\n`;

        for (const el of allElements) code += this.elToHtml(el);

        code += `</div>\n</body>\n</html>\nHTML;\n\n`;
        code += `$dompdf->loadHtml($html);\n`;
        code += `$dompdf->setPaper(${fmtStr}, '${orient}');\n`;
        code += `$dompdf->render();\n`;
        code += `$dompdf->stream('output.pdf', ['Attachment' => false]);\n`;
        return code;
    }

    elToHtml(el) {
        switch (el.type) {
            case 'rect':
                return `  <!-- ${el.label ? 'User Guide: ' + this.esc(el.label) + ' | ' : ''}Rectangle -->\n` +
                    `  <div class="abs" style="left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;border:1px solid #000;"></div>\n`;

            case 'text': {
                const size = el.fontSize || 11;
                const weight = (el.fontStyle || '').includes('B') ? 'bold' : 'normal';
                const italic = (el.fontStyle || '').includes('I') ? 'italic' : 'normal';
                return `  <!-- Text: "${this.esc(el.content)}" -->\n` +
                    `  <div class="abs" style="left:${el.x}mm;top:${el.y}mm;width:${el.w || 'auto'}mm;font-size:${size}pt;font-weight:${weight};font-style:${italic};">${this.esc(el.content)}</div>\n`;
            }

            case 'line':
                return `  <!-- Line -->\n` +
                    `  <div class="abs" style="left:${el.x1}mm;top:${el.y1}mm;width:${Math.abs(el.x2 - el.x1)}mm;border-top:1px solid #000;"></div>\n`;

            case 'image': {
                const label = this.esc(el.label || 'image.png');
                return `  <!-- Image: ${label} -->\n` +
                    `  <img class="abs" src="${label}" style="left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;" />\n`;
            }

            case 'table': {
                const rows = el.rows || 3;
                const cols = el.cols || 3;
                const colW = parseFloat((el.w / cols).toFixed(1));
                const rowH = parseFloat((el.h / rows).toFixed(1));
                let h = `  <!-- ${el.label ? 'User Guide: ' + this.esc(el.label) + ' | ' : ''}Table ${rows}×${cols} -->\n`;
                h += `  <table class="abs" style="left:${el.x}mm;top:${el.y}mm;width:${el.w}mm;height:${el.h}mm;border-collapse:collapse;">\n`;
                for (let r = 0; r < rows; r++) {
                    h += `    <tr>\n`;
                    for (let c = 0; c < cols; c++) {
                        h += `      <td style="width:${colW}mm;height:${rowH}mm;border:1px solid #000;"></td>\n`;
                    }
                    h += `    </tr>\n`;
                }
                h += `  </table>\n`;
                return h;
            }

            case 'point': {
                const size = el.fontSize || 11;
                return `  <!-- Point: "${this.esc(el.label)}" -->\n` +
                    `  <div class="abs" style="left:${el.x}mm;top:${el.y}mm;font-size:${size}pt;">${this.esc(el.label)}</div>\n`;
            }
        }
        return '';
    }
}

// ─────────────────────────────────────────────
// mPDF Generator (HTML-based, same approach as Dompdf)
// ─────────────────────────────────────────────
class MpdfGenerator extends DompdfGenerator {
    generate() {
        const orient = this.getOrientation();
        const fmt = this.getPageFormat() || 'A4';

        let code = `<?php\nrequire_once 'vendor/autoload.php';\n\n`;
        code += `$mpdf = new \\Mpdf\\Mpdf([\n`;
        code += `    'mode'        => 'utf-8',\n`;
        code += `    'format'      => '${fmt}',\n`;
        code += `    'orientation' => '${orient}',\n`;
        code += `    'margin_top'  => 0,\n`;
        code += `    'margin_right'=> 0,\n`;
        code += `    'margin_bottom'=> 0,\n`;
        code += `    'margin_left' => 0,\n`;
        code += `]);\n\n`;

        const pages = this.getPages();
        const allElements = pages.size > 0
            ? [...this.getSortedPages()].flatMap(p => pages.get(p))
            : [];

        code += `$html = <<<HTML\n`;
        code += `<!DOCTYPE html>\n<html>\n<head>\n<style>\n`;
        code += `  body { margin: 0; padding: 0; }\n`;
        code += `  .page { position: relative; width: ${state.pageWidth}mm; height: ${state.pageHeight}mm; }\n`;
        code += `  .abs { position: absolute; }\n`;
        code += `</style>\n</head>\n<body>\n<div class="page">\n`;

        for (const el of allElements) code += this.elToHtml(el);

        code += `</div>\n</body>\n</html>\nHTML;\n\n`;
        code += `$mpdf->WriteHTML($html);\n`;
        code += `$mpdf->Output('output.pdf', \\Mpdf\\Output\\Destination::FILE);\n`;
        return code;
    }
}

// ─────────────────────────────────────────────
// Main Exporter (delegates to the right generator)
// ─────────────────────────────────────────────
class Exporter {
    constructor() {
        this.library = 'fpdf';
    }

    init() {
        document.getElementById('btn-export').addEventListener('click', () => this.showExport());
        document.getElementById('btn-copy-code').addEventListener('click', () => this.copyCode());

        const sel = document.getElementById('export-library-select');
        if (sel) {
            sel.addEventListener('change', (e) => {
                this.library = e.target.value;
                // Live-preview refresh if modal is already open
                const modal = document.getElementById('modal-export');
                if (modal && modal.style.display === 'flex') {
                    document.getElementById('export-code').textContent = this.generateCode();
                }
            });
        }
    }

    getGenerator() {
        switch (this.library) {
            case 'tcpdf': return new TcpdfGenerator();
            case 'dompdf': return new DompdfGenerator();
            case 'mpdf': return new MpdfGenerator();
            default: return new FpdfGenerator();
        }
    }

    generateCode() {
        return this.getGenerator().generate();
    }

    showExport() {
        const code = this.generateCode();
        const modal = document.getElementById('modal-export');
        const codeBlock = document.getElementById('export-code');
        codeBlock.textContent = code;
        modal.style.display = 'flex';
    }

    async copyCode() {
        const code = document.getElementById('export-code').textContent;
        try {
            await navigator.clipboard.writeText(code);
            showToast('Code copied to clipboard!', 'success');
        } catch {
            showToast('Failed to copy code', 'error');
        }
    }
}

export const exporter = new Exporter();
