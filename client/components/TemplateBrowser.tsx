import React from 'react';
import { HandTemplate } from '@/types/template';
import styles from '@/components/TemplateBrowser.module.css';
import Tile from './Tile';
import type { Tile as TileType, Suit } from '@/types/tile';

interface TemplateBrowserProps {
  templates: HandTemplate[];
  onSelectTemplate?: (template: HandTemplate) => void;
  selectedTemplateId?: string;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  templates,
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const [expandedTemplate, setExpandedTemplate] = React.useState<string | null>(null);

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className={styles.templateBrowser}>
      <h3>Hand Templates</h3>
      <div className={styles.templateList}>
        {templates.map((template) => (
          <div key={template.id} className={styles.templateItem}>
            <div 
              className={`${styles.templateHeader} ${selectedTemplateId === template.id ? styles.selected : ''}`}
              onClick={() => onSelectTemplate?.(template)}
            >
              <span>{template.name}</span>
              <button 
                className={styles.expandButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(template.id);
                }}
              >
                {expandedTemplate === template.id ? '−' : '+'}
              </button>
            </div>
            
            {expandedTemplate === template.id && (
              <div className={styles.templateDetails}>
                <p className={styles.description}>{template.description}</p>
                <div className={styles.variants}>
                  <h4>Variations ({template.variations.length}):</h4>
                  <div className={styles.variantsList}>
                    {template.variations.map((variant) => (
                      <div key={variant.id} className={styles.variantItem}>
                        <div className={styles.variantHeader}>
                          <h5>{variant.name}</h5>
                          <span className={styles.tileCount}>
                            {variant.requiredTiles.length} tiles
                          </span>
                        </div>
                        <div className={styles.tileList}>
                          {variant.requiredTiles.map((tileCode, index) => {
                            // Map tile codes to proper suit and value
                            const isJoker = tileCode === 'JOKER';
                            const isFlower = tileCode.startsWith('F');
                            
                            // Handle dragon tile format 'Dx,1' where x is b (bamboo/white), c (crack/red), d (dot/green)
                            const isDragonFormat = tileCode.startsWith('D') && tileCode.length >= 2;
                            const isDragon = isDragonFormat || ['RD', 'GD', 'WD'].includes(tileCode);
                            const isWind = ['N', 'E', 'S', 'W'].includes(tileCode);
                            const isHonor = isDragon || isWind;
                            
                            // Extract suit and value
                            let suit: Suit = 'D';
                            let value = 0;
                            let dragonCode = tileCode; // Store the original code for dragon tiles
                            
                            if (isDragonFormat) {
                              // Handle dragon tiles in format 'Dx,1' where x is b/c/d
                              const dragonType = tileCode[1].toLowerCase();
                              // Map dragon types to their corresponding codes
                              // 'b' (bamboo) -> 'GD' (Green Dragon)
                              // 'c' (crack) -> 'RD' (Red Dragon)
                              // 'd' (dot) -> 'WD' (White Dragon)
                              dragonCode = {
                                'b': 'GD', // Green Dragon (bamboo)
                                'c': 'RD', // Red Dragon (crack)
                                'd': 'WD'  // White Dragon (dot)
                              }[dragonType] || 'RD';
                              suit = dragonCode as Suit;
                              value = 0;
                            } else if (!isJoker && !isFlower && !isHonor) {
                              // Regular tile (e.g., '1b', '5c')
                              const suitCode = tileCode.slice(-1).toLowerCase();
                              suit = ({
                                'b': 'B', // bam
                                'c': 'C', // crack
                                'd': 'D', // dot
                              }[suitCode] || 'D') as Suit;
                              value = parseInt(tileCode.slice(0, -1), 10) || 0;
                            } else if (isDragon) {
                              // Explicit dragon tiles (RD, GD, WD)
                              suit = tileCode as Suit;
                            } else if (isWind) {
                              // Wind tiles
                              suit = tileCode as Suit;
                            }
                            
                            // Debug log for dragon tiles
                            if (isDragon) {
                              console.log('Processing dragon tile:', {
                                tileCode,
                                isDragon,
                                isHonor,
                                suit,
                                value,
                                originalCode: tileCode
                              });
                            }

                            // Create tile object with proper mapping
                            const tile: TileType = {
                              id: `${variant.id}-tile-${index}`,
                              code: tileCode, // Always include the code as a string
                              suit: isHonor ? (tileCode as Suit) : suit, // For honor tiles, use the code as suit
                              value: value || 0, // Ensure value is always a number
                              // Don't set display property here - let getTileDisplay handle it
                              display: tileCode, // Just pass through the tile code
                              isHonor: isHonor,
                              isJoker: isJoker,
                              isFlower: isFlower,
                            };
                            
                            // For dragon tiles, ensure the code is set correctly
                            if (isDragon) {
                              tile.code = dragonCode; // Use the mapped dragon code (RD, GD, WD)
                              tile.suit = dragonCode as Suit; // Ensure suit matches the dragon code
                              tile.isHonor = true; // Ensure isHonor is set for proper rendering
                              console.log('Created dragon tile:', tile);
                            }
                            

                            return (
                              <div key={`${variant.id}-${index}`} className={styles.tile}>
                                <Tile 
                                  tile={tile}
                                  className={styles.tile}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateBrowser;
