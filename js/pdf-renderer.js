// ============================================================
// FPDF Visual Layout Designer — PDF Renderer
// ============================================================

import { state } from './state.js';
import { canvasManager } from './canvas-manager.js';
import { MM_TO_PX } from './config.js';
import { showToast } from './cursor.js';

class PdfRenderer {
    constructor() {
        this.pdfDoc = null;
        this.pageCache = new Map(); // page -> ImageBitmap
    }
    
    init() {
        // Set PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        state.on('zoomChanged', () => this.renderCurrentPage());
        state.on('pageChanged', () => this.renderCurrentPage());
        state.on('canvasResized', () => this.renderCurrentPage());
        state.on('projectLoaded', () => this.onProjectLoaded());
    }
    
    /**
     * Handle project loaded event — reload PDF if source is present
     */
    async onProjectLoaded() {
        if (state.pdfSource) {
            const isImage = state.pdfFilename && state.pdfFilename.match(/\.(jpg|jpeg|png)$/i);
            if (isImage) {
                await this.loadImageFromSource(state.pdfSource, state.pdfFilename);
            } else {
                await this.loadPdfFromSource(state.pdfSource, state.pdfFilename);
            }
        } else {
            this.pdfDoc = null;
            this.bgImage = null;
            state.pdfDoc = null;
            this.drawBlankPage();
            this.updatePageUI();
        }
    }

    /**
     * Load a PDF file from a browser File object
     */
    async loadPdf(file) {
        try {
            const isImage = file.type.startsWith('image/');

            // Read as data URL to get Base64 easily and robustly
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);
            
            const base64 = await base64Promise;
            state.pdfSource = base64;
            state.pdfFilename = file.name;
            
            if (isImage) {
                await this.loadImageFromSource(base64, file.name);
            } else {
                await this.loadPdfFromSource(base64, file.name);
            }
            
            showToast(`${isImage ? 'Image' : 'PDF'} loaded: ${state.totalPages} page(s)`, 'success');
            state.emit('pdfLoaded');
            
        } catch (err) {
            console.error('File load error:', err);
            showToast('Failed to load file: ' + err.message, 'error');
        }
    }

    /**
     * Load PDF from Base64 source
     */
    async loadPdfFromSource(base64, filename) {
        try {
            this.bgImage = null;
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
            this.pdfDoc = await loadingTask.promise;
            
            state.pdfDoc = this.pdfDoc;
            state.totalPages = this.pdfDoc.numPages;
            state.pdfFilename = filename;
            
            // Ensure element arrays exist for all pages
            for (let i = 1; i <= state.totalPages; i++) {
                if (!state.elements.has(i)) {
                    state.elements.set(i, []);
                }
            }
            
            // Get page dimensions from first page
            const page = await this.pdfDoc.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            
            const widthMm = (viewport.width * 0.352778);
            const heightMm = (viewport.height * 0.352778);
            
            state.setPageSize(
                Math.round(widthMm * 10) / 10,
                Math.round(heightMm * 10) / 10
            );
            
            this.pageCache.clear();
            await this.renderCurrentPage();

            // Detect interactive form fields (AcroForm) — silent skip if none found
            await this.detectFormFields();
            
        } catch (err) {
            console.error('Source PDF load error:', err);
            throw err;
        }
    }

    /**
     * Load Image from Base64 source
     */
    async loadImageFromSource(base64, filename) {
        try {
            const img = new Image();
            const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            const imgPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = reject;
            });
            img.src = `data:${mimeType};base64,` + base64;
            await imgPromise;
            
            this.pdfDoc = null;
            state.pdfDoc = null;
            this.bgImage = img;
            state.totalPages = 1;
            state.pdfFilename = filename;
            
            for (let i = 1; i <= state.totalPages; i++) {
                if (!state.elements.has(i)) {
                    state.elements.set(i, []);
                }
            }
            
            // Assume 96 DPI for image dimensions (1px = 0.264583 mm)
            const widthMm = img.width * 0.264583;
            const heightMm = img.height * 0.264583;
            
            state.setPageSize(
                Math.round(widthMm * 10) / 10,
                Math.round(heightMm * 10) / 10
            );
            
            this.pageCache.clear();
            await this.renderCurrentPage();
            
        } catch (err) {
            console.error('Source Image load error:', err);
            throw err;
        }
    }

    /**
     * Detect AcroForm widget annotations in the PDF and add them as canvas elements.
     * Checkbox (Btn) → type 'checkbox', Text input (Tx) → type 'inputbox'.
     * Coordinates are converted from PDF points to mm.
     * Silently skips pages with no annotations.
     */
    async detectFormFields() {
        if (!this.pdfDoc) return;

        let added = 0;

        for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
            const page = await this.pdfDoc.getPage(pageNum);
            const annotations = await page.getAnnotations();
            const viewport = page.getViewport({ scale: 1.0 });
            const pageHeightPt = viewport.height; // PDF points, origin at bottom-left

            for (const ann of annotations) {
                // Only process interactive form widgets
                if (ann.subtype !== 'Widget') continue;

                const fieldType = ann.fieldType; // 'Btn', 'Tx', 'Ch', etc.
                if (fieldType !== 'Btn' && fieldType !== 'Tx') continue;

                // ann.rect is [x1, y1, x2, y2] in PDF coordinate space (bottom-left origin)
                const [rx1, ry1, rx2, ry2] = ann.rect;

                // Convert to top-left origin (flip Y) then to mm
                const xMm  = parseFloat((Math.min(rx1, rx2) * 0.352778).toFixed(1));
                const yMm  = parseFloat(((pageHeightPt - Math.max(ry1, ry2)) * 0.352778).toFixed(1));
                const wMm  = parseFloat((Math.abs(rx2 - rx1) * 0.352778).toFixed(1));
                const hMm  = parseFloat((Math.abs(ry2 - ry1) * 0.352778).toFixed(1));

                // Skip degenerate rects
                if (wMm < 1 || hMm < 1) continue;

                // Derive label from PDF field metadata
                const rawLabel = ann.fieldName || ann.alternativeText || '';
                // Use only the last segment of dot-delimited field names (e.g. "Form1.#subform[0].Name" → "Name")
                const label = rawLabel.split('.').pop().replace(/\[.*?\]/g, '').trim();

                const elementType = fieldType === 'Btn' ? 'checkbox' : 'inputbox';

                const el = {
                    type: elementType,
                    x: xMm,
                    y: yMm,
                    w: wMm,
                    h: hMm,
                    label: label,
                    dbColumn: '',  // user can override in Inspector
                    dbType: elementType === 'checkbox' ? 'BOOLEAN' : 'VARCHAR(255)',
                    page: pageNum,
                };

                if (!state.elements.has(pageNum)) state.elements.set(pageNum, []);
                el.id = state.generateId();
                state.elements.get(pageNum).push(el);
                added++;
            }
        }

        if (added > 0) {
            state.emit('elementsChanged');
        }
    }
    
    /**
     * Render the current page onto the PDF layer
     */
    async renderCurrentPage() {
        if (!this.pdfDoc && !this.bgImage) {
            // No PDF loaded — just draw white background
            this.drawBlankPage();
            return;
        }
        
        const pageNum = state.currentPage;
        
        try {
            const ctx = canvasManager.getContext('pdf');
            canvasManager.clear('pdf');
            
            const zoom = state.zoom;
            const w = state.pageWidth * MM_TO_PX * zoom;
            const h = state.pageHeight * MM_TO_PX * zoom;
            
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);

            if (this.pdfDoc) {
                const page = await this.pdfDoc.getPage(pageNum);
                const scale = (MM_TO_PX * zoom) / (72 / 25.4); // convert from PDF points to our px
                
                const viewport = page.getViewport({ scale });
                
                // Render to offscreen canvas
                const offscreen = document.createElement('canvas');
                offscreen.width = viewport.width;
                offscreen.height = viewport.height;
                const offCtx = offscreen.getContext('2d');
                
                await page.render({
                    canvasContext: offCtx,
                    viewport: viewport,
                }).promise;
                
                // Draw PDF
                ctx.drawImage(offscreen, 0, 0, w, h);
            } else if (this.bgImage) {
                ctx.drawImage(this.bgImage, 0, 0, w, h);
            }
            
        } catch (err) {
            console.error('Render error:', err);
            this.drawBlankPage();
        }
        
        this.updatePageUI();
    }
    
    /**
     * Draw a blank white page
     */
    drawBlankPage() {
        const ctx = canvasManager.getContext('pdf');
        canvasManager.clear('pdf');
        
        const w = state.pageWidth * MM_TO_PX * state.zoom;
        const h = state.pageHeight * MM_TO_PX * state.zoom;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
    }
    
    /**
     * Update page navigation UI
     */
    updatePageUI() {
        const indicator = document.getElementById('page-indicator');
        indicator.innerHTML = `Page <strong>${state.currentPage}</strong> / <strong>${state.totalPages}</strong>`;
        
        document.getElementById('btn-prev-page').disabled = state.currentPage <= 1;
        document.getElementById('btn-next-page').disabled = state.currentPage >= state.totalPages;
        
        const infoPageNum = document.getElementById('info-page-num');
        if (infoPageNum) infoPageNum.textContent = `${state.currentPage} / ${state.totalPages}`;
        
        const infoPageSize = document.getElementById('info-page-size');
        if (infoPageSize) infoPageSize.textContent = `${state.pageWidth} × ${state.pageHeight} mm`;
    }
    
    nextPage() {
        if (state.currentPage < state.totalPages) {
            state.setPage(state.currentPage + 1);
        }
    }
    
    prevPage() {
        if (state.currentPage > 1) {
            state.setPage(state.currentPage - 1);
        }
    }
}

export const pdfRenderer = new PdfRenderer();
