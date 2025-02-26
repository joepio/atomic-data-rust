import { Resource, core, useArray } from '@tomic/react';
import { FC, PropsWithChildren } from 'react';
import { styled } from 'styled-components';
import { AtomicLink } from '../../components/AtomicLink';
import { type ViewTransitionProps } from '../../helpers/ViewTransitionProps';
import {
  PAGE_TITLE_TRANSITION_TAG,
  transitionName,
} from '../../helpers/transitionName';
import { getIconForClass } from '../../helpers/iconMap';
import { Row } from '../../components/Row';

interface ResourceCardTitleProps {
  resource: Resource;
}

export const ResourceCardTitle: FC<
  PropsWithChildren<ResourceCardTitleProps>
> = ({ resource, children }) => {
  const [isA] = useArray(resource, core.properties.isA);
  const Icon = getIconForClass(isA[0]);

  return (
    <TitleRow center gap='1ch' justify='space-between' wrapItems>
      <Row center gap='1ch'>
        <Icon />
        <AtomicLink subject={resource.subject}>
          <Title subject={resource.subject}>{resource.title}</Title>
        </AtomicLink>
      </Row>
      {children}
    </TitleRow>
  );
};

const Title = styled.h2<ViewTransitionProps>`
  font-size: 1.4rem;
  margin: 0;
  ${props => transitionName(PAGE_TITLE_TRANSITION_TAG, props.subject)};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const TitleRow = styled(Row)`
  max-width: 100%;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textLight};

  svg {
    min-width: 1em;
  }
`;
