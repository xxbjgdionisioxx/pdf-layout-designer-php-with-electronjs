// ============================================================
// FPDF Visual Layout Designer — FPDF Code Exporter
// ============================================================

import { state } from './state.js';
import { showToast } from './cursor.js';

class Exporter {
    init() {
        document.getElementById('btn-export').addEventListener('click', () => this.showExport());
        document.getElementById('btn-copy-code').addEventListener('click', () => this.copyCode());
    }
    
    /**
     * Generate FPDF PHP code from all elements
     */
    generateCode() {
        let code = `<?php\nrequire('fpdf.php');\n\n`;
        code += `$pdf = new FPDF('${this.getOrientation()}', 'mm', '${this.getPageFormat()}');\n`;
        code += `$pdf->SetAutoPageBreak(false);\n\n`;
        
        // Group elements by page
        const pages = new Map();
        for (const [pageNum, elements] of state.elements) {
            if (elements.length > 0) {
                pages.set(pageNum, elements);
            }
        }
        
        // If no elements on any page but we have pages, still add first page
        if (pages.size === 0) {
            code += `$pdf->AddPage();\n\n`;
        }
        
        // Sort pages
        const sortedPages = [...pages.keys()].sort((a, b) => a - b);
        
        for (const pageNum of sortedPages) {
            const elements = pages.get(pageNum);
            
            code += `// --- Page ${pageNum} ---\n`;
            code += `$pdf->AddPage();\n\n`;
            
            for (const el of elements) {
                code += this.elementToCode(el);
            }
            
            code += `\n`;
        }
        
        code += `$pdf->Output('F', 'output.pdf');\n`;
        
        return code;
    }
    
    elementToCode(el) {
        let code = '';
        
        switch (el.type) {
            case 'rect':
                code += `// Rectangle at (${el.x}, ${el.y})\n`;
                code += `$pdf->Rect(${el.x}, ${el.y}, ${el.w}, ${el.h});\n\n`;
                break;
                
            case 'text': {
                const style = el.fontStyle || '';
                const size = el.fontSize || 12;
                const text = (el.content || '').replace(/'/g, "\\'");
                
                code += `// Text: "${el.content}"\n`;
                code += `$pdf->SetFont('Helvetica', '${style}', ${size});\n`;
                code += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                
                // Estimate cell width
                const cellW = el.w ? parseFloat(el.w.toFixed(1)) : 0;
                const cellH = parseFloat((size * 0.352778 * 1.2).toFixed(1));
                
                code += `$pdf->Cell(${cellW}, ${cellH}, '${text}');\n\n`;
                break;
            }
                
            case 'line':
                code += `// Line from (${el.x1}, ${el.y1}) to (${el.x2}, ${el.y2})\n`;
                code += `$pdf->Line(${el.x1}, ${el.y1}, ${el.x2}, ${el.y2});\n\n`;
                break;
                
            case 'image': {
                const label = (el.label || 'image.png').replace(/'/g, "\\'");
                code += `// Image: ${el.label}\n`;
                code += `$pdf->Image('${label}', ${el.x}, ${el.y}, ${el.w}, ${el.h});\n\n`;
                break;
            }
                
            case 'table': {
                const rows = el.rows || 3;
                const cols = el.cols || 3;
                const colW = parseFloat((el.w / cols).toFixed(1));
                const rowH = parseFloat((el.h / rows).toFixed(1));
                
                code += `// Table ${rows}×${cols} at (${el.x}, ${el.y})\n`;
                code += `$pdf->SetFont('Helvetica', '', 10);\n`;
                code += `$tableX = ${el.x};\n`;
                code += `$tableY = ${el.y};\n`;
                code += `$colW = ${colW};\n`;
                code += `$rowH = ${rowH};\n\n`;
                
                code += `for ($r = 0; $r < ${rows}; $r++) {\n`;
                code += `    $pdf->SetXY($tableX, $tableY + ($r * $rowH));\n`;
                code += `    for ($c = 0; $c < ${cols}; $c++) {\n`;
                code += `        $pdf->Cell($colW, $rowH, '', 1);\n`;
                code += `    }\n`;
                code += `}\n\n`;
                break;
            }
                
            case 'point': {
                const ptLabel = (el.label || '').replace(/'/g, "\\'");
                const ptFontSize = el.fontSize || 12;
                const ptCellW = el.cellW !== undefined ? el.cellW : 0;
                const ptCellH = el.cellH !== undefined ? el.cellH : 10;
                
                code += `// Point: "${el.label}" at (${el.x}, ${el.y})\n`;
                code += `$pdf->SetFont('Helvetica', '', ${ptFontSize});\n`;
                code += `$pdf->SetXY(${el.x}, ${el.y});\n`;
                code += `$pdf->Cell(${ptCellW}, ${ptCellH}, '${ptLabel}');\n\n`;
                break;
            }
        }
        
        return code;
    }
    
    getOrientation() {
        return state.pageWidth > state.pageHeight ? 'L' : 'P';
    }
    
    getPageFormat() {
        // Check if it's a standard size
        if ((state.pageWidth === 210 && state.pageHeight === 297) ||
            (state.pageWidth === 297 && state.pageHeight === 210)) {
            return 'A4';
        }
        if ((state.pageWidth === 215.9 && state.pageHeight === 279.4) ||
            (state.pageWidth === 279.4 && state.pageHeight === 215.9)) {
            return 'Letter';
        }
        // Custom size: return array
        return `array(${state.pageWidth}, ${state.pageHeight})`;
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
            showToast('PHP code copied to clipboard!', 'success');
        } catch {
            showToast('Failed to copy code', 'error');
        }
    }
}

export const exporter = new Exporter();
