// ============================================================
// FPDF Visual Layout Designer — Rulers
// ============================================================

import { state } from './state.js';
import { MM_TO_PX } from './config.js';

class RulerRenderer {
    constructor() {
        this.hCanvas = null;
        this.vCanvas = null;
        this.hCtx = null;
        this.vCtx = null;
        this.mouseMMX = -1;
        this.mouseMMY = -1;
    }
    
    init() {
        this.hCanvas = document.getElementById('ruler-h');
        this.vCanvas = document.getElementById('ruler-v');
        this.hCtx = this.hCanvas.getContext('2d');
        this.vCtx = this.vCanvas.getContext('2d');
        
        state.on('canvasResized', () => this.resize());
        state.on('zoomChanged', () => this.render());
        state.on('projectLoaded', () => this.resize());
        
        this.resize();
    }
    
    resize() {
        const hContainer = document.getElementById('ruler-h-container');
        const vContainer = document.getElementById('ruler-v-container');
        
        const dpr = window.devicePixelRatio || 1;
        
        // Horizontal ruler
        this.hCanvas.width = hContainer.clientWidth * dpr;
        this.hCanvas.height = hContainer.clientHeight * dpr;
        this.hCanvas.style.width = `${hContainer.clientWidth}px`;
        this.hCanvas.style.height = `${hContainer.clientHeight}px`;
        this.hCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        // Vertical ruler
        this.vCanvas.width = vContainer.clientWidth * dpr;
        this.vCanvas.height = vContainer.clientHeight * dpr;
        this.vCanvas.style.width = `${vContainer.clientWidth}px`;
        this.vCanvas.style.height = `${vContainer.clientHeight}px`;
        this.vCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        this.render();
    }
    
    render() {
        this.renderHorizontal();
        this.renderVertical();
    }
    
    renderHorizontal() {
        const ctx = this.hCtx;
        const w = this.hCanvas.clientWidth;
        const h = this.hCanvas.clientHeight;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#161b22';
        ctx.fillRect(0, 0, w, h);
        
        // Get canvas container position relative to viewport
        const viewport = document.getElementById('canvas-viewport');
        const container = document.getElementById('canvas-container');
        const containerRect = container.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const offset = containerRect.left - viewportRect.left;
        
        const zoom = state.zoom;
        const pxPerMm = MM_TO_PX * zoom;
        const totalMm = state.pageWidth;
        
        ctx.save();
        ctx.translate(offset, 0);
        
        // Draw ticks
        for (let mm = 0; mm <= totalMm; mm++) {
            const x = mm * pxPerMm;
            const isMajor = mm % 10 === 0;
            const isMid = mm % 5 === 0;
            
            ctx.strokeStyle = '#484f58';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            
            let tickH;
            if (isMajor) {
                tickH = h;
                ctx.lineWidth = 1;
            } else if (isMid) {
                tickH = h * 0.5;
            } else {
                tickH = h * 0.25;
                // Skip minor ticks if too small
                if (pxPerMm < 2) continue;
            }
            
            ctx.moveTo(Math.round(x) + 0.5, h - tickH);
            ctx.lineTo(Math.round(x) + 0.5, h);
            ctx.stroke();
            
            // Label for major ticks
            if (isMajor && mm > 0) {
                ctx.fillStyle = '#8b949e';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(mm.toString(), x, 2);
            }
        }
        
        // Highlight cursor position
        if (this.mouseMMX >= 0 && this.mouseMMX <= totalMm) {
            const hx = this.mouseMMX * pxPerMm;
            ctx.fillStyle = 'rgba(88, 166, 255, 0.4)';
            ctx.fillRect(hx - 1, 0, 3, h);
        }
        
        ctx.restore();
    }
    
    renderVertical() {
        const ctx = this.vCtx;
        const w = this.vCanvas.clientWidth;
        const h = this.vCanvas.clientHeight;
        
        ctx.clearRect(0, 0, w, h);
        
        // Background
        ctx.fillStyle = '#161b22';
        ctx.fillRect(0, 0, w, h);
        
        // Get canvas container position relative to viewport
        const viewport = document.getElementById('canvas-viewport');
        const container = document.getElementById('canvas-container');
        const containerRect = container.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const offset = containerRect.top - viewportRect.top;
        
        const zoom = state.zoom;
        const pxPerMm = MM_TO_PX * zoom;
        const totalMm = state.pageHeight;
        
        ctx.save();
        ctx.translate(0, offset);
        
        // Draw ticks
        for (let mm = 0; mm <= totalMm; mm++) {
            const y = mm * pxPerMm;
            const isMajor = mm % 10 === 0;
            const isMid = mm % 5 === 0;
            
            ctx.strokeStyle = '#484f58';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            
            let tickW;
            if (isMajor) {
                tickW = w;
                ctx.lineWidth = 1;
            } else if (isMid) {
                tickW = w * 0.5;
            } else {
                tickW = w * 0.25;
                if (pxPerMm < 2) continue;
            }
            
            ctx.moveTo(w - tickW, Math.round(y) + 0.5);
            ctx.lineTo(w, Math.round(y) + 0.5);
            ctx.stroke();
            
            // Label for major ticks
            if (isMajor && mm > 0) {
                ctx.save();
                ctx.fillStyle = '#8b949e';
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.translate(8, y);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText(mm.toString(), 0, 0);
                ctx.restore();
            }
        }
        
        // Highlight cursor position
        if (this.mouseMMY >= 0 && this.mouseMMY <= totalMm) {
            const hy = this.mouseMMY * pxPerMm;
            ctx.fillStyle = 'rgba(88, 166, 255, 0.4)';
            ctx.fillRect(0, hy - 1, w, 3);
        }
        
        ctx.restore();
    }
    
    updateCursorPos(mmX, mmY) {
        this.mouseMMX = mmX;
        this.mouseMMY = mmY;
        this.render();
    }
}

export const rulerRenderer = new RulerRenderer();
