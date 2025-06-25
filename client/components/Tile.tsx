import type { Tile as TileType } from '@/types/tile';
import { useEffect, useState } from 'react';
import styles from './Tile.module.css';

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
  delay?: number;
}

const getTileDisplay = (tile: TileType): { main: string | number; corner: string } => {
  // Handle Jokers
  if (tile.isJoker) {
    return { main: '🃏', corner: 'JOKER' };
  }
  
  // Handle Flowers
  if (tile.isFlower) {
    return { main: '🌸', corner: 'FLOWER' };
  }
  
  // Handle Honor Tiles
  if (tile.isHonor) {
    switch (tile.code) {
      case 'RD': return { main: 'RED', corner: 'DRAGON' };
      case 'GD': return { main: 'GREEN', corner: 'DRAGON' };
      case 'WD': return { main: 'WHITE', corner: 'DRAGON' };
      case 'N': return { main: 'N', corner: 'WIND' };
      case 'E': return { main: 'E', corner: 'WIND' };
      case 'S': return { main: 'S', corner: 'WIND' };
      case 'W': return { main: 'W', corner: 'WIND' };
    }
  }
  
  // Regular numbered tiles
  return { 
    main: tile.value || '', 
    corner: tile.suit === 'C' ? 'CHAR' : tile.suit === 'B' ? 'BAM' : 'DOT' 
  };
};

const getSuitClass = (tile: TileType): string => {
  if (tile.isJoker) return styles.joker;
  if (tile.isFlower) return styles.flower;
  
  switch (tile.suit) {
    case 'C': return styles.crack;
    case 'B': return styles.bam;
    case 'D': return styles.dot;
    case 'RD': return styles.dragonRed;
    case 'GD': return styles.dragonGreen;
    case 'WD': return styles.dragonWhite;
    case 'W': return styles.wind;
    default: return '';
  }
};

export default function Tile({ 
  tile, 
  onClick, 
  className = '', 
  isSelected = false,
  delay = 0 
}: TileProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { main, corner } = getTileDisplay(tile);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  const tileClasses = [
    styles.tile,
    getSuitClass(tile),
    isSelected ? styles.selected : '',
    className
  ].filter(Boolean).join(' ');

  // Check if this is a dragon tile
  const isDragon = tile.isHonor && ['RD', 'GD', 'WD'].includes(tile.code || '');
  
  return (
    <div 
      className={tileClasses}
      onClick={onClick}
      data-suit={tile.suit}
      data-value={tile.value}
      data-corner={corner}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
      }}
    >
      <div 
        className={styles.tileContent}
        style={isDragon ? { fontSize: '0.6em' } : {}}
      >
        {main}
      </div>
    </div>
  );
}
