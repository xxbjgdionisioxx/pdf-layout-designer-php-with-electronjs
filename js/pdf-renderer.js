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
            await this.loadPdfFromSource(state.pdfSource, state.pdfFilename);
        } else {
            this.pdfDoc = null;
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
            
            await this.loadPdfFromSource(base64, file.name);
            
            showToast(`PDF loaded: ${state.totalPages} page(s)`, 'success');
            state.emit('pdfLoaded');
            
        } catch (err) {
            console.error('PDF load error:', err);
            showToast('Failed to load PDF: ' + err.message, 'error');
        }
    }

    /**
     * Load PDF from Base64 source
     */
    async loadPdfFromSource(base64, filename) {
        try {
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
            
        } catch (err) {
            console.error('Source PDF load error:', err);
            throw err;
        }
    }
    
    /**
     * Render the current page onto the PDF layer
     */
    async renderCurrentPage() {
        if (!this.pdfDoc) {
            // No PDF loaded — just draw white background
            this.drawBlankPage();
            return;
        }
        
        const pageNum = state.currentPage;
        
        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const zoom = state.zoom;
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
            
            // Draw onto PDF layer
            const ctx = canvasManager.getContext('pdf');
            canvasManager.clear('pdf');
            
            // White background
            const w = state.pageWidth * MM_TO_PX * zoom;
            const h = state.pageHeight * MM_TO_PX * zoom;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            
            // Draw PDF
            ctx.drawImage(offscreen, 0, 0, w, h);
            
        } catch (err) {
            console.error('PDF render error:', err);
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
