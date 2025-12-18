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
    pageCanvas: document.querySelector('.canvas-inner') // 🔥 canvas real
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
        el.classList.remove('bg-zinc-700', 'border-zinc-600');
        el.classList.add('bg-zinc-900', 'border-zinc-700');
    });

    element.classList.add('bg-zinc-700', 'border-zinc-600');
    element.classList.remove('bg-zinc-900', 'border-zinc-700');
}

function createElement(tagName) {
    const el = document.createElement(tagName);
    el.textContent = `This is a ${tagName} element.`;
    el.classList.add(
        'builder-element',
        'absolute',
        'inline-block', 
        'w-auto',    
        'max-w-max', 
        'px-2',
        'py-1',
        'text-zinc-950'
    );

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
        position: {
            xOffset: 0,
            yOffset: 0,
            mouseX: 0,
            mouseY: 0,
            startX: 0,
            startY: 0
        }
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

        elementState.position.mouseX = event.clientX;
        elementState.position.mouseY = event.clientY;

        elementState.position.startX = elementState.position.xOffset;
        elementState.position.startY = elementState.position.yOffset;
    });

    document.addEventListener('mousemove', (event) => {
        const elementState = state.draggingElement;
        if (!elementState) return;

        const canvasRect = dom.pageCanvas.getBoundingClientRect();
        const el = elementState.el;

        let dx = event.clientX - elementState.position.mouseX;
        let dy = event.clientY - elementState.position.mouseY;

        let x = elementState.position.startX + dx;
        let y = elementState.position.startY + dy;

        const maxX = canvasRect.width - el.offsetWidth;
        const maxY = canvasRect.height - el.offsetHeight;

        x = clamp(x, 0, maxX);
        y = clamp(y, 0, maxY);

        el.style.transform = `translate(${x}px, ${y}px)`;

        elementState.position.xOffset = x;
        elementState.position.yOffset = y;
    });

    document.addEventListener('mouseup', () => {
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
