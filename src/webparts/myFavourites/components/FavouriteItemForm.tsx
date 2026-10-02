import * as React from 'react';
import { Stack, TextField, Toggle } from '@fluentui/react';
import { INTERNAL_LINK_TOGGLE_LABEL } from '../../shared/internalLinkNote';
import type { IFavouriteFormValues } from '../models/IFavouriteItem';

export interface IFavouriteItemFormProps {
  values: IFavouriteFormValues;
  onChange: (values: IFavouriteFormValues) => void;
  disabled?: boolean;
}

const FavouriteItemForm: React.FC<IFavouriteItemFormProps> = ({ values, onChange, disabled }) => {
  const setField = <K extends keyof IFavouriteFormValues>(key: K, value: IFavouriteFormValues[K]): void => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <TextField
        label="Title"
        required
        disabled={disabled}
        value={values.title}
        onChange={(_, v) => setField('title', v ?? '')}
      />
      <TextField
        label="URL"
        required
        disabled={disabled}
        value={values.url}
        onChange={(_, v) => setField('url', v ?? '')}
      />
      <TextField
        label="Description"
        multiline
        rows={3}
        disabled={disabled}
        value={values.description}
        onChange={(_, v) => setField('description', v ?? '')}
      />
      <Toggle
        label={INTERNAL_LINK_TOGGLE_LABEL}
        disabled={disabled}
        checked={values.internal}
        onChange={(_, checked) => setField('internal', !!checked)}
        onText="Yes"
        offText="No"
      />
    </Stack>
  );
};

export default FavouriteItemForm;
