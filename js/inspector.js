// ============================================================
// FPDF Visual Layout Designer — Object Inspector Panel
// ============================================================

import { state } from './state.js';
import { history } from './history.js';

class Inspector {
    init() {
        state.on('selectionChanged', () => this.update());
        state.on('elementsChanged', () => {
            this.updateElementsList();
            this.updateSelectionFields();
        });
        state.on('pageChanged', () => this.updateElementsList());
        state.on('projectLoaded', () => this.updateElementsList());

        this.bindInputs();
        this.updateElementsList();
    }

    bindInputs() {
        // Position / size inputs
        const fields = ['sel-x', 'sel-y', 'sel-w', 'sel-h'];
        fields.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => this.applyChanges());
                input.addEventListener('input', () => this.applyChanges());
            }
        });

        // Text fields
        const textInput = document.getElementById('sel-text');
        if (textInput) {
            textInput.addEventListener('input', () => this.applyChanges());
        }

        const fontSizeInput = document.getElementById('sel-font-size');
        if (fontSizeInput) {
            fontSizeInput.addEventListener('change', () => this.applyChanges());
        }

        const fontStyleSelect = document.getElementById('sel-font-style');
        if (fontStyleSelect) {
            fontStyleSelect.addEventListener('change', () => this.applyChanges());
        }

        // Labels for Rect, Image, Table
        const imgLabel = document.getElementById('sel-img-label');
        if (imgLabel) imgLabel.addEventListener('input', () => this.applyChanges());

        const rectLabel = document.getElementById('sel-rect-label');
        if (rectLabel) rectLabel.addEventListener('input', () => this.applyChanges());

        const tableLabel = document.getElementById('sel-table-label');
        if (tableLabel) tableLabel.addEventListener('input', () => this.applyTableChanges());

        const tableLoop = document.getElementById('sel-table-loop');
        if (tableLoop) tableLoop.addEventListener('change', () => this.applyTableChanges());

        const tableVar = document.getElementById('sel-table-var');
        if (tableVar) tableVar.addEventListener('input', () => this.applyTableChanges());

        // Table rows/cols
        const rowsInput = document.getElementById('sel-rows');
        const colsInput = document.getElementById('sel-cols');
        if (rowsInput) rowsInput.addEventListener('change', () => this.applyTableChanges());
        if (colsInput) colsInput.addEventListener('change', () => this.applyTableChanges());

        // Point fields
        const ptFields = ['sel-point-label', 'sel-point-cell-w', 'sel-point-cell-h', 'sel-point-font-size'];
        ptFields.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.applyPointChanges());
                input.addEventListener('change', () => this.applyPointChanges());
            }
        });

        // Checkbox fields
        ['sel-checkbox-label', 'sel-checkbox-col'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.applyFormFieldChanges('checkbox'));
        });
        const cbType = document.getElementById('sel-checkbox-type');
        if (cbType) cbType.addEventListener('change', () => this.applyFormFieldChanges('checkbox'));

        // Inputbox fields
        ['sel-inputbox-label', 'sel-inputbox-col'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.applyFormFieldChanges('inputbox'));
        });
        const ibType = document.getElementById('sel-inputbox-type');
        if (ibType) ibType.addEventListener('change', () => this.applyFormFieldChanges('inputbox'));

        // Delete button
        document.getElementById('btn-delete-selected').addEventListener('click', () => {
            this.deleteSelected();
        });
    }

    update() {
        const selSection = document.getElementById('selection-section');
        const noSelSection = document.getElementById('no-selection-section');

        if (state.selectedElements.length === 0) {
            selSection.style.display = 'none';
            noSelSection.style.display = 'block';
            return;
        }

        selSection.style.display = 'block';
        noSelSection.style.display = 'none';

        this.updateSelectionFields();
    }

    updateSelectionFields() {
        if (state.selectedElements.length === 0) return;

        const el = state.selectedElements[0]; // Primary selection

        // Type
        document.getElementById('sel-type').textContent = el.type.charAt(0).toUpperCase() + el.type.slice(1);

        // Position
        if (el.type === 'line') {
            document.getElementById('sel-x').value = el.x1?.toFixed(1) ?? '';
            document.getElementById('sel-y').value = el.y1?.toFixed(1) ?? '';
            document.getElementById('sel-w').value = Math.abs((el.x2 - el.x1) || 0).toFixed(1);
            document.getElementById('sel-h').value = Math.abs((el.y2 - el.y1) || 0).toFixed(1);
        } else {
            document.getElementById('sel-x').value = el.x?.toFixed(1) ?? '';
            document.getElementById('sel-y').value = el.y?.toFixed(1) ?? '';
            document.getElementById('sel-w').value = el.w?.toFixed(1) ?? '';
            document.getElementById('sel-h').value = el.h?.toFixed(1) ?? '';
        }

        // Type-specific fields
        document.getElementById('rect-fields').style.display = el.type === 'rect' ? 'block' : 'none';
        document.getElementById('text-fields').style.display = el.type === 'text' ? 'block' : 'none';
        document.getElementById('image-fields').style.display = el.type === 'image' ? 'block' : 'none';
        document.getElementById('table-fields').style.display = el.type === 'table' ? 'block' : 'none';
        document.getElementById('point-fields').style.display = el.type === 'point' ? 'block' : 'none';
        document.getElementById('checkbox-fields').style.display = el.type === 'checkbox' ? 'block' : 'none';
        document.getElementById('inputbox-fields').style.display = el.type === 'inputbox' ? 'block' : 'none';

        if (el.type === 'rect') {
            document.getElementById('sel-rect-label').value = el.label || '';
        }

        if (el.type === 'text') {
            document.getElementById('sel-text').value = el.content || '';
            document.getElementById('sel-font-size').value = el.fontSize || 11;
            document.getElementById('sel-font-style').value = el.fontStyle || '';
        }

        if (el.type === 'image') {
            document.getElementById('sel-img-label').value = el.label || '';
        }

        if (el.type === 'table') {
            document.getElementById('sel-table-label').value = el.label || '';
            document.getElementById('sel-table-loop').checked = !!el.isLoop;
            document.getElementById('sel-table-var').value = el.loopVar || '';
            document.getElementById('sel-rows').value = el.rows || 3;
            document.getElementById('sel-cols').value = el.cols || 3;
        }

        if (el.type === 'point') {
            document.getElementById('sel-point-label').value = el.label || '';
            document.getElementById('sel-point-cell-w').value = el.cellW !== undefined ? el.cellW : 0;
            document.getElementById('sel-point-cell-h').value = el.cellH !== undefined ? el.cellH : 10;
            document.getElementById('sel-point-font-size').value = el.fontSize || 11;
        }

        if (el.type === 'checkbox') {
            document.getElementById('sel-checkbox-label').value = el.label || '';
            document.getElementById('sel-checkbox-col').value = el.dbColumn || '';
            document.getElementById('sel-checkbox-type').value = el.dbType || 'BOOLEAN';
        }

        if (el.type === 'inputbox') {
            document.getElementById('sel-inputbox-label').value = el.label || '';
            document.getElementById('sel-inputbox-col').value = el.dbColumn || '';
            document.getElementById('sel-inputbox-type').value = el.dbType || 'VARCHAR(255)';
        }
    }

    applyChanges() {
        if (state.selectedElements.length === 0) return;

        const el = state.selectedElements[0];

        if (el.type === 'line') {
            const x1 = parseFloat(document.getElementById('sel-x').value);
            const y1 = parseFloat(document.getElementById('sel-y').value);
            if (!isNaN(x1)) el.x1 = x1;
            if (!isNaN(y1)) el.y1 = y1;
        } else {
            const x = parseFloat(document.getElementById('sel-x').value);
            const y = parseFloat(document.getElementById('sel-y').value);
            const w = parseFloat(document.getElementById('sel-w').value);
            const h = parseFloat(document.getElementById('sel-h').value);

            if (!isNaN(x)) el.x = x;
            if (!isNaN(y)) el.y = y;
            if (!isNaN(w) && w > 0) el.w = w;
            if (!isNaN(h) && h > 0) el.h = h;
        }

        if (el.type === 'text') {
            el.content = document.getElementById('sel-text').value;
            el.fontSize = parseFloat(document.getElementById('sel-font-size').value) || 12;
            el.fontStyle = document.getElementById('sel-font-style').value;
        }

        if (el.type === 'rect') {
            el.label = document.getElementById('sel-rect-label').value;
        }

        if (el.type === 'image') {
            el.label = document.getElementById('sel-img-label').value;
        }

        state.emit('elementsChanged');
    }

    applyTableChanges() {
        if (state.selectedElements.length === 0) return;
        const el = state.selectedElements[0];
        if (el.type !== 'table') return;

        const rows = parseInt(document.getElementById('sel-rows').value) || 3;
        const cols = parseInt(document.getElementById('sel-cols').value) || 3;

        el.label = document.getElementById('sel-table-label').value;
        el.isLoop = document.getElementById('sel-table-loop').checked;
        el.loopVar = document.getElementById('sel-table-var').value || '$items';
        el.rows = rows;
        el.cols = cols;
        el.colWidths = Array(cols).fill(parseFloat((el.w / cols).toFixed(1)));
        el.rowHeights = Array(rows).fill(parseFloat((el.h / rows).toFixed(1)));

        state.emit('elementsChanged');
    }

    applyPointChanges() {
        if (state.selectedElements.length === 0) return;
        const el = state.selectedElements[0];
        if (el.type !== 'point') return;

        el.label = document.getElementById('sel-point-label').value;
        el.cellW = parseFloat(document.getElementById('sel-point-cell-w').value) || 0;
        el.cellH = parseFloat(document.getElementById('sel-point-cell-h').value) || 10;
        el.fontSize = parseFloat(document.getElementById('sel-point-font-size').value) || 12;

        state.emit('elementsChanged');
    }

    applyFormFieldChanges(type) {
        if (state.selectedElements.length === 0) return;
        const el = state.selectedElements[0];
        if (el.type !== type) return;

        if (type === 'checkbox') {
            el.label    = document.getElementById('sel-checkbox-label').value;
            el.dbColumn = document.getElementById('sel-checkbox-col').value;
            el.dbType   = document.getElementById('sel-checkbox-type').value;
        } else if (type === 'inputbox') {
            el.label    = document.getElementById('sel-inputbox-label').value;
            el.dbColumn = document.getElementById('sel-inputbox-col').value;
            el.dbType   = document.getElementById('sel-inputbox-type').value;
        }

        state.emit('elementsChanged');
    }

    deleteSelected() {
        if (state.selectedElements.length === 0) return;

        history.pushState('delete');

        const ids = state.selectedElements.map(e => e.id);
        ids.forEach(id => state.removeElement(id));

        state.clearSelection();
    }

    updateElementsList() {
        const list = document.getElementById('elements-list');
        const count = document.getElementById('element-count');
        const elements = state.getPageElements();

        count.textContent = elements.length;

        if (elements.length === 0) {
            list.innerHTML = '<p class="no-elements">No elements on this page</p>';
            return;
        }

        const icons = { rect: '▭', text: 'T', line: '╱', image: '🖼', table: '⊞', point: '◎', checkbox: '☑', inputbox: '▤' };

        list.innerHTML = elements.map(el => {
            const isSelected = state.selectedElements.includes(el);
            const icon = icons[el.type] || '?';
            let name = el.type.charAt(0).toUpperCase() + el.type.slice(1);
            if (el.type === 'text' && el.content) {
                name = el.content.substring(0, 16);
            }
            if (el.type === 'image' && el.label) {
                name = el.label;
            }
            if (el.type === 'point' && el.label) {
                name = '◎ ' + el.label.substring(0, 14);
            }

            let posStr;
            if (el.type === 'line') {
                posStr = `${el.x1?.toFixed(0)},${el.y1?.toFixed(0)}`;
            } else {
                posStr = `${el.x?.toFixed(0)},${el.y?.toFixed(0)}`;
            }

            return `<div class="element-item${isSelected ? ' selected' : ''}" data-id="${el.id}">
                <span class="el-icon">${icon}</span>
                <span class="el-name">${name}</span>
                <span class="el-pos">${posStr}</span>
            </div>`;
        }).join('');

        // Click handlers
        list.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = parseInt(item.dataset.id);
                const el = elements.find(el => el.id === id);
                if (el) {
                    state.selectElement(el, e.shiftKey);
                }
            });
        });
    }
}

export const inspector = new Inspector();
