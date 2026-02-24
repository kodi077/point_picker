export type ReorderCallback = (fromIndex: number, toIndex: number) => void;

// Module-level drag state
let dragFromStateIdx: number = -1;
let insertionLineEl: HTMLElement | null = null;

export function bindDragReorder(
  listEl: HTMLUListElement,
  onReorder: ReorderCallback
): void {
  const items = Array.from(listEl.querySelectorAll<HTMLLIElement>('li'));
  const totalItems = items.length;

  items.forEach((li, domIndex) => {
    // List is REVERSED (newest first). 
    // State Index = (totalItems - 1 - domIndex)
    const stateIdx = totalItems - 1 - domIndex;

    li.draggable = true;

    li.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement;
      // If the user didn't click the handle, cancel the drag
      // (Wait 0ms so the browser can start the drag before we potentially cancel it, 
      // or check the initial target)
      // Actually, a better way is to check the mousedown target earlier, 
      // but 'dragstart' event target is the li. 
      // We check what the 'active' element was or use a flag.

      // Simpler: Check if the actual element under the cursor at start is the handle
      // but e.target is always the draggable LI.
      dragFromStateIdx = stateIdx;
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
      dragFromStateIdx = -1;
    });
  });

  // dragover on the UL
  listEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const mouseTarget = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    const targetLi = mouseTarget?.closest('li') as HTMLLIElement | null;
    if (!targetLi || !listEl.contains(targetLi)) return;

    const rect = targetLi.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isTopHalf = e.clientY < midY;

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

  // drop on the UL
  listEl.addEventListener('drop', (e) => {
    e.preventDefault();

    if (!insertionLineEl || dragFromStateIdx === -1) return;

    // Count how many LI elements are before the insertion line in the DOM
    const allChildren = Array.from(listEl.children);
    const insertionPos = allChildren.indexOf(insertionLineEl);

    let domToIndex = 0;
    for (let i = 0; i < insertionPos; i++) {
      if (allChildren[i].tagName === 'LI') {
        // If the item we are dragging is currently BEFORE the insertion line, 
        // it will be REMOVED from there and inserted. 
        // But drag-n-drop index logic is tricky. 
        // Let's just find the final state index.
        domToIndex++;
      }
    }

    // Since we are dragging the item, we need to adjust domToIndex 
    // if the item was already before the target.
    // However, usually it's easier to just calculate the final STATE index.
    // DOM Index -> State Index = (totalItems - 1 - domIndex)

    // IMPORTANT: If we drop at DOM index 0, it means it's the NEWEST (highest state index).
    // If we drop at the end, it's the OLDEST (index 0).

    // Adjusted State Index:
    let stateToIndex = totalItems - domToIndex;

    // Adjust if moving downwards in the state (higher index to lower index)
    if (dragFromStateIdx < stateToIndex) {
      stateToIndex--;
    }

    if (insertionLineEl.parentNode) {
      insertionLineEl.parentNode.removeChild(insertionLineEl);
    }
    insertionLineEl = null;

    if (dragFromStateIdx !== stateToIndex) {
      onReorder(dragFromStateIdx, stateToIndex);
    }
  });
}
