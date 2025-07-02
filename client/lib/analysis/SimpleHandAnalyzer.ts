import { HandTemplate } from '@/types/template';
import { Tile } from '@/types/tile';
import { SimpleTileMatcher, type SimpleMatchResult } from './SimpleTileMatcher';

export interface TemplateMatchSummary {
  templateId: string;
  templateName: string;
  category: string;          // Template category
  image: string;             // Colorized image string
  bestMatch: SimpleMatchResult;
  variantCount: number;      // Total number of variations for this template
  maxMatchedVariations: number; // Number of variations with the maximum match count
  maxMatchedVariationsList: SimpleMatchResult[]; // All variations with max match count
}

export class SimpleHandAnalyzer {
  private templates: HandTemplate[];
  private currentHand: Tile[] = [];

  constructor(templates: HandTemplate[]) {
    this.templates = [...templates]; // Shallow copy to avoid mutating the original
  }

  /**
   * Analyze a hand of tiles against all templates
   * @param hand The hand of tiles to analyze
   * @returns Array of match results, sorted by best match first
   */
  public analyzeHand(hand: Tile[]): TemplateMatchSummary[] {
    if (!hand || hand.length === 0 || this.templates.length === 0) {
      return [];
    }
    
    // Store the current hand for use in isBetterMatch
    this.currentHand = hand;

    const results: TemplateMatchSummary[] = [];
    
    // Analyze each template and its variations
    for (const template of this.templates) {
      // Skip templates with no variations
      if (!template.variations?.length) continue;
      
      let bestMatch: SimpleMatchResult | null = null;
      let maxMatchedCount = -1;
      let maxMatchedVariations = 0;
      const maxMatchedResults: SimpleMatchResult[] = [];
      
      // First pass: find the maximum number of matches
      template.variations.forEach((variant, index) => {
        const matcher = new SimpleTileMatcher(hand, variant, template.id);
        const result = matcher.match();
        
        // Add the original variation index to the result
        const resultWithIndex = {
          ...result,
          originalVariationIndex: index
        };
        
        if (result.matchedCount > maxMatchedCount) {
          maxMatchedCount = result.matchedCount;
          maxMatchedVariations = 1;
          maxMatchedResults.length = 0; // Clear previous results
          maxMatchedResults.push(resultWithIndex);
        } else if (result.matchedCount === maxMatchedCount) {
          maxMatchedVariations++;
          maxMatchedResults.push(resultWithIndex);
        }
      });
      
      // If we found any matches for this template
      if (maxMatchedCount > 0) {
        bestMatch = maxMatchedResults[0]; // Start with first max match
        
        // If we have multiple variations with max matches, find the best one
        if (maxMatchedResults.length > 1) {
          for (let i = 1; i < maxMatchedResults.length; i++) {
            if (this.isBetterMatch(maxMatchedResults[i], bestMatch)) {
              bestMatch = maxMatchedResults[i];
            }
          }
        }
        
        // Create a fallback image string using the template name if image is not available
        const image = template.image || template.name;
        
        results.push({
          templateId: template.id,
          templateName: template.name,
          category: template.category || 'Uncategorized',
          image: image,
          bestMatch: bestMatch,
          variantCount: template.variations.length,
          maxMatchedVariations: maxMatchedVariations,
          maxMatchedVariationsList: maxMatchedResults.map((result, idx) => ({
            ...result,
            // Ensure originalVariationIndex is preserved
            originalVariationIndex: result.originalVariationIndex
          }))
        });
      }
    }
    
    // Sort results by match count (descending) and then by template name (ascending)
    return results.sort((a, b) => {
      if (b.bestMatch.matchedCount !== a.bestMatch.matchedCount) {
        return b.bestMatch.matchedCount - a.bestMatch.matchedCount;
      }
      return a.templateName.localeCompare(b.templateName);
    });
  }

  /**
   * Compare two match results to determine which is better
   * @param a First match result
   * @param b Second match result
   * @returns True if a is better than b
   */
  private isBetterMatch(a: SimpleMatchResult, b: SimpleMatchResult): boolean {
    // First compare by match count
    if (a.matchedCount !== b.matchedCount) {
      return a.matchedCount > b.matchedCount;
    }
    
    // Then compare by number of jokers used (fewer is better)
    const aJokers = a.matchedTileIndices.filter(i => {
      const tile = this.currentHand[i];
      return tile && (tile.code === 'J' || tile.code === 'JK');
    }).length;
    
    const bJokers = b.matchedTileIndices.filter(i => {
      const tile = this.currentHand[i];
      return tile && (tile.code === 'J' || tile.code === 'JK');
    }).length;
    
    if (aJokers !== bJokers) {
      return aJokers < bJokers;
    }
    
    // Finally, compare by variant name (alphabetical)
    return (a.variantName || '').localeCompare(b.variantName || '') < 0;
  }
}
