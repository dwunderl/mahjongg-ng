import { HandTemplate } from './templates/HandTemplate';

export class HandAnalyzer {
  constructor() {
    this.templates = [];
    this.initializeTemplates();
  }

  initializeTemplates() {
    // This will be populated with template implementations
    // from hand-analyzer-simple.html
    this.templates = [
      // Will add template implementations here
    ];
  }

  analyzeHand(hand) {
    const results = {
      hand: [...hand],
      matches: [],
      bestMatch: null,
      timestamp: new Date().toISOString()
    };

    // Analyze hand against all templates
    for (const template of this.templates) {
      const result = template.analyze(hand);
      if (result.matched) {
        results.matches.push(result);
      }
    }

    // Sort matches by score (highest first)
    results.matches.sort((a, b) => b.score - a.score);
    results.bestMatch = results.matches[0] || null;

    return results;
  }

  // Helper method to count tiles by type/value
  static countTiles(hand) {
    const counts = new Map();
    
    for (const tile of hand) {
      const key = `${tile.type}-${tile.value}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    
    return counts;
  }

  // Helper to check for specific combinations
  static hasSequence(hand, start, count, suit) {
    // Implementation for checking sequences
  }

  static hasPung(hand, value, suit) {
    // Implementation for checking pungs
  }

  static hasKong(hand, value, suit) {
    // Implementation for checking kongs
  }
}
