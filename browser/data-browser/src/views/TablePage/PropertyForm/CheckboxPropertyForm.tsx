import { Datatype, core } from '@tomic/react';
import { useEffect, type JSX } from 'react';
import { PropertyCategoryFormProps } from './PropertyCategoryFormProps';

export function CheckboxPropertyForm({
  resource,
}: PropertyCategoryFormProps): JSX.Element {
  useEffect(() => {
    resource.set(core.properties.datatype, Datatype.BOOLEAN);
  }, []);

  return <></>;
}
