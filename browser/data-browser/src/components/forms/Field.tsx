import React, { useState, type JSX } from 'react';
import { FaAsterisk, FaInfo, FaTrash } from 'react-icons/fa';
import { styled } from 'styled-components';
import { Collapse } from '../Collapse';
import { IconButton, IconButtonVariant } from '../IconButton/IconButton';
import { Row } from '../Row';
import {
  ErrMessage,
  FieldStyled,
  LabelHelper,
  LabelWrapper,
} from './InputStyles';
import { complement } from 'polished';

interface FieldProps {
  /** Label */
  label?: string;
  /** Helper text / collapsible info */
  helper?: React.ReactNode;
  /** Here goes the input */
  children: React.ReactNode;
  /** If the field is requires. Shows an aterisk with hover text */
  required?: boolean;
  disabled?: boolean;
  /** The error to be shown in the component */
  error?: Error;

  /** The id of the field. This is used to link the label with the input */
  fieldId?: string;
  labelId?: string;
  /**
   * If the field contains multiple inputs like an array.
   * This will make the component render a fieldset + legend instead of a label.
   */
  multiInput?: boolean;
  /**
   * This function will be called when the delete icon is clicked. This should
   * remove the item from any parent list
   */
  handleDelete?: (url: string) => unknown;
}

/** High level form field skeleton. Pass the actual input as a child component. */
function Field({
  label,
  helper,
  children,
  error,
  handleDelete,
  required,
  disabled,
  fieldId,
  labelId,
  multiInput,
}: FieldProps): JSX.Element {
  const [collapsedHelper, setCollapsed] = useState(true);

  return (
    <FieldStyled as={multiInput ? 'fieldset' : undefined}>
      <LabelWrapper>
        <Row gap='0.4rem' center>
          <FieldLabel
            data-test={`field-label-${label}`}
            htmlFor={fieldId}
            id={labelId}
            as={multiInput ? 'legend' : undefined}
          >
            {label}
            {required && <Astrisk title='Required field' size='0.6em' />}
          </FieldLabel>
          {helper && (
            <IconButton
              variant={IconButtonVariant.Outline}
              color='textLight'
              type='button'
              size='0.7rem'
              onClick={() => setCollapsed(!collapsedHelper)}
              title='Show helper'
            >
              <FaInfo />
            </IconButton>
          )}
          {!disabled && handleDelete && (
            <IconButton
              variant={IconButtonVariant.Outline}
              title='Delete this property'
              color='textLight'
              type='button'
              size='0.7rem'
              onClick={() => handleDelete('test')}
            >
              <FaTrash />
            </IconButton>
          )}
        </Row>
      </LabelWrapper>

      <LabelHelper>
        <Collapse open={!collapsedHelper}>
          {helper}
          {required && <p>Required field.</p>}
        </Collapse>
      </LabelHelper>
      {children}
      {error && (
        <ErrMessage title={`Error: ${JSON.stringify(error)}`}>
          {error.message}
        </ErrMessage>
      )}
    </FieldStyled>
  );
}

export const FieldLabel = styled.label`
  text-transform: capitalize;
  display: inline-flex;
  gap: 0.2rem;
  align-items: center;
  font-weight: bold;
`;

export default Field;

const Astrisk = styled(FaAsterisk)`
  margin-bottom: 0.5em;
  color: ${p => complement(p.theme.colors.main)};
`;
