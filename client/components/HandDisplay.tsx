import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tile } from '@/types/tile';
import DraggableTile from './DraggableTile';
import TileEditor from './TileEditor';
import styles from './HandDisplay.module.css';

export type SortType = 'suit' | 'number' | 'none';

interface HandDisplayProps {
  tiles: Tile[];
  onTileClick?: (tile: Tile) => void;
  onTilesChange?: (tiles: Tile[]) => void;
  onTileEdit?: (oldTile: Tile, newTile: Tile) => void;
  className?: string;
  selectedTileId?: string | null;
  sortBy?: SortType;
  onSortChange?: (sortType: SortType) => void;
  matchedTileIds?: string[];
  matchedTileIndices?: number[];
}

interface DraggableTileProps {
  tile: Tile;
  index: number;
  isSelected: boolean;
  isMatched: boolean;
  onClick: (tile: Tile, e: React.MouseEvent) => void;
  onEdit: (tile: Tile, e: React.MouseEvent) => void;
  moveTile: (dragIndex: number, hoverIndex: number) => void;
}

interface EditingTile {
  tile: Tile;
  index: number;
  position: { x: number; y: number };
}

// Define wind order for consistent sorting
const windOrder: Record<string, number> = {
  'e': 0, // East
  's': 1, // South
  'w': 2, // West
  'n': 3  // North
};

// Define suit order for consistent sorting
const suitOrder: Record<string, number> = {
  'c': 0, // Crack
  'b': 1,  // Bam
  'd': 2,  // Dot
  'e': 3,  // East
  's': 4,  // South
  'w': 5,  // West
  'n': 6,  // North
  'rd': 7, // Red Dragon
  'gd': 8, // Green Dragon
  'wd': 9, // White Dragon
  'f': 10, // Flower
  'j': 11  // Joker
};

// Type for tiles with additional sort properties
interface SortableTile extends Tile {
  _sortSuit: string;
  _sortValue: number;
  _tileType: string;
}

const sortTiles = (tiles: Tile[], sortBy: SortType = 'suit'): Tile[] => {
  if (sortBy === 'none' || tiles.length === 0) {
    return [...tiles];
  }

  // Create a processed copy of tiles with sort properties
  const processedTiles = tiles.map(tile => {
    const tileCode = tile.code.toLowerCase();
    const sortableTile: SortableTile = {
      ...tile,
      _sortSuit: '',
      _sortValue: 0,
      _tileType: 'joker' // Default fallback
    };

    // Parse tile code to extract type and properties
    if (tileCode === 'j') {
      // Joker
      sortableTile._tileType = 'joker';
      sortableTile._sortSuit = 'j';
      sortableTile._sortValue = 14; // Sort after all other tiles
    } else if (tileCode === 'f') {
      // Flower
      sortableTile._tileType = 'flower';
      sortableTile._sortSuit = 'f';
      sortableTile._sortValue = 13; // Sort before jokers
    } else if (['e', 's', 'w', 'n'].includes(tileCode)) {
      // Winds
      sortableTile._tileType = 'wind';
      sortableTile._sortSuit = tileCode;
      sortableTile._sortValue = ['e', 's', 'w', 'n'].indexOf(tileCode) + 9; // 9-12
    } else if (tileCode.startsWith('d') && ['d', 'c', 'b'].includes(tileCode[1])) {
      // Dragons (Dd, Dc, Db)
      sortableTile._tileType = 'dragon';
      const suit = tileCode[1];
      sortableTile._sortSuit = suit;
      // Sort as 10 of their respective suit
      sortableTile._sortValue = 10;
    } else if (/^[1-9][bcd]$/.test(tileCode)) {
      // Numbered tiles (1b, 2c, 3d, etc.)
      sortableTile._tileType = 'numbered';
      sortableTile._sortSuit = tileCode[1];
      sortableTile._sortValue = parseInt(tileCode[0], 10);
    }

    return sortableTile;
  });

  // Sort the processed tiles
  return processedTiles.sort((a, b) => {
    if (sortBy === 'number') {
      // Sort by number first, then by suit
      if (a._sortValue !== b._sortValue) {
        return a._sortValue - b._sortValue;
      }
      return (suitOrder[a._sortSuit] || 99) - (suitOrder[b._sortSuit] || 99);
    } else {
      // Sort by suit first, then by number
      const suitDiff = (suitOrder[a._sortSuit] || 99) - (suitOrder[b._sortSuit] || 99);
      if (suitDiff !== 0) return suitDiff;
      return a._sortValue - b._sortValue;
    }
  }).map(({ _sortSuit, _sortValue, _tileType, ...tile }) => tile);
};

const HandDisplay: React.FC<HandDisplayProps> = ({
  tiles: initialTiles,
  onTileClick = () => {},
  onTilesChange = () => {},
  onTileEdit = () => {},
  className = '',
  selectedTileId = null,
  sortBy: initialSortBy = 'suit',
  onSortChange = () => {},
  matchedTileIds: initialMatchedTileIds = [],
  matchedTileIndices: initialMatchedTileIndices = []
}) => {
  // Refs
  const dragInProgressRef = useRef(false);
  const prevSortByRef = useRef<SortType>(initialSortBy);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // State
  const [displayTiles, setDisplayTiles] = useState<Tile[]>(initialTiles);
  const [isAnimating, setIsAnimating] = useState(false);
  const [editingTile, setEditingTile] = useState<EditingTile | null>(null);
  const [sortBy, setSortBy] = useState<SortType>(initialSortBy);
  const [matchedTileIds, setMatchedTileIds] = useState<string[]>(initialMatchedTileIds);
  const [matchedTileIndices, setMatchedTileIndices] = useState<number[]>(initialMatchedTileIndices);
  
  const prevTilesRef = useRef<Tile[]>(initialTiles);
  const matchedTileIdsRef = useRef<string[]>(initialMatchedTileIds);
  const matchedIndicesRef = useRef<number[]>(initialMatchedTileIndices);

  // Update display tiles when tiles or sortBy changes
  useEffect(() => {
    console.log('Initial tiles or sortBy changed. Drag in progress:', dragInProgressRef.current);
    
    // Only update display tiles if we're not in the middle of a drag operation
    if (!dragInProgressRef.current) {
      console.log('Updating display tiles with sortBy:', sortBy);
      const sortedTiles = sortTiles(initialTiles, sortBy);
      console.log('Sorted tiles:', sortedTiles.map((t, i) => `${t.id}@${i}`));
      setDisplayTiles(sortedTiles);
    } else {
      console.log('Skipping display tiles update - drag in progress');
    }
    
    // Reset the drag in progress flag after a short delay
    // This prevents the display from jumping back after a drag ends
    const timer = setTimeout(() => {
      if (dragInProgressRef.current) {
        console.log('Resetting drag in progress flag');
        dragInProgressRef.current = false;
      }
    }, 150);
    
    prevSortByRef.current = sortBy;
    
    return () => {
      clearTimeout(timer);
    };
  }, [initialTiles, sortBy]);
  
  // Refs are already declared at the top of the component

  // Handle tile click
  const handleTileClick = useCallback((tile: Tile, e: React.MouseEvent) => {
    // Handle the event safely
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    onTileClick(tile);
  }, [onTileClick]);

  // Handle tile edit
  const handleTileEdit = useCallback((tile: Tile, e: React.MouseEvent | { currentTarget?: HTMLElement; target?: HTMLElement }) => {
    // Handle the event safely if it's a MouseEvent
    if (e && 'preventDefault' in e) {
      if (typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
    }
    
    try {
      // Get the target element safely
      let target: HTMLElement | null = null;
      
      if (e) {
        if ('currentTarget' in e) {
          target = e.currentTarget as HTMLElement;
        } else if ('target' in e) {
          target = e.target as HTMLElement;
        }
      }
      
      const rect = target?.getBoundingClientRect() || { left: 0, top: 0 };
      
      // Set sort type to 'none' when editing to prevent tile jump
      if (sortBy !== 'none') {
        onSortChange('none');
      }
      
      setEditingTile({
        tile,
        index: displayTiles.findIndex(t => t.id === tile.id),
        position: { x: rect.left, y: rect.top }
      });
    } catch (error) {
      console.error('Error in handleTileEdit:', error);
      // Fallback position if we can't get the target's position
      setEditingTile({
        tile,
        index: displayTiles.findIndex(t => t.id === tile.id),
        position: { x: 0, y: 0 }
      });
    }
  }, [displayTiles]);

  // Handle saving edited tile
  const handleSaveEdit = useCallback((updatedTile: Tile) => {
    if (!editingTile) return;
    
    // Call the parent's onTileEdit handler with both old and new tile
    onTileEdit(editingTile.tile, updatedTile);
    
    // Close the editor
    setEditingTile(null);
    
    // Update the tile in the display while preserving the current order
    setDisplayTiles(prevTiles => {
      return prevTiles.map(tile => 
        tile.id === editingTile.tile.id 
          ? { ...updatedTile, id: editingTile.tile.id }
          : tile
      );
    });
  }, [editingTile, onTileEdit]);

  // Handle drag and drop with improved state management
  const moveTile = useCallback((dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    
    console.log(`Moving tile from index ${dragIndex} to ${hoverIndex}`);
    
    // Mark that a drag is in progress
    dragInProgressRef.current = true;
    
    setDisplayTiles(prevTiles => {
      // Create a new array to avoid mutating the previous state directly
      const newTiles = [...prevTiles];
      
      // Get the tile being moved
      const movedTile = newTiles[dragIndex];
      
      // Create a new tile object to ensure React sees it as a change
      const updatedTile = { ...movedTile };
      
      // Remove the dragged tile
      newTiles.splice(dragIndex, 1);
      
      // Insert the tile at the new position
      newTiles.splice(hoverIndex, 0, updatedTile);
      
      console.log('New tile order:', newTiles.map((t, i) => `${t.id}@${i}`));
      
      // Update the parent component with the new order
      // Use a timeout to ensure this happens after the state update
      setTimeout(() => {
        if (onTilesChange) {
          onTilesChange([...newTiles]);
        }
      }, 0);
      
      return newTiles;
    });
    
    // Update sort type to 'none' to preserve manual order
    if (sortBy !== 'none') {
      console.log('Setting sort type to none');
      setSortBy('none');
      onSortChange('none');
    }
    
    // Force a re-render to ensure the UI updates
    setTimeout(() => {
      dragInProgressRef.current = false;
    }, 0);
    
  }, [onTilesChange, onSortChange, sortBy]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy: SortType) => {
    // Don't sort if we're in the middle of editing
    if (editingTile) return;
    
    setSortBy(newSortBy);
    onSortChange(newSortBy);
    
    if (newSortBy !== 'none') {
      const sorted = sortTiles(displayTiles, newSortBy);
      setDisplayTiles(sorted);
    }
  }, [displayTiles, onSortChange]);

  // Update tile matched states when matchedTileIds or matchedTileIndices change
  useEffect(() => {
    setDisplayTiles(prevTiles => {
      // Only update if we have tiles to process
      if (prevTiles.length === 0) return prevTiles;
      
      // Check if any tile's matched state needs updating
      const needsUpdate = prevTiles.some(tile => {
        const shouldBeMatched = matchedTileIds?.includes(tile.id) || false;
        const shouldBeJokerMatch = matchedTileIndices?.includes(prevTiles.indexOf(tile)) || false;
        return tile.isMatched !== shouldBeMatched || tile.isJokerMatch !== shouldBeJokerMatch;
      });
      
      if (!needsUpdate) return prevTiles;
      
      // Update the tiles with the correct matched states
      return prevTiles.map(tile => ({
        ...tile,
        isMatched: matchedTileIds?.includes(tile.id) || false,
        isJokerMatch: matchedTileIndices?.includes(prevTiles.indexOf(tile)) || false
      }));
    });
  }, [matchedTileIds, matchedTileIndices, displayTiles.length]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    try {
      e.preventDefault?.();
      e.stopPropagation?.();
    } catch (error) {
      console.error('Error in handleOverlayClick:', error);
    }
    setEditingTile(null);
  }, []);

  // Handle editor click
  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    try {
      e.preventDefault?.();
      e.stopPropagation?.();
    } catch (error) {
      console.error('Error in handleEditorClick:', error);
    }
  }, []);

  // Render the tile editor popup
  const renderTileEditor = useCallback(() => {
    if (!editingTile) return null;
    
    return (
      <div 
        className={styles.tileEditorOverlay}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
        onClick={handleOverlayClick}
      >
        <div 
          ref={editorRef}
          className={styles.tileEditor}
          style={{
            position: 'absolute',
            left: `${editingTile.position.x}px`,
            top: `${editingTile.position.y}px`,
            zIndex: 1001,
            pointerEvents: 'auto',
          }}
          onClick={handleEditorClick}
        >
          <TileEditor
            tile={editingTile.tile}
            onSave={handleSaveEdit}
            onClose={() => setEditingTile(null)}
            position={editingTile.position}
          />
        </div>
      </div>
    );
  }, [editingTile, handleSaveEdit]);

  // Render a single tile
  const renderTile = useCallback((tile: Tile, index: number) => {
    const isSelected = selectedTileId === tile.id;
    const isMatched = matchedTileIds.includes(tile.id) || matchedTileIndices.includes(index);
    
    return (
      <DraggableTile
        key={tile.id}
        tile={tile}
        index={index}
        isSelected={isSelected}
        isMatched={isMatched}
        onClick={handleTileClick}
        onEdit={handleTileEdit}
        moveTile={moveTile}
      />
    );
  }, [selectedTileId, matchedTileIds, matchedTileIndices, handleTileClick, handleTileEdit, moveTile]);

  // Render sort controls
  const renderSortControls = useCallback(() => (
    <div className={styles.sortControls}>
      <button 
        className={`${styles.sortButton} ${sortBy === 'suit' ? styles.activeSort : ''}`}
        onClick={() => handleSortChange('suit')}
        title="Sort by suit (Crack, Bam, Dot, then honors)"
      >
        Sort by Suit
      </button>
      <button 
        className={`${styles.sortButton} ${sortBy === 'number' ? styles.activeSort : ''}`}
        onClick={() => handleSortChange('number')}
        title="Sort by number (1-9, then honors)"
      >
        Sort by Number
      </button>
      <button 
        className={`${styles.sortButton} ${sortBy === 'none' ? styles.activeSort : ''}`}
        onClick={() => handleSortChange('none')}
        title="Keep current tile order (drag and drop to rearrange)"
      >
        Unsorted
      </button>
    </div>
  ), [handleSortChange, sortBy, styles]);

  // Main render
  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        className={`${styles.handDisplay} ${className} ${isAnimating ? styles.animating : ''}`}
        ref={containerRef}
      >
        {renderSortControls()}
        <div 
          className={styles.tilesContainer}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            justifyContent: 'center',
            padding: '8px',
            minHeight: '80px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          {displayTiles.length > 0 ? (
            displayTiles.map((tile, index) => renderTile(tile, index))
          ) : (
            <div className={styles.emptyState}>No tiles in hand</div>
          )}
        </div>
        {editingTile && renderTileEditor()}
      </div>
    </DndProvider>
  );
}

export default HandDisplay;
