// ============================================================
// FPDF Visual Layout Designer — Rectangle Tool
// ============================================================

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class RectTool {
    constructor() {
        this.startMm = null;
        this.previewEl = null;
    }
    
    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        this.startMm = { x: snapped.x, y: snapped.y };
        
        // Create a preview element
        this.previewEl = {
            type: 'rect',
            x: snapped.x,
            y: snapped.y,
            w: 0,
            h: 0,
            _preview: true,
        };
        
        state.isDrawing = true;
    }
    
    onMouseMove(e, mmX, mmY) {
        if (!state.isDrawing || !this.startMm) return;
        
        const snapped = snapManager.snapPoint(mmX, mmY);
        
        // Update preview
        this.previewEl.x = Math.min(this.startMm.x, snapped.x);
        this.previewEl.y = Math.min(this.startMm.y, snapped.y);
        this.previewEl.w = Math.abs(snapped.x - this.startMm.x);
        this.previewEl.h = Math.abs(snapped.y - this.startMm.y);
        
        // Temporarily add to elements for rendering
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
        
        // Only create if has meaningful size
        if (this.previewEl.w >= 1 && this.previewEl.h >= 1) {
            history.pushState('draw rect');
            
            const el = {
                type: 'rect',
                x: parseFloat(this.previewEl.x.toFixed(1)),
                y: parseFloat(this.previewEl.y.toFixed(1)),
                w: parseFloat(this.previewEl.w.toFixed(1)),
                h: parseFloat(this.previewEl.h.toFixed(1)),
            };
            
            state.addElement(el);
            state.selectElement(el);
        }
        
        this.startMm = null;
        this.previewEl = null;
    }
}

export const rectTool = new RectTool();
