// js/db-explorer.js
import { state } from './state.js';
import { showToast } from './cursor.js';

class DatabaseExplorer {
    constructor() {
        this.explorerEl = null;
        this.treeEl = null;
        this.closeBtn = null;
        this.importBtn = null;
        this.searchInput = null;
        this.clearBtn = null;
        this.searchQuery = '';
    }

    init() {
        this.explorerEl = document.getElementById('db-explorer');
        this.treeEl = document.getElementById('db-schema-tree');
        this.closeBtn = document.getElementById('btn-toggle-db-sidebar');
        this.importBtn = document.getElementById('btn-import-db');
        this.searchInput = document.getElementById('db-search-input');
        this.clearBtn = document.getElementById('btn-clear-db-search');

        this.importBtn?.addEventListener('click', () => {
            const modal = document.getElementById('modal-db-import');
            if (modal) modal.style.display = 'flex';
        });

        this.searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        this.clearBtn?.addEventListener('click', () => {
            if (this.searchInput) {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.render();
                this.searchInput.focus();
            }
        });

        // Listen for schema loaded event
        window.addEventListener('db-schema-loaded', (e) => {
            state.dbSchema = e.detail;
            this.searchQuery = '';
            if (this.searchInput) this.searchInput.value = '';
            this.render();
            this.toggle(true);
            showToast('Database schema imported successfully', 'success');
        });

        // Listen for project loaded to re-render schema
        state.on('projectLoaded', () => {
            if (state.dbSchema) {
                this.render();
                this.toggle(true);
            } else {
                this.toggle(false);
            }
        });

        // Initial render if schema exists
        if (state.dbSchema) {
            this.render();
        }
    }

    toggle(show) {
        if (!this.explorerEl) return;
        if (show) {
            this.explorerEl.classList.remove('collapsed');
        } else {
            this.explorerEl.classList.add('collapsed');
        }

        const btn = document.getElementById('btn-toggle-db-explorer');
        if (btn) btn.classList.toggle('active', show);
    }

    highlight(text) {
        if (!this.searchQuery) return text;
        const regex = new RegExp(`(${this.searchQuery})`, 'gi');
        return text.replace(regex, '<span class="db-highlight">$1</span>');
    }

    render() {
        if (!this.treeEl) return;
        if (!state.dbSchema || !state.dbSchema.tables) {
            this.treeEl.innerHTML = '<p class="no-elements">No database imported</p>';
            return;
        }

        this.treeEl.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'db-tree';

        const filteredTables = state.dbSchema.tables.filter(table => 
            table.name.toLowerCase().includes(this.searchQuery) ||
            table.columns.some(col => col.name.toLowerCase().includes(this.searchQuery))
        );

        if (filteredTables.length === 0) {
            this.treeEl.innerHTML = `<p class="no-elements">${this.searchQuery ? 'No matching tables found' : 'No tables available'}</p>`;
            return;
        }

        filteredTables.forEach(table => {
            const li = document.createElement('li');
            li.className = 'db-table-node';
            
            // Auto-expand if searching and a column matches
            if (this.searchQuery && table.columns.some(col => col.name.toLowerCase().includes(this.searchQuery))) {
                li.classList.add('expanded');
            }

            const header = document.createElement('div');
            header.className = 'db-table-header';
            header.innerHTML = `
                <svg class="db-table-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                <span class="db-table-name">${this.highlight(table.name)}</span>
            `;

            const columnList = document.createElement('ul');
            columnList.className = 'db-column-list';

            table.columns.forEach(col => {
                const colLi = document.createElement('li');
                colLi.className = 'db-column-item';
                colLi.setAttribute('draggable', 'true');
                colLi.dataset.table = table.name;
                colLi.dataset.column = col.name;
                colLi.dataset.type = col.type;

                colLi.innerHTML = `
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                    </svg>
                    <span class="db-column-name">${this.highlight(col.name)}</span>
                    <span class="db-column-type">${col.type}</span>
                `;

                colLi.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        type: 'db-column',
                        table: table.name,
                        column: col.name,
                        dataType: col.type
                    }));
                });

                columnList.appendChild(colLi);
            });

            header.addEventListener('click', () => {
                li.classList.toggle('expanded');
            });

            li.appendChild(header);
            li.appendChild(columnList);
            ul.appendChild(li);
        });

        this.treeEl.appendChild(ul);
    }
}

export const dbExplorer = new DatabaseExplorer();
