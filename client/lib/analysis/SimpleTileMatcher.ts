import type { Tile as TileType } from '@/types/tile';
import type { TemplateVariant } from '@/types/template';

export interface SimpleMatchResult {
  templateId: string;
  templateName: string;
  variantName: string;
  variantId: string;
  matchedCount: number;
  totalTiles: number;
  matchPercentage: number;
  matchedTileIndices: number[]; // Indices of matched tiles in the hand
}

export class SimpleTileMatcher {
  private hand: string[];
  private variation: TemplateVariant;
  private templateId: string;
  
  constructor(
    hand: TileType[], 
    variation: TemplateVariant, 
    templateId: string
  ) {
    // Convert hand to simple string codes for easier matching
    this.hand = hand.map(tile => tile.code);
    this.variation = JSON.parse(JSON.stringify(variation)); // Deep clone
    this.templateId = templateId;
  }

  /**
   * Convert between different dragon tile code formats
   * - Template format: 'Db' (green), 'Dc' (red), 'Dd' (white)
   * - Deck format: 'GD', 'RD', 'WD'
   */
  private normalizeDragonCode(code: string): string {
    // If it's already in deck format, return as is
    if (['RD', 'GD', 'WD'].includes(code)) {
      return code;
    }
    
    // Convert from template format to deck format
    if (code.startsWith('D') && code.length === 2) {
      const type = code[1].toLowerCase();
      return {
        'b': 'GD', // Db -> GD (Green Dragon)
        'c': 'RD', // Dc -> RD (Red Dragon)
        'd': 'WD'  // Dd -> WD (White Dragon)
      }[type] || code;
    }
    
    return code;
  }

  /**
   * Match the hand against the template variation using exact matching only
   */
  public match(): SimpleMatchResult {
    const matchedTiles = new Set<number>(); // Indices of matched hand tiles
    const matchedVariationTiles = new Set<number>(); // Indices of matched variation tiles
    const matchedIndices: number[] = [];
    
    // First pass: exact matching
    for (let i = 0; i < this.hand.length; i++) {
      let handTile = this.hand[i];
      
      // Skip jokers in this phase
      if (handTile === 'J') continue;
      
      // Normalize dragon tile codes in hand
      handTile = this.normalizeDragonCode(handTile);
      
      // Try to find a matching tile in the variation
      for (let j = 0; j < this.variation.requiredTiles.length; j++) {
        if (matchedVariationTiles.has(j)) continue; // Skip already matched variation tiles
        
        let variantTile = this.variation.requiredTiles[j].code;
        
        // Normalize dragon tile codes in template
        variantTile = this.normalizeDragonCode(variantTile);
        
        if (handTile === variantTile) {
          matchedTiles.add(i);
          matchedIndices.push(i);
          matchedVariationTiles.add(j);
          break; // Move to next hand tile
        }
      }
    }
    
    const totalTiles = this.variation.requiredTiles.length;
    const matchedCount = matchedVariationTiles.size;
    
    return {
      templateId: this.templateId,
      variantName: this.variation.name || 'Unnamed',
      variantId: this.variation.id,
      templateName: this.variation.name || 'Unnamed',
      matchedCount,
      totalTiles,
      matchPercentage: totalTiles > 0 ? Math.round((matchedCount / totalTiles) * 100) : 0,
      matchedTileIndices: matchedIndices
    };
  }
}
