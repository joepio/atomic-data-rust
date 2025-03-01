import { useState, useMemo, memo, useContext, type JSX } from 'react';
import { Dialog, useDialog } from '../../Dialog';
import { useSettings } from '../../../helpers/AppSettings';
import { css, styled } from 'styled-components';
import { NewFormDialog } from '../NewForm/NewFormDialog';
import {
  SB_BOTTOM_RADIUS,
  SB_TOP_RADIUS,
  SearchBox,
  SearchBoxButton,
} from '../SearchBox';
import { FaTrash } from 'react-icons/fa';
import { getTitlePropOfClass } from './useTitlePropOfClass';
import {
  checkForInitialRequiredValue,
  useValidation,
} from '../formValidation/useValidation';
import { ClassSelectorDialog } from '../../ClassSelectorDialog';
import {
  core,
  unknownSubject,
  useCanWrite,
  useResource,
  useStore,
} from '@tomic/react';
import { stringToSlug } from '../../../helpers/stringToSlug';
import { FaPencil } from 'react-icons/fa6';
import { EditFormDialog } from '../EditFormDialog';
import { ResourceFormContext } from '../ResourceFormContext';
import { isURL } from '../../../helpers/isURL';

export interface ResourceSelectorProps {
  /**
   * This callback is called when the Subject Changes. You can pass an Error
   * Handler as the second argument to set an error message. Take the second
   * argument of a `useString` hook and pass the setString part to this property
   */
  setSubject: (subject: string | undefined) => void;
  /** The value (URL of the Resource that is selected) */
  value?: string;
  /**
   * Whether a certain type of Class is required here. Pass the URL of the
   * class. Is used for constructing a list of options.
   */
  isA?: string;
  /** Only let the user select the following resources */
  allowsOnly?: string[];
  /** If true, the form will show an error if it is left empty. */
  required?: boolean;
  /** A function to remove this item. Only relevant in arrays. */
  handleRemove?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Is used when a new item is created using the ResourceSelector */
  parent?: string;
  hideCreateOption?: boolean;
  hideClearButton?: boolean;

  /** If true, this is the first item in a list, default=true*/
  first?: boolean;
  /** If true, this is the last item in a list, default=true*/
  last?: boolean;

  /** Some react node that is displayed in front of the text inside the input wrapper*/
  prefix?: React.ReactNode;

  /** Callback function to be called when the input loses focus */
  onBlur?: () => void;
  id?: string;
}

const INVALID_RESOURCE_ERROR = 'Invalid Resource';

/**
 * Form field for selecting a single resource. Needs external subject &
 * setSubject properties
 */
export const ResourceSelector = memo(function ResourceSelector({
  required,
  setSubject,
  value,
  handleRemove,
  isA,
  disabled,
  parent,
  hideClearButton,
  hideCreateOption,
  first = true,
  last = true,
  prefix,
  allowsOnly,
  id,
  onBlur,
}: ResourceSelectorProps): JSX.Element {
  const store = useStore();
  const { inResourceForm } = useContext(ResourceFormContext);
  const [pickedSubject, setPickedSubject] = useState<string | undefined>();
  const [newResourceClass, setNewResourceClass] = useState<string | undefined>(
    isA,
  );
  const [editing, setEditing] = useState(false);
  const [warning, setWarning] = useState<string | undefined>();
  const [classSelectorOpen, setClassSelectorOpen] = useState(false);
  const [titleProp, setTitleProp] = useState<string>();

  const [dialogProps, showDialog, closeDialog, isDialogOpen] = useDialog({
    onSuccess: () => {
      setSubject(pickedSubject);
    },
  });

  const { error, setError, setTouched } = useValidation(
    checkForInitialRequiredValue(value, required),
  );

  const [initialNewTitle, setInitialNewTitle] = useState('');

  const { drive } = useSettings();

  const resource = useResource(value ?? unknownSubject);
  const canWrite = useCanWrite(resource);

  const shouldShowEditForm = canWrite && isURL(value ?? '');

  const handleCreateItem = useMemo(() => {
    if (hideCreateOption) {
      return undefined;
    }

    return async (name: string | undefined, classType?: string) => {
      if (name !== undefined) {
        setInitialNewTitle(name);
      }

      if (!classType) {
        setClassSelectorOpen(true);

        return;
      }

      const { titleProp: foundTitleProp } = await getTitlePropOfClass(
        classType,
        store,
      );

      setTitleProp(foundTitleProp);
      setNewResourceClass(classType);
      showDialog();
    };
  }, [hideCreateOption, showDialog, isA, store]);

  const handleSaveClick = (subject: string) => {
    setPickedSubject(subject);
    closeDialog(true);
    setError(undefined);
  };

  const handleResourceError = (hasError: boolean) => {
    if (hasError) {
      setWarning(INVALID_RESOURCE_ERROR);
    } else {
      setWarning(undefined);
    }
  };

  const handleBlur = () => {
    setTouched();
    onBlur?.();
  };

  const handleSubjectChange = (subject: string | undefined) => {
    setSubject(subject);

    if (required) {
      setError(subject ? undefined : 'Required');
    }
  };

  return (
    <Wrapper first={first} last={last}>
      <StyledSearchBox
        prefix={prefix}
        value={value}
        isA={isA}
        required={required}
        disabled={disabled}
        hideClearButton={hideClearButton}
        allowsOnly={allowsOnly}
        visualError={error || warning}
        id={id}
        onChange={handleSubjectChange}
        onCreateItem={handleCreateItem}
        onClose={handleBlur}
        onResourceError={handleResourceError}
      >
        {inResourceForm && shouldShowEditForm && (
          <SearchBoxButton
            onClick={() => setEditing(true)}
            title='Edit resource'
            type='button'
          >
            <FaPencil />
          </SearchBoxButton>
        )}
        {handleRemove && !disabled && (
          <SearchBoxButton onClick={handleRemove} title='Remove' type='button'>
            <FaTrash />
          </SearchBoxButton>
        )}
      </StyledSearchBox>
      {newResourceClass && (
        <Dialog {...dialogProps} width='50rem'>
          {isDialogOpen && (
            <NewFormDialog
              parent={parent || drive}
              classSubject={newResourceClass}
              onCancel={() => closeDialog(false)}
              initialProps={
                titleProp
                  ? {
                      [titleProp]:
                        titleProp === core.properties.shortname
                          ? stringToSlug(initialNewTitle)
                          : initialNewTitle,
                    }
                  : undefined
              }
              onSaveClick={handleSaveClick}
            />
          )}
        </Dialog>
      )}
      {inResourceForm && shouldShowEditForm && (
        <EditFormDialog subject={value!} show={editing} bindShow={setEditing} />
      )}
      {!isA && (
        <ClassSelectorDialog
          show={classSelectorOpen}
          bindShow={setClassSelectorOpen}
          onClassSelect={c => {
            handleCreateItem?.(initialNewTitle, c);
          }}
        />
      )}
    </Wrapper>
  );
});

// We need Wrapper to be able to target this component.
const StyledSearchBox = styled(SearchBox)``;

const Wrapper = styled.div<{ first?: boolean; last?: boolean }>`
  ${SB_TOP_RADIUS.define(p => (p.first ? p.theme.radius : 0))}
  ${SB_BOTTOM_RADIUS.define(p => (p.last ? p.theme.radius : 0))}

  flex: 1;
  max-width: 100%;
  position: relative;

  & ${StyledSearchBox} {
    ${p =>
      !p.last &&
      css`
        border-bottom: none;
      `}
  }
`;
