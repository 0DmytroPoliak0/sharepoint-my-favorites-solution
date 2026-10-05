import * as React from 'react';
import { Icon, MessageBar, MessageBarType, Spinner, SpinnerSize, Stack } from '@fluentui/react';
import styles from './MyFavourites.module.scss';
import type { IMyFavouritesProps } from './IMyFavouritesProps';
import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteItem } from '../models/IFavouriteItem';
import {
  resolveFavouritesForView,
  stripFavouritesForStorage
} from '../services/favouritesCatalogMerge';
import { buildStarterFavouritesFromCatalog } from '../services/starterFavourites';
import FavouritesGrid from './FavouritesGrid';
import ManageFavouritesPanel from './ManageFavouritesPanel';

const MyFavourites: React.FC<IMyFavouritesProps> = (props) => {
  const { storageService, catalogService, maxRows, manageAboutUrl } = props;
  const webPartRef = React.useRef<HTMLElement>(null);

  const [storedItems, setStoredItems] = React.useState<IFavouriteItem[]>([]);
  const [catalog, setCatalog] = React.useState<ICatalogItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [busy, setBusy] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [manageOpen, setManageOpen] = React.useState<boolean>(false);

  const viewItems: IFavouriteItem[] = React.useMemo(
    () => resolveFavouritesForView(storedItems, catalog),
    [storedItems, catalog]
  );

  const loadFavourites = React.useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [loadResult, catalogRows] = await Promise.all([
        storageService.loadFavourites(),
        catalogService.loadCatalogAll()
      ]);

      let stored: IFavouriteItem[] = loadResult.items;
      if (!loadResult.fileExists) {
        const starters: IFavouriteItem[] = buildStarterFavouritesFromCatalog(catalogRows);
        if (starters.length > 0) {
          stored = stripFavouritesForStorage(starters);
          await storageService.saveFavourites(stored);
        }
      }

      setStoredItems(stored);
      setCatalog(catalogRows);
    } catch (err: unknown) {
      const msg: string = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStoredItems([]);
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, [storageService, catalogService]);

  React.useEffect(() => {
    loadFavourites().catch(() => undefined);
  }, [loadFavourites]);

  const handleSave = React.useCallback(
    async (nextItems: IFavouriteItem[]) => {
      setBusy(true);
      setError(undefined);
      try {
        const toStore: IFavouriteItem[] = stripFavouritesForStorage(nextItems);
        await storageService.saveFavourites(toStore);
        const catalogRows: ICatalogItem[] = await catalogService.loadCatalogAll();
        setCatalog(catalogRows);
        setStoredItems(toStore);
        setManageOpen(false);
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : String(err);
        throw new Error(msg);
      } finally {
        setBusy(false);
      }
    },
    [storageService, catalogService]
  );

  return (
    <section ref={webPartRef} className={styles.myFavourites}>
      <header className={styles.header}>
        <div className={styles.headerToolbar}>
          <button
            type="button"
            className={styles.headerActionRow}
            onClick={() => setManageOpen(true)}
            disabled={loading || busy}
            aria-label="Manage my homepage quick links"
          >
            <span className={styles.headerActionIconSlot} aria-hidden="true">
              <Icon iconName="Contact" className={styles.headerActionIcon} />
              <Icon iconName="Settings" className={styles.headerActionIconBadge} />
            </span>
            <span className={styles.headerActionText}>Manage my homepage quick links</span>
          </button>
        </div>
      </header>

      {error ? <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar> : null}

      {loading ? (
        <Spinner size={SpinnerSize.medium} label="Loading your homepage quick links..." />
      ) : (
        <Stack tokens={{ childrenGap: 12 }}>
          <FavouritesGrid items={viewItems} mode="view" maxRows={maxRows} />
        </Stack>
      )}

      <ManageFavouritesPanel
        isOpen={manageOpen}
        items={storedItems}
        catalog={catalog}
        catalogService={catalogService}
        busy={busy}
        maxRows={maxRows}
        manageAboutUrl={manageAboutUrl}
        onDismiss={() => setManageOpen(false)}
        onSave={handleSave}
        themeSourceElement={webPartRef.current ?? undefined}
      />
    </section>
  );
};

export default MyFavourites;
