import * as React from 'react';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import { useGridLayout } from '../hooks/useGridLayout';
import { useTouchReorder } from '../hooks/useTouchReorder';
import FavouriteTile from './FavouriteTile';
import FavouritesPager from './FavouritesPager';
import styles from './MyFavourites.module.scss';

export interface IFavouritesGridProps {
  items: IFavouriteItem[];
  mode: 'view' | 'manage';
  maxRows: number;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  selectedId?: string;
  reorderable?: boolean;
  onReorder?: (sourceId: string, targetId: string) => void;
}

const DRAG_MIME: string = 'application/x-myfavourites-id';

function paginate<T>(items: T[], pageSize: number, pageIndex: number): T[] {
  const start: number = pageIndex * pageSize;
  return items.slice(start, start + pageSize);
}

function isInteractiveDragTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  return !!target.closest('button, a[href], input, textarea, select');
}

const FavouritesGrid: React.FC<IFavouritesGridProps> = ({
  items,
  mode,
  maxRows,
  onDelete,
  onEdit,
  selectedId,
  reorderable,
  onReorder
}) => {
    const [isMobile, setIsMobile] = React.useState<boolean>(
      () => window.matchMedia('(max-width: 600px)').matches
    );

    React.useEffect(() => {
      const media = window.matchMedia('(max-width: 600px)');
      const updateMobile = (): void => setIsMobile(media.matches);

      updateMobile();
      media.addEventListener('change', updateMobile);
      return () => media.removeEventListener('change', updateMobile);
    }, []);

    const displayRows: number =
      mode === 'view' ? (isMobile ? 3 : 1) : maxRows;

    const { gridRef, columnsPerRow, pageSize, pageCount, pageIndex, setPageIndex } = useGridLayout(
      items.length,
      displayRows
    );

  const [draggingId, setDraggingId] = React.useState<string | undefined>(undefined);
  const [dropTargetId, setDropTargetId] = React.useState<string | undefined>(undefined);

  // Touch uses the same draft reorder callback as desktop dragging.
  const touchReorder = useTouchReorder(
    gridRef,
    mode === 'manage' && !!reorderable && !!onReorder,
    onReorder
  );

  // Share the existing tile highlights between mouse and touch.
  const activeDraggingId: string | undefined =
    touchReorder.draggingId ?? draggingId;

  const activeDropTargetId: string | undefined =
    touchReorder.draggingId
      ? touchReorder.dropTargetId
      : dropTargetId;

  const usePagination: boolean = !reorderable;
  const visible: IFavouriteItem[] = usePagination ? paginate(items, pageSize, pageIndex) : items;
  const showPager: boolean = usePagination && pageCount > 1;

  const handleDragStart = React.useCallback((itemId: string, event: React.DragEvent<HTMLElement>) => {
    if (isInteractiveDragTarget(event.target)) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData(DRAG_MIME, itemId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingId(itemId);
    setDropTargetId(undefined);
  }, []);

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(undefined);
    setDropTargetId(undefined);
  }, []);

  const handleDragOver = React.useCallback((itemId: string, event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (itemId !== draggingId) {
      setDropTargetId(itemId);
    }
  }, [draggingId]);

  const handleDrop = React.useCallback(
    (targetId: string, event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      const sourceId: string = event.dataTransfer.getData(DRAG_MIME);
      if (sourceId && sourceId !== targetId && onReorder) {
        onReorder(sourceId, targetId);
      }
      setDraggingId(undefined);
      setDropTargetId(undefined);
    },
    [onReorder]
  );

  if (items.length === 0) {
    return <p className={styles.emptyState}>No homepage quick links yet. Use Manage my homepage quick links to add links.</p>;
  }

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))`
  };

  return (
    <div className={styles.gridSection}>
      {reorderable ? (
        <p className={styles.reorderHint}>Drag tiles to set your preferred order. On touch screens, use the grip.</p>
      ) : null}
      <div
        ref={gridRef}
        className={`${styles.tileGrid} ${mode === 'view' ? styles.tileGridView : styles.tileGridManage} ${
          reorderable ? styles.tileGridReorderable : ''
        }`}
        style={gridStyle}
      >
        {visible.map((item) => (
          <FavouriteTile
            key={item.id}
            item={item}
            mode={mode}
            onDelete={onDelete}
            onEdit={onEdit}
            isSelected={selectedId === item.id}
            draggable={reorderable}
            isDragging={activeDraggingId === item.id}
            isDropTarget={
              activeDropTargetId === item.id &&
              activeDraggingId !== item.id
            }
            onDragStart={(ev) => {
              // A gesture must use either touch or native dragging.
              if (touchReorder.isTouchDragInProgress()) {
                ev.preventDefault();
                return;
              }

              handleDragStart(item.id, ev);
            }}
            onDragEnd={handleDragEnd}
            onDragOver={(ev) => handleDragOver(item.id, ev)}
            onDrop={(ev) => handleDrop(item.id, ev)}
            onGripPointerDown={(ev) =>
              touchReorder.handleStart(item.id, ev)
            }
            onGripPointerMove={touchReorder.handleMove}
            onGripPointerUp={touchReorder.handleEnd}
            onGripPointerCancel={touchReorder.handleCancel}
          />
        ))}
      </div>
      {showPager ? (
        <FavouritesPager pageIndex={pageIndex} pageCount={pageCount} onPageChange={setPageIndex} />
      ) : null}
    </div>
  );
};

export default FavouritesGrid;
