import { NormalisedCoordinate } from './types';

/**
 * Converts a raw pixel click position to a normalised coordinate.
 *
 * Rules:
 * 1. xAnchor = clickX / naturalWidth; yAnchor = clickY / naturalHeight
 * 2. Both values are rounded to exactly 3 decimal places using Math.round(value * 1000) / 1000
 * 3. Both values are clamped to [0, 1] — clamping is applied AFTER rounding
 * 4. Throws RangeError if naturalWidth <= 0 or naturalHeight <= 0
 */
export function calculateAnchor(
  clickX: number,       // pixel X relative to image top-left
  clickY: number,       // pixel Y relative to image top-left
  naturalWidth: number, // image.naturalWidth
  naturalHeight: number // image.naturalHeight
): NormalisedCoordinate {
  // Rule 4: Validate dimensions
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    throw new RangeError('Image dimensions must be greater than zero');
  }

  // Rule 1: Normalise
  const rawX = clickX / naturalWidth;
  const rawY = clickY / naturalHeight;

  // Rule 2: Round to 3 decimal places
  const roundedX = Math.round(rawX * 1000) / 1000;
  const roundedY = Math.round(rawY * 1000) / 1000;

  // Rule 3: Clamp after rounding
  const xAnchor = Math.min(1, Math.max(0, roundedX));
  const yAnchor = Math.min(1, Math.max(0, roundedY));

  return { xAnchor, yAnchor };
}
