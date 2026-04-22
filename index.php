<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description"
        content="FPDF Visual Layout Designer - Design PDF layouts visually and export FPDF PHP code">
    <title>PDF Layout Designer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>

<body>
    <div id="app">
        <!-- ============ TOOLBAR ============ -->
        <header id="toolbar">
            <div class="toolbar-group toolbar-brand">
                <span class="brand-icon">◩</span>
                <span class="brand-text">PDF Layout Designer</span>
                <span class="brand-text" style="font-size:12px; color:var(--text-muted); font-weight:400;">by
                    Bryan James Dionisio</span>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="file-tools">
                <button class="tool-btn" id="btn-new-project" title="New Project">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <span class="tool-label">New</span>
                </button>
                <button class="tool-btn" id="btn-projects" title="My Projects">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span class="tool-label">Projects</span>
                </button>
                <label class="tool-btn" id="btn-upload" title="Upload PDF (Ctrl+O)">
                    <input type="file" id="pdf-upload" accept=".pdf" hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span class="tool-label">Upload</span>
                </label>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="draw-tools">
                <button class="tool-btn active" id="btn-select" title="Select Tool (V)" data-tool="select">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    </svg>
                    <span class="tool-label">Select</span>
                </button>
                <button class="tool-btn" id="btn-point" title="Point Tool (P)" data-tool="point">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="2" x2="12" y2="8" />
                        <line x1="12" y1="16" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="8" y2="12" />
                        <line x1="16" y1="12" x2="22" y2="12" />
                    </svg>
                    <span class="tool-label">Point</span>
                </button>
                <button class="tool-btn" id="btn-rect" title="Rectangle Tool (R)" data-tool="rect">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    <span class="tool-label">Rect</span>
                </button>
                <button class="tool-btn" id="btn-text" title="Text Tool (T)" data-tool="text">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="4 7 4 4 20 4 20 7" />
                        <line x1="9.5" y1="20" x2="14.5" y2="20" />
                        <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    <span class="tool-label">Text</span>
                </button>
                <button class="tool-btn" id="btn-line" title="Line Tool (L)" data-tool="line">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="19" x2="19" y2="5" />
                    </svg>
                    <span class="tool-label">Line</span>
                </button>
                <button class="tool-btn" id="btn-image" title="Image Placeholder (I)" data-tool="image">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span class="tool-label">Image</span>
                </button>
                <button class="tool-btn" id="btn-table" title="Table Tool (B)" data-tool="table">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="3" y1="15" x2="21" y2="15" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                        <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    <span class="tool-label">Table</span>
                </button>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="view-tools">
                <button class="tool-btn toggle-btn active" id="btn-grid" title="Toggle Grid (G)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="3" y1="15" x2="21" y2="15" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                        <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    <span class="tool-label">Grid</span>
                </button>
                <div class="dropdown-wrapper">
                    <select id="grid-spacing" title="Grid Spacing">
                        <option value="1">1mm</option>
                        <option value="2">2mm</option>
                        <option value="5" selected>5mm</option>
                        <option value="10">10mm</option>
                    </select>
                </div>
                <button class="tool-btn toggle-btn active" id="btn-snap" title="Toggle Snap (S)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 14h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1" />
                        <path d="M3 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3" />
                        <path d="M21 4h-1a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1" />
                        <path d="M3 4h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3" />
                    </svg>
                    <span class="tool-label">Snap</span>
                </button>
                <button class="tool-btn toggle-btn active" id="btn-margins" title="Toggle Margins (M)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" />
                        <rect x="7" y="7" width="10" height="10" stroke-dasharray="2,2" />
                    </svg>
                    <span class="tool-label">Margins</span>
                </button>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="history-tools">
                <button class="tool-btn" id="btn-undo" title="Undo (Ctrl+Z)" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span class="tool-label">Undo</span>
                </button>
                <button class="tool-btn" id="btn-redo" title="Redo (Ctrl+Y)" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                    </svg>
                    <span class="tool-label">Redo</span>
                </button>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="export-tools">
                <button class="tool-btn" id="btn-export" title="Export PHP Code">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span class="tool-label">Export</span>
                </button>
                <button class="tool-btn" id="btn-save" title="Save Project As JSON (Ctrl+S)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span class="tool-label">Save As</span>
                </button>
                <button class="tool-btn" id="btn-load" title="Load Project">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span class="tool-label">Load</span>
                </button>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group" id="page-template">
                <select id="page-size-select" title="Page Size">
                    <option value="a4-portrait" selected>A4 Portrait</option>
                    <option value="a4-landscape">A4 Landscape</option>
                    <option value="letter-portrait">Letter Portrait</option>
                    <option value="letter-landscape">Letter Landscape</option>
                    <option value="custom">Custom...</option>
                </select>
            </div>

            <div class="toolbar-separator" style="margin-left: auto; border:none; width: 0;"></div>

            <div class="toolbar-group">
                <button class="tool-btn" id="btn-logout" title="Log Out" style="color: #ef4444;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span class="tool-label">Logout</span>
                </button>
            </div>
        </header>

        <!-- ============ MAIN LAYOUT ============ -->
        <div id="main-layout">
            <!-- Corner piece between rulers -->
            <div id="ruler-corner">
                <span>mm</span>
            </div>

            <!-- Horizontal Ruler -->
            <div id="ruler-h-container">
                <canvas id="ruler-h"></canvas>
            </div>

            <!-- Vertical Ruler -->
            <div id="ruler-v-container">
                <canvas id="ruler-v"></canvas>
            </div>

            <!-- Canvas Viewport -->
            <div id="canvas-viewport">
                <div id="canvas-container">
                    <!-- PDF Layer -->
                    <canvas id="layer-pdf"></canvas>
                    <!-- Grid Layer -->
                    <canvas id="layer-grid"></canvas>
                    <!-- Drawing Layer -->
                    <canvas id="layer-draw"></canvas>
                    <!-- Cursor/Guide Layer -->
                    <canvas id="layer-cursor"></canvas>
                </div>
            </div>

            <!-- Inspector Panel -->
            <aside id="inspector-panel">
                <div class="inspector-header">
                    <h2>Inspector</h2>
                    <button id="btn-toggle-inspector" class="icon-btn" title="Toggle Inspector">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                </div>

                <div class="inspector-content">
                    <!-- Page Info Section -->
                    <div class="inspector-section">
                        <h3>Page Info</h3>
                        <div class="inspector-row">
                            <label>Size</label>
                            <span id="info-page-size">210 × 297 mm</span>
                        </div>
                        <div class="inspector-row">
                            <label>Page</label>
                            <span id="info-page-num">1 / 1</span>
                        </div>
                        <div class="inspector-row">
                            <label>Zoom</label>
                            <span id="info-zoom">100%</span>
                        </div>
                    </div>

                    <!-- Margins Section -->
                    <div class="inspector-section">
                        <h3>Margins (mm)</h3>
                        <div class="inspector-grid-4">
                            <div class="inspector-field">
                                <label for="margin-top">T</label>
                                <input type="number" id="margin-top" value="10" min="0" step="1">
                            </div>
                            <div class="inspector-field">
                                <label for="margin-right">R</label>
                                <input type="number" id="margin-right" value="10" min="0" step="1">
                            </div>
                            <div class="inspector-field">
                                <label for="margin-bottom">B</label>
                                <input type="number" id="margin-bottom" value="10" min="0" step="1">
                            </div>
                            <div class="inspector-field">
                                <label for="margin-left">L</label>
                                <input type="number" id="margin-left" value="10" min="0" step="1">
                            </div>
                        </div>
                    </div>

                    <!-- Selection Section -->
                    <div class="inspector-section" id="selection-section" style="display:none;">
                        <h3>Selected Object</h3>
                        <div class="inspector-row">
                            <label>Type</label>
                            <span id="sel-type">—</span>
                        </div>
                        <div class="inspector-grid-2">
                            <div class="inspector-field">
                                <label for="sel-x">X (mm)</label>
                                <input type="number" id="sel-x" step="0.1">
                            </div>
                            <div class="inspector-field">
                                <label for="sel-y">Y (mm)</label>
                                <input type="number" id="sel-y" step="0.1">
                            </div>
                            <div class="inspector-field">
                                <label for="sel-w">W (mm)</label>
                                <input type="number" id="sel-w" step="0.1">
                            </div>
                            <div class="inspector-field">
                                <label for="sel-h">H (mm)</label>
                                <input type="number" id="sel-h" step="0.1">
                            </div>
                        </div>

                        <!-- Rect-specific fields -->
                        <div id="rect-fields" style="display:none;">
                            <div class="inspector-field full-width">
                                <label for="sel-rect-label">Label / User Guide</label>
                                <input type="text" id="sel-rect-label" placeholder="e.g. Signature box">
                            </div>
                        </div>

                        <!-- Text-specific fields -->
                        <div id="text-fields" style="display:none;">
                            <div class="inspector-field full-width">
                                <label for="sel-text">Text</label>
                                <input type="text" id="sel-text" placeholder="Enter text">
                            </div>
                            <div class="inspector-grid-2">
                                <div class="inspector-field">
                                    <label for="sel-font-size">Size</label>
                                    <input type="number" id="sel-font-size" value="12" min="1" step="1">
                                </div>
                                <div class="inspector-field">
                                    <label for="sel-font-style">Style</label>
                                    <select id="sel-font-style">
                                        <option value="">Normal</option>
                                        <option value="B">Bold</option>
                                        <option value="I">Italic</option>
                                        <option value="BI">Bold Italic</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Image-specific fields -->
                        <div id="image-fields" style="display:none;">
                            <div class="inspector-field full-width">
                                <label for="sel-img-label">Label / User Guide</label>
                                <input type="text" id="sel-img-label" placeholder="e.g. Logo placeholder">
                            </div>
                        </div>

                        <!-- Table-specific fields -->
                        <div id="table-fields" style="display:none;">
                            <div class="inspector-field full-width" style="margin-bottom: 8px;">
                                <label for="sel-table-label">Label / User Guide</label>
                                <input type="text" id="sel-table-label" placeholder="e.g. Items list">
                            </div>
                            <div class="inspector-grid-2" style="margin-bottom: 8px;">
                                <div class="inspector-field"
                                    style="flex-direction: row; align-items: center; gap: 6px;">
                                    <input type="checkbox" id="sel-table-loop" style="width: auto; margin:0;">
                                    <label for="sel-table-loop" style="margin:0; cursor:pointer;">Loop Mode</label>
                                </div>
                                <div class="inspector-field">
                                    <input type="text" id="sel-table-var" placeholder="$items"
                                        title="PHP array variable">
                                </div>
                            </div>
                            <div class="inspector-grid-2">
                                <div class="inspector-field">
                                    <label for="sel-rows">Rows</label>
                                    <input type="number" id="sel-rows" min="1" step="1">
                                </div>
                                <div class="inspector-field">
                                    <label for="sel-cols">Cols</label>
                                    <input type="number" id="sel-cols" min="1" step="1">
                                </div>
                            </div>
                        </div>

                        <!-- Point-specific fields -->
                        <div id="point-fields" style="display:none;">
                            <div class="inspector-field full-width">
                                <label for="sel-point-label">Label</label>
                                <input type="text" id="sel-point-label" placeholder="Point name">
                            </div>
                            <div class="inspector-grid-2">
                                <div class="inspector-field">
                                    <label for="sel-point-cell-w">Cell W</label>
                                    <input type="number" id="sel-point-cell-w" step="0.1" min="0">
                                </div>
                                <div class="inspector-field">
                                    <label for="sel-point-cell-h">Cell H</label>
                                    <input type="number" id="sel-point-cell-h" step="0.1" min="0">
                                </div>
                            </div>
                            <div class="inspector-field">
                                <label for="sel-point-font-size">Font Size</label>
                                <input type="number" id="sel-point-font-size" step="1" min="1" value="12">
                            </div>
                        </div>

                        <div class="inspector-actions">
                            <button id="btn-delete-selected" class="btn-danger" title="Delete Selected (Del)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path
                                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>

                    <!-- No Selection Message -->
                    <div class="inspector-section" id="no-selection-section">
                        <div class="no-selection-msg">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5" opacity="0.4">
                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                            </svg>
                            <p>No element selected</p>
                            <p class="hint">Click on an element or use a drawing tool to create one</p>
                        </div>
                    </div>

                    <!-- Elements List -->
                    <div class="inspector-section">
                        <h3>Elements <span id="element-count" class="badge">0</span></h3>
                        <div id="elements-list" class="elements-list">
                            <p class="no-elements">No elements on this page</p>
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <!-- ============ BOTTOM BAR ============ -->
        <footer id="bottom-bar">
            <div class="bottom-group">
                <button id="btn-prev-page" class="icon-btn" title="Previous Page" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <span id="page-indicator">Page <strong>1</strong> / <strong>1</strong></span>
                <button id="btn-next-page" class="icon-btn" title="Next Page" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>

            <div class="bottom-group" id="coord-display">
                <span class="coord-label">X:</span>
                <span id="coord-x" class="coord-value">0.0</span>
                <span class="coord-unit">mm</span>
                <span class="coord-sep">|</span>
                <span class="coord-label">Y:</span>
                <span id="coord-y" class="coord-value">0.0</span>
                <span class="coord-unit">mm</span>
            </div>

            <div class="bottom-group" id="zoom-controls">
                <button id="btn-zoom-out" class="icon-btn" title="Zoom Out (Ctrl+-)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </button>
                <span id="zoom-display" class="zoom-value">100%</span>
                <button id="btn-zoom-in" class="icon-btn" title="Zoom In (Ctrl++)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                </button>
                <button id="btn-zoom-fit" class="icon-btn" title="Fit to Page">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path
                            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                </button>
                <button id="btn-zoom-reset" class="icon-btn" title="Reset Zoom (100%)">
                    1:1
                </button>
            </div>
        </footer>

        <!-- ============ MODALS ============ -->
        <!-- Text Input Modal -->
        <div id="modal-text" class="modal-overlay" style="display:none;">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Add Text</h3>
                    <button class="modal-close" data-modal="modal-text">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-field">
                        <label for="modal-text-content">Text Content</label>
                        <input type="text" id="modal-text-content" placeholder="Enter text..." autofocus>
                    </div>
                    <div class="modal-row">
                        <div class="modal-field">
                            <label for="modal-font-size">Font Size (pt)</label>
                            <input type="number" id="modal-font-size" value="12" min="1">
                        </div>
                        <div class="modal-field">
                            <label for="modal-font-style">Font Style</label>
                            <select id="modal-font-style">
                                <option value="">Normal</option>
                                <option value="B">Bold</option>
                                <option value="I">Italic</option>
                                <option value="BI">Bold Italic</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-text">Cancel</button>
                    <button class="btn btn-primary" id="modal-text-ok">Add Text</button>
                </div>
            </div>
        </div>

        <!-- Table Input Modal -->
        <div id="modal-table" class="modal-overlay" style="display:none;">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Create Table</h3>
                    <button class="modal-close" data-modal="modal-table">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-row">
                        <div class="modal-field">
                            <label for="modal-table-rows">Rows</label>
                            <input type="number" id="modal-table-rows" value="3" min="1" max="50">
                        </div>
                        <div class="modal-field">
                            <label for="modal-table-cols">Columns</label>
                            <input type="number" id="modal-table-cols" value="3" min="1" max="20">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-table">Cancel</button>
                    <button class="btn btn-primary" id="modal-table-ok">Create Table</button>
                </div>
            </div>
        </div>

        <!-- Export Modal -->
        <div id="modal-export" class="modal-overlay" style="display:none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-header">
                    <h3>Export PHP Code</h3>
                    <button class="modal-close" data-modal="modal-export">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px; flex-wrap:wrap;">
                        <label style="font-size:13px; color:var(--text-muted); font-weight:600; white-space:nowrap;">PDF
                            Library:</label>
                        <select id="export-library-select"
                            style="padding:6px 10px; background:var(--bg-color); border:1px solid var(--border-color); border-radius:6px; color:var(--text-base); font-size:13px; cursor:pointer;">
                            <option value="fpdf">FPDF — Lightweight, coordinate-based</option>
                            <option value="tcpdf">TCPDF — Feature-rich, UTF-8 support</option>
                            <option value="dompdf">Dompdf — HTML to PDF rendering</option>
                            <option value="mpdf">mPDF — HTML to PDF, CSS support</option>
                        </select>
                        <span id="export-library-badge"
                            style="font-size:11px; color:var(--text-muted); font-style:italic;"></span>
                    </div>
                    <pre id="export-code" class="code-block"></pre>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-export">Close</button>
                    <button class="btn btn-primary" id="btn-copy-code">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>


        <!-- Custom Page Size Modal -->
        <div id="modal-custom-page" class="modal-overlay" style="display:none;">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Custom Page Size</h3>
                    <button class="modal-close" data-modal="modal-custom-page">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-row">
                        <div class="modal-field">
                            <label for="custom-page-w">Width (mm)</label>
                            <input type="number" id="custom-page-w" value="210" min="10">
                        </div>
                        <div class="modal-field">
                            <label for="custom-page-h">Height (mm)</label>
                            <input type="number" id="custom-page-h" value="297" min="10">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-custom-page">Cancel</button>
                    <button class="btn btn-primary" id="modal-custom-ok">Apply</button>
                </div>
            </div>
        </div>

        <!-- Point Input Modal -->
        <div id="modal-point" class="modal-overlay" style="display:none;">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Add Point Marker</h3>
                    <button class="modal-close" data-modal="modal-point">&times;</button>
                </div>

                <div class="modal-body">
                    <div class="modal-field">
                        <label for="modal-point-label">Label / Text Content</label>
                        <input type="text" id="modal-point-label" placeholder="e.g. Name, Address, Total..." autofocus>
                    </div>
                    <div class="modal-row">
                        <div class="modal-field">
                            <label for="modal-point-cell-w">Cell Width (mm)</label>
                            <input type="number" id="modal-point-cell-w" value="0" min="0" step="1">
                        </div>
                        <div class="modal-field">
                            <label for="modal-point-cell-h">Cell Height (mm)</label>
                            <input type="number" id="modal-point-cell-h" value="10" min="0" step="1">
                        </div>
                    </div>
                    <div class="modal-field">
                        <label for="modal-point-font-size">Font Size (pt)</label>
                        <input type="number" id="modal-point-font-size" value="12" min="1">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-point">Cancel</button>
                    <button class="btn btn-primary" id="modal-point-ok">Place Point</button>
                </div>
            </div>
        </div>

        <!-- Save Project Modal -->
        <div id="modal-save" class="modal-overlay" style="display:none;">
            <div class="modal-dialog">
                <div class="modal-header">
                    <h3>Save Project</h3>
                    <button class="modal-close" data-modal="modal-save">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-field">
                        <label for="modal-save-filename">Filename</label>
                        <div class="input-group">
                            <input type="text" id="modal-save-filename" placeholder="layout" autofocus>
                            <span class="input-group-text">.json</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-save">Cancel</button>
                    <button class="btn btn-primary" id="modal-save-ok">Download JSON</button>
                </div>
            </div>
        </div>

        <!-- Projects Modal -->
        <div id="modal-projects" class="modal-overlay" style="display:none;">
            <div class="modal-dialog modal-lg">
                <div class="modal-header">
                    <h3>My Projects</h3>
                    <button class="modal-close" data-modal="modal-projects">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="projects-list" class="projects-list">
                        <!-- project items will be injected here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-modal="modal-projects">Close</button>
                    <button class="btn btn-primary" id="btn-create-new-project">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create New Project
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast notifications -->
        <div id="toast-container"></div>
    </div>

    <script type="module" src="js/app.js?v=2"></script>
</body>

</html>