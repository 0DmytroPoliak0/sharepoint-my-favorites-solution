import * as React from 'react';
import {
  DefaultButton,
  IconButton,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  Text
} from '@fluentui/react';
import { PULSE_FAVOURITES_CATALOGUE_LABEL } from '../../shared/catalogueLabels';
import type { ICatalogItem } from '../models/ICatalogItem';
import type { IFavouriteFormValues } from '../models/IFavouriteItem';
import FavouriteItemForm from './FavouriteItemForm';
import styles from './MyFavourites.module.scss';

export interface IAddFavouritesSectionProps {
  catalogLoading: boolean;
  catalogError: string | undefined;
  availableCatalog: ICatalogItem[];
  addForm: IFavouriteFormValues;
  addFormError: string | undefined;
  busy: boolean;
  onAddFormChange: (values: IFavouriteFormValues) => void;
  onAddFromCatalog: (item: ICatalogItem) => void;
  onAddFromForm: () => void;
  onClearForm: () => void;
}

const AddFavouritesSection: React.FC<IAddFavouritesSectionProps> = ({
  catalogLoading,
  catalogError,
  availableCatalog,
  addForm,
  addFormError,
  busy,
  onAddFormChange,
  onAddFromCatalog,
  onAddFromForm,
  onClearForm
}) => {
  return (
    <section className={styles.manageAddSection} aria-label="Add a My Favourite">
      <Text variant="mediumPlus" block className={styles.manageAddHeading}>
        Add a My Favourite
      </Text>
      <Pivot className={styles.addFavouritesPivot}>
        <PivotItem headerText="Add from catalogue" itemKey="catalog">
          <div className={styles.addTabPanel}>
            {addFormError ? <MessageBar messageBarType={MessageBarType.error}>{addFormError}</MessageBar> : null}
            {catalogLoading ? <Spinner size={SpinnerSize.small} label="Loading catalogue..." /> : null}
            {catalogError ? <MessageBar messageBarType={MessageBarType.warning}>{catalogError}</MessageBar> : null}
            {!catalogLoading && !catalogError && availableCatalog.length === 0 ? (
              <p className={styles.catalogEmpty}>All catalogue items are already in your favourites.</p>
            ) : (
              <div className={styles.catalogGrid} role="list" aria-label={PULSE_FAVOURITES_CATALOGUE_LABEL}>
                {availableCatalog.map((row) => {
                  const description: string = (row.description ?? '').trim();
                  const supportUrl: string = (row.supportPageUrl ?? '').trim();
                  return (
                    <article key={row.id} className={styles.catalogCard} role="listitem">
                      <button
                        type="button"
                        className={styles.catalogCardMain}
                        disabled={busy}
                        onClick={() => onAddFromCatalog(row)}
                        aria-label={`Add ${row.title} to favourites`}
                      >
                        <span className={styles.catalogCardTitle}>{row.title}</span>
                        {description ? <span className={styles.catalogCardDesc}>{description}</span> : null}
                      </button>
                      {supportUrl ? (
                        <a
                          className={styles.catalogCardHelp}
                          href={supportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Support information"
                          aria-label={`Support for ${row.title}`}
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          ?
                        </a>
                      ) : null}
                      <IconButton
                        className={styles.catalogCardAdd}
                        iconProps={{ iconName: 'Add' }}
                        title={`Add ${row.title}`}
                        ariaLabel={`Add ${row.title}`}
                        disabled={busy}
                        onClick={(ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          onAddFromCatalog(row);
                        }}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </PivotItem>

        <PivotItem headerText="Manually add a link" itemKey="manual">
          <div className={styles.addTabPanel}>
            {addFormError ? <MessageBar messageBarType={MessageBarType.error}>{addFormError}</MessageBar> : null}
            <FavouriteItemForm values={addForm} onChange={onAddFormChange} disabled={busy} />
            <Stack horizontal className={styles.manualFormActions} tokens={{ childrenGap: 8 }}>
              <PrimaryButton text="Add" onClick={onAddFromForm} disabled={busy} />
              <DefaultButton text="Clear" onClick={onClearForm} disabled={busy} />
            </Stack>
          </div>
        </PivotItem>
      </Pivot>
    </section>
  );
};

export default AddFavouritesSection;
