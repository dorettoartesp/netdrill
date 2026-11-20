/** Minimal shape of `window.visualViewport` used for keyboard detection. */
export interface ViewportBox {
  height: number;
  offsetTop: number;
}

/**
 * Height of the layout viewport hidden below the visual viewport, i.e. covered by the
 * on-screen keyboard on mobile browsers that overlay it (iOS Safari).
 *
 * @param layoutHeight - `window.innerHeight`.
 * @param viewport - `window.visualViewport` (or null when unsupported).
 * @returns Covered height in CSS pixels, never negative.
 */
export function keyboardInset(layoutHeight: number, viewport: ViewportBox | null): number {
  if (!viewport) return 0;
  return Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop));
}
