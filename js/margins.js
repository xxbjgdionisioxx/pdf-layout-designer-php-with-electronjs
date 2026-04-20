// ============================================================
// FPDF Visual Layout Designer — Margin Guides
// ============================================================

import { state } from './state.js';
import { canvasManager } from './canvas-manager.js';
import { MM_TO_PX, COLORS } from './config.js';

class MarginsRenderer {
    init() {
        state.on('canvasResized', () => this.renderOnDraw());
        state.on('projectLoaded', () => this.renderOnDraw());
        
        // Listen for margin input changes
        ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.updateFromInputs());
                input.addEventListener('input', () => this.updateFromInputs());
            }
        });
    }
    
    updateFromInputs() {
        state.margins.top = parseFloat(document.getElementById('margin-top').value) || 0;
        state.margins.right = parseFloat(document.getElementById('margin-right').value) || 0;
        state.margins.bottom = parseFloat(document.getElementById('margin-bottom').value) || 0;
        state.margins.left = parseFloat(document.getElementById('margin-left').value) || 0;
        state.emit('elementsChanged'); // trigger redraw
    }
    
    /**
     * Render margins on the draw layer (called during draw cycle)
     */
    renderOnDraw() {
        // Margins will be drawn as part of the draw layer redraw
    }
    
    /**
     * Draw margin guides on a canvas context
     */
    draw(ctx) {
        if (!state.marginsVisible) return;
        
        const zoom = state.zoom;
        const m = state.margins;
        
        const left = m.left * MM_TO_PX * zoom;
        const top = m.top * MM_TO_PX * zoom;
        const right = (state.pageWidth - m.right) * MM_TO_PX * zoom;
        const bottom = (state.pageHeight - m.bottom) * MM_TO_PX * zoom;
        
        ctx.save();
        ctx.strokeStyle = COLORS.margin;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        
        // Draw margin rectangle
        ctx.beginPath();
        ctx.rect(left, top, right - left, bottom - top);
        ctx.stroke();
        
        // Fill outside margins with subtle overlay
        ctx.fillStyle = 'rgba(248, 81, 73, 0.03)';
        
        // Top margin
        ctx.fillRect(0, 0, state.pageWidth * MM_TO_PX * zoom, top);
        // Bottom margin
        ctx.fillRect(0, bottom, state.pageWidth * MM_TO_PX * zoom, state.pageHeight * MM_TO_PX * zoom - bottom);
        // Left margin
        ctx.fillRect(0, top, left, bottom - top);
        // Right margin
        ctx.fillRect(right, top, state.pageWidth * MM_TO_PX * zoom - right, bottom - top);
        
        ctx.restore();
    }
    
    toggle() {
        state.marginsVisible = !state.marginsVisible;
        const btn = document.getElementById('btn-margins');
        btn.classList.toggle('active', state.marginsVisible);
        state.emit('elementsChanged'); // trigger redraw
    }
}

export const marginsRenderer = new MarginsRenderer();
