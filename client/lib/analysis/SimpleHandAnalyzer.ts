import { HandTemplate } from '@/types/template';
import { Tile } from '@/types/tile';
import { SimpleTileMatcher, type SimpleMatchResult } from './SimpleTileMatcher';

export interface TemplateMatchSummary {
  templateId: string;
  templateName: string;
  bestMatch: SimpleMatchResult;
  variantCount: number;      // Total number of variations for this template
  maxMatchedVariations: number; // Number of variations with the maximum match count
}

export class SimpleHandAnalyzer {
  private templates: HandTemplate[];

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

    const results: TemplateMatchSummary[] = [];
    
    // Analyze each template and its variations
    for (const template of this.templates) {
      // Skip templates with no variations
      if (!template.variations?.length) continue;
      
      let bestMatch: SimpleMatchResult | null = null;
      let maxMatchedCount = -1;
      let maxMatchedVariations = 0;
      let variantCount = 0;
      
      // First pass: find the maximum number of matched tiles
      for (const variation of template.variations) {
        variantCount++;
        const matcher = new SimpleTileMatcher(hand, variation, template.id);
        const result = matcher.match();
        
        if (result.matchedCount > maxMatchedCount) {
          maxMatchedCount = result.matchedCount;
          maxMatchedVariations = 1;
        } else if (result.matchedCount === maxMatchedCount) {
          maxMatchedVariations++;
        }
      }
      
      // Second pass: find the best match (with tiebreaker logic if needed)
      for (const variation of template.variations) {
        const matcher = new SimpleTileMatcher(hand, variation, template.id);
        const result = matcher.match();
        
        if (result.matchedCount === maxMatchedCount) {
          // If this is the first match or better than current best match
          if (!bestMatch || 
              (result.matchedCount > bestMatch.matchedCount) ||
              (result.matchedCount === bestMatch.matchedCount && 
               variation.name && 
               (!bestMatch.variantName || variation.name < bestMatch.variantName))) {
            bestMatch = {
              ...result,
              variantName: variation.name || 'Unnamed',
              templateId: template.id,
              templateName: template.name
            };
          }
        }
      }
      
      // Add the best match for this template to results
      if (bestMatch) {
        results.push({
          templateId: bestMatch.templateId,
          templateName: bestMatch.templateName,
          bestMatch: bestMatch,
          variantCount: variantCount,
          maxMatchedVariations: maxMatchedVariations
        });
      }
    }
    
    // Sort results by match count (descending) and then by template name
    return results.sort((a, b) => {
      // First sort by match count (descending)
      if (b.bestMatch.matchedCount !== a.bestMatch.matchedCount) {
        return b.bestMatch.matchedCount - a.bestMatch.matchedCount;
      }
      // Then sort by template name (ascending)
      return a.templateName.localeCompare(b.templateName);
    });
  }
}
