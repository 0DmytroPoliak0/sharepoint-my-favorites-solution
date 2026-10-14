import * as React from 'react';
import {
  Callout,
  DirectionalHint,
  getId,
  Icon,
  IconButton
} from '@fluentui/react';
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
  onGripPointerDown?: (
    event: React.PointerEvent<HTMLSpanElement>
  ) => void;
  onGripPointerMove?: (
    event: React.PointerEvent<HTMLSpanElement>
  ) => void;
  onGripPointerUp?: (
    event: React.PointerEvent<HTMLSpanElement>
  ) => void;
  onGripPointerCancel?: (
    event: React.PointerEvent<HTMLSpanElement>
  ) => void;
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
  onDrop,
  onGripPointerDown,
  onGripPointerMove,
  onGripPointerUp,
  onGripPointerCancel
}) => {
  const description: string = item.description.trim();
  const isView: boolean = mode === 'view';
  const isCatalogItem: boolean = item.catalogItemId !== undefined;
  const showEdit: boolean = !isView && !isCatalogItem && !!onEdit;
  const showDescriptionInTile: boolean = !isView && description.length > 0;
  const showViewHelp: boolean = isView && description.length > 0;
  // Anchor the popup to its own information button.
  const helpButtonRef = React.useRef<HTMLButtonElement>(null);
  const helpDismissTimer = React.useRef<number | undefined>(undefined);
  const [helpId] = React.useState<string>(
    () => getId('quick-link-help-')
  );
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

  const cancelHelpDismiss = React.useCallback((): void => {
    if (helpDismissTimer.current !== undefined) {
      window.clearTimeout(helpDismissTimer.current);
      helpDismissTimer.current = undefined;
    }
  }, []);

  const clearHelp = React.useCallback((): void => {
    cancelHelpDismiss();
    setHelpVisible(false);
  }, [cancelHelpDismiss]);

  const showHelp = React.useCallback((): void => {
    cancelHelpDismiss();
    setHelpVisible(true);
  }, [cancelHelpDismiss]);

  const scheduleHelpDismiss = React.useCallback((): void => {
    cancelHelpDismiss();

    // Allow the pointer to cross the gap into the popup.
    helpDismissTimer.current = window.setTimeout(clearHelp, 150);
  }, [cancelHelpDismiss, clearHelp]);

  const handleHelpPointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      // Keep a tapped popup open until the user dismisses it.
      if (event.pointerType !== 'touch') {
        scheduleHelpDismiss();
      }
    },
    [scheduleHelpDismiss]
  );

  React.useEffect(() => {
    // Remove any pending timer when this tile disappears.
    return () => cancelHelpDismiss();
  }, [cancelHelpDismiss]);

  return (
    <article
      className={tileClassName}
      data-favourite-id={item.id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPointerLeave={isView ? handleHelpPointerLeave : undefined}
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
        </div>
      ) : null}

      {draggable ? (
        <span
          className={styles.tileDragHandle}
          aria-hidden="true"
          title="Drag to reorder"
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          onPointerCancel={onGripPointerCancel}
          onLostPointerCapture={onGripPointerCancel}
        >
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
            ref={helpButtonRef}
            type="button"
            className={styles.tileHelp}
            aria-label={`Help for ${item.title}`}
            aria-expanded={helpVisible}
            aria-describedby={helpVisible ? helpId : undefined}
            onPointerEnter={showHelp}
            onFocus={showHelp}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              showHelp();
            }}
          >
            ?
          </button>

          {helpVisible ? (
            <Callout
              target={helpButtonRef.current}
              directionalHint={DirectionalHint.topAutoEdge}
              directionalHintFixed={false}
              minPagePadding={16}
              gapSpace={6}
              isBeakVisible={false}
              calloutMaxWidth={320}
              calloutMaxHeight={320}
              role="tooltip"
              id={helpId}
              onDismiss={clearHelp}
              onPointerEnter={showHelp}
              onPointerLeave={handleHelpPointerLeave}
              onRestoreFocus={() => undefined}
              styles={{
                root: {
                  maxWidth: 'calc(100vw - 32px)'
                },
                calloutMain: {
                  overflowY: 'auto'
                }
              }}
            >
              <div className={styles.tileHelpPopover}>
                {description}
              </div>
            </Callout>
          ) : null}
        </>
      ) : null}

      {item.displayAsNew && isView ? <span className={styles.tileNewBadge}>New</span> : null}
    </article>
  );
};

export default FavouriteTile;
