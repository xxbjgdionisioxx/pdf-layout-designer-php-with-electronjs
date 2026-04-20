// ============================================================
// FPDF Visual Layout Designer — Grid Rendering
// ============================================================

import { state } from './state.js';
import { canvasManager } from './canvas-manager.js';
import { MM_TO_PX, COLORS } from './config.js';

class GridRenderer {
    init() {
        state.on('canvasResized', () => this.render());
        state.on('zoomChanged', () => this.render());
        state.on('elementsChanged', () => this.render());
        state.on('projectLoaded', () => this.render());
    }
    
    render() {
        canvasManager.clear('grid');
        
        if (!state.gridVisible) return;
        
        const ctx = canvasManager.getContext('grid');
        const zoom = state.zoom;
        const spacing = state.gridSpacing;
        const pxSpacing = spacing * MM_TO_PX * zoom;
        
        const w = state.pageWidth * MM_TO_PX * zoom;
        const h = state.pageHeight * MM_TO_PX * zoom;
        
        ctx.save();
        
        // Minor grid lines
        ctx.strokeStyle = COLORS.gridMinor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        
        for (let x = 0; x <= w; x += pxSpacing) {
            // Skip major lines (every 10mm)
            const mmX = x / (MM_TO_PX * zoom);
            if (Math.abs(mmX % 10) < 0.01) continue;
            
            ctx.moveTo(Math.round(x) + 0.5, 0);
            ctx.lineTo(Math.round(x) + 0.5, h);
        }
        
        for (let y = 0; y <= h; y += pxSpacing) {
            const mmY = y / (MM_TO_PX * zoom);
            if (Math.abs(mmY % 10) < 0.01) continue;
            
            ctx.moveTo(0, Math.round(y) + 0.5);
            ctx.lineTo(w, Math.round(y) + 0.5);
        }
        ctx.stroke();
        
        // Major grid lines (every 10mm)
        const majorPx = 10 * MM_TO_PX * zoom;
        ctx.strokeStyle = COLORS.gridMajor;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        
        for (let x = 0; x <= w; x += majorPx) {
            ctx.moveTo(Math.round(x) + 0.5, 0);
            ctx.lineTo(Math.round(x) + 0.5, h);
        }
        
        for (let y = 0; y <= h; y += majorPx) {
            ctx.moveTo(0, Math.round(y) + 0.5);
            ctx.lineTo(w, Math.round(y) + 0.5);
        }
        ctx.stroke();
        
        ctx.restore();
    }
    
    toggle() {
        state.gridVisible = !state.gridVisible;
        const btn = document.getElementById('btn-grid');
        btn.classList.toggle('active', state.gridVisible);
        this.render();
    }
    
    setSpacing(spacing) {
        state.gridSpacing = parseInt(spacing);
        this.render();
    }
}

export const gridRenderer = new GridRenderer();
