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
    pageCanvas: document.querySelector('.page-container')
};

// ==============================
// Utils
// ==============================

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function clearCanvasSelection() {
    if (state.selectedCanvasElement) {
        state.selectedCanvasElement.classList.remove('canvas-selected');
        state.selectedCanvasElement = null;
    }
}

function selectCanvasElement(element) {
    clearCanvasSelection();
    element.classList.add('canvas-selected');
    state.selectedCanvasElement = element;
}

function setPaletteSelection(element) {
    dom.paletteElements.forEach(el => {
        el.classList.remove('bg-zinc-700', 'border-zinc-600', 'selected-element');
        el.classList.add('bg-zinc-900', 'border-zinc-700');
    });

    element.classList.add('bg-zinc-700', 'border-zinc-600', 'selected-element');
    element.classList.remove('bg-zinc-900', 'border-zinc-700');
}

function createElement(tagName) {
    const el = document.createElement(tagName);
    el.textContent = `This is a ${tagName} element.`;
    el.classList.add('builder-element', 'inline-block', 'px-2', 'py-1');
    return el;
}

// ==============================
// Handlers
// ==============================
function onPaletteElementClick(paletteElement) {
    const tagName = paletteElement.dataset.element;

    state.selectedPaletteElement = paletteElement;
    setPaletteSelection(paletteElement);

    const newElement = createElement(tagName);
    dom.pageCanvas.replaceChildren(newElement);

    const elementState = {
        el: newElement,
        id: crypto.randomUUID(),
        styles: {},
        position: {
            initialX: 0,
            initialY: 0,
            xOffset: 0,
            yOffset: 0
        },
        isDragging: false
    };

    state.createdElements.push(elementState);
}

// ==============================
// Canvas delegation
// ==============================
function initCanvasSelection() {

    dom.pageCanvas.addEventListener('click', (event) => {
        const target = event.target.closest('.builder-element');
        if (!target) return;

        selectCanvasElement(target);
    });

    dom.pageCanvas.addEventListener('mousedown', (event) => {
        const target = event.target.closest('.builder-element');
        if (!target) return;

        const elementState = state.createdElements.find(e => e.el === target);
        if (!elementState) return;

        state.draggingElement = elementState;
        elementState.isDragging = true;

        elementState.position.initialX = event.clientX - elementState.position.xOffset;
        elementState.position.initialY = event.clientY - elementState.position.yOffset;

        const canvasRect = dom.pageCanvas.getBoundingClientRect();
        const elementRect = elementState.el.getBoundingClientRect();

        elementState.baseX = elementRect.left - canvasRect.left;
        elementState.baseY = elementRect.top - canvasRect.top;

    });

    document.addEventListener('mousemove', (event) => {
        const elementState = state.draggingElement;
        if (!elementState) return;
        event.preventDefault();

        const canvasRect = dom.pageCanvas.getBoundingClientRect();
        const elementRect = elementState.el.getBoundingClientRect();

        let dx = event.clientX - elementState.position.initialX;
        let dy = event.clientY - elementState.position.initialY;

        // Limit dragging within canvas bounds

        const maxX = canvasRect.width - elementRect.width - elementState.baseX;
        const maxY = canvasRect.height - elementRect.height - elementState.baseY;

        dx = clamp(dx, -elementState.baseX, maxX);
        dy = clamp(dy, -elementState.baseY, maxY);

        elementState.position.xOffset = dx;
        elementState.position.yOffset = dy;

        elementState.el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    document.addEventListener('mouseup', () => {
        if (!state.draggingElement) return;

        state.draggingElement.isDragging = false;
        state.draggingElement = null;
    });
}

// ==============================
// Init
// ==============================
function initPalette() {
    dom.paletteElements.forEach(element => {
        element.addEventListener('click', () =>
            onPaletteElementClick(element)
        );
    });
}

initPalette();
initCanvasSelection();
