import * as React from 'react';
import { Icon, IconButton } from '@fluentui/react';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import styles from './MyFavourites.module.scss';

export interface IFavouriteTileProps {
  item: IFavouriteItem;
  mode: 'view' | 'manage';
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isSelected?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLElement>) => void;
}

const FavouriteTile: React.FC<IFavouriteTileProps> = ({
  item,
  mode,
  onDelete,
  onEdit,
  isSelected,
  draggable,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop
}) => {
  const description: string = item.description.trim();
  const isView: boolean = mode === 'view';
  const isCatalogItem: boolean = item.catalogItemId !== undefined;
  const showEdit: boolean = !isView && !isCatalogItem && !!onEdit;
  const showDescriptionInTile: boolean = !isView && description.length > 0;
  const showViewHelp: boolean = isView && description.length > 0;
  const [helpVisible, setHelpVisible] = React.useState<boolean>(false);

  const tileClassName: string = [
    styles.tile,
    isView ? styles.tileView : styles.tileManage,
    isSelected ? styles.tileSelected : '',
    draggable ? styles.tileDraggable : '',
    isDragging ? styles.tileDragging : '',
    isDropTarget ? styles.tileDropTarget : ''
  ]
    .filter(Boolean)
    .join(' ');

  const clearHelp = React.useCallback(() => {
    setHelpVisible(false);
  }, []);

  return (
    <article
      className={tileClassName}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseLeave={isView ? clearHelp : undefined}
      aria-grabbed={draggable ? isDragging : undefined}
    >
      {!isView ? (
        <div className={styles.tileTopBar}>
          <div className={styles.tileActions}>
            {showEdit ? (
              <IconButton
                className={styles.tileEdit}
                iconProps={{ iconName: 'Edit' }}
                title="Edit quick link"
                ariaLabel={`Edit ${item.title}`}
                onClick={() => onEdit!(item.id)}
              />
            ) : null}
            {onDelete ? (
              <IconButton
                className={styles.tileDelete}
                iconProps={{ iconName: 'Delete' }}
                title="Remove quick link"
                ariaLabel={`Remove ${item.title}`}
                onClick={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  onDelete(item.id);
                }}
              />
            ) : null}
          </div>
          {item.internal ? (
            <span className={styles.tileInternalInBar} title="Internal link" aria-label="Internal link">
              <Icon iconName="CityNext" className={styles.tileInternalIcon} aria-hidden="true" />
            </span>
          ) : null}
        </div>
      ) : item.internal ? (
        <span className={styles.tileInternalBadge} title="Internal link" aria-label="Internal link">
          <Icon iconName="CityNext" className={styles.tileInternalIcon} aria-hidden="true" />
        </span>
      ) : null}

      {draggable ? (
        <span className={styles.tileDragHandle} aria-hidden="true" title="Drag to reorder">
          <Icon iconName="GripperDotsVertical" />
        </span>
      ) : null}

      <a
        className={styles.tileLink}
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        onClick={!isView ? (ev) => ev.preventDefault() : undefined}
      >
        <span className={styles.tileTitle}>{item.title}</span>
        {showDescriptionInTile ? <span className={styles.tileDescription}>{description}</span> : null}
      </a>

      {showViewHelp ? (
        <>
          <button
            type="button"
            className={styles.tileHelp}
            aria-label={`Help for ${item.title}`}
            aria-expanded={helpVisible}
            onMouseEnter={() => setHelpVisible(true)}
            onFocus={() => setHelpVisible(true)}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              setHelpVisible(true);
            }}
            onBlur={clearHelp}
          >
            ?
          </button>
          {helpVisible ? (
            <div
              className={styles.tileHelpPopover}
              role="tooltip"
              onMouseLeave={clearHelp}
            >
              {description}
            </div>
          ) : null}
        </>
      ) : null}

      {item.displayAsNew && isView ? <span className={styles.tileNewBadge}>New</span> : null}
    </article>
  );
};

export default FavouriteTile;
