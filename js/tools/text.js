// ============================================================
// FPDF Visual Layout Designer — Text Tool
// ============================================================

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class TextTool {
    constructor() {
        this.pendingPos = null;
    }
    
    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        this.pendingPos = { x: snapped.x, y: snapped.y };
        
        // Show text input modal
        this.showModal();
    }
    
    onMouseMove(e, mmX, mmY) {
        // No-op
    }
    
    onMouseUp(e, mmX, mmY) {
        // No-op
    }
    
    showModal() {
        const modal = document.getElementById('modal-text');
        const input = document.getElementById('modal-text-content');
        const fontSizeInput = document.getElementById('modal-font-size');
        const fontStyleSelect = document.getElementById('modal-font-style');
        
        // Reset fields
        input.value = '';
        fontSizeInput.value = '12';
        fontStyleSelect.value = '';
        
        modal.style.display = 'flex';
        
        // Focus input after a tick
        setTimeout(() => input.focus(), 50);
    }
    
    /**
     * Called when the modal "Add Text" button is clicked
     */
    confirmText() {
        const content = document.getElementById('modal-text-content').value.trim();
        const fontSize = parseFloat(document.getElementById('modal-font-size').value) || 12;
        const fontStyle = document.getElementById('modal-font-style').value;
        
        if (!content || !this.pendingPos) {
            this.pendingPos = null;
            return;
        }
        
        history.pushState('add text');
        
        const el = {
            type: 'text',
            x: parseFloat(this.pendingPos.x.toFixed(1)),
            y: parseFloat(this.pendingPos.y.toFixed(1)),
            content: content,
            fontSize: fontSize,
            fontStyle: fontStyle,
            w: 0, // computed during render
            h: 0,
        };
        
        state.addElement(el);
        state.selectElement(el);
        
        this.pendingPos = null;
        
        // Close modal
        document.getElementById('modal-text').style.display = 'none';
    }
    
    cancelText() {
        this.pendingPos = null;
        document.getElementById('modal-text').style.display = 'none';
    }
}

export const textTool = new TextTool();
