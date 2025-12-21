// ==============================
// GLOBAL STATE
// ==============================
const state = {
    createdElements: [],
    selectedCanvasElement: null,
    draggingElement: null
};

// ==============================
// DOM
// ==============================
const dom = {
    paletteElements: document.querySelectorAll('.element'),
    pageCanvas: document.querySelector('.canvas-inner')
};

// ==============================
// PROPERTIES DOM
// ==============================
const properties = {
    element: document.querySelector('#properties-element'),
    id: document.querySelector('#properties-id'),
    text: document.querySelector('#properties-text'),
    textColor: document.querySelector('#properties-text-color'),
    fontSize: document.querySelector('#properties-font-size'),
    backgroundColor: document.querySelector('#properties-background-color'),
    backgroundOpacity: document.querySelector('#properties-background-opacity'),
    value: document.querySelector('#properties-value'),
    type: document.querySelector('#properties-type')
};

// ==============================
// ELEMENT SCHEMAS (CORE)
// ==============================
const ELEMENT_SCHEMAS = {
    p: {
        text: {
            default: 'This is a paragraph',
            apply: (el, value) => el.textContent = value
        },
        textColor: {
            default: '#000000',
            apply: (el, value) => el.style.color = value
        },
        fontSize: {
            default: 16,
            apply: (el, value) => el.style.fontSize = `${value}px`
        },
        backgroundColor: {
            default: '#ffffff',
            apply: (el, value, elementState) => {
                const opacity = elementState.styles.backgroundOpacity ?? 1;
                el.style.backgroundColor = hexToRgba(value, opacity);
            }
        },
        backgroundOpacity: {
            default: 1,
            apply: (el, value, elementState) => {
                const bgColor = getComputedStyle(el).backgroundColor;
                el.style.backgroundColor = rgbToRgba(bgColor, value);
            }
        }
    },
    input: {
        type: {
            default: 'text',
            apply: (el, value) => el.setAttribute('type', value)
        },
        textColor: {
            default: '#000000',
            apply: (el, value) => el.style.color = value
        },
        backgroundColor: {
            default: '#ffffff',
            apply: (el, value, elementState) => {
                const opacity = elementState.styles.backgroundOpacity ?? 1;
                el.style.backgroundColor = hexToRgba(value, opacity);
            }
        },
        backgroundOpacity: {
            default: 1,
            apply: (el, value, elementState) => {
                const bgColor = getComputedStyle(el).backgroundColor;
                el.style.backgroundColor = rgbToRgba(bgColor, value);
            }
        },
        value: {
            default: '',
            apply: (el, value) => el.value = value
        },
    }
};

// ==============================
// UTILS
// ==============================
function hexToRgba(hex, alpha = 1) {
    hex = hex.replace('#', '');

    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbToRgba(rgb, alpha) {
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return rgb;
    return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getSelectedElementState() {
    if (!state.selectedCanvasElement) return null;
    return state.createdElements.find(
        e => e.id === state.selectedCanvasElement.dataset.id
    );
}

// ==============================
// SELECTION
// ==============================
function clearCanvasSelection() {
    if (!state.selectedCanvasElement) return;
    state.selectedCanvasElement.classList.remove('canvas-selected');
    state.selectedCanvasElement = null;
}

function selectCanvasElement(el) {
    clearCanvasSelection();
    el.classList.add('canvas-selected');
    state.selectedCanvasElement = el;
}

// ==============================
// ELEMENT CREATION
// ==============================
function createElement(tagName) {
    const el = document.createElement(tagName);
    el.classList.add(
        'builder-element',
        'absolute',
        'inline-block',
        'px-2',
        'py-1',
        'text-zinc-950'
    );
    return el;
}

function createElementState(tagName, el) {
    const schema = ELEMENT_SCHEMAS[tagName] || {};

    const elementState = {
        id: crypto.randomUUID(),
        el,
        type: tagName,
        styles: {},
        position: {
            x: 0,
            y: 0,
            mouseX: 0,
            mouseY: 0,
            startX: 0,
            startY: 0
        }
    };

    Object.entries(schema).forEach(([key, config]) => {
        elementState.styles[key] = config.default;
        config.apply(el, config.default, elementState);
    });

    return elementState;
}

// ==============================
// PALETTE HANDLER
// ==============================
function onPaletteElementClick(paletteElement) {
    const tagName = paletteElement.dataset.element.toLowerCase();

    if (state.createdElements.length === 0) {
        dom.pageCanvas.innerHTML = '';
    }

    const el = createElement(tagName);
    const elementState = createElementState(tagName, el);

    el.dataset.id = elementState.id;

    dom.pageCanvas.appendChild(el);
    state.createdElements.push(elementState);
}

// ==============================
// DRAG & DROP
// ==============================
function initDragAndDrop() {
    dom.pageCanvas.addEventListener('mousedown', (e) => {
        const target = e.target.closest('.builder-element');
        if (!target) return;

        const elementState = state.createdElements.find(el => el.el === target);
        if (!elementState) return;

        state.draggingElement = elementState;

        elementState.position.mouseX = e.clientX;
        elementState.position.mouseY = e.clientY;
        elementState.position.startX = elementState.position.x;
        elementState.position.startY = elementState.position.y;
    });

    document.addEventListener('mousemove', (e) => {
        if (!state.draggingElement) return;

        const elState = state.draggingElement;
        const el = elState.el;
        const canvasRect = dom.pageCanvas.getBoundingClientRect();

        let x = elState.position.startX + (e.clientX - elState.position.mouseX);
        let y = elState.position.startY + (e.clientY - elState.position.mouseY);

        const maxX = canvasRect.width - el.offsetWidth;
        const maxY = canvasRect.height - el.offsetHeight;

        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        elState.position.x = x;
        elState.position.y = y;
    });

    document.addEventListener('mouseup', () => {
        state.draggingElement = null;
    });
}

// ==============================
// CANVAS SELECTION
// ==============================
function initCanvasSelection() {
    dom.pageCanvas.addEventListener('click', (e) => {
        const target = e.target.closest('.builder-element');

        if (!target) {
            clearCanvasSelection();
            clearPropertiesWindow();
            return;
        }

        const elementState = state.createdElements.find(
            el => el.id === target.dataset.id
        );

        if (!elementState) return;

        selectCanvasElement(target);
        showPropertiesWindow(elementState);
    });
}

// ==============================
// PROPERTIES LOGIC
// ==============================
function showPropertiesWindow(elementState) {
    properties.element.value = elementState.type;
    properties.element.disabled = true;

    properties.id.value = elementState.id;
    properties.id.disabled = true;

    const schema = ELEMENT_SCHEMAS[elementState.type];

    Object.entries(properties).forEach(([key, input]) => {
        if (key === 'element' || key === 'id') return;

        if (!schema[key]) {
            input.value = '';
            input.disabled = true;
            return;
        }

        input.disabled = false;
        input.value = elementState.styles[key];
    });
}

function clearPropertiesWindow() {
    Object.values(properties).forEach(input => {
        input.value = '';
        input.disabled = true;
    });
}

function initPropertiesListeners() {
    Object.entries(properties).forEach(([key, input]) => {
        if (!input || key === 'element' || key === 'id') return;

        input.addEventListener('input', (e) => {
            const elementState = getSelectedElementState();
            if (!elementState) return;

            const schema = ELEMENT_SCHEMAS[elementState.type];
            if (!schema[key]) return;

            elementState.styles[key] = e.target.value;
            schema[key].apply(
                elementState.el,
                e.target.value,
                elementState
            );
        });
    });
}

// ==============================
// INIT
// ==============================
function initPalette() {
    dom.paletteElements.forEach(el => {
        el.addEventListener('click', () => onPaletteElementClick(el));
    });
}

initPalette();
initCanvasSelection();
initDragAndDrop();
initPropertiesListeners();
