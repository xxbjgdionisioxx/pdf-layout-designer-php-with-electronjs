// ============================================================
// FPDF Visual Layout Designer — Canvas Manager
// ============================================================

import { state } from './state.js';
import { MM_TO_PX } from './config.js';

class CanvasManager {
    constructor() {
        this.viewport = null;
        this.container = null;
        this.layers = {};
        this.contexts = {};
        this._initialized = false;
    }
    
    init() {
        this.viewport = document.getElementById('canvas-viewport');
        this.container = document.getElementById('canvas-container');
        
        const layerNames = ['pdf', 'grid', 'draw', 'cursor'];
        for (const name of layerNames) {
            const canvas = document.getElementById(`layer-${name}`);
            this.layers[name] = canvas;
            this.contexts[name] = canvas.getContext('2d');
        }
        
        this.resize();
        this._initialized = true;
        
        // Listen for zoom / page size changes
        state.on('zoomChanged', () => this.resize());
        state.on('pageSizeChanged', () => this.resize());
        state.on('projectLoaded', () => this.resize());
    }
    
    /**
     * Resize all canvas layers to match current page size × zoom
     */
    resize() {
        const w = state.pageWidth * MM_TO_PX * state.zoom;
        const h = state.pageHeight * MM_TO_PX * state.zoom;
        
        // The CSS size
        this.container.style.width = `${w}px`;
        this.container.style.height = `${h}px`;
        
        // High-DPI support
        const dpr = window.devicePixelRatio || 1;
        
        for (const name of Object.keys(this.layers)) {
            const canvas = this.layers[name];
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            
            const ctx = this.contexts[name];
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        
        state.emit('canvasResized');
    }
    
    /**
     * Clear a specific layer
     */
    clear(layerName) {
        const canvas = this.layers[layerName];
        const ctx = this.contexts[layerName];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    /**
     * Clear all layers
     */
    clearAll() {
        for (const name of Object.keys(this.layers)) {
            this.clear(name);
        }
    }
    
    /**
     * Get the canvas context for a layer
     */
    getContext(layerName) {
        return this.contexts[layerName];
    }
    
    /**
     * Convert screen coordinates (relative to canvas-container) to mm coordinates
     */
    screenToMm(screenX, screenY) {
        return {
            x: screenX / (MM_TO_PX * state.zoom),
            y: screenY / (MM_TO_PX * state.zoom),
        };
    }
    
    /**
     * Convert mm coordinates to screen coordinates (relative to canvas-container)
     */
    mmToScreen(mmX, mmY) {
        return {
            x: mmX * MM_TO_PX * state.zoom,
            y: mmY * MM_TO_PX * state.zoom,
        };
    }
    
    /**
     * Get mouse position in mm from a mouse event on the canvas
     */
    getMouseMm(event) {
        const rect = this.container.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;
        return this.screenToMm(screenX, screenY);
    }
    
    /**
     * Get mouse position in screen px relative to container
     */
    getMouseScreen(event) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }
    
    /**
     * Get the visible area of the viewport in mm
     */
    getViewportBounds() {
        const scrollLeft = this.viewport.scrollLeft;
        const scrollTop = this.viewport.scrollTop;
        const viewWidth = this.viewport.clientWidth;
        const viewHeight = this.viewport.clientHeight;
        
        const topLeft = this.screenToMm(scrollLeft, scrollTop);
        const bottomRight = this.screenToMm(scrollLeft + viewWidth, scrollTop + viewHeight);
        
        return {
            x: topLeft.x,
            y: topLeft.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        };
    }
    
    /**
     * Get pixel dimensions
     */
    getPixelSize() {
        return {
            width: state.pageWidth * MM_TO_PX * state.zoom,
            height: state.pageHeight * MM_TO_PX * state.zoom,
        };
    }
}

export const canvasManager = new CanvasManager();
