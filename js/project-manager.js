// ============================================================
// FPDF Visual Layout Designer — Project Manager
// ============================================================

import { state } from './state.js';
import { history } from './history.js';
import { showToast } from './cursor.js';
import { pdfRenderer } from './pdf-renderer.js';

class ProjectManager {
    constructor() {
        this.dbName = 'FPDF_Designer_DB';
        this.storeName = 'projects';
        this.db = null;
        this.currentProjectId = null;
    }

    async init() {
        // Bind UI synchronously so they are active even if DB fails or delays
        document.getElementById('btn-new-project')?.addEventListener('click', () => this.createNewProject());
        document.getElementById('btn-projects')?.addEventListener('click', () => this.showProjectsModal());
        document.getElementById('btn-create-new-project')?.addEventListener('click', () => {
            document.getElementById('modal-projects').style.display = 'none';
            this.createNewProject();
        });

        try {
            await this.initDB();
            
            // Load current project or create new
            const savedProject = localStorage.getItem('currentProjectId');
            if (savedProject) {
                await this.loadProject(savedProject);
            } else {
                await this.createNewProject();
            }

            // Auto-save listeners
            const deferredSave = this.debounce(() => this.autoSave(), 1000);
            state.on('elementsChanged', deferredSave);
            state.on('pageChanged', deferredSave);
            state.on('pageSizeChanged', deferredSave);
            state.on('pdfLoaded', deferredSave);

        } catch (err) {
            console.error('Project Manager Init Error:', err);
        }
    }

    initDB() {
        return Promise.resolve(); // Handled by PHP Postgres backend
    }

    async autoSave() {
        if (!this.currentProjectId) return;

        const data = state.serialize();
        data.id = this.currentProjectId;
        data.name = state.pdfFilename ? state.pdfFilename.replace(/\.pdf$/i, '') : 'Untitled Project';
        data.updatedAt = new Date().toISOString();
        data.appName = 'FPDF Layout Designer';

        try {
            await this.saveToDB(data);
        } catch (err) {
            console.error('AutoSave failed:', err);
        }
    }

    async createNewProject() {
        history.clear();
        state.deserialize({}); // Reset state to defaults

        // Explicitly clear any loaded PDF so the old background is gone
        state.pdfSource   = null;
        state.pdfFilename = null;
        state.pdfDoc      = null;
        pdfRenderer.pdfDoc = null;
        pdfRenderer.pageCache.clear();

        this.currentProjectId = 'proj_' + Date.now();
        localStorage.setItem('currentProjectId', this.currentProjectId);

        pdfRenderer.drawBlankPage();
        pdfRenderer.updatePageUI();
        state.emit('elementsChanged');

        await this.autoSave();
        showToast('New project created', 'success');
    }

    async loadProject(id) {
        try {
            const project = await this.getFromDB(id);
            if (project) {
                history.clear();
                state.deserialize(project);
                this.currentProjectId = id;
                localStorage.setItem('currentProjectId', id);
                this.syncUI(project);
            } else {
                await this.createNewProject();
            }
        } catch (err) {
            console.error('Load project failed:', err);
            await this.createNewProject();
        }
    }

    async deleteProject(id) {
        try {
            await this.removeFromDB(id);
            if (this.currentProjectId === id) {
                await this.createNewProject();
            } else {
                this.showProjectsModal(); // Refresh list
            }
            showToast('Project deleted', 'info');
        } catch (err) {
            console.error('Delete project failed:', err);
        }
    }

    async showProjectsModal() {
        try {
            const projects = await this.getAllFromDB();
            const list = document.getElementById('projects-list');
            
            if (projects.length === 0) {
                list.innerHTML = '<p class="no-elements">No existing projects.</p>';
            } else {
                // Sort by updatedAt descending
                projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                
                list.innerHTML = projects.map(p => `
                    <div class="project-item ${p.id === this.currentProjectId ? 'active-project' : ''}" data-id="${p.id}">
                        <div class="project-info" onclick="window.projectManager.loadProjectAndClose('${p.id}')">
                            <span class="project-name">${p.name || 'Untitled Project'} ${p.id === this.currentProjectId ? '(Current)' : ''}</span>
                            <span class="project-date">Last updated: ${new Date(p.updatedAt).toLocaleString()}</span>
                        </div>
                        <div class="project-actions">
                            <button class="btn-icon" onclick="window.projectManager.deleteProject('${p.id}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('');
            }
            
            document.getElementById('modal-projects').style.display = 'flex';
        } catch (err) {
            console.error('Failed to list projects:', err);
        }
    }
    
    // Helper to close modal after load
    async loadProjectAndClose(id) {
        await this.loadProject(id);
        document.getElementById('modal-projects').style.display = 'none';
        showToast('Project loaded', 'success');
    }

    syncUI(data) {
        // Same as serializer syncUI
        const elBtnGrid = document.getElementById('btn-grid');
        if (elBtnGrid) elBtnGrid.classList.toggle('active', state.gridVisible);
        
        const elGridSpacing = document.getElementById('grid-spacing');
        if (elGridSpacing) elGridSpacing.value = state.gridSpacing.toString();

        const elBtnSnap = document.getElementById('btn-snap');
        if (elBtnSnap) elBtnSnap.classList.toggle('active', state.snapEnabled);

        const elBtnMargins = document.getElementById('btn-margins');
        if (elBtnMargins) elBtnMargins.classList.toggle('active', state.marginsVisible);
        
        const marginsMap = {
            'margin-top': state.margins.top,
            'margin-right': state.margins.right,
            'margin-bottom': state.margins.bottom,
            'margin-left': state.margins.left
        };
        for (const [id, val] of Object.entries(marginsMap)) {
            const el = document.getElementById(id);
            if (el) el.value = val;
        }

        const template = data.pageTemplate || 'a4-portrait';
        const elPageSize = document.getElementById('page-size-select');
        if (elPageSize) elPageSize.value = template;
    }

    // --- API DB wrappers ---
    saveToDB(project) {
        return fetch('api/projects.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        }).then(res => res.json());
    }

    getFromDB(id) {
        return fetch('api/projects.php?id=' + encodeURIComponent(id))
            .then(res => res.ok ? res.json() : null)
            .catch(() => null);
    }

    getAllFromDB() {
        return fetch('api/projects.php')
            .then(res => res.ok ? res.json() : [])
            .catch(() => []);
    }

    removeFromDB(id) {
        return fetch('api/projects.php?id=' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        }).then(res => res.json());
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

export const projectManager = new ProjectManager();
// Expose for inline onclick handlers inside the modal string templates
window.projectManager = projectManager;
