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
        
        const w = 5;
        const h = 5;
        
        const el = {
            type: 'button',
            x: parseFloat((snapped.x - w / 2).toFixed(1)),
            y: parseFloat((snapped.y - h / 2).toFixed(1)),
            w: w,
            h: h,
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
