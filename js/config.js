// ============================================================
// FPDF Visual Layout Designer — Configuration
// ============================================================

export const PAGE_TEMPLATES = {
    'a4-portrait': { name: 'A4 Portrait', width: 210, height: 297 },
    'a4-landscape': { name: 'A4 Landscape', width: 297, height: 210 },
    'letter-portrait': { name: 'Letter Portrait', width: 215.9, height: 279.4 },
    'letter-landscape': { name: 'Letter Landscape', width: 279.4, height: 215.9 },
};

export const MM_TO_PX = 3.78;

export const DEFAULTS = {
    pageTemplate: 'a4-portrait',
    pageWidth: 210,
    pageHeight: 297,
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    zoom: 1.0,
    gridSpacing: 5,
    gridVisible: true,
    snapEnabled: true,
    marginsVisible: true,
    snapThreshold: 3,
};

export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export const COLORS = {
    rect: '#58a6ff',
    text: '#3fb950',
    line: '#f0883e',
    image: '#bc8cff',
    table: '#f778ba',
    point: '#ff6b6b',
    checkbox: '#34d399',
    inputbox: '#60a5fa',
    button: '#a855f7',
    selected: '#ffd700',
    handle: '#ffffff',
    margin: 'rgba(248, 81, 73, 0.35)',
    gridMajor: 'rgba(88, 166, 255, 0.12)',
    gridMinor: 'rgba(88, 166, 255, 0.05)',
    crosshair: 'rgba(88, 166, 255, 0.5)',
    rulerHighlight: 'rgba(88, 166, 255, 0.4)',
};

export const TOOL_TYPES = {
    SELECT: 'select',
    POINT: 'point',
    RECT: 'rect',
    TEXT: 'text',
    LINE: 'line',
    IMAGE: 'image',
    TABLE: 'table',
    CHECKBOX: 'checkbox',
    INPUTBOX: 'inputbox',
    BUTTON: 'button',
};

export const ELEMENT_TYPES = {
    RECT: 'rect',
    TEXT: 'text',
    LINE: 'line',
    IMAGE: 'image',
    TABLE: 'table',
    POINT: 'point',
    CHECKBOX: 'checkbox',
    INPUTBOX: 'inputbox',
    BUTTON: 'button',
};
