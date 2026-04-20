// ============================================================
// FPDF Visual Layout Designer — Line Tool
// ============================================================

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class LineTool {
    constructor() {
        this.startMm = null;
        this.previewEl = null;
    }
    
    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        this.startMm = { x: snapped.x, y: snapped.y };
        
        this.previewEl = {
            type: 'line',
            x1: snapped.x,
            y1: snapped.y,
            x2: snapped.x,
            y2: snapped.y,
            _preview: true,
        };
        
        state.isDrawing = true;
    }
    
    onMouseMove(e, mmX, mmY) {
        if (!state.isDrawing || !this.startMm) return;
        
        let snapped = snapManager.snapPoint(mmX, mmY);
        
        // Shift key constrains to horizontal or vertical
        if (e.shiftKey) {
            const dx = Math.abs(snapped.x - this.startMm.x);
            const dy = Math.abs(snapped.y - this.startMm.y);
            if (dx > dy) {
                snapped.y = this.startMm.y;
            } else {
                snapped.x = this.startMm.x;
            }
        }
        
        this.previewEl.x2 = snapped.x;
        this.previewEl.y2 = snapped.y;
        
        // Update preview in elements
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
        
        // Remove preview
        const elements = state.getPageElements();
        const idx = elements.findIndex(e => e._preview);
        if (idx >= 0) elements.splice(idx, 1);
        
        state.isDrawing = false;
        
        // Check minimum length
        const len = Math.sqrt(
            (this.previewEl.x2 - this.previewEl.x1) ** 2 +
            (this.previewEl.y2 - this.previewEl.y1) ** 2
        );
        
        if (len >= 1) {
            history.pushState('draw line');
            
            const el = {
                type: 'line',
                x1: parseFloat(this.previewEl.x1.toFixed(1)),
                y1: parseFloat(this.previewEl.y1.toFixed(1)),
                x2: parseFloat(this.previewEl.x2.toFixed(1)),
                y2: parseFloat(this.previewEl.y2.toFixed(1)),
            };
            
            state.addElement(el);
            state.selectElement(el);
        }
        
        this.startMm = null;
        this.previewEl = null;
    }
}

export const lineTool = new LineTool();
