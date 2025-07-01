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
   * Identify groups (pungs, kongs, quints) in the template variation
   * Returns a map of group IDs to tile indices in the group
   */
  private identifyGroups(): Map<number, number[]> {
    const groups = new Map<number, number[]>();
    const groupStarts = new Map<string, number>();
    
    // First pass: identify potential group starts
    for (let i = 0; i < this.variation.requiredTiles.length; i++) {
      const tile = this.variation.requiredTiles[i];
      
      if (tile.groupSize >= 3) { // Only consider pungs (3), kongs (4), or quints (5+)
        const groupKey = `${tile.code}-${tile.groupSize}`;
        if (!groupStarts.has(groupKey)) {
          groupStarts.set(groupKey, i);
        }
      }
    }
    
    // Second pass: create groups
    let groupId = 0;
    for (const [groupKey, startIdx] of groupStarts.entries()) {
      const groupSize = parseInt(groupKey.split('-')[1]);
      const groupIndices = [];
      
      // Add tiles to the group
      for (let i = 0; i < groupSize; i++) {
        const tileIdx = startIdx + i;
        if (tileIdx < this.variation.requiredTiles.length) {
          groupIndices.push(tileIdx);
        }
      }
      
      groups.set(groupId++, groupIndices);
    }
    
    return groups;
  }

  /**
   * Match the hand against the template variation, including joker matching
   */
  public match(): SimpleMatchResult {
    const matchedTiles = new Set<number>(); // Indices of matched hand tiles
    const matchedVariationTiles = new Set<number>(); // Indices of matched variation tiles
    const matchedIndices: number[] = [];
    
    // First pass: exact matching (skip jokers)
    for (let i = 0; i < this.hand.length; i++) {
      let handTile = this.hand[i];
      
      // Skip jokers in this phase
      if (handTile === 'J' || handTile === 'JK') continue;
      
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
    
    // Second pass: joker matching
    const groups = this.identifyGroups();
    
    // Collect all joker indices from hand that aren't already matched
    const jokerIndices = [];
    for (let i = 0; i < this.hand.length; i++) {
      const tileCode = this.hand[i];
      if ((tileCode === 'J' || tileCode === 'JK') && !matchedTiles.has(i)) {
        jokerIndices.push(i);
      }
    }
    
    // Process jokers one by one
    for (const jokerIndex of jokerIndices) {
      let jokerMatched = false;
      
      // Try to match joker to an incomplete group first
      for (const [_, groupIndices] of groups.entries()) {
        const matchedInGroup = groupIndices.filter(i => matchedVariationTiles.has(i)).length;
        const groupSize = groupIndices.length;
        
        // Skip complete groups
        if (matchedInGroup >= groupSize) {
          continue;
        }
        
        // Find first unmatched tile in this group
        const unmatchedInGroup = groupIndices.find(i => !matchedVariationTiles.has(i));
        if (unmatchedInGroup !== undefined) {
          matchedTiles.add(jokerIndex);
          matchedIndices.push(jokerIndex);
          matchedVariationTiles.add(unmatchedInGroup);
          jokerMatched = true;
          break;
        }
      }
      
      // If joker wasn't used in a group, try to match it to any unmatched tile
      if (!jokerMatched) {
        for (let j = 0; j < this.variation.requiredTiles.length; j++) {
          if (!matchedVariationTiles.has(j)) {
            matchedTiles.add(jokerIndex);
            matchedIndices.push(jokerIndex);
            matchedVariationTiles.add(j);
            break;
          }
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
