import { AnchorPoint, AppState, ImageInfo } from './types';

// --- Initial state ---

export function createInitialState(): AppState {
  return {
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageObjectUrl: '',
    points: [],
    nameUnit: 'Point',
    selectedPointId: null,
  };
}

// --- Image ---

export function setImage(state: AppState, info: ImageInfo): AppState {
  return {
    ...state,
    imageNaturalWidth: info.naturalWidth,
    imageNaturalHeight: info.naturalHeight,
    imageObjectUrl: info.objectUrl,
  };
}

// --- Validation helpers (pure, no side effects) ---

export function isNameDuplicate(state: AppState, name: string, excludeId?: string): boolean {
  return state.points.some(
    (p) => p.pointName === name && p.id !== excludeId
  );
}

export function isAutoNamed(point: AnchorPoint, index: number, nameUnit: string): boolean {
  if (nameUnit.trim() === '') {
    return point.pointName === (index + 1).toString();
  }
  return point.pointName === (index + 1).toString() + nameUnit;
}

// --- Points ---

export function addPoint(state: AppState, xAnchor: number, yAnchor: number): AppState {
  const nameUnit = state.nameUnit;
  const autoName = nameUnit.trim() === ''
    ? (state.points.length + 1).toString()
    : (state.points.length + 1).toString() + nameUnit;

  const newPoint: AnchorPoint = {
    id: crypto.randomUUID(),
    pointName: autoName,
    xAnchor,
    yAnchor,
  };

  return {
    ...state,
    points: [...state.points, newPoint],
  };
}

export function renamePoint(state: AppState, id: string, newName: string): AppState {
  const points = state.points.map((p) =>
    p.id === id ? { ...p, pointName: newName } : p
  );
  return { ...state, points };
}

export function deletePoint(state: AppState, id: string): AppState {
  // Record the original index-based names before deletion
  const originalPoints = state.points;
  const filtered = originalPoints.filter((p) => p.id !== id);

  // Recalculate auto-names
  const recalculated = filtered.map((p, newIndex) => {
    // Find original index to check if it was auto-named
    const originalIndex = originalPoints.findIndex((op) => op.id === p.id);
    if (isAutoNamed(p, originalIndex, state.nameUnit)) {
      const newName = state.nameUnit.trim() === ''
        ? (newIndex + 1).toString()
        : (newIndex + 1).toString() + state.nameUnit;
      return { ...p, pointName: newName };
    }
    return p;
  });

  return {
    ...state,
    points: recalculated,
    selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
  };
}

export function reorderPoints(state: AppState, fromIndex: number, toIndex: number): AppState {
  const points = [...state.points];
  const [moved] = points.splice(fromIndex, 1);
  points.splice(toIndex, 0, moved);

  // Track original auto-names before reorder
  const originalPoints = state.points;

  const recalculated = points.map((p, newIndex) => {
    const originalIndex = originalPoints.findIndex((op) => op.id === p.id);
    if (isAutoNamed(p, originalIndex, state.nameUnit)) {
      const newName = state.nameUnit.trim() === ''
        ? (newIndex + 1).toString()
        : (newIndex + 1).toString() + state.nameUnit;
      return { ...p, pointName: newName };
    }
    return p;
  });

  return { ...state, points: recalculated };
}

export function setNameUnit(state: AppState, nameUnit: string): AppState {
  return { ...state, nameUnit };
}

// --- Selection ---

export function selectPoint(state: AppState, id: string | null): AppState {
  return { ...state, selectedPointId: id };
}
