import { AppState } from './types';
import { calculateAnchor } from './coordinateEngine';

// --- Constants ---
const DOT_RADIUS = 6;                 // px
const DOT_COLOR = '#3B82F6';          // blue-500
const DOT_SELECTED = '#EF4444';       // red-500 for selected point
const DOT_HOVER = '#F59E0B';          // amber-500 for hovered point
const LABEL_FONT = '12px Arial';
const LABEL_COLOR = '#1E3A5F';

// --- State internal to this module ---
let hoveredPointId: string | null = null;

// --- Exported functions ---

export function initCanvas(containerEl: HTMLElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  containerEl.appendChild(canvas);
  return canvas;
}

export function renderImage(
  containerEl: HTMLElement,
  canvas: HTMLCanvasElement,
  state: AppState
): void {
  if (!state.imageObjectUrl) {
    containerEl.style.backgroundImage = '';
    containerEl.style.width = '';
    containerEl.style.height = '';
    return;
  }

  const MAX = 800;
  const { imageNaturalWidth: w, imageNaturalHeight: h } = state;
  let displayW = w;
  let displayH = h;

  if (w > MAX || h > MAX) {
    const ratio = Math.min(MAX / w, MAX / h);
    displayW = Math.round(w * ratio);
    displayH = Math.round(h * ratio);
  }

  containerEl.style.position = 'relative';
  containerEl.style.display = 'inline-block';
  containerEl.style.backgroundImage = `url(${state.imageObjectUrl})`;
  containerEl.style.backgroundSize = 'contain';
  containerEl.style.backgroundRepeat = 'no-repeat';
  containerEl.style.backgroundPosition = 'top left';
  containerEl.style.width = displayW + 'px';
  containerEl.style.height = displayH + 'px';

  // Resize canvas to match rendered size
  canvas.width = containerEl.offsetWidth;
  canvas.height = containerEl.offsetHeight;

  renderDots(canvas, state);
}

export function renderDots(canvas: HTMLCanvasElement, state: AppState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const point of state.points) {
    const px = point.xAnchor * canvas.width;
    const py = point.yAnchor * canvas.height;

    // Choose fill color
    let fillColor: string;
    if (point.id === state.selectedPointId) {
      fillColor = DOT_SELECTED;
    } else if (point.id === hoveredPointId) {
      fillColor = DOT_HOVER;
    } else {
      fillColor = DOT_COLOR;
    }

    // Draw filled circle
    ctx.beginPath();
    ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Draw label with white text shadow
    ctx.font = LABEL_FONT;
    ctx.shadowColor = 'white';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 0;
    ctx.fillStyle = LABEL_COLOR;
    ctx.fillText(point.pointName, px + 10, py + 4);
    ctx.shadowColor = 'transparent';
  }
}

export function setHoveredPoint(id: string | null): void {
  hoveredPointId = id;
  // Callers must call renderDots() after calling this.
}

export function getClickCoordinates(
  event: MouseEvent,
  canvas: HTMLCanvasElement,
  state: AppState
): { clickX: number; clickY: number } | null {
  if (state.imageNaturalWidth === 0) return null;

  const rect = canvas.getBoundingClientRect();
  const clickXRendered = event.clientX - rect.left;
  const clickYRendered = event.clientY - rect.top;

  // Scale rendered px to natural px
  const clickX = (clickXRendered / canvas.width) * state.imageNaturalWidth;
  const clickY = (clickYRendered / canvas.height) * state.imageNaturalHeight;

  return { clickX, clickY };
}

export function updateTooltip(
  tooltipEl: HTMLElement,
  state: AppState,
  event: MouseEvent,
  canvas: HTMLCanvasElement
): void {
  if (state.imageNaturalWidth === 0) {
    tooltipEl.style.display = 'none';
    return;
  }

  const coords = getClickCoordinates(event, canvas, state);
  if (!coords) {
    tooltipEl.style.display = 'none';
    return;
  }

  const { xAnchor, yAnchor } = calculateAnchor(
    coords.clickX,
    coords.clickY,
    state.imageNaturalWidth,
    state.imageNaturalHeight
  );

  tooltipEl.textContent = `x: ${xAnchor.toFixed(3)}  y: ${yAnchor.toFixed(3)}`;
  tooltipEl.style.left = (event.clientX + 12) + 'px';
  tooltipEl.style.top = (event.clientY + 12) + 'px';
  tooltipEl.style.display = 'block';
}
