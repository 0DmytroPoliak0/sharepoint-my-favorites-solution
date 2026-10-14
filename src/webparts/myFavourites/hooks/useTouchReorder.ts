import * as React from 'react';

type GripEvent = React.PointerEvent<HTMLSpanElement>;

interface ITouchDrag {
  pointerId: number;
  sourceId: string;
  targetId?: string;
  handle: HTMLSpanElement;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
}

interface ITouchReorder {
  draggingId?: string;
  dropTargetId?: string;
  handleStart: (itemId: string, event: GripEvent) => void;
  handleMove: (event: GripEvent) => void;
  handleEnd: (event: GripEvent) => void;
  handleCancel: (event: GripEvent) => void;
  isTouchDragInProgress: () => boolean;
}

export function useTouchReorder(
  gridRef: React.RefObject<HTMLDivElement>,
  enabled: boolean,
  onReorder?: (sourceId: string, targetId: string) => void
): ITouchReorder {
  const dragRef = React.useRef<ITouchDrag | undefined>(undefined);
  const frameRef = React.useRef<number | undefined>(undefined);

  const [draggingId, setDraggingId] =
    React.useState<string | undefined>(undefined);
  const [dropTargetId, setDropTargetId] =
    React.useState<string | undefined>(undefined);

  const stop = React.useCallback((resetState: boolean = true): void => {
    const drag = dragRef.current;
    dragRef.current = undefined;

    if (frameRef.current !== undefined) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    }

    if (resetState) {
      setDraggingId(undefined);
      setDropTargetId(undefined);
    }

    if (drag?.handle.hasPointerCapture(drag.pointerId)) {
      drag.handle.releasePointerCapture(drag.pointerId);
    }
  }, []);

  const updateTarget = React.useCallback((): void => {
    const drag = dragRef.current;
    const grid = gridRef.current;

    if (!drag?.active || !grid) {
      return;
    }

    const element = document.elementFromPoint(drag.x, drag.y);
    const tile = element?.closest<HTMLElement>(
      'article[data-favourite-id]'
    );

    const id = tile && grid.contains(tile)
      ? tile.dataset.favouriteId
      : undefined;

    drag.targetId = id !== drag.sourceId ? id : undefined;
    setDropTargetId(drag.targetId);
  }, [gridRef]);

  React.useEffect(() => {
    if (!enabled) {
      stop();
    }

    return () => stop(false);
  }, [enabled, stop]);

  const handleStart = React.useCallback(
    (itemId: string, event: GripEvent): void => {
      if (
        event.pointerType !== 'touch' ||
        !event.isPrimary ||
        !enabled ||
        !onReorder ||
        !gridRef.current ||
        dragRef.current
      ) {
        return;
      }

      event.preventDefault();

      const handle = event.currentTarget;

      dragRef.current = {
        pointerId: event.pointerId,
        sourceId: itemId,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        active: false
      };

      try {
        handle.setPointerCapture(event.pointerId);
      } catch {
        stop();
        return;
      }

      let previousTime: number | undefined;

      const tick = (time: number): void => {
        const drag = dragRef.current;
        const grid = gridRef.current;

        if (!drag || !grid) {
          stop();
          return;
        }

        const elapsed = previousTime === undefined
          ? 16
          : Math.min(time - previousTime, 32);

        previousTime = time;

        if (drag.active) {
          const bounds = grid.getBoundingClientRect();
          const top = Math.max(bounds.top, 0);
          const bottom = Math.min(bounds.bottom, window.innerHeight);
          const edge = Math.min(48, (bottom - top) / 3);

          if (
            edge > 0 &&
            drag.x >= bounds.left &&
            drag.x <= bounds.right
          ) {
            let speed = 0;

            if (drag.y < top + edge) {
              speed = -Math.min(1, (top + edge - drag.y) / edge);
            } else if (drag.y > bottom - edge) {
              speed = Math.min(1, (drag.y - bottom + edge) / edge);
            }

            grid.scrollTop += speed * 480 * elapsed / 1000;
          }

          updateTarget();
        }

        frameRef.current = window.requestAnimationFrame(tick);
      };

      frameRef.current = window.requestAnimationFrame(tick);
    },
    [enabled, gridRef, onReorder, stop, updateTarget]
  );

  const handleMove = React.useCallback((event: GripEvent): void => {
    const drag = dragRef.current;

    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    event.preventDefault();
    drag.x = event.clientX;
    drag.y = event.clientY;

    if (
      !drag.active &&
      Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 6
    ) {
      drag.active = true;
      setDraggingId(drag.sourceId);
    }

    updateTarget();
  }, [updateTarget]);

  const handleEnd = React.useCallback((event: GripEvent): void => {
    const drag = dragRef.current;

    if (!drag || event.pointerId !== drag.pointerId) {
      return;
    }

    event.preventDefault();
    drag.x = event.clientX;
    drag.y = event.clientY;
    updateTarget();

    const sourceId = drag.sourceId;
    const targetId = drag.targetId;
    const shouldReorder = enabled && drag.active && !!targetId;

    stop();

    if (shouldReorder && targetId) {
      onReorder?.(sourceId, targetId);
    }
  }, [enabled, onReorder, stop, updateTarget]);

  const handleCancel = React.useCallback((event: GripEvent): void => {
    if (event.pointerId === dragRef.current?.pointerId) {
      stop();
    }
  }, [stop]);

  return {
    draggingId,
    dropTargetId,
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    // Prevent native dragging from taking over a touch gesture.
    isTouchDragInProgress: () => dragRef.current !== undefined
  };
}