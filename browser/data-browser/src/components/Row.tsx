import { styled } from 'styled-components';
import * as CSS from 'csstype';

import { ButtonDefault } from './Button';
import { forwardRef, type JSX } from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: CSS.Property.Gap;
  justify?: CSS.Property.JustifyContent;
  direction?: CSS.Property.FlexDirection;
  center?: boolean;
  wrapItems?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export type RowProps = Omit<FlexProps, 'direction'> & {
  reverse?: boolean;
};
export type ColumnProps = Omit<FlexProps, 'direction'> & {
  reverse?: boolean;
};

export const Row = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<RowProps>
>(({ children, reverse, ...props }, ref) => {
  return (
    <Flex {...props} direction={reverse ? 'row-reverse' : 'row'} ref={ref}>
      {children}
    </Flex>
  );
});

Row.displayName = 'Row';

export const Column = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<ColumnProps>
>(({ children, reverse, ...props }, ref) => {
  return (
    <Flex
      {...props}
      direction={reverse ? 'column-reverse' : 'column'}
      ref={ref}
    >
      {children}
    </Flex>
  );
});

Column.displayName = 'Column';

/**
 * Underlying layout of the Row and Column components.
 * Do not use this component directly and don't extend it.
 *
 * This component is only exported so it can be used in css selectors.
 */
export const Flex = styled.div<FlexProps>`
  align-items: ${p => (p.center ? 'center' : 'initial')};
  display: flex;
  gap: ${p => p.gap ?? `${p.theme.margin}rem`};
  justify-content: ${p => p.justify ?? 'start'};
  flex-direction: ${p => p.direction ?? 'row'};
  flex-wrap: ${p => (p.wrapItems ? 'wrap' : 'nowrap')};
  width: ${p => (p.fullWidth ? '100%' : 'initial')};
  height: ${p => (p.fullHeight ? '100%' : 'initial')};

  & > :is(h1, h2, h3, h4, h5, h6) {
    margin-bottom: 0;
  }

  & ${ButtonDefault} {
    align-self: flex-start;
  }

  & > p {
    margin: 0;
  }
`;
