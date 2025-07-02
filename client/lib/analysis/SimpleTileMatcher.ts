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
  originalVariationIndex: number; // Original index in the full variations array
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
        // Skip if this tile is already part of a matched group
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
    // Track which hand tiles and variation tiles are matched
    const matchedHandIndices = new Set<number>();
    const matchedVariationIndices = new Set<number>();
    const matchedIndices: number[] = [];
    
    // First, identify all jokers in the hand
    const jokerIndices: number[] = [];
    for (let i = 0; i < this.hand.length; i++) {
      const tileCode = this.hand[i];
      if (tileCode === 'J' || tileCode === 'JK') {
        jokerIndices.push(i);
      }
    }
    
    // First pass: exact matching (skip jokers)
    for (let i = 0; i < this.hand.length; i++) {
      // Skip jokers in this phase
      if (jokerIndices.includes(i)) continue;
      
      let handTile = this.hand[i];
      handTile = this.normalizeDragonCode(handTile);
      
      // Try to find a matching tile in the variation
      for (let j = 0; j < this.variation.requiredTiles.length; j++) {
        if (matchedVariationIndices.has(j)) continue;
        
        let variantTile = this.variation.requiredTiles[j].code;
        variantTile = this.normalizeDragonCode(variantTile);
        
        if (handTile === variantTile) {
          matchedHandIndices.add(i);
          matchedIndices.push(i);
          matchedVariationIndices.add(j);
          break;
        }
      }
    }
    
    // Identify groups in the template (pungs, kongs, quints)
    const groups = this.identifyGroups();
    
    // Second pass: use jokers to complete groups first (most valuable use of jokers)
    for (const jokerIndex of jokerIndices) {
      if (matchedHandIndices.has(jokerIndex)) continue; // Skip already used jokers
      
      let jokerUsed = false;
      
      // Try to use joker in a group first
      for (const [_, groupIndices] of groups.entries()) {
        const groupTiles = groupIndices.map(i => this.variation.requiredTiles[i]);
        const groupCode = groupTiles[0]?.code; // All tiles should have the same code
        
        // Skip if group is already complete
        const matchedInGroup = groupIndices.filter(i => matchedVariationIndices.has(i)).length;
        if (matchedInGroup >= groupIndices.length) continue;
        
        // Find first unmatched tile in this group
        const unmatchedInGroup = groupIndices.find(i => !matchedVariationIndices.has(i));
        if (unmatchedInGroup !== undefined) {
          matchedHandIndices.add(jokerIndex);
          matchedIndices.push(jokerIndex);
          matchedVariationIndices.add(unmatchedInGroup);
          jokerUsed = true;
          break;
        }
      }
      
      // If joker wasn't used in a group, try to use it for any unmatched tile
      if (!jokerUsed) {
        for (let j = 0; j < this.variation.requiredTiles.length; j++) {
          if (!matchedVariationIndices.has(j)) {
            matchedHandIndices.add(jokerIndex);
            matchedIndices.push(jokerIndex);
            matchedVariationIndices.add(j);
            break;
          }
        }
      }
    }
    
    const totalTiles = this.variation.requiredTiles.length;
    const matchedCount = matchedVariationIndices.size;
    
    return {
      templateId: this.templateId,
      variantName: this.variation.name || 'Unnamed',
      variantId: this.variation.id,
      templateName: this.variation.name || 'Unnamed',
      matchedCount,
      totalTiles,
      matchPercentage: totalTiles > 0 ? Math.round((matchedCount / totalTiles) * 100) : 0,
      matchedTileIndices: matchedIndices,
      originalVariationIndex: -1 // This will be set by the analyzer
    };
  }
}
