// ============================================================
// FPDF Visual Layout Designer — Global State
// ============================================================

import { DEFAULTS, TOOL_TYPES } from './config.js';

class AppState {
    constructor() {
        // Tool state
        this.currentTool = TOOL_TYPES.SELECT;
        
        // Page state
        this.pageTemplate = DEFAULTS.pageTemplate;
        this.pageWidth = DEFAULTS.pageWidth;
        this.pageHeight = DEFAULTS.pageHeight;
        this.currentPage = 1;
        this.totalPages = 1;
        
        // View state
        this.zoom = DEFAULTS.zoom;
        this.gridSpacing = DEFAULTS.gridSpacing;
        this.gridVisible = DEFAULTS.gridVisible;
        this.snapEnabled = DEFAULTS.snapEnabled;
        this.marginsVisible = DEFAULTS.marginsVisible;
        this.margins = { ...DEFAULTS.margins };
        
        // PDF state
        this.pdfDoc = null;
        this.pdfPages = new Map(); // pageNum -> rendered ImageData
        this.pdfSource = null; // Base64 or ArrayBuffer of the source PDF
        this.pdfFilename = null;
        
        // Elements: Map<pageNum, Element[]>
        this.elements = new Map();
        this.elements.set(1, []);
        
        // Selection state
        this.selectedElements = [];
        this.hoveredElement = null;
        
        // Drawing state (used during drag operations)
        this.isDrawing = false;
        this.drawStart = null;
        this.drawCurrent = null;
        
        // Drag/resize state
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
        this.dragOffset = null;
        
        // Mouse state
        this.mouseX = 0; // in mm
        this.mouseY = 0; // in mm
        this.mouseScreenX = 0;
        this.mouseScreenY = 0;
        
        // Listeners
        this._listeners = {};
        
        // Element ID counter
        this._nextId = 1;
    }
    
    // ---- Event system ----
    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
    }
    
    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }
    
    emit(event, data) {
        if (!this._listeners[event]) return;
        for (const fn of this._listeners[event]) fn(data);
    }
    
    // ---- Element management ----
    generateId() {
        return this._nextId++;
    }
    
    getPageElements(page = this.currentPage) {
        if (!this.elements.has(page)) {
            this.elements.set(page, []);
        }
        return this.elements.get(page);
    }
    
    addElement(element) {
        element.id = this.generateId();
        element.page = this.currentPage;
        this.getPageElements().push(element);
        this.emit('elementsChanged');
        return element;
    }
    
    removeElement(id) {
        const elements = this.getPageElements();
        const idx = elements.findIndex(e => e.id === id);
        if (idx !== -1) {
            elements.splice(idx, 1);
            this.selectedElements = this.selectedElements.filter(e => e.id !== id);
            this.emit('elementsChanged');
        }
    }
    
    clearSelection() {
        this.selectedElements = [];
        this.emit('selectionChanged');
    }
    
    selectElement(element, addToSelection = false) {
        if (addToSelection) {
            const index = this.selectedElements.indexOf(element);
            if (index !== -1) {
                this.selectedElements.splice(index, 1);
            } else {
                this.selectedElements.push(element);
            }
        } else {
            this.selectedElements = [element];
        }
        this.emit('selectionChanged');
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.clearSelection();
        this.emit('toolChanged', tool);
    }
    
    setZoom(zoom) {
        this.zoom = Math.max(0.25, Math.min(3.0, zoom));
        this.emit('zoomChanged', this.zoom);
    }
    
    setPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.clearSelection();
            this.emit('pageChanged', page);
        }
    }
    
    setPageSize(width, height) {
        this.pageWidth = width;
        this.pageHeight = height;
        this.emit('pageSizeChanged');
    }
    
    // Serialize for save
    serialize() {
        const elementsObj = {};
        for (const [page, els] of this.elements) {
            elementsObj[page] = els.map(e => ({ ...e }));
        }
        return {
            pageTemplate: this.pageTemplate,
            pageWidth: this.pageWidth,
            pageHeight: this.pageHeight,
            totalPages: this.totalPages,
            margins: { ...this.margins },
            gridSpacing: this.gridSpacing,
            gridVisible: this.gridVisible,
            snapEnabled: this.snapEnabled,
            marginsVisible: this.marginsVisible,
            elements: elementsObj,
            nextId: this._nextId,
            pdfSource: this.pdfSource,
            pdfFilename: this.pdfFilename,
        };
    }
    
    // Deserialize from save
    deserialize(data) {
        this.pageTemplate = data.pageTemplate || DEFAULTS.pageTemplate;
        this.pageWidth = data.pageWidth || DEFAULTS.pageWidth;
        this.pageHeight = data.pageHeight || DEFAULTS.pageHeight;
        this.totalPages = data.totalPages || 1;
        this.margins = data.margins || { ...DEFAULTS.margins };
        this.gridSpacing = data.gridSpacing || DEFAULTS.gridSpacing;
        this.gridVisible = data.gridVisible !== undefined ? data.gridVisible : DEFAULTS.gridVisible;
        this.snapEnabled = data.snapEnabled !== undefined ? data.snapEnabled : DEFAULTS.snapEnabled;
        this.marginsVisible = data.marginsVisible !== undefined ? data.marginsVisible : DEFAULTS.marginsVisible;
        this._nextId = data.nextId || 1;
        this.pdfSource = data.pdfSource || null;
        this.pdfFilename = data.pdfFilename || null;
        
        this.elements = new Map();
        if (data.elements) {
            for (const [page, els] of Object.entries(data.elements)) {
                this.elements.set(parseInt(page), els);
            }
        }
        if (!this.elements.has(1)) {
            this.elements.set(1, []);
        }
        
        this.currentPage = 1;
        this.selectedElements = [];
        this.emit('projectLoaded');
    }
}

export const state = new AppState();
