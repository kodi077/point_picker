import { AppState } from './types';
import {
  createInitialState,
  setImage,
  addPoint,
  deletePoint,
  renamePoint,
  reorderPoints,
  selectPoint,
  setNameUnit,
  resetState,
} from './state';
import { calculateAnchor } from './coordinateEngine';
import { bindImageUpload } from './imageUpload';
import {
  initCanvas,
  renderImage,
  renderDots,
  setHoveredPoint,
  getClickCoordinates,
  updateTooltip,
} from './canvasRenderer';
import { renderPointsPanel } from './pointsPanel';
import { bindInlineRename } from './inlineRename';
import { bindDragReorder } from './dragReorder';
import { renderNameUnitControl } from './nameUnitControl';
import { renderExportControls } from './exportModal';
import { bindNavigationGuard } from './navigationGuard';
import { showToast } from './toast';

// --- Accuracy check (only when URL contains ?test=1) ---
function runAccuracyCheck(): void {
  console.log('ACCURACY CHECK');
  const cases = [
    { x: 600, y: 600, w: 1200, h: 1200, ex: 0.5, ey: 0.5 },
    { x: 0, y: 0, w: 1200, h: 1200, ex: 0, ey: 0 },
    { x: 123, y: 456, w: 1000, h: 1000, ex: 0.123, ey: 0.456 },
    { x: 1, y: 1, w: 3, h: 3, ex: 0.333, ey: 0.333 },
  ];

  cases.forEach((c, i) => {
    const result = calculateAnchor(c.x, c.y, c.w, c.h);
    const pass = result.xAnchor === c.ex && result.yAnchor === c.ey;
    console.log(`Case ${i + 1}: ${pass ? 'PASS' : 'FAIL'} (got x=${result.xAnchor}, y=${result.yAnchor}; expected x=${c.ex}, y=${c.ey})`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.search.includes('test=1')) {
    runAccuracyCheck();
  }

  // --- DOM refs ---
  const fileInputEl = document.getElementById('file-input') as HTMLInputElement;
  const dropZoneEl = document.getElementById('upload-zone') as HTMLElement;
  const containerEl = document.getElementById('image-container') as HTMLElement;
  const panelEl = document.getElementById('points-panel') as HTMLElement;
  const exportControlsEl = document.getElementById('export-controls') as HTMLElement;
  const tooltipEl = document.getElementById('coordinate-tooltip') as HTMLElement;
  const imageContainerEl = document.getElementById('image-container') as HTMLElement;
  const resetBtnEl = document.getElementById('reset-image-btn') as HTMLButtonElement;

  // --- Canvas ---
  const canvas = initCanvas(containerEl);

  // --- State ---
  let state: AppState = createInitialState();

  function setState(newState: AppState): void {
    state = newState;
    render();
  }

  function render(): void {
    renderImage(containerEl, canvas, state);
    renderDots(canvas, state);
    renderPointsPanel(panelEl, state, handleDelete, handleSelect, handleHover, handleClearAll);

    // Toggle visibility based on image state
    if (state.imageNaturalWidth > 0) {
      dropZoneEl.style.display = 'none';
      imageContainerEl.style.display = 'flex';
      resetBtnEl.style.display = 'flex';
    } else {
      dropZoneEl.style.display = 'flex';
      imageContainerEl.style.display = 'none';
      resetBtnEl.style.display = 'none';
    }

    const nameUnitContainer = document.getElementById('name-unit-container') as HTMLElement;
    if (nameUnitContainer) {
      renderNameUnitControl(nameUnitContainer, state.nameUnit, handleNameUnitChange);
    }

    const listEl = panelEl.querySelector<HTMLUListElement>('.points-list');
    if (listEl) bindDragReorder(listEl, handleReorder);
  }

  // --- Handlers ---
  function handleDelete(id: string): void {
    setState(deletePoint(state, id));
  }

  function handleSelect(id: string): void {
    setState(selectPoint(state, id));
  }

  function handleHover(id: string | null): void {
    setHoveredPoint(id);
    renderDots(canvas, state);
  }

  function handleRename(id: string, name: string): void {
    setState(renamePoint(state, id, name));
  }

  function handleReorder(from: number, to: number): void {
    setState(reorderPoints(state, from, to));
  }

  function handleNameUnitChange(unit: string): void {
    setState(setNameUnit(state, unit));
  }

  function handleClearAll(): void {
    if (confirm('Delete all points?')) {
      setState({ ...state, points: [], selectedPointId: null });
    }
  }

  function handleReset(): void {
    if (confirm('Deselect image and remove all points?')) {
      setState(resetState());
    }
  }

  // --- Reset button ---
  resetBtnEl.addEventListener('click', handleReset);

  // --- Canvas click: add point ---
  canvas.addEventListener('click', (e) => {
    const coords = getClickCoordinates(e, canvas, state);
    if (!coords) return;
    const { xAnchor, yAnchor } = calculateAnchor(
      coords.clickX,
      coords.clickY,
      state.imageNaturalWidth,
      state.imageNaturalHeight
    );

    // Check for duplicate coordinates
    const duplicate = state.points.find(p => p.xAnchor === xAnchor && p.yAnchor === yAnchor);
    if (duplicate) {
      showToast('Identical point already exists');
      handleSelect(duplicate.id);
      return;
    }

    setState(addPoint(state, xAnchor, yAnchor));
  });

  // --- Canvas pointer events: make the container clickable ---
  containerEl.style.cursor = 'crosshair';
  canvas.style.pointerEvents = 'auto';
  canvas.style.cursor = 'crosshair';

  // --- Canvas tooltip ---
  canvas.addEventListener('mousemove', (e) => {
    updateTooltip(tooltipEl, state, e, canvas);
  });

  canvas.addEventListener('mouseleave', () => {
    tooltipEl.style.display = 'none';
  });

  // --- Keyboard accessibility on image container ---
  imageContainerEl.addEventListener('keydown', (e) => {
    if (state.imageNaturalWidth === 0) return;
    // Keyboard activation is not required for precise point placement
    // (mouse click is required for precise placement)
    if (e.key === 'Enter' || e.key === ' ') {
      imageContainerEl.setAttribute(
        'aria-description',
        'Use mouse click to place anchor points precisely on the image.'
      );
    }
  });

  // --- Image upload ---
  bindImageUpload(
    fileInputEl,
    dropZoneEl,
    (info) => setState(setImage(state, info)),
    (msg) => alert(msg)
  );

  // --- Export controls ---
  renderExportControls(exportControlsEl, () => state.points);

  // --- Inline Rename (Bind once) ---
  bindInlineRename(panelEl, () => state, handleRename);

  // --- Navigation guard ---
  bindNavigationGuard(() => state);


  // --- Initial render ---
  render();
});
