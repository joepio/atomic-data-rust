import { useRef, useEffect, useState, type JSX } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Resource,
  useArray,
  useCanWrite,
  useStore,
  dataBrowser,
  core,
} from '@tomic/react';
import { styled } from 'styled-components';
import { FaEdit, FaEye, FaGripVertical } from 'react-icons/fa';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ErrorLook } from '../components/ErrorLook';
import { ElementEdit, ElementEditPropsBase, ElementShow } from './Element';
import { Button } from '../components/Button';
import { ResourcePageProps } from './ResourcePage';
import toast from 'react-hot-toast';
import { shortcuts } from '../components/HotKeyWrapper';
import { EditableTitle } from '../components/EditableTitle';
import { FileDropZone } from '../components/forms/FileDropzone/FileDropzone';
import { Column, Row } from '../components/Row';
import { TagBar } from '../components/Tag/TagBar';

/** A full page, editable document, consisting of Elements */
export function DocumentPage({ resource }: ResourcePageProps): JSX.Element {
  const canWrite = useCanWrite(resource);
  const [editMode, setEditMode] = useState(canWrite);

  useEffect(() => {
    setEditMode(canWrite);
  }, [canWrite]);

  return (
    <FullPageWrapper>
      <DocumentContainer>
        {editMode ? (
          <DocumentPageEdit resource={resource} setEditMode={setEditMode} />
        ) : (
          <DocumentPageShow resource={resource} setEditMode={setEditMode} />
        )}
      </DocumentContainer>
    </FullPageWrapper>
  );
}

type DocumentSubPageProps = {
  resource: Resource;
  setEditMode: (arg: boolean) => void;
};

function DocumentPageEdit({
  resource,
  setEditMode,
}: DocumentSubPageProps): JSX.Element {
  const [elements, setElements] = useArray(
    resource,
    dataBrowser.properties.elements,
    { commit: false, validate: false, commitDebounce: 0 },
  );

  const titleRef = useRef<HTMLInputElement>(null);
  const store = useStore();
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<Error | undefined>(undefined);
  const [current, setCurrent] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // On init, focus on the last element
  useEffect(() => {
    setCurrent(elements.length - 1);

    if (elements === undefined) {
      setElements([]);
    }
  }, []);

  // Always have one element
  useEffect(() => {
    if (elements.length === 0) {
      addElement(0);
    }
  }, [JSON.stringify(elements)]);

  useHotkeys(
    'enter',
    e => {
      e.preventDefault();
      addElement(current + 1);
    },
    { enableOnTags: ['TEXTAREA'] },
    [current],
  );

  /** Move from title to first element */
  useHotkeys(
    'enter',
    e => {
      e.preventDefault();
      addElement(0);
      focusElement(0);
    },
    { enableOnTags: ['INPUT'] },
    [addElement, focusElement],
  );

  useHotkeys(
    'up',
    e => {
      e.preventDefault();

      if (!current || current === 0) {
        titleRef.current?.focus();
      } else {
        focusElement(current - 1);
      }
    },
    { enableOnTags: ['TEXTAREA'] },
    [current],
  );

  useHotkeys(
    'down',
    e => {
      e.preventDefault();

      if (document.activeElement === titleRef.current) {
        focusElement(0);
      } else {
        focusElement(current + 1);
      }
    },
    { enableOnTags: ['TEXTAREA', 'INPUT'] },
    [current],
  );

  // Move current element up
  useHotkeys(
    shortcuts.moveLineUp,
    e => {
      e.preventDefault();
      moveElement(current, current - 1);
    },
    { enableOnTags: ['TEXTAREA'] },
    [current],
  );

  // Move element down
  useHotkeys(
    shortcuts.moveLineDown,
    e => {
      e.preventDefault();
      moveElement(current, current + 1);
    },
    { enableOnTags: ['TEXTAREA'] },
    [current],
  );

  // Lose focus
  useHotkeys(
    'esc',
    e => {
      e.preventDefault();
      setCurrent(-1);
    },
    { enableOnTags: ['TEXTAREA'] },
  );

  /** Creates a new Element at the given position, with the Document as its parent */
  async function addElement(position: number) {
    // When an element is created, it should be a Resource that has this document as its parent.
    // or maybe a nested resource?
    const elementSubject = store.createSubject(resource.subject);
    const newElements = [...elements];
    newElements.splice(position, 0, elementSubject);

    try {
      const newElement = await store.newResource({
        subject: elementSubject,
        isA: dataBrowser.classes.paragraph,
        parent: resource.subject,
        propVals: {
          [core.properties.description]: '',
        },
      });

      await setElements(newElements);
      focusElement(position);
      await newElement.save();
      await resource.save();
    } catch (e) {
      setErr(e);
    }
  }

  function focusElement(goto: number) {
    if (goto > elements.length - 1) {
      goto = elements.length - 1;
    } else if (goto < 0) {
      goto = 0;
    }

    setCurrent(goto);
    let found: HTMLInputElement | undefined = ref?.current?.children[
      goto
    ]?.getElementsByClassName('element')[0] as HTMLInputElement;

    if (!found) {
      found = ref?.current?.children[goto] as HTMLInputElement;
    }

    if (found) {
      found.focus();
    } else {
      ref.current?.focus();
    }
  }

  async function deleteElement(number: number) {
    if (elements.length === 1) {
      setElements([]);
      focusElement(0);
      resource.save();

      return;
    }

    setElements(elements.toSpliced(number, 1));
    focusElement(number - 1);
    resource.save();
  }

  /** Sets the subject for a specific element and moves to the next element */
  async function setElement(index: number, subject: string) {
    setElements(elements.with(index, subject));

    if (index === elements.length - 1) {
      addElement(index + 1);
    } else {
      focusElement(index + 1);
      resource.save();
    }
  }

  function moveElement(from: number, to: number) {
    const element = elements[from];
    setElements(elements.toSpliced(from, 1).toSpliced(to, 0, element));
    focusElement(to);
    resource.save();
  }

  function handleSortEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = elements.indexOf(active.id.toString());

      if (!over?.id) {
        return;
      }

      const newIndex = elements.indexOf(over.id.toString());
      moveElement(oldIndex, newIndex);
    }
  }

  /** Create elements for every new File resource */
  function handleUploadedFiles(fileSubjects: string[]) {
    toast.success('Upload succeeded!');
    fileSubjects.map(subject => elements.push(subject));
    setElements([...elements]);
    resource.save();
  }

  /** Add a new line, or move to the last line if it is empty */
  async function handleNewLineMaybe() {
    const lastSubject = elements[elements.length - 1];

    if (!lastSubject) {
      addElement(elements.length);

      return;
    }

    const lastElem = await store.getResource(lastSubject);
    const description = lastElem.get(core.properties.description);

    if (description === undefined || description.length === 0) {
      focusElement(elements.length - 1);
    } else {
      addElement(elements.length);
    }
  }

  return (
    <Column fullHeight>
      <Row justify='space-between'>
        <EditableTitle parentRef={titleRef} resource={resource} />
        <Button
          icon
          subtle
          onClick={() => setEditMode(false)}
          title='Read mode'
        >
          <FaEye />
        </Button>
      </Row>
      <TagBar resource={resource} />
      {err?.message && <ErrorLook>{err.message}</ErrorLook>}
      <FileDropZone
        onFilesUploaded={handleUploadedFiles}
        parentResource={resource}
      >
        <div ref={ref}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSortEnd}
          >
            <SortableContext
              // Not sue why, but creating a new array from elements fixes jumping behavior
              items={[...elements]}
              strategy={verticalListSortingStrategy}
            >
              {elements.map((elementSubject, index) => (
                <SortableElement
                  key={index + elementSubject}
                  canDrag={true}
                  index={index}
                  subject={elementSubject}
                  deleteElement={deleteElement}
                  setCurrent={setCurrent}
                  current={current}
                  setElementSubject={setElement}
                  active={index === current}
                />
              ))}
            </SortableContext>
          </DndContext>
          <NewLine onClick={handleNewLineMaybe} />
        </div>
      </FileDropZone>
    </Column>
  );
}

function DocumentPageShow({
  resource,
  setEditMode,
}: DocumentSubPageProps): JSX.Element {
  const [elements] = useArray(resource, dataBrowser.properties.elements);
  const canWrite = useCanWrite(resource);

  return (
    <Column fullHeight>
      <Row justify='space-between'>
        <h1 style={{ flex: 1 }}>{resource.title}</h1>
        {canWrite && (
          <Button
            data-test='document-edit'
            icon
            subtle
            onClick={() => setEditMode(true)}
            title='Edit mode'
          >
            <FaEdit />
          </Button>
        )}
      </Row>
      <TagBar resource={resource} />
      <div>
        {elements.map(subject => (
          <ElementShow subject={subject} key={subject} />
        ))}
      </div>
    </Column>
  );
}

interface SortableElementProps extends ElementEditPropsBase {
  subject: string;
  index?: number;
  active: boolean;
}

function SortableElement(props: SortableElementProps) {
  const { subject, active } = props;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: subject });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableItemWrapper ref={setNodeRef} style={style}>
      <GripItem active={active} {...attributes} {...listeners} />
      <ElementEdit {...props} />
    </SortableItemWrapper>
  );
}

const DocumentContainer = styled.div`
  width: min(100%, ${p => p.theme.containerWidth}rem);
  margin: auto;
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 2rem;
  @media (max-width: ${props => props.theme.containerWidth}rem) {
    padding: ${p => p.theme.margin}rem;
  }
`;

const NewLine = styled.div`
  height: 20rem;
  flex: 1;
  cursor: text;
`;

const SortableItemWrapper = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;
`;

const GripItem = (props: GripItemProps) => {
  return (
    <SortHandleStyled {...props} title={'Grab to re-order'}>
      <FaGripVertical />
    </SortHandleStyled>
  );
};

interface GripItemProps {
  /** The element is currently selected */
  active: boolean;
}

const FullPageWrapper = styled.div`
  background-color: ${p => p.theme.colors.bg};
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: ${p => p.theme.heights.fullPage};
  box-sizing: border-box;
`;

const SortHandleStyled = styled.div<GripItemProps>`
  width: 1rem;
  flex: 1;
  display: flex;
  align-items: center;
  opacity: ${p => (p.active ? 0.3 : 0)};
  position: absolute;
  left: -1rem;
  bottom: 0;
  height: 100%;
  /* TODO fix cursor while dragging */
  cursor: grab;
  border: solid 1px transparent;
  border-radius: ${p => p.theme.radius};

  &:drop(active),
  &:focus,
  &:active {
    opacity: 0.5;
  }

  &:hover {
    opacity: 0.5;
  }
`;

export default DocumentPage;
