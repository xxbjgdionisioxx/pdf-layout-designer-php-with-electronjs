// ============================================================
// FPDF Visual Layout Designer — JSON Serializer
// ============================================================

import { state } from './state.js';
import { showToast } from './cursor.js';
import { history } from './history.js';

class Serializer {
    init() {
        document.getElementById('btn-save').addEventListener('click', () => this.saveProject());
        document.getElementById('btn-load').addEventListener('click', () => this.loadProject());
        
        // Bind Save Modal
        document.getElementById('modal-save-ok').addEventListener('click', () => this.confirmSave());
        document.getElementById('modal-save-filename').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmSave();
            }
        });
    }

    /**
     * Show the save modal
     */
    saveProject() {
        const modal = document.getElementById('modal-save');
        const input = document.getElementById('modal-save-filename');
        
        // Set default filename
        let defaultName = 'layout';
        if (state.pdfFilename) {
            defaultName = state.pdfFilename.replace(/\.pdf$/i, '');
        }
        
        input.value = defaultName;
        modal.style.display = 'flex';
        input.select();
        input.focus();
    }

    /**
     * Perform the actual save
     */
    confirmSave() {
        let filename = document.getElementById('modal-save-filename').value.trim() || 'layout';
        
        // Ensure clean .json extension
        filename = filename.replace(/\.(pdf|json)$/i, '');
        filename += '.json';

        const data = state.serialize();
        data.version = '1.0';
        data.appName = 'FPDF Layout Designer';
        data.savedAt = new Date().toISOString();

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        // Close modal
        document.getElementById('modal-save').style.display = 'none';
        
        showToast(`Project saved as ${filename}`, 'success');
    }

    /**
     * Load project from JSON file
     */
    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (data.appName !== 'FPDF Layout Designer') {
                    showToast('Invalid project file', 'error');
                    return;
                }

                history.clear();
                state.deserialize(data);

                // Update UI state
                this.syncUI(data);

                showToast('Project loaded!', 'success');

            } catch (err) {
                console.error('Load error:', err);
                showToast('Failed to load project: ' + err.message, 'error');
            }
        });

        input.click();
    }

    /**
     * Sync UI controls with loaded state
     */
    syncUI(data) {
        // Grid
        document.getElementById('btn-grid').classList.toggle('active', state.gridVisible);
        document.getElementById('grid-spacing').value = state.gridSpacing.toString();

        // Snap
        document.getElementById('btn-snap').classList.toggle('active', state.snapEnabled);

        // Margins
        document.getElementById('btn-margins').classList.toggle('active', state.marginsVisible);
        document.getElementById('margin-top').value = state.margins.top;
        document.getElementById('margin-right').value = state.margins.right;
        document.getElementById('margin-bottom').value = state.margins.bottom;
        document.getElementById('margin-left').value = state.margins.left;

        // Page size
        const template = data.pageTemplate || 'a4-portrait';
        document.getElementById('page-size-select').value = template;
    }
}

export const serializer = new Serializer();
