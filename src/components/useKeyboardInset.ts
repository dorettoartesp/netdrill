'use client';

import { useEffect, useState } from 'react';
import { keyboardInset } from '@/lib/visual-viewport';

/** Visible area above the on-screen keyboard, tracked from `window.visualViewport`. */
export interface KeyboardViewport {
  /** Height covered by the keyboard (0 when closed or unsupported). */
  inset: number;
  /** Height of the visible area in CSS pixels (0 before mount). */
  visibleHeight: number;
  /** Distance the visual viewport is panned from the top of the layout viewport. */
  offsetTop: number;
}

/**
 * Subscribes to visual viewport changes so layouts can stay above the virtual keyboard,
 * including on iOS Safari where the keyboard overlays the page instead of resizing it.
 *
 * @returns The current keyboard viewport; zeros during server rendering.
 */
export function useKeyboardInset(): KeyboardViewport {
  const [state, setState] = useState<KeyboardViewport>({ inset: 0, visibleHeight: 0, offsetTop: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const box = vv ? { height: vv.height, offsetTop: vv.offsetTop } : null;
      setState({
        inset: keyboardInset(window.innerHeight, box),
        visibleHeight: box ? box.height : window.innerHeight,
        offsetTop: box ? box.offsetTop : 0,
      });
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return state;
}
