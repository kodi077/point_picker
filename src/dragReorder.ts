export type ReorderCallback = (fromIndex: number, toIndex: number) => void;

// Module-level drag state
let dragFromIndex: number = -1;
let insertionLineEl: HTMLElement | null = null;

export function bindDragReorder(
  listEl: HTMLUListElement,
  onReorder: ReorderCallback
): void {
  const items = Array.from(listEl.querySelectorAll<HTMLLIElement>('li'));

  items.forEach((li, index) => {
    // Only allow drag when mousedown is on the drag handle
    li.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('drag-handle')) {
        li.draggable = true;
      } else {
        li.draggable = false;
      }
    });

    li.addEventListener('mouseup', () => {
      li.draggable = false;
    });

    li.addEventListener('dragstart', (e) => {
      dragFromIndex = index;
      li.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      if (insertionLineEl && insertionLineEl.parentNode) {
        insertionLineEl.parentNode.removeChild(insertionLineEl);
      }
      insertionLineEl = null;
      dragFromIndex = -1;
      li.draggable = false;
    });
  });

  // dragover on the UL
  listEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    const targetLi = target?.closest('li') as HTMLLIElement | null;
    if (!targetLi || !listEl.contains(targetLi)) return;

    const rect = targetLi.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isTopHalf = e.clientY < midY;

    // Create or reuse insertion line
    if (!insertionLineEl) {
      insertionLineEl = document.createElement('div');
      insertionLineEl.className = 'insertion-line';
    }

    if (isTopHalf) {
      listEl.insertBefore(insertionLineEl, targetLi);
    } else {
      listEl.insertBefore(insertionLineEl, targetLi.nextSibling);
    }
  });

  // dragleave on the UL
  listEl.addEventListener('dragleave', (e) => {
    const related = e.relatedTarget as Node | null;
    if (!related || !listEl.contains(related)) {
      if (insertionLineEl && insertionLineEl.parentNode) {
        insertionLineEl.parentNode.removeChild(insertionLineEl);
        insertionLineEl = null;
      }
    }
  });

  // drop on the UL
  listEl.addEventListener('drop', (e) => {
    e.preventDefault();

    if (!insertionLineEl) return;

    // Determine toIndex: count li elements before the insertion line
    const allChildren = Array.from(listEl.children);
    const insertionIdx = allChildren.indexOf(insertionLineEl);

    // Count only li elements before the insertion line
    let toIndex = 0;
    for (let i = 0; i < insertionIdx; i++) {
      if (allChildren[i].tagName === 'LI') {
        toIndex++;
      }
    }

    if (insertionLineEl.parentNode) {
      insertionLineEl.parentNode.removeChild(insertionLineEl);
    }
    insertionLineEl = null;

    if (dragFromIndex !== -1 && dragFromIndex !== toIndex) {
      onReorder(dragFromIndex, toIndex);
    }
  });
}
