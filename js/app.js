// ============================================================
// FPDF Visual Layout Designer — Main Application Bootstrap
// ============================================================

import { state } from './state.js';
import { PAGE_TEMPLATES, TOOL_TYPES, MM_TO_PX } from './config.js';
import { canvasManager } from './canvas-manager.js';
import { zoomManager } from './zoom.js';
import { gridRenderer } from './grid.js';
import { rulerRenderer } from './rulers.js';
import { cursorManager, showToast } from './cursor.js';
import { marginsRenderer } from './margins.js';
import { snapManager } from './snap.js';
import { history } from './history.js';
import { pdfRenderer } from './pdf-renderer.js';
import { drawRenderer } from './draw-renderer.js';
import { inspector } from './inspector.js';
import { exporter } from './exporter.js';
import { serializer } from './serializer.js';
import { projectManager } from './project-manager.js';
import { dbExporter } from './db-exporter.js';

// Tools
import { selectTool } from './tools/select.js';
import { pointTool } from './tools/point.js';
import { rectTool } from './tools/rectangle.js';
import { textTool } from './tools/text.js';
import { lineTool } from './tools/line.js';
import { imageTool } from './tools/image.js';
import { tableTool } from './tools/table.js';
import { buttonTool } from './tools/button.js';

class App {
    constructor() {
        this.tools = {
            select: selectTool,
            point: pointTool,
            rect: rectTool,
            text: textTool,
            line: lineTool,
            image: imageTool,
            table: tableTool,
            button: buttonTool,
        };
    }

    init() {
        // Initialize all modules
        canvasManager.init();
        zoomManager.init();
        gridRenderer.init();
        rulerRenderer.init();
        cursorManager.init();
        marginsRenderer.init();
        snapManager.init();
        pdfRenderer.init();
        drawRenderer.init();
        inspector.init();
        exporter.init();
        serializer.init();
        projectManager.init();
        dbExporter.init();

        // Bind toolbar buttons
        this.bindToolbar();

        // Bind canvas events
        this.bindCanvasEvents();

        // Bind page navigation
        this.bindPageNavigation();

        // Bind modals
        this.bindModals();

        // Bind keyboard shortcuts
        this.bindKeyboard();

        // Bind page template selector
        this.bindPageTemplate();

        // Bind viewport scroll for ruler sync
        this.bindViewportScroll();

        // Bind window resize
        window.addEventListener('resize', () => {
            canvasManager.resize();
            rulerRenderer.resize();
        });

        // Initial render
        pdfRenderer.drawBlankPage();
        gridRenderer.render();
        drawRenderer.render();

        showToast('FPDF Layout Designer ready', 'info');
    }

    bindToolbar() {
        // Drawing tool buttons
        const toolBtns = document.querySelectorAll('#draw-tools .tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (tool) {
                    state.setTool(tool);

                    // Update active state
                    toolBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // Grid toggle
        document.getElementById('btn-grid').addEventListener('click', () => {
            gridRenderer.toggle();
        });

        // Grid spacing
        document.getElementById('grid-spacing').addEventListener('change', (e) => {
            gridRenderer.setSpacing(e.target.value);
        });

        // Snap toggle
        document.getElementById('btn-snap').addEventListener('click', () => {
            state.snapEnabled = !state.snapEnabled;
            document.getElementById('btn-snap').classList.toggle('active', state.snapEnabled);
        });

        // Margins toggle
        document.getElementById('btn-margins').addEventListener('click', () => {
            marginsRenderer.toggle();
        });

        // Sidebar Toggles
        const btnToggleElements = document.getElementById('btn-toggle-elements');
        if (btnToggleElements) {
            btnToggleElements.addEventListener('click', () => {
                document.getElementById('elements-panel').classList.toggle('collapsed');
                btnToggleElements.style.transform = document.getElementById('elements-panel').classList.contains('collapsed')
                    ? 'rotate(180deg)' : 'rotate(0deg)';
                setTimeout(() => {
                    canvasManager.resize();
                    rulerRenderer.resize();
                }, 300);
            });
        }

        const btnToggleInspector = document.getElementById('btn-toggle-inspector');
        if (btnToggleInspector) {
            btnToggleInspector.addEventListener('click', () => {
                document.getElementById('inspector-panel').classList.toggle('collapsed');
                btnToggleInspector.style.transform = document.getElementById('inspector-panel').classList.contains('collapsed')
                    ? 'rotate(180deg)' : 'rotate(0deg)';
                setTimeout(() => {
                    canvasManager.resize();
                    rulerRenderer.resize();
                }, 300);
            });
        }

        // Undo/Redo
        // Undo/Redo
        document.getElementById('btn-undo').addEventListener('click', () => history.undo());
        document.getElementById('btn-redo').addEventListener('click', () => history.redo());

        // Auth Logout
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                fetch('api/auth.php?action=logout', { method: 'POST' })
                    .then(() => window.location.href = 'login.php');
            });
        }

        // PDF upload
        document.getElementById('pdf-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                pdfRenderer.loadPdf(file);
            }
        });

        // Tool change listener to sync active button and cursor
        state.on('toolChanged', (tool) => {
            const toolBtns = document.querySelectorAll('#draw-tools .tool-btn');
            toolBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });

            // Update cursor
            const drawCanvas = canvasManager.layers.draw;
            if (drawCanvas) {
                drawCanvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
            }
        });
    }

    bindCanvasEvents() {
        const drawCanvas = canvasManager.layers.draw;

        drawCanvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // left click only

            const mm = canvasManager.getMouseMm(e);
            state.mouseX = mm.x;
            state.mouseY = mm.y;

            const tool = this.tools[state.currentTool];
            if (tool) {
                tool.onMouseDown(e, mm.x, mm.y);
            }
        });

        drawCanvas.addEventListener('mousemove', (e) => {
            const mm = canvasManager.getMouseMm(e);
            const screen = canvasManager.getMouseScreen(e);

            state.mouseX = mm.x;
            state.mouseY = mm.y;
            state.mouseScreenX = screen.x;
            state.mouseScreenY = screen.y;

            // Update cursor crosshair
            cursorManager.drawCrosshair(screen.x, screen.y);
            cursorManager.updateTooltip(e, mm.x, mm.y);
            cursorManager.updateCoordDisplay(mm.x, mm.y);

            // Update rulers
            rulerRenderer.updateCursorPos(mm.x, mm.y);

            // Forward to tool
            const tool = this.tools[state.currentTool];
            if (tool) {
                tool.onMouseMove(e, mm.x, mm.y);
            }
        });

        drawCanvas.addEventListener('mouseup', (e) => {
            const mm = canvasManager.getMouseMm(e);

            const tool = this.tools[state.currentTool];
            if (tool) {
                tool.onMouseUp(e, mm.x, mm.y);
            }
        });

        drawCanvas.addEventListener('mouseleave', () => {
            cursorManager.hide();
            rulerRenderer.updateCursorPos(-1, -1);
        });

        // Click to copy coordinates (when using select tool and no element is clicked)
        drawCanvas.addEventListener('dblclick', (e) => {
            const mm = canvasManager.getMouseMm(e);
            cursorManager.showClickMarker(e);
            cursorManager.copyCoordinates(mm.x, mm.y);
        });

        // Prevent context menu on canvas
        drawCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    bindPageNavigation() {
        document.getElementById('btn-prev-page').addEventListener('click', () => {
            pdfRenderer.prevPage();
        });

        document.getElementById('btn-next-page').addEventListener('click', () => {
            pdfRenderer.nextPage();
        });
    }

    bindModals() {
        // Close buttons for all modals
        document.querySelectorAll('.modal-close, .modal-overlay .btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal || btn.closest('.modal-overlay')?.id;
                if (modalId) {
                    document.getElementById(modalId).style.display = 'none';
                }
            });
        });

        // Text modal confirm
        document.getElementById('modal-text-ok').addEventListener('click', () => {
            textTool.confirmText();
        });

        // Text modal enter key
        document.getElementById('modal-text-content').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                textTool.confirmText();
            }
        });

        // Table modal confirm
        document.getElementById('modal-table-ok').addEventListener('click', () => {
            tableTool.confirmTable();
        });

        // Point modal confirm
        document.getElementById('modal-point-ok').addEventListener('click', () => {
            pointTool.confirmPoint();
        });

        // Point modal enter key
        document.getElementById('modal-point-label').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                pointTool.confirmPoint();
            }
        });

        // Custom page size modal
        document.getElementById('modal-custom-ok').addEventListener('click', () => {
            const w = parseFloat(document.getElementById('custom-page-w').value);
            const h = parseFloat(document.getElementById('custom-page-h').value);
            if (w >= 10 && h >= 10) {
                state.pageTemplate = 'custom';
                state.setPageSize(w, h);
                pdfRenderer.drawBlankPage();
                pdfRenderer.updatePageUI();
            }
            document.getElementById('modal-custom-page').style.display = 'none';
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });
        });
    }

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': state.setTool(TOOL_TYPES.SELECT); break;
                    case 'p': state.setTool(TOOL_TYPES.POINT); break;
                    case 'r': state.setTool(TOOL_TYPES.RECT); break;
                    case 't': state.setTool(TOOL_TYPES.TEXT); break;
                    case 'l': state.setTool(TOOL_TYPES.LINE); break;
                    case 'i': state.setTool(TOOL_TYPES.IMAGE); break;
                    case 'b': state.setTool(TOOL_TYPES.TABLE); break;
                    case 'k': state.setTool(TOOL_TYPES.BUTTON); break;
                    case 'g': gridRenderer.toggle(); break;
                    case 's': {
                        state.snapEnabled = !state.snapEnabled;
                        document.getElementById('btn-snap').classList.toggle('active', state.snapEnabled);
                        break;
                    }
                    case 'm': marginsRenderer.toggle(); break;
                    case 'delete':
                    case 'backspace':
                        if (state.selectedElements.length > 0) {
                            history.pushState('delete');
                            const ids = state.selectedElements.map(e => e.id);
                            ids.forEach(id => state.removeElement(id));
                            state.clearSelection();
                        }
                        break;
                    case 'escape':
                        state.clearSelection();
                        state.isDrawing = false;
                        // Close any open modals
                        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
                        break;
                }
            }

            // Ctrl shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            history.redo();
                        } else {
                            history.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        history.redo();
                        break;
                    case 'b':
                        e.preventDefault();
                        state.setTool(TOOL_TYPES.BUTTON);
                        break;
                    case 's':
                        e.preventDefault();
                        serializer.saveProject();
                        break;
                    case 'a':
                        e.preventDefault();
                        // Select all elements on current page
                        const elements = state.getPageElements();
                        state.selectedElements = [...elements];
                        state.emit('selectionChanged');
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        zoomManager.zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        zoomManager.zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        zoomManager.setZoom(1.0);
                        break;
                }
            }
        });
    }

    bindPageTemplate() {
        const select = document.getElementById('page-size-select');
        select.addEventListener('change', () => {
            const value = select.value;

            if (value === 'custom') {
                // Show custom size modal
                document.getElementById('custom-page-w').value = state.pageWidth;
                document.getElementById('custom-page-h').value = state.pageHeight;
                document.getElementById('modal-custom-page').style.display = 'flex';
                return;
            }

            const template = PAGE_TEMPLATES[value];
            if (template) {
                state.pageTemplate = value;
                state.setPageSize(template.width, template.height);
                pdfRenderer.drawBlankPage();
                pdfRenderer.updatePageUI();
                gridRenderer.render();
            }
        });
    }

    bindViewportScroll() {
        const viewport = document.getElementById('canvas-viewport');
        viewport.addEventListener('scroll', () => {
            rulerRenderer.render();
        });

        // Mouse wheel zoom
        viewport.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomManager.zoomIn();
                } else {
                    zoomManager.zoomOut();
                }
            }
        }, { passive: false });
    }
}

// ---- Bootstrap ----
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
