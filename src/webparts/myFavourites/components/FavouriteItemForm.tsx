import * as React from 'react';
import { Stack, TextField } from '@fluentui/react';
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
    </Stack>
  );
};

export default FavouriteItemForm;
