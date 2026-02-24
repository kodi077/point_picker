import { AppState } from './types';

// Store handler reference for removal
let boundHandler: ((e: BeforeUnloadEvent) => void) | null = null;

export function bindNavigationGuard(getState: () => AppState): void {
  boundHandler = (e: BeforeUnloadEvent) => {
    const state = getState();
    if (state.points.length > 0) {
      e.preventDefault();
      e.returnValue = '';
      // Modern browsers show their own text — setting returnValue is enough.
    }
  };
  window.addEventListener('beforeunload', boundHandler);
}

export function unbindNavigationGuard(): void {
  if (boundHandler) {
    window.removeEventListener('beforeunload', boundHandler);
    boundHandler = null;
  }
}
