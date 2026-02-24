// A single anchor point saved by the user.
export interface AnchorPoint {
  readonly id: string;        // UUID v4, immutable after creation
  pointName: string;          // editable by user
  readonly xAnchor: number;   // normalised 0.000–1.000, 3 decimal places
  readonly yAnchor: number;   // normalised 0.000–1.000, 3 decimal places
}

// The complete application state — a plain object, never mutated in place.
export interface AppState {
  readonly imageNaturalWidth: number;   // 0 if no image loaded
  readonly imageNaturalHeight: number;  // 0 if no image loaded
  readonly imageObjectUrl: string;      // empty string if no image loaded
  readonly imageName: string;           // original file name
  readonly points: ReadonlyArray<AnchorPoint>;
  readonly nameUnit: string;            // suffix for auto-naming, default "Point"
  readonly selectedPointId: string | null;
}

// All supported export languages.
export type ExportLanguage =
  | "json"
  | "dart"
  | "swift"
  | "java"
  | "javascript"
  | "typescript"
  | "kotlin"
  | "python"
  | "csharp";

// Return value from the coordinate calculator.
export interface NormalisedCoordinate {
  readonly xAnchor: number;
  readonly yAnchor: number;
}

// Return value from the image loader.
export interface ImageInfo {
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly objectUrl: string;
  readonly fileName: string;
}
