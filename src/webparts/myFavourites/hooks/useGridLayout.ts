import * as React from 'react';
import { getColumnsForWidth, getPageCount, getPageSize } from '../services/gridLayout';

export interface IGridLayoutState {
  columnsPerRow: number;
  pageSize: number;
  pageCount: number;
  gridRef: React.RefObject<HTMLDivElement>;
}

export function useGridLayout(
  itemCount: number,
  maxRows: number
): IGridLayoutState & { pageIndex: number; setPageIndex: React.Dispatch<React.SetStateAction<number>> } {
  const gridRef: React.RefObject<HTMLDivElement> = React.useRef<HTMLDivElement>(null);
  const [columnsPerRow, setColumnsPerRow] = React.useState<number>(3);
  const [pageIndex, setPageIndex] = React.useState<number>(0);

  const hasItems: boolean = itemCount > 0;

  React.useEffect(() => {
    const element: HTMLDivElement | null = gridRef.current;
    if (!element) {
      return;
    }

    const updateColumns = (): void => {
      setColumnsPerRow(getColumnsForWidth(element.clientWidth));
    };

    updateColumns();
    const observer: ResizeObserver = new ResizeObserver(updateColumns);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasItems]);

  const pageSize: number = getPageSize(columnsPerRow, maxRows);
  const pageCount: number = getPageCount(itemCount, pageSize);
  const prevItemCountRef = React.useRef<number>(itemCount);
  const prevLayoutRef = React.useRef<{ maxRows: number; columnsPerRow: number }>({
    maxRows,
    columnsPerRow
  });

  React.useEffect(() => {
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [itemCount, pageCount, pageIndex, maxRows, columnsPerRow]);

  React.useEffect(() => {
    const layoutChanged: boolean =
      prevLayoutRef.current.maxRows !== maxRows ||
      prevLayoutRef.current.columnsPerRow !== columnsPerRow;
    prevLayoutRef.current = { maxRows, columnsPerRow };

    if (layoutChanged) {
      setPageIndex(0);
      prevItemCountRef.current = itemCount;
      return;
    }

    const prevCount: number = prevItemCountRef.current;
    if (itemCount > prevCount) {
      setPageIndex(Math.max(0, getPageCount(itemCount, pageSize) - 1));
    }
    prevItemCountRef.current = itemCount;
  }, [itemCount, maxRows, columnsPerRow, pageSize]);

  return {
    gridRef,
    columnsPerRow,
    pageSize,
    pageCount,
    pageIndex,
    setPageIndex
  };
}
