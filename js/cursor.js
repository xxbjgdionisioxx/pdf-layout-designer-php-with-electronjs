// ============================================================
// FPDF Visual Layout Designer — Cursor & Crosshair
// ============================================================

import { state } from './state.js';
import { canvasManager } from './canvas-manager.js';
import { MM_TO_PX, COLORS } from './config.js';

class CursorManager {
    constructor() {
        this.tooltip = null;
    }
    
    init() {
        // Create coordinate tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'coord-tooltip';
        this.tooltip.style.display = 'none';
        document.getElementById('canvas-viewport').appendChild(this.tooltip);
    }
    
    /**
     * Draw crosshair lines on cursor layer
     */
    drawCrosshair(screenX, screenY) {
        canvasManager.clear('cursor');
        
        const ctx = canvasManager.getContext('cursor');
        const size = canvasManager.getPixelSize();
        
        ctx.save();
        ctx.strokeStyle = COLORS.crosshair;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, size.height);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(size.width, screenY);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Update coordinate tooltip position and values
     */
    updateTooltip(event, mmX, mmY) {
        if (mmX < 0 || mmY < 0 || mmX > state.pageWidth || mmY > state.pageHeight) {
            this.tooltip.style.display = 'none';
            return;
        }
        
        this.tooltip.style.display = 'block';
        this.tooltip.textContent = `${mmX.toFixed(1)}, ${mmY.toFixed(1)} mm`;
        
        // Position tooltip near cursor
        const viewport = document.getElementById('canvas-viewport');
        const viewportRect = viewport.getBoundingClientRect();
        const offsetX = event.clientX - viewportRect.left + viewport.scrollLeft + 15;
        const offsetY = event.clientY - viewportRect.top + viewport.scrollTop - 5;
        
        this.tooltip.style.left = `${offsetX}px`;
        this.tooltip.style.top = `${offsetY}px`;
    }
    
    /**
     * Update bottom bar coordinate display
     */
    updateCoordDisplay(mmX, mmY) {
        document.getElementById('coord-x').textContent = mmX >= 0 ? mmX.toFixed(1) : '—';
        document.getElementById('coord-y').textContent = mmY >= 0 ? mmY.toFixed(1) : '—';
    }
    
    /**
     * Hide crosshair and tooltip
     */
    hide() {
        canvasManager.clear('cursor');
        if (this.tooltip) this.tooltip.style.display = 'none';
    }
    
    /**
     * Show a click marker animation at the clicked position
     */
    showClickMarker(event) {
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        
        const marker = document.createElement('div');
        marker.className = 'click-marker';
        marker.style.left = `${event.clientX - rect.left}px`;
        marker.style.top = `${event.clientY - rect.top}px`;
        container.appendChild(marker);
        
        marker.addEventListener('animationend', () => marker.remove());
    }
    
    /**
     * Copy coordinates to clipboard
     */
    async copyCoordinates(mmX, mmY) {
        const text = `${mmX.toFixed(1)}, ${mmY.toFixed(1)}`;
        try {
            await navigator.clipboard.writeText(text);
            showToast(`Copied: (${text}) mm`, 'success');
        } catch {
            showToast('Failed to copy coordinates', 'error');
        }
    }
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 2500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

export const cursorManager = new CursorManager();
