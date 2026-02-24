import { AppState } from './types';
import { isNameDuplicate } from './state';

export type CommitCallback = (id: string, newName: string) => void;

export function bindInlineRename(
  panelEl: HTMLElement,
  getState: () => AppState,
  onCommit: CommitCallback
): void {
  // Use event delegation on panelEl
  panelEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('point-name')) return;

    const span = target as HTMLElement;
    const id = span.dataset.id;
    if (!id) return;

    const currentName = span.textContent ?? '';

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'rename-input';
    input.value = currentName;
    input.style.width = span.offsetWidth + 'px';

    let committed = false;

    function restoreSpan(): void {
      if (input.parentNode) {
        const restored = document.createElement('span');
        restored.className = 'point-name';
        restored.dataset.id = id!;
        restored.textContent = currentName;
        input.parentNode.replaceChild(restored, input);
      }
    }

    function showError(message: string): void {
      const errorSpan = document.createElement('span');
      errorSpan.className = 'rename-error';
      errorSpan.textContent = message;
      if (input.parentNode) {
        input.parentNode.replaceChild(errorSpan, input);
      }
      setTimeout(() => {
        if (errorSpan.parentNode) {
          const restored = document.createElement('span');
          restored.className = 'point-name';
          restored.dataset.id = id!;
          restored.textContent = currentName;
          errorSpan.parentNode.replaceChild(restored, errorSpan);
        }
      }, 1500);
    }

    function tryCommit(): void {
      if (committed) return;
      const trimmedName = input.value.trim();

      if (trimmedName === '') {
        committed = true;
        showError('Name cannot be empty');
        return;
      }

      const state = getState();
      if (isNameDuplicate(state, trimmedName, id)) {
        committed = true;
        showError('Name already in use');
        return;
      }

      committed = true;
      onCommit(id!, trimmedName);
      // The caller will re-render the panel which replaces the input naturally.
    }

    function cancelEdit(): void {
      if (committed) return;
      committed = true;
      restoreSpan();
    }

    input.addEventListener('keydown', (ke) => {
      if (ke.key === 'Enter') {
        ke.preventDefault();
        tryCommit();
      } else if (ke.key === 'Escape') {
        ke.preventDefault();
        cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      tryCommit();
    });

    span.parentNode?.replaceChild(input, span);
    input.focus();
    input.select();
  });
}
