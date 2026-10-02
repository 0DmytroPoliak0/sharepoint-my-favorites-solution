import * as React from 'react';
import { IconButton } from '@fluentui/react';
import styles from './MyFavourites.module.scss';

export interface IFavouritesPagerProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
}

const FavouritesPager: React.FC<IFavouritesPagerProps> = ({ pageIndex, pageCount, onPageChange }) => {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className={styles.pager} aria-label="Favourites pages">
      <IconButton
        className={styles.pagerChevron}
        iconProps={{ iconName: 'ChevronLeft' }}
        disabled={pageIndex <= 0}
        title="Previous page"
        ariaLabel="Previous page"
        onClick={() => onPageChange(pageIndex - 1)}
      />
      <div className={styles.pagerDots}>
        {Array.from({ length: pageCount }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.pagerDot} ${i === pageIndex ? styles.pagerDotActive : ''}`}
            aria-label={`Page ${i + 1}`}
            aria-current={i === pageIndex ? 'page' : undefined}
            onClick={() => onPageChange(i)}
          />
        ))}
      </div>
      <IconButton
        className={styles.pagerChevron}
        iconProps={{ iconName: 'ChevronRight' }}
        disabled={pageIndex >= pageCount - 1}
        title="Next page"
        ariaLabel="Next page"
        onClick={() => onPageChange(pageIndex + 1)}
      />
    </nav>
  );
};

export default FavouritesPager;
