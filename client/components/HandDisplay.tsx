import React from 'react';
import { Tile } from '@/types/tile';
import TileComponent from './Tile';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './HandDisplay.module.css';

// Extend the Tile type to include matching info
type ExtendedTile = Tile & {
  isMatched?: boolean;
  isJokerMatch?: boolean;
};

interface HandDisplayProps {
  tiles: Tile[];
  onTileClick?: (tile: ExtendedTile) => void;
  className?: string;
  selectedTileId?: string | null;
  sortBy?: 'suit' | 'number';
  onSortChange?: (type: 'suit' | 'number') => void;
  matchedTileIds?: string[]; // IDs of tiles that match the current template
  matchedTileIndices?: number[]; // Indices of tiles that were matched using jokers
}

// Sort tiles according to Mahjong rules
const sortTiles = (tiles: Tile[], sortBy: 'suit' | 'number' = 'suit'): Tile[] => {
  if (tiles.length === 0) return [];
  
  // Separate special tiles (Flowers, Winds, Jokers)
  const flowers: Tile[] = [];
  const winds: Tile[] = [];
  const jokers: Tile[] = [];
  const regularTiles: Tile[] = [];
  
  // Categorize each tile
  tiles.forEach(tile => {
    if (tile.isFlower) {
      flowers.push(tile);
    } else if (tile.suit === 'W') {
      winds.push(tile);
    } else if (tile.isJoker) {
      jokers.push(tile);
    } else {
      regularTiles.push(tile);
    }
  });
  
  // Sort regular tiles
  const suitOrder: Record<string, number> = {
    'C': 1, 'B': 2, 'D': 3,  // Numbered suits
    'RD': 4, 'GD': 5, 'WD': 6  // Dragons
  };
  
  const sortedRegular = [...regularTiles].sort((a, b) => {
    if (sortBy === 'suit') {
      // First by suit, then by value
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return (a.value || 0) - (b.value || 0);
    } else {
      // First by value, then by suit
      if ((a.value || 0) !== (b.value || 0)) {
        return (a.value || 0) - (b.value || 0);
      }
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
  });
  
  // Sort Winds alphabetically (E, N, S, W)
  const windOrder: Record<string, number> = { 'E': 1, 'S': 2, 'W': 3, 'N': 4 };
  const sortedWinds = [...winds].sort((a, b) => 
    windOrder[a.value?.toString() || ''] - windOrder[b.value?.toString() || '']
  );
  
  // Combine all tiles: regular tiles first, then flowers, then winds, then jokers
  return [
    ...sortedRegular,
    ...flowers,  // Flowers come after regular tiles
    ...sortedWinds,  // Then winds in order E, S, W, N
    ...jokers      // Jokers come last
  ];
};

// Memoize the Tile component to prevent unnecessary re-renders
const MemoizedTile = React.memo(TileComponent);

export default function HandDisplay({ 
  tiles, 
  onTileClick, 
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

  // Update refs when props change
  useEffect(() => {
    matchedTileIdsRef.current = matchedTileIds;
    matchedIndicesRef.current = matchedTileIndices;
  }, [matchedTileIds, matchedTileIndices]);

  // Sort and update display tiles
  useEffect(() => {
    const sorted = sortTiles(tiles, sortBy);
    
    // Only update if the tiles or their order has actually changed
    const tilesChanged = 
      sorted.length !== displayTiles.length ||
      sorted.some((tile, i) => !displayTiles[i] || tile.id !== displayTiles[i].id);
    
    if (tilesChanged) {
      setDisplayTiles(sorted);
      
      // Add animation class when tiles change
      if (tiles.length > 0 && prevTilesRef.current.length > 0) {
        const prevIds = new Set(prevTilesRef.current.map(t => t.id));
        const newIds = new Set(tiles.map(t => t.id));
        
        // Only animate if tiles have actually changed
        if (prevIds.size !== newIds.size || 
            ![...prevIds].every(id => newIds.has(id))) {
          setIsAnimating(true);
          const timer = setTimeout(() => setIsAnimating(false), 300);
          return () => clearTimeout(timer);
        }
      }
      
      prevTilesRef.current = tiles;
    }
  }, [tiles, sortBy, displayTiles]);

  // Check if a tile is matched (either directly or via joker)
  const isTileMatched = useCallback((tileId: string, index: number) => {
    return matchedTileIdsRef.current.includes(tileId) || 
           matchedIndicesRef.current.includes(index);
  }, []);

  // Handle tile click
  const handleTileClick = useCallback((tile: Tile, index: number) => {
    if (!onTileClick) return;
    
    const extendedTile: ExtendedTile = {
      ...tile,
      isMatched: matchedTileIdsRef.current.includes(tile.id),
      isJokerMatch: matchedIndicesRef.current.includes(index)
    };
    
    onTileClick(extendedTile);
  }, [onTileClick]);

  // Handle sort change
  const handleSortChange = useCallback((type: 'suit' | 'number') => {
    onSortChange?.(type);
  }, [onSortChange]);

  // Memoize the renderTile function to prevent unnecessary recreations
  const renderTile = useCallback((tile: Tile, index: number) => {
    const isSelected = selectedTileId === tile.id;
    const isMatched = isTileMatched(tile.id, index);
    const isJokerMatch = matchedIndicesRef.current.includes(index);
    
    const tileClasses = [
      styles.tileWrapper,
      isSelected ? styles.selected : '',
      isMatched ? styles.matched : ''
    ].filter(Boolean).join(' ');
    
    const tileComponentClasses = [
      isJokerMatch ? styles.jokerMatch : ''
    ].filter(Boolean).join(' ');
    
    return (
      <div 
        key={`${tile.id}-${index}`}
        className={tileClasses}
        onClick={() => handleTileClick(tile, index)}
      >
        <MemoizedTile 
          tile={tile} 
          className={tileComponentClasses}
        />
        {isMatched && <div className={styles.matchIndicator} />}
      </div>
    );
  }, [selectedTileId, isTileMatched, handleTileClick]);

  return (
    <div className={`${styles.handDisplay} ${className}`}>
      <div className={styles.sortControls}>
        <button 
          className={`${styles.sortButton} ${sortBy === 'suit' ? styles.active : ''}`}
          onClick={() => handleSortChange('suit')}
        >
          Sort by Suit
        </button>
        <button 
          className={`${styles.sortButton} ${sortBy === 'number' ? styles.active : ''}`}
          onClick={() => handleSortChange('number')}
        >
          Sort by Number
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`${styles.tilesContainer} ${isAnimating ? styles.animating : ''}`}
      >
        {displayTiles.length > 0 ? (
          displayTiles.map((tile, index) => renderTile(tile, index))
        ) : (
          <div className={styles.emptyState}>
            No tiles in hand
          </div>
        )}
      </div>
      
      <div className={`${styles.matchLegend} ${(matchedTileIds?.length > 0 || matchedTileIndices?.length > 0) ? styles.visible : ''}`}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.matched}`} />
          <span>Matched Tiles</span>
        </div>
        <div className={`${styles.legendItem} ${matchedTileIndices?.length > 0 ? '' : styles.hidden}`}>
          <div className={`${styles.legendColor} ${styles.jokerMatch}`} />
          <span>Joker Matches</span>
        </div>
      </div>
    </div>
  );
}
