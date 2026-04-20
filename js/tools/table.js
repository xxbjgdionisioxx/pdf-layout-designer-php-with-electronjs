// ============================================================
// FPDF Visual Layout Designer — Table Builder Tool
// ============================================================

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class TableTool {
    constructor() {
        this.startMm = null;
        this.previewEl = null;
    }
    
    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        this.startMm = { x: snapped.x, y: snapped.y };
        
        this.previewEl = {
            type: 'table',
            x: snapped.x,
            y: snapped.y,
            w: 0,
            h: 0,
            rows: 3,
            cols: 3,
            _preview: true,
        };
        
        state.isDrawing = true;
    }
    
    onMouseMove(e, mmX, mmY) {
        if (!state.isDrawing || !this.startMm) return;
        
        const snapped = snapManager.snapPoint(mmX, mmY);
        
        this.previewEl.x = Math.min(this.startMm.x, snapped.x);
        this.previewEl.y = Math.min(this.startMm.y, snapped.y);
        this.previewEl.w = Math.abs(snapped.x - this.startMm.x);
        this.previewEl.h = Math.abs(snapped.y - this.startMm.y);
        
        const elements = state.getPageElements();
        const existingIdx = elements.findIndex(e => e._preview);
        if (existingIdx >= 0) {
            elements[existingIdx] = this.previewEl;
        } else {
            elements.push(this.previewEl);
        }
        
        state.emit('elementsChanged');
    }
    
    onMouseUp(e, mmX, mmY) {
        if (!state.isDrawing || !this.startMm) return;
        
        const elements = state.getPageElements();
        const idx = elements.findIndex(e => e._preview);
        if (idx >= 0) elements.splice(idx, 1);
        
        state.isDrawing = false;
        
        if (this.previewEl.w >= 5 && this.previewEl.h >= 5) {
            // Show table config modal
            this.pendingBounds = {
                x: parseFloat(this.previewEl.x.toFixed(1)),
                y: parseFloat(this.previewEl.y.toFixed(1)),
                w: parseFloat(this.previewEl.w.toFixed(1)),
                h: parseFloat(this.previewEl.h.toFixed(1)),
            };
            
            this.showModal();
        }
        
        this.startMm = null;
        this.previewEl = null;
    }
    
    showModal() {
        const modal = document.getElementById('modal-table');
        document.getElementById('modal-table-rows').value = '3';
        document.getElementById('modal-table-cols').value = '3';
        modal.style.display = 'flex';
    }
    
    confirmTable() {
        const rows = parseInt(document.getElementById('modal-table-rows').value) || 3;
        const cols = parseInt(document.getElementById('modal-table-cols').value) || 3;
        
        if (!this.pendingBounds) return;
        
        history.pushState('create table');
        
        const colWidth = this.pendingBounds.w / cols;
        const rowHeight = this.pendingBounds.h / rows;
        
        const el = {
            type: 'table',
            x: this.pendingBounds.x,
            y: this.pendingBounds.y,
            w: this.pendingBounds.w,
            h: this.pendingBounds.h,
            rows: rows,
            cols: cols,
            colWidths: Array(cols).fill(parseFloat(colWidth.toFixed(1))),
            rowHeights: Array(rows).fill(parseFloat(rowHeight.toFixed(1))),
        };
        
        state.addElement(el);
        state.selectElement(el);
        
        this.pendingBounds = null;
        document.getElementById('modal-table').style.display = 'none';
    }
    
    cancelTable() {
        this.pendingBounds = null;
        document.getElementById('modal-table').style.display = 'none';
    }
}

export const tableTool = new TableTool();
