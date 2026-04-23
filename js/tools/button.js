// ============================================================
// FPDF Visual Layout Designer — Button Tool
// ============================================================

import { state } from '../state.js';
import { snapManager } from '../snap.js';
import { history } from '../history.js';

class ButtonTool {
    constructor() {}
    
    onMouseDown(e, mmX, mmY) {
        const snapped = snapManager.snapPoint(mmX, mmY);
        
        history.pushState('add button');
        
        const el = {
            type: 'button',
            x: parseFloat(snapped.x.toFixed(1)),
            y: parseFloat(snapped.y.toFixed(1)),
            w: 5, // Default width 5mm
            h: 5, // Default height 5mm
            label: 'group',
            buttonType: 'radio',
            buttonValue: 'Value',
        };
        
        state.addElement(el);
        state.selectElement(el);
        
        // Automatically switch back to select tool so they can immediately adjust or clone
        state.setTool('select');
    }
    
    onMouseMove(e, mmX, mmY) {
        // No-op
    }
    
    onMouseUp(e, mmX, mmY) {
        // No-op
    }
}

export const buttonTool = new ButtonTool();
