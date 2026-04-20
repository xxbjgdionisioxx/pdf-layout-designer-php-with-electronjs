// ============================================================
// FPDF Visual Layout Designer — Undo/Redo History
// ============================================================

import { state } from './state.js';

class HistoryManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
    }
    
    /**
     * Save current state snapshot for undo
     */
    pushState(actionLabel = '') {
        const snapshot = this._captureSnapshot();
        snapshot.label = actionLabel;
        this.undoStack.push(snapshot);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        // Clear redo stack on new action
        this.redoStack = [];
        this._updateButtons();
    }
    
    undo() {
        if (this.undoStack.length === 0) return;
        
        // Save current state to redo stack
        const currentSnapshot = this._captureSnapshot();
        this.redoStack.push(currentSnapshot);
        
        // Restore previous state
        const prevSnapshot = this.undoStack.pop();
        this._restoreSnapshot(prevSnapshot);
        this._updateButtons();
        state.emit('elementsChanged');
        state.emit('selectionChanged');
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        // Save current state to undo stack
        const currentSnapshot = this._captureSnapshot();
        this.undoStack.push(currentSnapshot);
        
        // Restore redo state
        const nextSnapshot = this.redoStack.pop();
        this._restoreSnapshot(nextSnapshot);
        this._updateButtons();
        state.emit('elementsChanged');
        state.emit('selectionChanged');
    }
    
    _captureSnapshot() {
        const elementsObj = {};
        for (const [page, els] of state.elements) {
            elementsObj[page] = els.map(e => JSON.parse(JSON.stringify(e)));
        }
        return {
            elements: elementsObj,
            selectedIds: state.selectedElements.map(e => e.id),
        };
    }
    
    _restoreSnapshot(snapshot) {
        state.elements = new Map();
        for (const [page, els] of Object.entries(snapshot.elements)) {
            state.elements.set(parseInt(page), els);
        }
        
        // Restore selection
        const pageEls = state.getPageElements();
        state.selectedElements = pageEls.filter(e => snapshot.selectedIds.includes(e.id));
    }
    
    _updateButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.disabled = this.undoStack.length === 0;
        if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
    }
    
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this._updateButtons();
    }
}

export const history = new HistoryManager();
