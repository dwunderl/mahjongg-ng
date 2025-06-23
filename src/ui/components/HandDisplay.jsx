import React from 'react';

const HandDisplay = ({ tiles, highlightedTiles = [], onTileClick }) => {
  const renderTile = (tile, index) => {
    const isHighlighted = highlightedTiles.some(t => t.id === tile.id);
    const tileClass = `tile ${isHighlighted ? 'highlighted' : ''}`;
    
    return (
      <div 
        key={tile.id || index}
        className={tileClass}
        onClick={() => onTileClick && onTileClick(tile, index)}
      >
        <span className="tile-value">{tile.value}</span>
        <span className="tile-type">{tile.type[0].toUpperCase()}</span>
      </div>
    );
  };

  return (
    <div className="hand-display">
      {tiles.map((tile, index) => renderTile(tile, index))}
    </div>
  );
};

export default HandDisplay;
