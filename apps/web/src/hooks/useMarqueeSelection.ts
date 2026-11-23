import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLibraryStore } from '../stores/library-store.js';

export interface MarqueeRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export type MarqueeBox = MarqueeRect;

export function useMarqueeSelection(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const isMarqueeActiveRef = useRef(false);
  const justFinishedMarqueeRef = useRef(false);

  // Drag tracking refs
  const isMouseDownRef = useRef(false);
  const candidateStartRef = useRef<{
    clientX: number;
    clientY: number;
    anchorContentX: number;
    anchorContentY: number;
  } | null>(null);
  const currentPointerRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const initialSelectedIdsRef = useRef<Set<string>>(new Set());
  const autoScrollRafId = useRef<number | null>(null);

  // Helper to update marquee box and perform 1-pixel edge touch intersection
  const updateMarqueeAndSelection = useCallback(
    (currentClientX: number, currentClientY: number) => {
      const container = containerRef.current;
      const start = candidateStartRef.current;
      if (!container || !start) return;

      const currentRect = container.getBoundingClientRect();

      // Convert anchor back to current viewport coordinates taking dynamic scroll into account
      const anchorClientX = start.anchorContentX - container.scrollLeft + currentRect.left;
      const anchorClientY = start.anchorContentY - container.scrollTop + currentRect.top;

      const rawLeft = Math.min(anchorClientX, currentClientX);
      const rawRight = Math.max(anchorClientX, currentClientX);
      const rawTop = Math.min(anchorClientY, currentClientY);
      const rawBottom = Math.max(anchorClientY, currentClientY);

      // Clamp strictly to containerRect (canvasRef.current.getBoundingClientRect())
      const rect: MarqueeRect = {
        left: Math.max(currentRect.left, rawLeft),
        right: Math.min(currentRect.right, rawRight),
        top: Math.max(currentRect.top, rawTop),
        bottom: Math.min(currentRect.bottom, rawBottom),
        width: Math.max(0, Math.min(currentRect.right, rawRight) - Math.max(currentRect.left, rawLeft)),
        height: Math.max(0, Math.min(currentRect.bottom, rawBottom) - Math.max(currentRect.top, rawTop)),
      };

      setMarqueeRect(rect);

      // Hit-Testing: Compare every [data-library-item-id] element's getBoundingClientRect() directly against marqueeRect
      const itemElements = container.querySelectorAll<HTMLElement>('[data-library-item-id]');
      const intersectingIds = new Set<string>(initialSelectedIdsRef.current);

      itemElements.forEach((el) => {
        const id = el.getAttribute('data-library-item-id');
        if (!id) return;
        const itemRect = el.getBoundingClientRect();
        // Strict 1-pixel edge intersection against marqueeRect
        const isIntersecting = !(
          rect.right < itemRect.left ||
          rect.left > itemRect.right ||
          rect.bottom < itemRect.top ||
          rect.top > itemRect.bottom
        );
        if (isIntersecting) {
          intersectingIds.add(id);
        }
      });

      const nextIds = Array.from(intersectingIds);
      const currentIds = useLibraryStore.getState().selectedIds;
      const hasChanged =
        nextIds.length !== currentIds.length ||
        nextIds.some((id) => !currentIds.includes(id));

      if (hasChanged) {
        useLibraryStore.getState().setSelectedIds(nextIds);
      }
    },
    [containerRef]
  );

  const stopAutoScrollLoop = useCallback(() => {
    if (autoScrollRafId.current !== null) {
      cancelAnimationFrame(autoScrollRafId.current);
      autoScrollRafId.current = null;
    }
  }, []);

  const startAutoScrollLoop = useCallback(() => {
    if (autoScrollRafId.current !== null) return;

    const scrollLoop = () => {
      if (!isMarqueeActiveRef.current || !containerRef.current || !candidateStartRef.current) {
        autoScrollRafId.current = null;
        return;
      }

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const { clientX, clientY } = currentPointerRef.current;

      // Define 36px trigger zone inside top and bottom edges (clamped to window.innerHeight)
      const topEdge = Math.max(containerRect.top, 0);
      const bottomEdge = Math.min(containerRect.bottom, window.innerHeight);
      const topZoneBottom = topEdge + 36;
      const bottomZoneTop = bottomEdge - 36;

      let didScroll = false;

      if (clientY > bottomZoneTop) {
        // Pointer in bottom 36px trigger zone: smoothly scroll down
        const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        if (container.scrollTop < maxScroll) {
          const proximity = (clientY - bottomZoneTop) / 36;
          const intensity = Math.min(1, Math.max(0, proximity));
          const scrollSpeed = 2 + intensity * 6; // Gentle, smooth 2px to 8px per frame
          const nextScrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
          if (nextScrollTop !== container.scrollTop) {
            container.scrollTop = nextScrollTop;
            didScroll = true;
          }
        }
      } else if (clientY < topZoneBottom) {
        // Pointer in top 36px trigger zone: smoothly scroll up
        if (container.scrollTop > 0) {
          const proximity = (topZoneBottom - clientY) / 36;
          const intensity = Math.min(1, Math.max(0, proximity));
          const scrollSpeed = 2 + intensity * 6; // Gentle, smooth 2px to 8px per frame
          const nextScrollTop = Math.max(0, container.scrollTop - scrollSpeed);
          if (nextScrollTop !== container.scrollTop) {
            container.scrollTop = nextScrollTop;
            didScroll = true;
          }
        }
      }

      if (didScroll) {
        updateMarqueeAndSelection(clientX, clientY);
      }

      autoScrollRafId.current = requestAnimationFrame(scrollLoop);
    };

    autoScrollRafId.current = requestAnimationFrame(scrollLoop);
  }, [containerRef, updateMarqueeAndSelection]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Left click only
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore interactive controls, modals, context menus, buttons, inputs, links, or item cards/rows
      if (
        target.closest(
          '[data-library-item], [data-library-item-id], button, input, textarea, select, a, [role="dialog"], [data-testid*="modal"], [data-testid*="context-menu"]'
        )
      ) {
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const anchorContentX = e.clientX - containerRect.left + container.scrollLeft;
      const anchorContentY = e.clientY - containerRect.top + container.scrollTop;

      const store = useLibraryStore.getState();
      const isAdditive = e.ctrlKey || e.metaKey || e.shiftKey;
      initialSelectedIdsRef.current = isAdditive ? new Set(store.selectedIds) : new Set();

      isMouseDownRef.current = true;
      isMarqueeActiveRef.current = false;
      candidateStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        anchorContentX,
        anchorContentY
      };
      currentPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
    },
    [containerRef]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !candidateStartRef.current || !containerRef.current) return;

      currentPointerRef.current = { clientX: e.clientX, clientY: e.clientY };

      const start = candidateStartRef.current;
      const dx = e.clientX - start.clientX;
      const dy = e.clientY - start.clientY;
      const distance = Math.hypot(dx, dy);

      // Require > 4px threshold before activating marquee
      if (distance <= 4 && !isMarqueeActiveRef.current) {
        return;
      }

      if (!isMarqueeActiveRef.current) {
        isMarqueeActiveRef.current = true;
        setIsMarqueeActive(true);
        document.body.style.userSelect = 'none';
        startAutoScrollLoop();
      }

      // Synchronously update marquee box and perform 1-pixel intersection check
      updateMarqueeAndSelection(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      stopAutoScrollLoop();

      document.body.style.userSelect = '';

      if (isMarqueeActiveRef.current) {
        isMarqueeActiveRef.current = false;
        justFinishedMarqueeRef.current = true;
        setIsMarqueeActive(false);
        setMarqueeRect(null);
        setTimeout(() => {
          justFinishedMarqueeRef.current = false;
        }, 120);
      } else {
        // Clicked empty space without dragging (> 4px)
        const store = useLibraryStore.getState();
        store.clearSelection();
        store.closeCanvasContextMenu();
        store.closeItemContextMenu();
      }

      candidateStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      stopAutoScrollLoop();
    };
  }, [containerRef, startAutoScrollLoop, stopAutoScrollLoop, updateMarqueeAndSelection]);

  return {
    marqueeRect,
    marqueeBox: marqueeRect, // Backwards-compatibility
    isMarqueeActive,
    justFinishedMarqueeRef,
    handleMouseDown
  };
}
