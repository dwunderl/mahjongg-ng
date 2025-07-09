import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { Tile as TileType } from '@/types/tile';
import Tile from './Tile';
import { useRef, useState, useCallback, useEffect } from 'react';
import { XYCoord } from 'dnd-core';
import styles from './Tile.module.css';

interface DragItem {
  type: string;
  id: string;
  index: number;
  isMatched?: boolean;
  isJokerMatch?: boolean;
  timestamp: number;
}

interface DraggableTileProps {
  tile: TileType;
  index: number;
  moveTile: (dragIndex: number, hoverIndex: number) => void;
  onClick: (tile: TileType, e: React.MouseEvent) => void;
  onEdit?: (tile: TileType, e: React.MouseEvent) => void;
  isSelected?: boolean;
  isMatched?: boolean;
  isJokerMatch?: boolean;
  opacity?: number;
}

const DraggableTile: React.FC<DraggableTileProps> = ({
  tile,
  index,
  moveTile,
  onClick,
  onEdit,
  isSelected = false,
  isMatched = false,
  isJokerMatch = false,
  opacity = 1,
}) => {
  // Refs
  const dragRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickCountRef = useRef(0);

  // State
  const [isPressing, setIsPressing] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // Set up drag and drop
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'TILE',
    item: (): DragItem => ({
      id: tile.id,
      index,
      type: 'TILE',
      isMatched: tile.isMatched || isMatched,
      isJokerMatch: tile.isJokerMatch || isJokerMatch,
      timestamp: Date.now(),
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isMatched && !isJokerMatch,
  });

  // Update drag state when dragging starts/ends
  useEffect(() => {
    if (isDragging) {
      isDraggingRef.current = true;
      setIsDraggingState(true);
    } else {
      isDraggingRef.current = false;
      setIsDraggingState(false);
    }
  }, [isDragging]);

  const [, drop] = useDrop({
    accept: 'TILE',
    hover: (item: DragItem, monitor: DropTargetMonitor) => {
      if (!dragRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = dragRef.current.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      moveTile(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  // Combine drag and drop refs using a ref callback
  const dragDropRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Connect the node to the drag and drop system
      const dragDropNode = drag(drop(node));
      // Update our ref
      if (node) {
        (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
      return dragDropNode;
    },
    [drag, drop]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };
  }, []);

  // Handle double click for editing
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(tile, e);
    }
  }, [onEdit, tile]);

  // Handle pointer down for drag start
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Don't prevent default to allow native drag operations
      e.stopPropagation();

      // Only handle left mouse button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      // Set pressing state
      setIsPressing(true);
      isDraggingRef.current = false;

      // Set up press timer for long press detection with a delay
      pressTimerRef.current = setTimeout(() => {
        // Only trigger edit if we're still pressing and not dragging
        if (isPressing && onEdit && !isDraggingRef.current) {
          const syntheticEvent = {
            ...e,
            preventDefault: () => e.preventDefault(),
            stopPropagation: () => e.stopPropagation(),
            currentTarget: e.currentTarget,
            target: e.target,
          } as unknown as React.MouseEvent;

          onEdit(tile, syntheticEvent);
          // Reset states after edit
          setIsPressing(false);
          isDraggingRef.current = false;
        }
      }, 300); // Reduced to 300ms for better UX

      // Add pointer capture for reliable drag detection
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
    },
    [onEdit, tile]
  );

  // Handle pointer up for drag end or click
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Clear press timer
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }

      // Only handle left mouse button or touch
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      // If we were pressing and not dragging, handle as click
      if (isPressing && !isDraggingRef.current) {
        clickCountRef.current++;

        // Handle double click
        if (clickCountRef.current === 1) {
          clickTimerRef.current = setTimeout(() => {
            // Single click handler
            onClick(tile, e as unknown as React.MouseEvent);
            clickCountRef.current = 0;
          }, 200);
        } else {
          // Double click handler
          if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
          }
          if (onEdit) {
            onEdit(tile, e as unknown as React.MouseEvent);
          }
          clickCountRef.current = 0;
        }
      }

      // Reset states
      setIsPressing(false);
      isDraggingRef.current = false;

      // Release pointer capture
      const target = e.currentTarget as HTMLElement;
      target.releasePointerCapture(e.pointerId);
    },
    [isPressing, onClick, onEdit, tile]
  );

  // Handle pointer cancel (e.g., when dragging outside the window)
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear timers
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Reset states
    setIsPressing(false);
    isDraggingRef.current = false;

    // Release pointer capture
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
  }, []);

  // Handle mouse move for drag detection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPressing && !isDraggingRef.current) {
      // Clear any pending edit timer
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      
      // Only start dragging if we've moved a minimum distance
      const moveThreshold = 5; // pixels
      const deltaX = Math.abs(e.movementX);
      const deltaY = Math.abs(e.movementY);
      
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        isDraggingRef.current = true;
        setIsDraggingState(true);
      }
    }
  }, [isPressing]);

  // Handle mouse leave to clean up drag state
  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isPressing) {
      setIsPressing(false);
      isDraggingRef.current = false;
    }
  }, [isPressing]);

  // Determine if we should show matched or joker match states
  const showMatched = isMatched || tile.isMatched;
  const showJokerMatch = isJokerMatch || tile.isJokerMatch;

  return (
    <div
      ref={dragDropRef}
      className={`${styles.tile} ${isSelected ? styles.selected : ''} ${
        isDragging || isDraggingState ? styles.dragging : ''
      } ${showMatched ? styles.matched : ''} ${
        showJokerMatch ? styles.jokerMatch : ''
      }`}
      style={{ opacity }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      onTouchMove={(e) => {
        // Prevent default to avoid scrolling while dragging
        e.preventDefault();
        handleMouseMove(e as any);
      }}
    >
      <Tile
        tile={tile}
        isSelected={isSelected}
        isMatched={showMatched}
        isJokerMatch={showJokerMatch}
      />
    </div>
  );
};

export default DraggableTile;
