import { AppState } from './types';

export type DeleteCallback = (id: string) => void;
export type SelectCallback = (id: string) => void;
export type HoverCallback = (id: string | null) => void;
export type ClearAllCallback = () => void;

export function renderPointsPanel(
  panelEl: HTMLElement,
  state: AppState,
  onDelete: DeleteCallback,
  onSelect: SelectCallback,
  onHover: HoverCallback,
  clearAll: ClearAllCallback
): void {
  panelEl.innerHTML = '';

  // 1. HEADER
  const header = document.createElement('div');
  header.className = 'panel-header';

  const dimsSpan = document.createElement('span');
  dimsSpan.className = 'image-dimensions';
  if (state.imageNaturalWidth > 0) {
    dimsSpan.textContent = `W: ${state.imageNaturalWidth} px | H: ${state.imageNaturalHeight} px`;
  } else {
    dimsSpan.textContent = 'No image loaded';
  }
  header.appendChild(dimsSpan);

  panelEl.appendChild(header);

  // 2. EMPTY STATE
  if (state.points.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.innerHTML = `
      <h3>No points yet</h3>
      <p>Click anywhere on the image to add your first anchor point.</p>
    `;
    panelEl.appendChild(emptyDiv);
    return;
  }

  // 3. POINTS LIST (Newest first)
  const ul = document.createElement('ul');
  ul.className = 'points-list';

  // Create a reversed copy for rendering
  const renderedPoints = [...state.points].reverse();

  renderedPoints.forEach((point) => {
    // Find the original index for display (1-based)
    const originalIndex = state.points.findIndex(p => p.id === point.id) + 1;

    const li = document.createElement('li');
    li.className = 'point-row' + (point.id === state.selectedPointId ? ' selected' : '');
    li.dataset.pointId = point.id;

    // a. Drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.setAttribute('aria-label', 'Drag to reorder');
    dragHandle.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
      </svg>
    `;
    li.appendChild(dragHandle);

    // b. Index symbol
    const indexSpan = document.createElement('span');
    indexSpan.className = 'point-index';
    indexSpan.textContent = String(originalIndex);
    li.appendChild(indexSpan);

    // c. Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'point-name';
    nameSpan.dataset.id = point.id;
    nameSpan.textContent = point.pointName;
    li.appendChild(nameSpan);

    // d. Coordinates badge
    const coordsSpan = document.createElement('span');
    coordsSpan.className = 'point-coords';
    coordsSpan.textContent = `${point.xAnchor.toFixed(3)} , ${point.yAnchor.toFixed(3)}`;
    li.appendChild(coordsSpan);

    // e. Action button area
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete point ${point.pointName}`);
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;
    li.appendChild(deleteBtn);

    ul.appendChild(li);
  });

  panelEl.appendChild(ul);

  // 4. CLEAR ALL BUTTON
  const clearAllBtn = document.createElement('button');
  clearAllBtn.className = 'clear-all-btn';
  clearAllBtn.textContent = 'Clear All Points';
  panelEl.appendChild(clearAllBtn);

  // 5. EVENT LISTENERS
  ul.querySelectorAll<HTMLButtonElement>('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const li = btn.closest('li');
      const id = li?.dataset.pointId;
      if (id) onDelete(id);
    });
  });

  ul.querySelectorAll<HTMLLIElement>('.point-row').forEach((li) => {
    li.addEventListener('click', (e) => {
      // If clicking exactly on the name span, let inlineRename handle it
      const target = e.target as HTMLElement;
      if (target.classList.contains('point-name')) {
        return;
      }

      const id = li.dataset.pointId;
      if (id) onSelect(id);
    });
    li.addEventListener('mouseenter', () => {
      const id = li.dataset.pointId;
      if (id) onHover(id);
    });
    li.addEventListener('mouseleave', () => {
      onHover(null);
    });
  });

  // Wire Clear All button
  clearAllBtn.addEventListener('click', () => {
    clearAll();
  });
}
