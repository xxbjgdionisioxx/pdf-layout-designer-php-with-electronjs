// ============================================================
// FPDF Visual Layout Designer — Select Tool
// ============================================================

import { state } from '../state.js';
import { canvasManager } from '../canvas-manager.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';
import { drawRenderer } from '../draw-renderer.js';
import { MM_TO_PX } from '../config.js';

class SelectTool {
    constructor() {
        this.dragStartMm = null;
        this.dragOffsets = null; // offsets for each selected element
        this.resizeStartEl = null;
        this.resizeHandle = null;
        this.resizeStartBounds = null;
    }
    
    onMouseDown(e, mmX, mmY) {
        const scale = MM_TO_PX * state.zoom;
        const screenPos = canvasManager.getMouseScreen(e);
        
        // Check if clicking on a resize handle
        if (state.selectedElements.length === 1) {
            const el = state.selectedElements[0];
            const bounds = drawRenderer.getElementScreenBounds(el, scale);
            if (bounds) {
                const handles = drawRenderer.getHandlePositions(bounds.x, bounds.y, bounds.w, bounds.h);
                for (const h of handles) {
                    if (Math.abs(screenPos.x - h.x) < 6 && Math.abs(screenPos.y - h.y) < 6) {
                        // Start resizing
                        state.isResizing = true;
                        this.resizeHandle = h.pos;
                        this.resizeStartEl = JSON.parse(JSON.stringify(el));
                        this.resizeStartBounds = { ...bounds };
                        history.pushState('resize');
                        return;
                    }
                }
            }
        }
        
        // Check if clicking on an element
        const elements = state.getPageElements();
        let clicked = null;
        
        // Iterate in reverse (top element first)
        for (let i = elements.length - 1; i >= 0; i--) {
            if (this.hitTest(elements[i], mmX, mmY)) {
                clicked = elements[i];
                break;
            }
        }
        
        if (clicked) {
            const addToSelection = e.shiftKey;
            if (!addToSelection && !state.selectedElements.includes(clicked)) {
                state.selectElement(clicked, false);
            } else if (addToSelection) {
                state.selectElement(clicked, true);
            }
            
            // Start dragging
            state.isDragging = true;
            this.dragStartMm = { x: mmX, y: mmY };
            
            // Store offsets for all selected elements
            this.dragOffsets = state.selectedElements.map(el => {
                if (el.type === 'line') {
                    return { dx1: el.x1 - mmX, dy1: el.y1 - mmY, dx2: el.x2 - mmX, dy2: el.y2 - mmY };
                }
                return { dx: el.x - mmX, dy: el.y - mmY };
            });
            
            history.pushState('move');
        } else {
            state.clearSelection();
        }
    }
    
    onMouseMove(e, mmX, mmY) {
        const scale = MM_TO_PX * state.zoom;
        
        // Handle resizing
        if (state.isResizing && state.selectedElements.length === 1) {
            const el = state.selectedElements[0];
            const snapped = snapManager.snapResize(mmX, mmY);
            this.applyResize(el, snapped.x, snapped.y);
            state.emit('elementsChanged');
            return;
        }
        
        // Handle dragging
        if (state.isDragging && this.dragOffsets) {
            const snapped = snapManager.snapPoint(mmX, mmY);
            
            state.selectedElements.forEach((el, i) => {
                const off = this.dragOffsets[i];
                if (el.type === 'line') {
                    el.x1 = snapped.x + off.dx1;
                    el.y1 = snapped.y + off.dy1;
                    el.x2 = snapped.x + off.dx2;
                    el.y2 = snapped.y + off.dy2;
                } else {
                    el.x = snapped.x + off.dx;
                    el.y = snapped.y + off.dy;
                }
            });
            
            state.emit('elementsChanged');
            return;
        }
        
        // Hover cursor change
        const drawCanvas = canvasManager.layers.draw;
        let cursorSet = false;
        
        // Check handles
        if (state.selectedElements.length === 1) {
            const el = state.selectedElements[0];
            const bounds = drawRenderer.getElementScreenBounds(el, scale);
            if (bounds) {
                const screenPos = canvasManager.getMouseScreen(e);
                const handles = drawRenderer.getHandlePositions(bounds.x, bounds.y, bounds.w, bounds.h);
                for (const h of handles) {
                    if (Math.abs(screenPos.x - h.x) < 6 && Math.abs(screenPos.y - h.y) < 6) {
                        drawCanvas.style.cursor = h.cursor;
                        cursorSet = true;
                        break;
                    }
                }
            }
        }
        
        if (!cursorSet) {
            // Check if hovering over any element
            const elements = state.getPageElements();
            let hovered = false;
            for (let i = elements.length - 1; i >= 0; i--) {
                if (this.hitTest(elements[i], mmX, mmY)) {
                    drawCanvas.style.cursor = 'move';
                    hovered = true;
                    break;
                }
            }
            if (!hovered) {
                drawCanvas.style.cursor = 'crosshair';
            }
        }
    }
    
    onMouseUp(e, mmX, mmY) {
        state.isDragging = false;
        state.isResizing = false;
        this.dragStartMm = null;
        this.dragOffsets = null;
        this.resizeHandle = null;
        this.resizeStartEl = null;
        
        state.emit('selectionChanged');
    }
    
    /**
     * Hit test: is the point (mmX, mmY) inside the element?
     */
    hitTest(el, mmX, mmY) {
        const margin = 2; // mm tolerance
        
        switch (el.type) {
            case 'rect':
            case 'image':
            case 'table':
                return mmX >= el.x - margin && mmX <= el.x + el.w + margin &&
                       mmY >= el.y - margin && mmY <= el.y + el.h + margin;
            
            case 'text': {
                const w = el.w || 40;
                const h = el.h || 6;
                return mmX >= el.x - margin && mmX <= el.x + w + margin &&
                       mmY >= el.y - margin && mmY <= el.y + h + margin;
            }
            
            case 'line': {
                // Distance from point to line segment
                const dist = this.pointToLineDist(mmX, mmY, el.x1, el.y1, el.x2, el.y2);
                return dist < margin + 1;
            }
            
            case 'point': {
                // Circular hit area around point center
                const dx = mmX - el.x;
                const dy = mmY - el.y;
                return Math.sqrt(dx * dx + dy * dy) < 4; // 4mm radius
            }
            
            default:
                return false;
        }
    }
    
    pointToLineDist(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }
        
        return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
    }
    
    /**
     * Apply resize based on handle position
     */
    applyResize(el, mmX, mmY) {
        const orig = this.resizeStartEl;
        const h = this.resizeHandle;
        
        if (el.type === 'line') {
            if (h === 'tl' || h === 'bl' || h === 'ml') { el.x1 = mmX; el.y1 = mmY; }
            if (h === 'tr' || h === 'br' || h === 'mr') { el.x2 = mmX; el.y2 = mmY; }
            return;
        }
        
        // For rect/image/table/text
        const minSize = 2; // minimum mm
        
        switch (h) {
            case 'tl':
                el.w = Math.max(minSize, orig.x + orig.w - mmX);
                el.h = Math.max(minSize, orig.y + orig.h - mmY);
                el.x = orig.x + orig.w - el.w;
                el.y = orig.y + orig.h - el.h;
                break;
            case 'tm':
                el.h = Math.max(minSize, orig.y + orig.h - mmY);
                el.y = orig.y + orig.h - el.h;
                break;
            case 'tr':
                el.w = Math.max(minSize, mmX - orig.x);
                el.h = Math.max(minSize, orig.y + orig.h - mmY);
                el.y = orig.y + orig.h - el.h;
                break;
            case 'mr':
                el.w = Math.max(minSize, mmX - orig.x);
                break;
            case 'br':
                el.w = Math.max(minSize, mmX - orig.x);
                el.h = Math.max(minSize, mmY - orig.y);
                break;
            case 'bm':
                el.h = Math.max(minSize, mmY - orig.y);
                break;
            case 'bl':
                el.w = Math.max(minSize, orig.x + orig.w - mmX);
                el.h = Math.max(minSize, mmY - orig.y);
                el.x = orig.x + orig.w - el.w;
                break;
            case 'ml':
                el.w = Math.max(minSize, orig.x + orig.w - mmX);
                el.x = orig.x + orig.w - el.w;
                break;
        }
    }
}

export const selectTool = new SelectTool();
