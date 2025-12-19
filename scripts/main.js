// ==============================
// State
// ==============================
const state = {
    selectedPaletteElement: null,
    selectedCanvasElement: null,
    createdElements: [],
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
// Properties DOM
// ==============================
const properties = {
    type: document.querySelector('#properties-type'),
    id: document.querySelector('#properties-id'),
    text: document.querySelector('#properties-text')
};

// ==============================
// Utils
// ==============================
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// ==============================
// Selection
// ==============================
function clearCanvasSelection() {
    if (state.selectedCanvasElement) {
        state.selectedCanvasElement.classList.remove('canvas-selected');
        state.selectedCanvasElement = null;
    }
}

function selectCanvasElement(el) {
    clearCanvasSelection();
    el.classList.add('canvas-selected');
    state.selectedCanvasElement = el;
}

// ==============================
// Element creation
// ==============================
function createElement(tagName) {
    const el = document.createElement(tagName);
    el.textContent = `This is a ${tagName} element.`;

    el.classList.add(
        'builder-element',
        'inline-block',
        'absolute',
        'px-2',
        'py-1',
        'text-zinc-950'
    );

    return el;
}

// ==============================
// Palette handler
// ==============================
function onPaletteElementClick(paletteElement) {
    const tagName = paletteElement.dataset.element;

    if (state.createdElements.length === 0) {
        dom.pageCanvas.innerHTML = '';
    }

    const el = createElement(tagName);

    const elementState = {
        id: crypto.randomUUID(),
        el,
        dataSet: tagName.toLowerCase(),
        text: el.textContent,
        position: {
            x: 0,
            y: 0,
            mouseX: 0,
            mouseY: 0,
            startX: 0,
            startY: 0
        }
    };

    el.dataset.id = elementState.id;

    dom.pageCanvas.appendChild(el);
    state.createdElements.push(elementState);
}

// ==============================
// Drag & Drop
// ==============================
function initDragAndDrop() {
    dom.pageCanvas.addEventListener('mousedown', (event) => {
        const target = event.target.closest('.builder-element');
        if (!target) return;

        const elementState = state.createdElements.find(e => e.el === target);
        if (!elementState) return;

        state.draggingElement = elementState;

        elementState.position.mouseX = event.clientX;
        elementState.position.mouseY = event.clientY;
        elementState.position.startX = elementState.position.x;
        elementState.position.startY = elementState.position.y;
    });

    document.addEventListener('mousemove', (event) => {
        if (!state.draggingElement) return;

        const elState = state.draggingElement;
        const el = elState.el;
        const canvasRect = dom.pageCanvas.getBoundingClientRect();

        const dx = event.clientX - elState.position.mouseX;
        const dy = event.clientY - elState.position.mouseY;

        let x = elState.position.startX + dx;
        let y = elState.position.startY + dy;

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
// Canvas selection
// ==============================
function initCanvasSelection() {
    dom.pageCanvas.addEventListener('click', (event) => {
        const target = event.target.closest('.builder-element');

        if (!target) {
            clearCanvasSelection();
            clearPropertiesWindow();
            return;
        }

        const id = target.dataset.id;
        const elementState = state.createdElements.find(e => e.id === id);
        if (!elementState) return;

        selectCanvasElement(target);
        showPropertiesWindow(elementState);
    });
}

// ==============================
// Properties logic
// ==============================
function initPropertiesListeners() {
    properties.text.addEventListener('input', (event) => {
        const el = state.selectedCanvasElement;
        if (!el) return;

        const id = el.dataset.id;
        const elementState = state.createdElements.find(e => e.id === id);
        if (!elementState) return;

        elementState.text = event.target.value;
        el.textContent = event.target.value;
    });
}

function showPropertiesWindow(elementState) {
    properties.type.value = elementState.dataSet;
    properties.type.disabled = true;

    properties.id.value = elementState.id;
    properties.id.disabled = true;

    if (elementState.dataSet === 'p') {
        properties.text.disabled = false;
        properties.text.value = elementState.el.textContent;
    } else {
        properties.text.value = '';
        properties.text.disabled = true;
    }
}

function clearPropertiesWindow() {
    properties.type.value = '';
    properties.id.value = '';
    properties.text.value = '';
    properties.text.disabled = true;
}

// ==============================
// Init
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
