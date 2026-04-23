// ============================================================
// FPDF Visual Layout Designer — Drawing Renderer
// ============================================================
// Renders all elements on the draw layer

import { state } from './state.js';
import { canvasManager } from './canvas-manager.js';
import { MM_TO_PX, COLORS } from './config.js';
import { marginsRenderer } from './margins.js';

class DrawRenderer {
    init() {
        state.on('elementsChanged', () => this.render());
        state.on('selectionChanged', () => this.render());
        state.on('canvasResized', () => this.render());
        state.on('projectLoaded', () => this.render());
    }

    render() {
        canvasManager.clear('draw');
        const ctx = canvasManager.getContext('draw');
        const zoom = state.zoom;
        const scale = MM_TO_PX * zoom;

        ctx.save();

        // Draw margins first
        marginsRenderer.draw(ctx);

        // Draw all elements on current page
        const elements = state.getPageElements();
        for (const el of elements) {
            const isSelected = state.selectedElements.includes(el);
            this.drawElement(ctx, el, scale, isSelected);
        }

        // Draw selection handles
        for (const el of state.selectedElements) {
            this.drawHandles(ctx, el, scale);
        }

        ctx.restore();
    }

    drawElement(ctx, el, scale, isSelected) {
        switch (el.type) {
            case 'rect': this.drawRect(ctx, el, scale, isSelected); break;
            case 'text': this.drawText(ctx, el, scale, isSelected); break;
            case 'line': this.drawLine(ctx, el, scale, isSelected); break;
            case 'image': this.drawImage(ctx, el, scale, isSelected); break;
            case 'table': this.drawTable(ctx, el, scale, isSelected); break;
            case 'point': this.drawPoint(ctx, el, scale, isSelected); break;
            case 'checkbox': this.drawCheckbox(ctx, el, scale, isSelected); break;
            case 'inputbox': this.drawInputbox(ctx, el, scale, isSelected); break;
            case 'button': this.drawButton(ctx, el, scale, isSelected); break;
        }
    }

    drawRect(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;

        ctx.save();
        ctx.strokeStyle = isSelected ? COLORS.selected : COLORS.rect;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.08)' : 'rgba(88, 166, 255, 0.06)';

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Dimension label
        ctx.fillStyle = isSelected ? COLORS.selected : COLORS.rect;
        ctx.font = `10px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${el.w.toFixed(1)} × ${el.h.toFixed(1)}`, x + w / 2, y + h + 3);

        if (el.label) {
            ctx.textBaseline = 'middle';
            ctx.font = `11px 'Inter', sans-serif`;
            ctx.fillText(el.label, x + w / 2, y + h / 2);
        }

        ctx.restore();
    }

    drawText(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;

        // Calculate font size in pixels
        const fontSizePx = (el.fontSize || 11) * (scale / MM_TO_PX) * 0.352778 * MM_TO_PX;

        let fontWeight = '';
        let fontStyle = '';
        if (el.fontStyle) {
            if (el.fontStyle.includes('B')) fontWeight = 'bold';
            if (el.fontStyle.includes('I')) fontStyle = 'italic';
        }

        ctx.save();
        ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px 'Inter', sans-serif`.trim();
        ctx.textBaseline = 'top';

        const text = el.content || 'Text';
        const metrics = ctx.measureText(text);
        const textH = fontSizePx * 1.2;

        // Store computed dimensions
        el.w = metrics.width / scale;
        el.h = textH / scale;

        // Bounding box
        ctx.strokeStyle = isSelected ? COLORS.selected : COLORS.text;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(x - 2, y - 2, metrics.width + 4, textH + 4);
        ctx.setLineDash([]);

        // Text
        ctx.fillStyle = isSelected ? COLORS.selected : COLORS.text;
        ctx.fillText(text, x, y);

        ctx.restore();
    }

    drawLine(ctx, el, scale, isSelected) {
        const x1 = el.x1 * scale;
        const y1 = el.y1 * scale;
        const x2 = el.x2 * scale;
        const y2 = el.y2 * scale;

        ctx.save();
        ctx.strokeStyle = isSelected ? COLORS.selected : COLORS.line;
        ctx.lineWidth = isSelected ? 2.5 : 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // End points
        ctx.fillStyle = isSelected ? COLORS.selected : COLORS.line;
        ctx.beginPath();
        ctx.arc(x1, y1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawImage(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;

        ctx.save();
        ctx.strokeStyle = isSelected ? COLORS.selected : COLORS.image;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.06)' : 'rgba(188, 140, 255, 0.06)';

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Cross pattern
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Image icon and label
        ctx.fillStyle = isSelected ? COLORS.selected : COLORS.image;
        ctx.font = `11px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = el.label || 'Image Placeholder';
        ctx.fillText(`🖼 ${label}`, x + w / 2, y + h / 2);

        ctx.restore();
    }

    drawTable(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;
        const rows = el.rows || 3;
        const cols = el.cols || 3;

        ctx.save();
        ctx.strokeStyle = isSelected ? COLORS.selected : COLORS.table;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.04)' : 'rgba(247, 120, 186, 0.04)';

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Draw column lines
        const colWidths = el.colWidths || Array(cols).fill(w / cols);
        let cx = x;
        for (let c = 1; c < cols; c++) {
            cx += (el.colWidths ? el.colWidths[c - 1] * scale : w / cols);
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(cx, y + h);
            ctx.stroke();
        }

        // Draw row lines
        const rowH = h / rows;
        for (let r = 1; r < rows; r++) {
            const ry = y + r * rowH;
            ctx.beginPath();
            ctx.moveTo(x, ry);
            ctx.lineTo(x + w, ry);
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = isSelected ? COLORS.selected : COLORS.table;
        ctx.font = `9px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`Table ${rows}×${cols}`, x + w / 2, y + h + 3);

        if (el.label) {
            ctx.textBaseline = 'middle';
            ctx.font = `11px 'Inter', sans-serif`;
            ctx.fillText(el.label, x + w / 2, y + h / 2);
        }

        ctx.restore();
    }

    drawPoint(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const color = isSelected ? COLORS.selected : COLORS.point;
        const radius = 6;
        const crossSize = 12;

        ctx.save();

        // Crosshair lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);

        // Vertical crosshair
        ctx.beginPath();
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y - radius);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.lineTo(x, y + crossSize);
        ctx.stroke();

        // Horizontal crosshair
        ctx.beginPath();
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x - radius, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + crossSize, y);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Label badge
        const label = el.label || 'Point';
        ctx.font = `600 10px 'Inter', sans-serif`;
        const metrics = ctx.measureText(label);
        const badgeW = metrics.width + 10;
        const badgeH = 16;
        const badgeX = x + crossSize + 4;
        const badgeY = y - badgeH / 2;

        // Badge background
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 107, 107, 0.9)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
        ctx.fill();

        // Badge text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, badgeX + 5, y + 0.5);

        // Coordinate label below
        ctx.fillStyle = color;
        ctx.font = `10px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`(${el.x.toFixed(1)}, ${el.y.toFixed(1)})`, x, y + crossSize + 3);

        ctx.restore();
    }

    drawCheckbox(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;
        const color = isSelected ? COLORS.selected : COLORS.checkbox;

        ctx.save();
        // Outer box
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.08)' : 'rgba(52, 211, 153, 0.1)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        // Checkmark
        const cx = x + w * 0.2;
        const cy = y + h * 0.55;
        const ex = x + w * 0.45;
        const ey = y + h * 0.8;
        const fx = x + w * 0.8;
        const fy = y + h * 0.2;
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, w * 0.12);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        // Label badge
        if (el.label) {
            ctx.font = `600 10px 'Inter', sans-serif`;
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(el.label, x, y - 2);
        }
        ctx.restore();
    }

    drawInputbox(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;
        const color = isSelected ? COLORS.selected : COLORS.inputbox;

        ctx.save();
        // Background
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.06)' : 'rgba(96, 165, 250, 0.07)';
        ctx.fillRect(x, y, w, h);

        // Dashed border
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        // Bottom accent line (solid)
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 3, y + h);
        ctx.lineTo(x + w - 3, y + h);
        ctx.stroke();

        // Input cursor icon
        ctx.fillStyle = color;
        ctx.font = `10px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('▤', x + 4, y + h / 2);

        // Label
        if (el.label) {
            ctx.font = `600 10px 'Inter', sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(el.label, x, y - 2);
        }
        ctx.restore();
    }

    drawButton(ctx, el, scale, isSelected) {
        const x = el.x * scale;
        const y = el.y * scale;
        const w = el.w * scale;
        const h = el.h * scale;
        const color = isSelected ? COLORS.selected : COLORS.button;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2 : 1.5;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.08)' : 'rgba(168, 85, 247, 0.1)';

        const isRadio = el.buttonType === 'radio' || !el.buttonType;

        if (isRadio) {
            // Draw circle
            const cx = x + w / 2;
            const cy = y + h / 2;
            const r = Math.min(w, h) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner dot
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            // Draw square
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Inner square
            ctx.fillStyle = color;
            ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5);
        }

        // Label (Group Name) and Value
        const labelText = el.label ? el.label : 'Group';
        const valText = el.buttonValue ? `[${el.buttonValue}]` : '';

        ctx.font = `600 10px 'Inter', sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${labelText} ${valText}`, x, y - 2);
        ctx.restore();
    }

    /**
     * Draw resize handles for selected elements
     */
    drawHandles(ctx, el, scale) {
        const bounds = this.getElementScreenBounds(el, scale);
        if (!bounds) return;

        const { x, y, w, h } = bounds;
        const handleSize = 6;
        const handles = this.getHandlePositions(x, y, w, h);

        ctx.save();
        ctx.fillStyle = COLORS.handle;
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 1.5;

        for (const handle of handles) {
            ctx.beginPath();
            ctx.rect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    getHandlePositions(x, y, w, h) {
        return [
            { x: x, y: y, cursor: 'nw-resize', pos: 'tl' },
            { x: x + w / 2, y: y, cursor: 'n-resize', pos: 'tm' },
            { x: x + w, y: y, cursor: 'ne-resize', pos: 'tr' },
            { x: x + w, y: y + h / 2, cursor: 'e-resize', pos: 'mr' },
            { x: x + w, y: y + h, cursor: 'se-resize', pos: 'br' },
            { x: x + w / 2, y: y + h, cursor: 's-resize', pos: 'bm' },
            { x: x, y: y + h, cursor: 'sw-resize', pos: 'bl' },
            { x: x, y: y + h / 2, cursor: 'w-resize', pos: 'ml' },
        ];
    }

    getElementScreenBounds(el, scale) {
        switch (el.type) {
            case 'rect':
            case 'image':
            case 'table':
            case 'checkbox':
            case 'inputbox':
            case 'button':
                return { x: el.x * scale, y: el.y * scale, w: el.w * scale, h: el.h * scale };
            case 'text':
                return {
                    x: el.x * scale - 2,
                    y: el.y * scale - 2,
                    w: (el.w || 40) * scale + 4,
                    h: (el.h || 6) * scale + 4,
                };
            case 'line':
                return {
                    x: Math.min(el.x1, el.x2) * scale,
                    y: Math.min(el.y1, el.y2) * scale,
                    w: Math.abs(el.x2 - el.x1) * scale,
                    h: Math.abs(el.y2 - el.y1) * scale,
                };
            case 'point': {
                const ps = 14; // point marker half-size
                return {
                    x: el.x * scale - ps,
                    y: el.y * scale - ps,
                    w: ps * 2,
                    h: ps * 2,
                };
            }
            default:
                return null;
        }
    }
}

export const drawRenderer = new DrawRenderer();
