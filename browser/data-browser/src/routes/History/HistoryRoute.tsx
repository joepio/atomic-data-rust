import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { useResource, Version } from '@tomic/react';

import { ContainerNarrow } from '../../components/Containers';
import { useCurrentSubject } from '../../helpers/useCurrentSubject';
import { ErrorLook } from '../../components/ErrorLook';
import { styled } from 'styled-components';
import { useVersions } from './useVersions';
import { groupVersionsByMonth } from './versionHelpers';
import { toast } from 'react-hot-toast';
import { useNavigateWithTransition } from '../../hooks/useNavigateWithTransition';
import { constructOpenURL } from '../../helpers/navigation';
import { HistoryDesktopView } from './HistoryDesktopView';
import { HistoryMobileView } from './HistoryMobileView';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { Column, Row } from '../../components/Row';
import { ProgressBar } from '../../components/ProgressBar';
import { Main } from '../../components/Main';
import { pathNames } from '../paths';
import { appRoute } from '../RootRoutes';
import { createRoute } from '@tanstack/react-router';

export const HistoryRoute = createRoute({
  path: pathNames.history,
  component: () => <History />,
  getParentRoute: () => appRoute,
});

/** Shows an activity log of previous versions */
function History(): JSX.Element {
  const navigate = useNavigateWithTransition();
  const isSmallScreen = useMediaQuery('(max-width: 500px)');
  const [subject] = useCurrentSubject();
  const resource = useResource(subject);
  const { versions, loading, error, progress } = useVersions(resource);
  const [selectedVersion, setSelectedVersion] = useState<Version | undefined>();

  const groupedVersions: {
    [key: string]: Version[];
  } = useMemo(() => groupVersionsByMonth(versions), [versions]);

  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersion(versions[versions.length - 1]);
    }
  }, [versions]);

  const setResourceToCurrentVersion = async () => {
    if (selectedVersion && subject) {
      await resource.setVersion(selectedVersion);

      toast.success('Resource version updated');
      navigate(constructOpenURL(subject));
    }
  };

  const nextVersion = useCallback(() => {
    const currentIndex = versions.findIndex(v => v === selectedVersion);

    if (currentIndex === -1 || currentIndex === versions.length - 1) {
      return;
    }

    setSelectedVersion(versions[currentIndex + 1]);
  }, [versions, selectedVersion]);

  const previousVersion = useCallback(() => {
    const currentIndex = versions.findIndex(v => v === selectedVersion);

    if (currentIndex === -1 || currentIndex === 0) {
      return;
    }

    setSelectedVersion(versions[currentIndex - 1]);
  }, [versions, selectedVersion]);

  const ViewComp = isSmallScreen ? HistoryMobileView : HistoryDesktopView;

  const isCurrentVersion = selectedVersion === versions[versions.length - 1];

  if (loading) {
    return (
      <ContainerNarrow>
        <Centered>
          <Column fullWidth>
            <span>Building history of {resource.title}</span>
            <Row center fullWidth>
              <ProgressBar value={progress} />
              <span>{progress}%</span>
            </Row>
          </Column>
        </Centered>
      </ContainerNarrow>
    );
  }

  if (error) {
    return (
      <ContainerNarrow>
        <ErrorLook>{error.message}</ErrorLook>
      </ContainerNarrow>
    );
  }

  return (
    <Main subject={subject}>
      <SplitView about={subject}>
        <ViewComp
          resource={resource}
          groupedVersions={groupedVersions}
          selectedVersion={selectedVersion}
          isCurrentVersion={isCurrentVersion}
          onNextVersion={nextVersion}
          onPreviousVersion={previousVersion}
          onSelectVersion={setSelectedVersion}
          onVersionAccept={setResourceToCurrentVersion}
        />
      </SplitView>
    </Main>
  );
}

const SplitView = styled.main`
  display: flex;
  /* Fills entire view on all devices */
  width: 100%;
  height: 100%;
  height: calc(100vh - 6rem);
  padding: ${p => p.theme.margin}rem;
  gap: ${p => p.theme.margin}rem;

  /* Fix code blocks not shrinking causing page overflow. */
  & code {
    word-break: break-word;
  }
`;

const Centered = styled.div`
  display: grid;
  place-items: center;
  height: 100dvh;
  min-width: 100%;
`;
