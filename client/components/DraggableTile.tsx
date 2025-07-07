import { useDrag, useDrop } from 'react-dnd';
import { Tile as TileType } from '@/types/tile';
import Tile from './Tile';
import { useRef, useEffect } from 'react';
import styles from './Tile.module.css';

// Define the drag item type for better type safety
interface DragItem {
  id: string;
  index: number;
  type: string;
}

interface DraggableTileProps {
  tile: TileType;
  index: number;
  moveTile: (dragIndex: number, hoverIndex: number) => void;
  onClick: (tile: TileType) => void;
  isSelected?: boolean;
  isMatched?: boolean;
  isJokerMatch?: boolean;
  opacity?: number;
}

export default function DraggableTile({
  tile,
  index,
  moveTile,
  onClick,
  isSelected = false,
  isMatched = false,
  isJokerMatch = false,
  opacity = 1,
}: DraggableTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'TILE',
    item: () => {
      // Include all necessary tile data in the drag item
      return { 
        id: tile.id, 
        index, 
        type: 'TILE',
        isMatched: tile.isMatched || isMatched,
        isJokerMatch: tile.isJokerMatch || isJokerMatch
      } as const;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: true,
    end: (item, monitor) => {
      if (monitor.didDrop()) {
        // The drop was successful
        // Force an update to ensure the tile's state is correct after drop
        setTimeout(() => {
          // This will trigger a re-render with the correct state
          onClick(tile);
        }, 0);
      }
    },
  });

  const [, drop] = useDrop<DragItem>({
    accept: 'TILE',
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get horizontal middle (since tiles are in a row)
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // Only perform the move when the mouse has crossed half of the item's width
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
        return;
      }
      
      // Dragging left
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      // Time to actually perform the action
      // Use requestAnimationFrame to ensure smooth animations
      requestAnimationFrame(() => {
        moveTile(dragIndex, hoverIndex);
        // Update the index for the dragged item
        item.index = hoverIndex;
      });
    }
  });

  useEffect(() => {
    if (ref.current) {
      drag(drop(ref));
    }
  }, [drag, drop]);

  // Show highlight if the tile is matched, either through props or tile data
  const showMatched = tile.isMatched || isMatched;
  const showJokerMatch = tile.isJokerMatch || isJokerMatch;
  
  const tileClasses = [
    styles.tileWrapper,
    showMatched && styles.matchedTile,
    showJokerMatch && styles.jokerMatchTile,
    isDragging && styles.dragging,
    isSelected && styles.selectedTile
  ].filter(Boolean).join(' ');

  // Calculate styles based on state
  const tileStyle: React.CSSProperties = {
    opacity: isDragging ? 0.7 : opacity,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    display: 'inline-flex',
    margin: '0 1px',
    transition: isDragging ? 'transform 0.1s ease, opacity 0.1s ease' : 'transform 0.2s ease, opacity 0.2s ease',
    transform: isDragging ? 'scale(1.15) rotate(2deg) translateY(-5px)' : 'scale(1)',
    zIndex: isDragging ? 100 : isSelected ? 10 : 1,
    filter: isDragging ? 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' : 'none',
    touchAction: 'none', // Important for touch devices
    userSelect: 'none', // Prevent text selection during drag
    willChange: 'transform', // Optimize for animations
  };

  // Use the preview ref for the drag preview
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Set up the preview element
  useEffect(() => {
    if (previewRef.current) {
      preview(previewRef.current);
    }
  }, [preview]);

  return (
    <div 
      ref={ref}
      className={tileClasses}
      style={tileStyle}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent text selection while dragging
        onClick(tile); // Call the click handler with the tile
      }}
    >
      <div 
        ref={previewRef}
        style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <Tile
          tile={{
            ...tile,
            isMatched: showMatched,
            isJokerMatch: showJokerMatch
          }}
          isSelected={isSelected}
          isMatched={showMatched}
          isJokerMatch={showJokerMatch}
        />
      </div>
    </div>
  );
}
