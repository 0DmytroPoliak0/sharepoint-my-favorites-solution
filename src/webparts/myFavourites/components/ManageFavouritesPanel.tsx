import * as React from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Icon,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  Stack,
  Text
} from '@fluentui/react';
import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteFormValues, IFavouriteItem } from '../models/IFavouriteItem';
import { CatalogService } from '../services/CatalogService';
import { enrichFavouritesWithCatalog } from '../services/favouritesCatalogMerge';
import { reorderFavourites } from '../services/reorderFavourites';
import {
  emptyFavouriteFormValues,
  favouriteToFormValues,
  formValuesToFavourite,
  normalizeFavouriteItem,
  validateFavouriteForm
} from '../services/favouritesFileModel';
import {
  favouriteAlreadyAddedMessage,
  findFavouriteDuplicate
} from '../services/favouriteDuplicateCheck';
import AddFavouritesSection from './AddFavouritesSection';
import FavouriteItemForm from './FavouriteItemForm';
import FavouritesGrid from './FavouritesGrid';
import styles from './MyFavourites.module.scss';

export interface IManageFavouritesPanelProps {
  isOpen: boolean;
  items: IFavouriteItem[];
  catalog: ICatalogItem[];
  catalogService: CatalogService;
  busy: boolean;
  maxRows: number;
  manageAboutUrl: string;
  onDismiss: () => void;
  onSave: (items: IFavouriteItem[]) => Promise<void>;
  themeSourceElement?: HTMLElement;
}

// states declared in the component are used to manage the draft list of favourites, the catalog, form values for adding and editing favourites, and various error states. The component also manages the state of which favourite is currently being edited or deleted.

const ManageFavouritesPanel: React.FC<IManageFavouritesPanelProps> = ({
  isOpen,
  themeSourceElement,
  items,
  catalog: catalogFromParent,
  catalogService,
  busy,
  maxRows,
  manageAboutUrl,
  onDismiss,
  onSave
}) => {
  const [draft, setDraft] = React.useState<IFavouriteItem[]>([]);
  const [catalog, setCatalog] = React.useState<ICatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = React.useState<boolean>(false);
  const [catalogError, setCatalogError] = React.useState<string | undefined>(undefined);
  const [addForm, setAddForm] = React.useState<IFavouriteFormValues>(emptyFavouriteFormValues());
  const [addTab, setAddTab] = React.useState<'catalog' | 'manual'>('catalog');
  const [editForm, setEditForm] = React.useState<IFavouriteFormValues>(emptyFavouriteFormValues());
  const [editingId, setEditingId] = React.useState<string | undefined>(undefined);
  const [addFormError, setAddFormError] = React.useState<string | undefined>(undefined);
  const [editFormError, setEditFormError] = React.useState<string | undefined>(undefined);
  const [saveError, setSaveError] = React.useState<string | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = React.useState<IFavouriteItem | undefined>(undefined);
  const deleteConfirmedRef = React.useRef<boolean>(false);
  const draftRef = React.useRef<IFavouriteItem[]>([]);
  const itemsRef = React.useRef<IFavouriteItem[]>(items);
  itemsRef.current = items;

  const isEditing: boolean = editingId !== undefined;

  const hasAddFormInput: boolean =
    addForm.title.length > 0 ||
    addForm.url.length > 0 ||
    addForm.description.length > 0;

  const hasUnfinishedForm: boolean = isEditing || addTab === 'manual' || hasAddFormInput;

  const panelActionsDisabled: boolean =
    busy || hasUnfinishedForm || pendingDelete !== undefined;

  const handlePanelDismiss = React.useCallback(
    (ev?: React.SyntheticEvent<HTMLElement> | KeyboardEvent): void => {
      if (panelActionsDisabled) {
        ev?.preventDefault();
        return;
      }

      onDismiss();
    },
    [onDismiss, panelActionsDisabled]
  );

  const handleAddTabChange = React.useCallback(
    (tab: 'catalog' | 'manual'): void => {
      if (busy) {
        return;
      }

      if (hasAddFormInput && tab !== addTab) {
        setAddFormError(
          'Use Add or Cancel entry before switching tabs.'
        );
        return;
      }

      setAddFormError(undefined);
      setAddTab(tab);
    },
    [busy, hasAddFormInput, addTab]
  );

  React.useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    const initial: IFavouriteItem[] = itemsRef.current.map((item) => normalizeFavouriteItem(item));
    draftRef.current = initial;
    setDraft(initial);
    setAddForm(emptyFavouriteFormValues());
    setAddTab('catalog');
    setEditForm(emptyFavouriteFormValues());
    setEditingId(undefined);
    setAddFormError(undefined);
    setEditFormError(undefined);
    setSaveError(undefined);
    setPendingDelete(undefined);
    // Only re-seed draft when the panel opens, not when parent items refresh while editing.
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled: boolean = false;
    setCatalogLoading(true);
    setCatalogError(undefined);
    catalogService
      .loadCatalogAll()
      .then(
        (rows) => {
          if (!cancelled) {
            setCatalog(rows);
            setCatalogLoading(false);
          }
        },
        (err: unknown) => {
          if (!cancelled) {
            const msg: string = err instanceof Error ? err.message : String(err);
            setCatalogError(msg);
            setCatalog([]);
            setCatalogLoading(false);
          }
        }
      );
    return () => {
      cancelled = true;
    };
  }, [isOpen, catalogService]);

  React.useEffect(() => {
    if (isOpen && catalogFromParent.length > 0) {
      setCatalog(catalogFromParent);
    }
  }, [isOpen, catalogFromParent]);

  const displayDraft: IFavouriteItem[] = React.useMemo(
    () => enrichFavouritesWithCatalog(draft, catalog),
    [draft, catalog]
  );

  const availableCatalog: ICatalogItem[] = React.useMemo(
    () => CatalogService.filterCatalogNotInFavourites(catalog, draft),
    [catalog, draft]
  );

  const editingItem: IFavouriteItem | undefined = React.useMemo(
    () => (editingId ? draft.find((item) => item.id === editingId) : undefined),
    [draft, editingId]
  );

  const handleRequestDelete = React.useCallback(
    (id: string) => {
      const item: IFavouriteItem | undefined = draft.find((f) => f.id === id);
      if (item) {
        setPendingDelete(item);
      }
    },
    [draft]
  );

  const handleDialogDismiss = React.useCallback(() => {
    if (deleteConfirmedRef.current) {
      deleteConfirmedRef.current = false;
      return;
    }
    setPendingDelete(undefined);
  }, []);

  const handleConfirmDelete = React.useCallback(() => {
    const itemToDelete: IFavouriteItem | undefined = pendingDelete;
    if (!itemToDelete) {
      return;
    }
    deleteConfirmedRef.current = true;
    const id: string = itemToDelete.id;
    setDraft((prev) => {
      const next: IFavouriteItem[] = prev.filter((item) => item.id !== id);
      draftRef.current = next;
      return next;
    });
    setEditingId((current) => (current === id ? undefined : current));
    setPendingDelete(undefined);
  }, [pendingDelete]);

  const handleStartEdit = React.useCallback(
    (id: string) => {
      const item: IFavouriteItem | undefined = draft.find((f) => f.id === id);
      if (!item) {
        return;
      }
      setAddFormError(undefined);
      setEditingId(id);
      setEditForm(favouriteToFormValues(item));
      setEditFormError(undefined);
    },
    [draft]
  );

  const handleCancelEdit = React.useCallback(() => {
    setEditingId(undefined);
    setEditForm(emptyFavouriteFormValues());
    setEditFormError(undefined);
  }, []);

  const appendToDraft = React.useCallback((favourite: IFavouriteItem): void => {
    setDraft((prev) => {
      const next: IFavouriteItem[] = [...prev, favourite];
      draftRef.current = next;
      return next;
    });
  }, []);

  const handleAddFromCatalog = React.useCallback(
    (catalogItem: ICatalogItem) => {
      const duplicate: IFavouriteItem | undefined =
        findFavouriteDuplicate(draft, catalogItem.title, catalogItem.url);

      if (duplicate) {
        setAddFormError(favouriteAlreadyAddedMessage(duplicate.title));
        return;
      }

      const favourite: IFavouriteItem = CatalogService.catalogItemToFavourite(catalogItem);
      appendToDraft(favourite);
      setAddFormError(undefined);
    },
    [appendToDraft, draft]
  );

  const handleAddFromForm = React.useCallback(() => {
    const validationError: string | undefined = validateFavouriteForm(addForm);
    if (validationError) {
      setAddFormError(validationError);
      return;
    }

    const duplicate: IFavouriteItem | undefined =
      findFavouriteDuplicate(draft, addForm.title, addForm.url);

    if (duplicate) {
      setAddFormError(favouriteAlreadyAddedMessage(duplicate.title));
      return;
    }

    const favourite: IFavouriteItem = formValuesToFavourite(addForm, { source: 'manual' });
    appendToDraft(favourite);
    setAddForm(emptyFavouriteFormValues());
    setAddFormError(undefined);
    setAddTab('catalog');
  }, [addForm, appendToDraft, draft]);

  const handleUpdateEdit = React.useCallback(() => {
    if (!editingId || !editingItem) {
      return;
    }
    const validationError: string | undefined = validateFavouriteForm(editForm);
    if (validationError) {
      setEditFormError(validationError);
      return;
    }

    const duplicate: IFavouriteItem | undefined =
      findFavouriteDuplicate(
        draft,
        editForm.title,
        editForm.url,
        editingId
      );

    if (duplicate) {
      setEditFormError(favouriteAlreadyAddedMessage(duplicate.title));
      return;
    }

    const updated: IFavouriteItem = formValuesToFavourite(editForm, editingItem);
    setDraft((prev) => {
      const next: IFavouriteItem[] = prev.map((item) => (item.id === editingId ? updated : item));
      draftRef.current = next;
      return next;
    });
    handleCancelEdit();
  }, [editForm, editingId, editingItem, handleCancelEdit, draft]);

  const handleClearAddForm = React.useCallback(() => {
    setAddForm(emptyFavouriteFormValues());
    setAddFormError(undefined);
    setAddTab('catalog');
  }, []);

  const handleReorder = React.useCallback((sourceId: string, targetId: string) => {
    setDraft((prev) => {
      const next: IFavouriteItem[] = reorderFavourites(prev, sourceId, targetId);
      draftRef.current = next;
      return next;
    });
  }, []);

  const handleSave = React.useCallback(async () => {
    if (panelActionsDisabled) {
      return;
    }

    setSaveError(undefined);

    try {
      const toSave: IFavouriteItem[] =
        draftRef.current.map((item) => normalizeFavouriteItem(item));

      await onSave(toSave);
    } catch (err: unknown) {
      const msg: string =
        err instanceof Error ? err.message : String(err);

      setSaveError(msg);
    }
  }, [onSave, panelActionsDisabled]);

  const panelThemeStyle: React.CSSProperties & Record<string, string> = {};

  if (isOpen && themeSourceElement) {
    const sourceStyle = window.getComputedStyle(themeSourceElement);

    for (let index = 0; index < sourceStyle.length; index++) {
      const propertyName = sourceStyle.item(index);

      if (propertyName.startsWith('--')) {
        const value = sourceStyle.getPropertyValue(propertyName).trim();

        if (value) {
          panelThemeStyle[propertyName] = value;
        }
      }
    }
  }

  const deleteDialogSubText: string = pendingDelete
    ? `Are you sure you want to remove "${pendingDelete.title}" from your homepage quick links?`
    : '';

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={handlePanelDismiss}
      layerProps={{ fabricProps: { style: panelThemeStyle } }}
      type={PanelType.large}
      headerText="Manage my homepage quick links"
      closeButtonAriaLabel="Close"
      onRenderFooterContent={() => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <PrimaryButton
            text="Save"
            onClick={() => {
              handleSave().catch(() => undefined);
            }}
            disabled={panelActionsDisabled}
          />
          <DefaultButton
            text="Cancel"
            onClick={() => handlePanelDismiss()}
            disabled={panelActionsDisabled}
          />
        </Stack>
      )}
      isFooterAtBottom={true}
    >
      <Stack tokens={{ childrenGap: 20 }}>
        {saveError ? <MessageBar messageBarType={MessageBarType.error}>{saveError}</MessageBar> : null}

        {manageAboutUrl ? (
          <a
            className={styles.headerActionRow}
            href={manageAboutUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.headerActionText}>How to use homepage quick links</span>
            <Icon iconName="Info" className={styles.headerActionIcon} aria-hidden="true" />
          </a>
        ) : null}

        <section>
          <FavouritesGrid
            items={displayDraft}
            mode="manage"
            maxRows={maxRows}
            reorderable={true}
            onReorder={panelActionsDisabled ? undefined : handleReorder}
            onDelete={panelActionsDisabled ? undefined : handleRequestDelete}
            onEdit={panelActionsDisabled ? undefined : handleStartEdit}
            selectedId={editingId}
          />
        </section>

        {isEditing ? (
          <section
            className={styles.editSection}
            aria-label="Edit quick link"
          >
            <Text variant="mediumPlus" block>
              Edit quick link
            </Text>

            {editFormError ? (
              <MessageBar messageBarType={MessageBarType.error}>
                {editFormError}
              </MessageBar>
            ) : null}

            <FavouriteItemForm
              values={editForm}
              onChange={setEditForm}
              disabled={busy}
            />

            {/* Keep edit actions together, matching the Add form. */}
            <Stack
              horizontal
              wrap
              className={styles.manualFormActions}
              tokens={{ childrenGap: 8 }}
            >
              <PrimaryButton
                text="Update"
                onClick={handleUpdateEdit}
                disabled={busy}
              />
              <DefaultButton
                text="Cancel edit"
                onClick={handleCancelEdit}
                disabled={busy}
              />
            </Stack>
          </section>
        ) : null}

        {isEditing ? null : (
          <AddFavouritesSection
            key="add-favourites"
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            availableCatalog={availableCatalog}
            addForm={addForm}
            addFormError={addFormError}
            busy={busy}
            selectedTab={addTab}
            onTabChange={handleAddTabChange}
            onAddFormChange={setAddForm}
            onAddFromCatalog={handleAddFromCatalog}
            onAddFromForm={handleAddFromForm}
            onClearForm={handleClearAddForm}
          />
        )}
      </Stack>

      <Dialog
        hidden={!pendingDelete}
        onDismiss={handleDialogDismiss}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Remove quick link',
          subText: deleteDialogSubText
        }}
        modalProps={{ isBlocking: true }}
        styles={{ main: { maxWidth: 480, zIndex: 1000000 } }}
      >
        <DialogFooter>
          <PrimaryButton
            text="Remove"
            disabled={busy}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              handleConfirmDelete();
            }}
          />
          <DefaultButton
            text="Cancel"
            disabled={busy}
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              setPendingDelete(undefined);
            }}
          />
        </DialogFooter>
      </Dialog>
    </Panel>
  );
};

export default ManageFavouritesPanel;
