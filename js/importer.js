// ============================================================
// FPDF Visual Layout Designer — PHP Importer
// ============================================================

import { state } from './state.js';
import { showToast } from './cursor.js';
import { history } from './history.js';

class Importer {
    init() {
        const btnImport = document.getElementById('btn-import-php');
        if (btnImport) {
            btnImport.addEventListener('click', () => {
                const contentArea = document.getElementById('modal-import-php-content');
                if (contentArea) contentArea.value = '';
                document.getElementById('modal-import-php').style.display = 'flex';
            });
        }

        const btnOk = document.getElementById('modal-import-php-ok');
        if (btnOk) {
            btnOk.addEventListener('click', () => {
                const code = document.getElementById('modal-import-php-content').value;
                if (code.trim()) {
                    this.parsePHP(code);
                }
                document.getElementById('modal-import-php').style.display = 'none';
            });
        }
    }

    parsePHP(code) {
        let currentX = 10;
        let currentY = 10;
        let currentFont = { family: 'Arial', style: '', size: 12 };

        const lines = code.split('\n');
        let elementsAdded = 0;

        history.pushState('import-php');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // 1. SetXY
            let m = line.match(/\$pdf->SetXY\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
            if (m) {
                currentX = parseFloat(m[1]);
                currentY = parseFloat(m[2]);
            }

            // 2. SetFont
            m = line.match(/\$pdf->SetFont\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*([\d.]+)\s*\)/i);
            if (m) {
                currentFont.family = m[1];
                currentFont.style = m[2];
                currentFont.size = parseFloat(m[3]);
            }

            // 3. Rect
            m = line.match(/\$pdf->Rect\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
            if (m) {
                const rect = {
                    type: 'rect',
                    x: parseFloat(m[1]),
                    y: parseFloat(m[2]),
                    w: parseFloat(m[3]),
                    h: parseFloat(m[4]),
                    label: 'Imported Rect'
                };
                state.addElement(rect);
                elementsAdded++;
                continue;
            }

            // 4. Line
            m = line.match(/\$pdf->Line\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
            if (m) {
                const lineEl = {
                    type: 'line',
                    x1: parseFloat(m[1]),
                    y1: parseFloat(m[2]),
                    x2: parseFloat(m[3]),
                    y2: parseFloat(m[4])
                };
                state.addElement(lineEl);
                elementsAdded++;
                continue;
            }

            // 5. Image
            m = line.match(/\$pdf->Image\s*\(\s*['"]([^'"]+)['"]\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?/i);
            if (m) {
                const imgEl = {
                    type: 'image',
                    label: m[1],
                    x: parseFloat(m[2]),
                    y: parseFloat(m[3]),
                    w: parseFloat(m[4]),
                    h: m[5] ? parseFloat(m[5]) : parseFloat(m[4]) // fallback to width if height is missing
                };
                state.addElement(imgEl);
                elementsAdded++;
                continue;
            }

            // 6. Cell or MultiCell
            m = line.match(/\$pdf->(?:Multi)?Cell\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*(.*?)\s*(?:\)|,)/i);
            if (m) {
                const w = parseFloat(m[1]);
                const h = parseFloat(m[2]);
                let rawTxt = m[3].trim();
                
                // Try to strip leading/trailing quotes for plain strings
                let txt = rawTxt;
                if ((txt.startsWith("'") && txt.endsWith("'")) || (txt.startsWith('"') && txt.endsWith('"'))) {
                    txt = txt.substring(1, txt.length - 1);
                }

                if (txt === '' || rawTxt === "''" || rawTxt === '""') {
                    // Empty cell = Input Box
                    const inputEl = {
                        type: 'inputbox',
                        label: 'Imported Input',
                        x: currentX,
                        y: currentY,
                        w: w > 0 ? w : 30, // Fallback width
                        h: h > 0 ? h : 10
                    };
                    state.addElement(inputEl);
                } else if (w === 0 && txt.length > 0) {
                    // Usually width 0 means it's a point label or full width text
                    const pointEl = {
                        type: 'point',
                        label: txt,
                        x: currentX,
                        y: currentY,
                        cellW: w,
                        cellH: h,
                        fontSize: currentFont.size
                    };
                    state.addElement(pointEl);
                } else {
                    // Normal text
                    const textEl = {
                        type: 'text',
                        content: txt,
                        x: currentX,
                        y: currentY,
                        w: w,
                        h: h,
                        fontStyle: currentFont.style,
                        fontSize: currentFont.size
                    };
                    state.addElement(textEl);
                }
                
                elementsAdded++;
                
                // Update X cursor for Cell (FPDF advances X automatically if ln=0, but we assume basic usage for now)
                currentX += w;
                continue;
            }
        }

        if (elementsAdded > 0) {
            showToast(`Imported ${elementsAdded} elements from PHP code.`, 'success');
        } else {
            showToast('No recognizable FPDF/TCPDF commands found.', 'warning');
        }
    }
}

export const importer = new Importer();
