import React from 'react';
import { Tile } from '@/types/tile';
import TileComponent from './Tile';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DraggableTile from './DraggableTile';
import styles from './HandDisplay.module.css';

// Extend the Tile type to include matching info
type ExtendedTile = Tile & {
  isMatched?: boolean;
  isJokerMatch?: boolean;
};

// Define sort type to include 'none' for unsorted
const SortType = {
  SUIT: 'suit',
  NUMBER: 'number',
  NONE: 'none'
} as const;

type SortType = typeof SortType[keyof typeof SortType];

interface HandDisplayProps {
  tiles: Tile[];
  onTileClick?: (tile: ExtendedTile) => void;
  onTilesChange?: (tiles: Tile[]) => void;
  className?: string;
  selectedTileId?: string | null;
  sortBy?: SortType;
  onSortChange?: (type: SortType) => void;
  matchedTileIds?: string[]; // IDs of tiles that match the current template
  matchedTileIndices?: number[]; // Indices of tiles that were matched using jokers
}

// Extended type for tiles with sorting properties
interface SortableTile extends Tile {
  _sortSuit: string;
  _sortValue: number;
  _tileType: 'number' | 'dragon' | 'wind' | 'flower' | 'joker';
  _windOrder?: number; // Only for wind tiles
}

// Sort tiles according to Mahjong rules
const sortTiles = (tiles: Tile[], sortBy: SortType = 'suit'): Tile[] => {
  // If sortBy is 'none', return the tiles as-is
  if (sortBy === 'none') {
    return [...tiles];
  }
  if (tiles.length === 0) return [];
  
  // Separate special tiles (Jokers, Flowers, Winds)
  const jokers: Tile[] = [];
  const flowers: Tile[] = [];
  const winds: Tile[] = [];
  const regularTiles: Tile[] = [];
  
  // Categorize each tile
  tiles.forEach(tile => {
    if (tile.isJoker) {
      jokers.push(tile);
    } else if (tile.isFlower) {
      flowers.push(tile);
    } else if (tile.isHonor && tile.code && ['E', 'S', 'W', 'N'].includes(tile.code)) {
      // Handle wind tiles (E, S, W, N)
      winds.push(tile);
    } else {
      regularTiles.push(tile);
    }
  });
  
  console.log('Categorized tiles:', {
    regularTiles: regularTiles.map(t => t.code),
    winds: winds.map(t => t.code),
    flowers: flowers.map(t => t.code),
    jokers: jokers.map(t => t.code)
  });

  // Define sort orders
  const suitOrder: Record<string, number> = {
    'c': 1,  // Crack
    'b': 2,  // Bam
    'd': 3   // Dot
  };

  // Map dragon codes to their suit and value
  // Note: Using the new dragon codes (Dc, Db, Dd)
  const dragonMap: Record<string, { suit: string, value: number }> = {
    'Dc': { suit: 'c', value: 10 }, // Red Dragon (Crack)
    'Db': { suit: 'b', value: 10 }, // Green Dragon (Bam)
    'Dd': { suit: 'd', value: 10 }, // White Dragon (Dot)
    // Keep legacy codes for backward compatibility
    'RD': { suit: 'c', value: 10 },
    'GD': { suit: 'b', value: 10 },
    'WD': { suit: 'd', value: 10 }
  };

  // Define wind order for sorting
  const windOrder: Record<string, number> = { 'E': 1, 'S': 2, 'W': 3, 'N': 4 };

  // Process all tiles with proper typing and tile types
  const processedTiles: SortableTile[] = [];
  
  // Process regular tiles and dragons
  for (const tile of regularTiles) {
    // If it's a dragon, map it to its corresponding suit and value 10
    if ((tile.isHonor && tile.code && (['RD', 'GD', 'WD', 'Dc', 'Db', 'Dd'].includes(tile.code))) ||
        (tile.code && (tile.code.startsWith('D') && ['c', 'b', 'd'].includes(tile.code[1]?.toLowerCase())))) {
      // Handle both old and new dragon codes
      const dragonCode = tile.code.length === 2 && tile.code.startsWith('D') ? 
                        `D${tile.code[1].toLowerCase()}` : tile.code;
      const { suit, value } = dragonMap[dragonCode] || { suit: tile.suit?.toLowerCase() || 'c', value: 10 };
      processedTiles.push({
        ...tile,
        _sortSuit: suit,
        _sortValue: value,
        _tileType: 'number' // Treat dragons as numbers for sorting
      } as SortableTile);
    } else {
      // Regular numbered tile
      processedTiles.push({
        ...tile,
        _sortSuit: (tile.suit || '').toLowerCase(),
        _sortValue: tile.value || 0,
        _tileType: 'number'
      } as SortableTile);
    }
  }

  // Process wind tiles
  for (const wind of winds) {
    processedTiles.push({
      ...wind,
      _sortSuit: 'w',
      _sortValue: windOrder[wind.value?.toString() || ''] || 0,
      _tileType: 'wind',
      _windOrder: windOrder[wind.value?.toString() || ''] || 0
    } as SortableTile);
  }

  // Process flowers
  for (const flower of flowers) {
    processedTiles.push({
      ...flower,
      _sortSuit: 'f',
      _sortValue: 0,
      _tileType: 'flower'
    } as SortableTile);
  }

  // Process jokers
  for (const joker of jokers) {
    processedTiles.push({
      ...joker,
      _sortSuit: 'j',
      _sortValue: 0,
      _tileType: 'joker'
    } as SortableTile);
  }

  // Define the priority order for tile types
  const tileTypeOrder: Record<string, number> = {
    'number': 1,    // Includes both numbers and dragons
    'wind': 2,
    'flower': 3,
    'joker': 4
  };

  // Sort all tiles
  const sortedTiles = [...processedTiles].sort((a, b) => {
    // First sort by tile type (number/dragon < wind < flower < joker)
    if (tileTypeOrder[a._tileType] !== tileTypeOrder[b._tileType]) {
      return tileTypeOrder[a._tileType] - tileTypeOrder[b._tileType];
    }

    // If tile types are the same, use the appropriate sort order
    if (a._tileType === 'wind' && b._tileType === 'wind') {
      // Sort winds by their wind order (E, S, W, N)
      return (a._windOrder || 0) - (b._windOrder || 0);
    } else if (a._tileType === 'number') {
      // For numbers and dragons, sort by the current sort mode
      if (sortBy === 'suit') {
        // First by suit, then by value
        if (suitOrder[a._sortSuit] !== suitOrder[b._sortSuit]) {
          return suitOrder[a._sortSuit] - suitOrder[b._sortSuit];
        }
        return a._sortValue - b._sortValue;
      } else {
        // First by value, then by suit
        if (a._sortValue !== b._sortValue) {
          return a._sortValue - b._sortValue;
        }
        return suitOrder[a._sortSuit] - suitOrder[b._sortSuit];
      }
    }
    
    // For other tile types (flowers, jokers), maintain their original order
    return 0;
  });

  // Return the sorted tiles
  return sortedTiles;
};

export default function HandDisplay({ 
  tiles, 
  onTileClick, 
  onTilesChange,
  className = '',
  selectedTileId = null,
  sortBy = 'suit',
  onSortChange,
  matchedTileIds = [],
  matchedTileIndices = []
}: HandDisplayProps) {
  const [displayTiles, setDisplayTiles] = useState<Tile[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTilesRef = useRef<Tile[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const matchedTileIdsRef = useRef<string[]>(matchedTileIds);
  const matchedIndicesRef = useRef<number[]>(matchedTileIndices);

  // Update refs when matchedTileIds or matchedTileIndices change
  useEffect(() => {
    // Only update if the values have actually changed
    const idsChanged = JSON.stringify(matchedTileIdsRef.current) !== JSON.stringify(matchedTileIds);
    const indicesChanged = JSON.stringify(matchedIndicesRef.current) !== JSON.stringify(matchedTileIndices);
    
    if (idsChanged || indicesChanged) {
      console.log('HandDisplay: matchedTileIds updated', {
        matchedTileIds,
        matchedTileIndices,
        displayTilesCount: displayTiles.length
      });
      
      // Update the refs with the latest values
      matchedTileIdsRef.current = Array.isArray(matchedTileIds) ? [...matchedTileIds] : [];
      matchedIndicesRef.current = Array.isArray(matchedTileIndices) ? [...matchedTileIndices] : [];
      
      // Only force update if we have display tiles
      if (displayTiles.length > 0) {
        setDisplayTiles(prevTiles => [...prevTiles]);
      }
    }
  }, [matchedTileIds, matchedTileIndices, displayTiles.length]);

  // Handle sort change
  const handleSortChange = useCallback((type: SortType) => {
    onSortChange?.(type);
  }, [onSortChange]);

  // Sort and update display tiles
  const [isDragging, setIsDragging] = useState(false);
  const dragInProgressRef = useRef(false);
  const prevSortByRef = useRef(sortBy);
  const tilesRef = useRef(tiles);
  
  useEffect(() => {
    // Update refs with latest values
    tilesRef.current = tiles;
    
    // Only proceed if we have tiles
    if (tiles.length === 0) {
      if (displayTiles.length > 0) {
        setDisplayTiles([]);
      }
      return;
    }
    
    // Don't sort if we're in the middle of a drag operation
    if (dragInProgressRef.current) {
      return;
    }
    
    // If sort type changed to 'none', use the current display order if available
    if (sortBy === 'none' && prevSortByRef.current !== 'none' && displayTiles.length > 0) {
      // We're switching to 'none' sort, so keep the current display order
      return;
    }
    
    // If we're in 'none' sort mode and the tiles array reference changes,
    // only update if the actual tile IDs have changed
    if (sortBy === 'none') {
      const tilesChanged = tiles.length !== displayTiles.length ||
        tiles.some((tile, i) => !displayTiles[i] || tile.id !== displayTiles[i].id);
      
      if (tilesChanged) {
        setDisplayTiles([...tiles]);
      }
      return;
    }
    
    // For 'suit' or 'number' sort, apply the sort
    const sortedTiles = sortTiles(tiles, sortBy);
    
    // Only update if the order has actually changed
    const hasChanged = displayTiles.length !== sortedTiles.length ||
      sortedTiles.some((tile, i) => !displayTiles[i] || tile.id !== displayTiles[i].id);
    
    if (hasChanged) {
      setDisplayTiles(sortedTiles);
    }
    
    // Update the previous sort type
    prevSortByRef.current = sortBy;
  }, [tiles, sortBy, displayTiles]);

  // Handle tile reordering with proper state updates
  const moveTile = useCallback((dragIndex: number, hoverIndex: number) => {
    // Only proceed if the position actually changed and we have valid indices
    if (dragIndex === hoverIndex || 
        dragIndex < 0 || 
        dragIndex >= displayTiles.length ||
        hoverIndex < 0 || 
        hoverIndex > displayTiles.length) {
      return;
    }
    
    // Set drag in progress flag
    dragInProgressRef.current = true;
    
    // Switch to unsorted mode when tiles are manually reordered
    if (onSortChange && sortBy !== 'none') {
      onSortChange('none');
    }
    
    setDisplayTiles(prevTiles => {
      // Create a new array to avoid mutating the previous state
      const newTiles = [...prevTiles];
      
      // Remove the dragged tile while preserving its matched state
      const [movedTile] = newTiles.splice(dragIndex, 1);
      
      // Insert it at the new position
      newTiles.splice(hoverIndex, 0, movedTile);
      
      // Ensure the moved tile maintains its matched state
      const updatedTiles = newTiles.map((tile, idx) => ({
        ...tile,
        isMatched: matchedTileIds?.includes(tile.id) || false,
        isJokerMatch: matchedTileIndices?.includes(idx) || false
      }));
      
      // Notify parent of the change
      if (onTilesChange) {
        onTilesChange([...updatedTiles]);
      }
      
      return updatedTiles;
    });
    
    // Reset drag in progress after a short delay
    setTimeout(() => {
      dragInProgressRef.current = false;
    }, 100);
  }, [displayTiles.length, onTilesChange, onSortChange, sortBy, matchedTileIds, matchedTileIndices]);

  // Check if a tile is matched using its ID
  const isTileMatched = useCallback((tileId: string) => {
    if (!matchedTileIds || !Array.isArray(matchedTileIds)) {
      return false;
    }
    return matchedTileIds.includes(tileId);
  }, [matchedTileIds]);
  
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
  }, [matchedTileIds, matchedTileIndices]);

  // Handle tile click
  const handleTileClick = useCallback((tile: Tile) => {
    if (onTileClick) {
      onTileClick({ ...tile, isMatched: isTileMatched(tile.id) });
    }
  }, [onTileClick, isTileMatched]);

  // Render a single tile
  const renderTile = useCallback((tile: Tile, index: number) => {
    const isSelected = selectedTileId === tile.id;
    const isMatched = isTileMatched(tile.id);
    const isJokerMatch = matchedTileIndices?.includes(index) || false;
    
    return (
      <DraggableTile
        key={`${tile.id}-${index}`}
        tile={tile}
        index={index}
        moveTile={moveTile}
        onClick={handleTileClick}
        isSelected={isSelected}
        isMatched={isMatched}
        isJokerMatch={isJokerMatch}
      />
    );
  }, [selectedTileId, isTileMatched, handleTileClick, moveTile, matchedTileIndices]);

  const renderContent = () => {
    // Ensure we have valid arrays for matchedTileIds and matchedTileIndices
    const safeMatchedTileIds = Array.isArray(matchedTileIds) ? matchedTileIds : [];
    const safeMatchedIndices = Array.isArray(matchedTileIndices) ? matchedTileIndices : [];
    const showLegend = safeMatchedTileIds.length > 0 || safeMatchedIndices.length > 0;
    
    return (
      <div 
        ref={containerRef} 
        className={`${styles.handContainer} ${isAnimating ? styles.animating : ''} ${className || ''}`}
      >
        {onSortChange && (
          <div className={styles.sortControls}>
            <button 
              className={`${styles.sortButton} ${sortBy === 'suit' ? styles.activeSort : ''}`}
              onClick={() => handleSortChange('suit')}
              title="Sort tiles by suit (Crack, Bam, Dot, then honors)"
            >
              Sort by Suit
            </button>
            <button 
              className={`${styles.sortButton} ${sortBy === 'number' ? styles.activeSort : ''}`}
              onClick={() => handleSortChange('number')}
              title="Sort tiles by number (1-9, then honors)"
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
        )}
        <div 
          className={styles.tilesContainer}
          style={{
            minHeight: '100px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center'
          }}
        >
          {displayTiles.length > 0 ? (
            displayTiles.map((tile: Tile, index: number) => renderTile(tile, index))
          ) : (
            <div className={styles.emptyState}>No tiles in hand</div>
          )}
        </div>
        
        {/* Always render the legend to prevent layout shifts, but control visibility with CSS */}
        {showLegend && (
          <div className={styles.matchLegend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.matched}`} />
              <span>Matched Tiles</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.jokerMatch}`} />
              <span>Joker Matches</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {renderContent()}
    </DndProvider>
  );
}
