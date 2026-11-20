import React from 'react';

interface StudyTypingLayoutProps {
  /** True while the command field has focus on a mobile screen. */
  isTyping: boolean;
  /** Height of the area visible above the keyboard. */
  visibleHeight: number;
  /** Visual viewport offset from the top of the page. */
  offsetTop: number;
  /** Classes applied in both modes (reading layout). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Session container. While typing on mobile it is pinned to the visual viewport, so the field
 * and the symbol dock stay above the keyboard; otherwise it is a normal page wrapper.
 * The element type never changes, so children (and the session timer) are not remounted.
 */
export function StudyTypingLayout({ isTyping, visibleHeight, offsetTop, className = '', children }: StudyTypingLayoutProps) {
  return (
    <div
      data-typing={isTyping ? 'true' : undefined}
      className={isTyping ? `fixed inset-x-0 z-40 flex flex-col overflow-hidden bg-[#0c0e14] ${className}` : className}
      style={isTyping ? { top: `${offsetTop}px`, height: `${visibleHeight}px` } : undefined}
    >
      {children}
    </div>
  );
}
