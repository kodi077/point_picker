import { AnchorPoint, AppState, ImageInfo } from './types';

// --- Initial state ---

export function createInitialState(): AppState {
  return {
    imageNaturalWidth: 0,
    imageNaturalHeight: 0,
    imageObjectUrl: '',
    imageName: '',
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
    imageName: info.fileName,
  };
}

// --- Validation helpers (pure, no side effects) ---

export function isNameDuplicate(state: AppState, name: string, excludeId?: string): boolean {
  return state.points.some(
    (p) => p.pointName === name && p.id !== excludeId
  );
}

export function isAutoNamed(point: AnchorPoint, index: number, nameUnit: string): boolean {
  return point.pointName === nameUnit + (index + 1).toString();
}

// --- Points ---

export function addPoint(state: AppState, xAnchor: number, yAnchor: number): AppState {
  const nameUnit = state.nameUnit;
  const autoName = nameUnit + (state.points.length + 1).toString();

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
  const filtered = state.points.filter((p) => p.id !== id);

  return {
    ...state,
    points: filtered,
    selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
  };
}

export function reorderPoints(state: AppState, fromIndex: number, toIndex: number): AppState {
  const points = [...state.points];
  const [moved] = points.splice(fromIndex, 1);
  points.splice(toIndex, 0, moved);

  return { ...state, points };
}

export function setNameUnit(state: AppState, nameUnit: string): AppState {
  return { ...state, nameUnit };
}

// --- Selection ---

export function selectPoint(state: AppState, id: string | null): AppState {
  return { ...state, selectedPointId: id };
}

export function resetState(): AppState {
  return createInitialState();
}
