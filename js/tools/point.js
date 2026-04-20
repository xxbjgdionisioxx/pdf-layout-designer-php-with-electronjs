// ============================================================
// FPDF Visual Layout Designer — Point Tool
// ============================================================ 

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class PointTool {
    constructor() {
        this.pendingPos = null;
    }

    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        this.pendingPos = { x: snapped.x, y: snapped.y };
        this.showModal();
    }

    onMouseMove(e, mmX, mmY) {
        // No-op
    }

    onMouseUp(e, mmX, mmY) {
        // No-op
    }

    showModal() {
        const modal = document.getElementById('modal-point');
        const input = document.getElementById('modal-point-label');
        const cellW = document.getElementById('modal-point-cell-w');
        const cellH = document.getElementById('modal-point-cell-h');
        const fontSize = document.getElementById('modal-point-font-size');

        // Reset fields
        input.value = '';
        cellW.value = '0';
        cellH.value = '10';
        fontSize.value = '12';

        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 50);
    }

    confirmPoint() {
        const label = document.getElementById('modal-point-label').value.trim();
        const cellW = parseFloat(document.getElementById('modal-point-cell-w').value) || 0;
        const cellH = parseFloat(document.getElementById('modal-point-cell-h').value) || 10;
        const fontSize = parseFloat(document.getElementById('modal-point-font-size').value) || 12;

        if (!label || !this.pendingPos) {
            this.pendingPos = null;
            document.getElementById('modal-point').style.display = 'none';
            return;
        }

        history.pushState('add point');

        const el = {
            type: 'point',
            x: parseFloat(this.pendingPos.x.toFixed(1)),
            y: parseFloat(this.pendingPos.y.toFixed(1)),
            label: label,
            cellW: cellW,
            cellH: cellH,
            fontSize: fontSize,
        };

        state.addElement(el);
        state.selectElement(el);

        this.pendingPos = null;
        document.getElementById('modal-point').style.display = 'none';
    }

    cancelPoint() {
        this.pendingPos = null;
        document.getElementById('modal-point').style.display = 'none';
    }
}

export const pointTool = new PointTool();
