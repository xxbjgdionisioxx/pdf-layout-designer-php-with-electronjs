// ============================================================
// FPDF Visual Layout Designer — Zoom System
// ============================================================

import { state } from './state.js';
import { ZOOM_LEVELS, MM_TO_PX } from './config.js';

class ZoomManager {
    constructor() {
        this.display = null;
    }
    
    init() {
        this.display = document.getElementById('zoom-display');
        
        document.getElementById('btn-zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-fit').addEventListener('click', () => this.fitToPage());
        document.getElementById('btn-zoom-reset').addEventListener('click', () => this.setZoom(1.0));
        
        state.on('zoomChanged', () => this.updateDisplay());
        this.updateDisplay();
    }
    
    zoomIn() {
        const current = state.zoom;
        const next = ZOOM_LEVELS.find(z => z > current + 0.01);
        if (next) state.setZoom(next);
    }
    
    zoomOut() {
        const current = state.zoom;
        const prev = [...ZOOM_LEVELS].reverse().find(z => z < current - 0.01);
        if (prev) state.setZoom(prev);
    }
    
    setZoom(level) {
        state.setZoom(level);
    }
    
    fitToPage() {
        const viewport = document.getElementById('canvas-viewport');
        const availW = viewport.clientWidth - 80; // padding
        const availH = viewport.clientHeight - 80;
        
        const pageW = state.pageWidth * MM_TO_PX;
        const pageH = state.pageHeight * MM_TO_PX;
        
        const zoomW = availW / pageW;
        const zoomH = availH / pageH;
        
        const fitZoom = Math.min(zoomW, zoomH);
        // Snap to nearest nice value
        const snapped = Math.floor(fitZoom * 20) / 20; // round to 0.05
        state.setZoom(Math.max(0.25, Math.min(3.0, snapped)));
    }
    
    updateDisplay() {
        if (this.display) {
            this.display.textContent = `${Math.round(state.zoom * 100)}%`;
        }
        
        const infoZoom = document.getElementById('info-zoom');
        if (infoZoom) {
            infoZoom.textContent = `${Math.round(state.zoom * 100)}%`;
        }
    }
}

export const zoomManager = new ZoomManager();
