import * as React from 'react';
import { DirectionalHint, Icon, IconButton, MessageBar, MessageBarType, Spinner, SpinnerSize, TooltipHost } from '@fluentui/react';
import type { IFavouriteItem } from '../../myFavourites/models/IFavouriteItem';
import { stripFavouritesForStorage } from '../../myFavourites/services/favouritesCatalogMerge';
import {
  favouriteAlreadyAddedMessage,
  findFavouriteWithTitle
} from '../../myFavourites/services/favouriteDuplicateCheck';
import { normalizeFavouriteItem } from '../../myFavourites/services/favouritesFileModel';
import { INTERNAL_LINK_FIELD_NOTE } from '../../shared/internalLinkNote';
import type { IAddFavouriteProps } from './IAddFavouriteProps';
import styles from './AddFavourite.module.scss';

const AddFavourite: React.FC<IAddFavouriteProps> = ({ storageService, link }) => {
  const [busy, setBusy] = React.useState<boolean>(false);
  const [notice, setNotice] = React.useState<string | undefined>(undefined);
  const [noticeType, setNoticeType] = React.useState<MessageBarType>(MessageBarType.info);
  const [alreadyAdded, setAlreadyAdded] = React.useState<boolean>(false);

  const title: string = link.title.trim();
  const url: string = link.url.trim();
  const description: string = link.description.trim();
  const helpInfo: string = link.helpInfo.trim();
  const hasDescription: boolean = description.length > 0;
  const showHelp: boolean = hasDescription;
  const helpTooltip: string = helpInfo || description;
  const isConfigured: boolean = title.length > 0 && url.length > 0;

  React.useEffect(() => {
    if (!isConfigured) {
      setAlreadyAdded(false);
      return;
    }

    let cancelled: boolean = false;
    storageService
      .loadFavourites()
      .then(({ items }) => {
        if (!cancelled) {
          setAlreadyAdded(!!findFavouriteWithTitle(items, title));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAlreadyAdded(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isConfigured, storageService, title]);

  const handleAdd = React.useCallback(async () => {
    if (!isConfigured || busy) {
      return;
    }

    setBusy(true);
    setNotice(undefined);

    try {
      // eslint-disable-next-line no-new
      new URL(url);
    } catch {
      setNoticeType(MessageBarType.error);
      setNotice('This page does not have a valid URL to add.');
      setBusy(false);
      return;
    }

    try {
      const { items: existing } = await storageService.loadFavourites();
      if (findFavouriteWithTitle(existing, title)) {
        setAlreadyAdded(true);
        setNoticeType(MessageBarType.warning);
        setNotice(favouriteAlreadyAddedMessage(title));
        setBusy(false);
        return;
      }

      const favourite: IFavouriteItem = normalizeFavouriteItem({
        title,
        url,
        description,
        internal: link.internal,
        source: 'manual'
      });
      const next: IFavouriteItem[] = stripFavouritesForStorage([...existing, favourite]);
      await storageService.saveFavourites(next);
      setAlreadyAdded(true);
      setNoticeType(MessageBarType.success);
      setNotice('Added to your homepage quick links.');
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      setNoticeType(MessageBarType.error);
      setNotice(msg);
    } finally {
      setBusy(false);
    }
  }, [busy, description, isConfigured, link.internal, storageService, title, url]);

  if (!isConfigured) {
    return (
      <section className={styles.addFavourite}>
        <p className={styles.emptyConfig}>Unable to determine the current page title or URL.</p>
      </section>
    );
  }

  const titleClassName: string = hasDescription ? styles.cardTitle : `${styles.cardTitle} ${styles.cardTitleLarge}`;
  const cardHeading: string = 'Add to my homepage quick links';

  return (
    <section className={styles.addFavourite} aria-label="Add a quick link to my homepage">
      <article className={styles.card}>
        <IconButton
          className={`${styles.actionButton} ${styles.actionButtonPrimary}`}
          iconProps={{ iconName: 'CircleAddition' }}
          title={alreadyAdded ? 'Already in your homepage quick links' : cardHeading}
          ariaLabel={`${cardHeading}: ${title}`}
          disabled={busy}
          onClick={() => {
            handleAdd().catch(() => undefined);
          }}
        />
        <div className={styles.cardMain}>
          <div className={styles.cardTitleRow}>
            <span className={titleClassName}>{cardHeading}</span>
            {link.internal ? (
              <TooltipHost
                content={INTERNAL_LINK_FIELD_NOTE}
                directionalHint={DirectionalHint.leftCenter}
                calloutProps={{ gapSpace: 8 }}
              >
                <Icon iconName="CityNext" className={styles.cardInternalIcon} aria-label="Internal link" />
              </TooltipHost>
            ) : null}
          </div>
          {hasDescription ? <p className={styles.cardDescription}>{description}</p> : null}
        </div>

        <div className={styles.cardActions}>
          {showHelp ? (
            <TooltipHost
              content={helpTooltip}
              directionalHint={DirectionalHint.leftCenter}
              calloutProps={{ gapSpace: 8 }}
            >
              <span className={styles.helpTrigger} aria-label="Help information">
                ?
              </span>
            </TooltipHost>
          ) : null}
        </div>
      </article>

      {busy ? <Spinner className={styles.feedback} size={SpinnerSize.small} label="Saving..." /> : null}

      {notice ? (
        <MessageBar
          className={styles.feedback}
          messageBarType={noticeType}
          onDismiss={() => setNotice(undefined)}
        >
          {notice}
        </MessageBar>
      ) : null}
    </section>
  );
};

export default AddFavourite;
