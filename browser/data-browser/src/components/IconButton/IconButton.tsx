import {
  ComponentType,
  ButtonHTMLAttributes,
  AnchorHTMLAttributes,
} from 'react';
import { styled, DefaultTheme } from 'styled-components';
import { transition } from '../../helpers/transition';

export enum IconButtonVariant {
  Simple,
  Outline,
  Fill,
  Colored,
  Square,
}

type ColorProp = keyof DefaultTheme['colors'] | 'inherit';

type BaseProps = {
  className?: string;
  variant?: IconButtonVariant;
  color?: ColorProp;
  size?: string;
  title: string;
  edgeAlign?: 'start' | 'end';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  as?: string | ComponentType<any>;
};

export type IconButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement | null>;
  };

export const IconButton: React.FC<React.PropsWithChildren<IconButtonProps>> = ({
  variant = IconButtonVariant.Simple,
  color = 'inherit',
  size = '1em',
  children,
  ref,
  ...props
}) => {
  const Comp = ComponentMap.get(variant!) ?? SimpleIconButton;

  return (
    <Comp ref={ref} color={color} size={size} {...props}>
      {children}
    </Comp>
  );
};

export type IconButtonLinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    ref?: React.Ref<HTMLAnchorElement | null>;
  };

export const IconButtonLink: React.FC<
  React.PropsWithChildren<IconButtonLinkProps>
> = ({
  variant = IconButtonVariant.Simple,
  color = 'inherit',
  size = '1em',
  ref,
  children,
  ...props
}) => {
  const Comp = ComponentMap.get(variant ?? IconButtonVariant.Simple)!;

  return (
    <Comp ref={ref} color={color!} size={size} as='a' {...props}>
      {children}
    </Comp>
  );
};

interface ButtonBaseProps {
  size?: string;
  edgeAlign?: 'start' | 'end';
}

const IconButtonBase = styled.button<ButtonBaseProps>`
  --button-padding: 0.4em;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  ${transition('background-color', 'color', 'box-shadow', 'filter')};
  color: ${p => p.theme.colors.text};
  font-size: ${p => p.size ?? '1em'};
  border: none;
  user-select: none;
  padding: var(--button-padding);
  aspect-ratio: 1/1;
  height: 2em;
  margin-inline-start: ${p =>
    p.edgeAlign === 'start' ? 'calc(var(--button-padding) * -1)' : '0'};

  margin-inline-end: ${p =>
    p.edgeAlign === 'end' ? 'calc(var(--button-padding) * -1)' : '0'};
  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ButtonStyleProps {
  color: ColorProp;
}

const SimpleIconButton = styled(IconButtonBase)<ButtonStyleProps>`
  color: ${p => (p.color === 'inherit' ? 'inherit' : p.theme.colors[p.color])};
  background-color: transparent;
  border-radius: ${p => p.theme.radius};

  &:not([disabled]) {
    &:hover,
    &:focus-visible {
      background-color: ${p => p.theme.colors.bg1};
    }

    &:active {
      background-color: ${p => p.theme.colors.bg2};
    }
  }
`;

const OutlineIconButton = styled(IconButtonBase)<ButtonStyleProps>`
  color: ${p => (p.color === 'inherit' ? 'inherit' : p.theme.colors[p.color])};
  background-color: ${p => p.theme.colors.bg};
  border-radius: 50%;

  &:not([disabled]) {
    &:hover,
    &:focus-visible {
      color: ${p => p.theme.colors.main};
      box-shadow:
        0px 0px 0px 1.5px ${p => p.theme.colors.main},
        ${p => p.theme.boxShadowSoft};
    }
  }

  &&:active {
    background-color: ${p => p.theme.colors.main};
    color: white;
  }
`;

const SquareIconButton = styled(IconButtonBase)<ButtonStyleProps>`
  color: ${p => (p.color === 'inherit' ? 'inherit' : p.theme.colors[p.color])};
  background-color: ${p => p.theme.colors.bg};
  border-radius: ${p => p.theme.radius};
  border: 1px solid ${p => p.theme.colors.bg2};

  &:not([disabled]) {
    &:hover,
    &:focus-visible {
      color: ${p => p.theme.colors.main};
      border-color: ${p => p.theme.colors.main};
      box-shadow: ${p => p.theme.boxShadowSoft};
    }
  }

  &&:active {
    background-color: ${p => p.theme.colors.main};
    color: white;
  }
`;

const FillIconButton = styled(IconButtonBase)<ButtonStyleProps>`
  color: ${p => (p.color === 'inherit' ? 'inherit' : p.theme.colors[p.color])};
  background-color: unset;
  border-radius: 50%;
  &:hover,
  &:focus-visible {
    color: white;
    background-color: ${p => p.theme.colors.main};
    box-shadow: ${p => p.theme.boxShadowSoft};
  }
`;

const ColoredIconButton = styled(IconButtonBase)<ButtonStyleProps>`
  color: white;
  background-color: ${p =>
    p.color === 'inherit' ? 'inherit' : p.theme.colors[p.color]};
  border-radius: 50%;
  &:hover,
  &:focus-visible {
    color: white;
    filter: brightness(1.3);
    box-shadow: ${p => p.theme.boxShadowSoft};
  }
`;

const ComponentMap = new Map([
  [IconButtonVariant.Simple, SimpleIconButton],
  [IconButtonVariant.Outline, OutlineIconButton],
  [IconButtonVariant.Fill, FillIconButton],
  [IconButtonVariant.Colored, ColoredIconButton],
  [IconButtonVariant.Square, SquareIconButton],
]);
