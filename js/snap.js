// ============================================================
// FPDF Visual Layout Designer — Snap System
// ============================================================

import { state } from './state.js';
import { DEFAULTS, MM_TO_PX } from './config.js';

class SnapManager {
    constructor() {
        this.threshold = DEFAULTS.snapThreshold; // in screen pixels
    }
    
    init() {
        // Nothing to initialize
    }
    
    /**
     * Snap a point (in mm) to grid/guides if snap is enabled
     * Returns snapped { x, y }
     */
    snapPoint(mmX, mmY) {
        if (!state.snapEnabled) return { x: mmX, y: mmY };
        
        let x = mmX;
        let y = mmY;
        
        // Snap to grid
        if (state.gridVisible) {
            const spacing = state.gridSpacing;
            x = Math.round(x / spacing) * spacing;
            y = Math.round(y / spacing) * spacing;
        }
        
        // Snap to margins
        if (state.marginsVisible) {
            const thresholdMm = this.threshold / (MM_TO_PX * state.zoom);
            const m = state.margins;
            
            if (Math.abs(x - m.left) < thresholdMm) x = m.left;
            if (Math.abs(x - (state.pageWidth - m.right)) < thresholdMm) x = state.pageWidth - m.right;
            if (Math.abs(y - m.top) < thresholdMm) y = m.top;
            if (Math.abs(y - (state.pageHeight - m.bottom)) < thresholdMm) y = state.pageHeight - m.bottom;
        }
        
        // Snap to other element edges
        const thresholdMm = this.threshold / (MM_TO_PX * state.zoom);
        const elements = state.getPageElements();
        
        for (const el of elements) {
            if (state.selectedElements.includes(el)) continue; // skip self
            
            const bounds = this.getElementBounds(el);
            if (!bounds) continue;
            
            // Snap to left/right/top/bottom edges
            if (Math.abs(x - bounds.x) < thresholdMm) x = bounds.x;
            if (Math.abs(x - (bounds.x + bounds.w)) < thresholdMm) x = bounds.x + bounds.w;
            if (Math.abs(y - bounds.y) < thresholdMm) y = bounds.y;
            if (Math.abs(y - (bounds.y + bounds.h)) < thresholdMm) y = bounds.y + bounds.h;
        }
        
        return { x, y };
    }
    
    /**
     * Snap during resize: snap the resizing edge
     */
    snapResize(mmX, mmY) {
        return this.snapPoint(mmX, mmY);
    }
    
    /**
     * Get bounding box of an element in mm
     */
    getElementBounds(el) {
        switch (el.type) {
            case 'rect':
            case 'image':
            case 'table':
                return { x: el.x, y: el.y, w: el.w, h: el.h };
            case 'text':
                return { x: el.x, y: el.y, w: el.w || 40, h: el.h || 6 };
            case 'line':
                return {
                    x: Math.min(el.x1, el.x2),
                    y: Math.min(el.y1, el.y2),
                    w: Math.abs(el.x2 - el.x1),
                    h: Math.abs(el.y2 - el.y1),
                };
            default:
                return null;
        }
    }
}

export const snapManager = new SnapManager();
