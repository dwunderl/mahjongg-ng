export class HandTemplate {
  constructor() {
    this.name = 'Base Template';
    this.description = 'Base class for all hand templates';
    this.requiredTiles = [];
    this.optionalTiles = [];
    this.patterns = [];
  }

  analyze(hand) {
    // To be implemented by subclasses
    return {
      template: this.name,
      matched: false,
      score: 0,
      matchedTiles: [],
      message: 'Not implemented'
    };
  }

  // Helper methods for subclasses
  countTiles(hand, type, value) {
    return hand.filter(tile => 
      tile.type === type && 
      (value === undefined || tile.value === value)
    ).length;
  }

  hasSequence(hand, start, length, suit) {
    for (let i = 0; i < length; i++) {
      const value = start + i;
      if (!hand.some(tile => tile.type === suit && tile.value === value)) {
        return false;
      }
    }
    return true;
  }

  hasPung(hand, value, suit) {
    return this.countTiles(hand, suit, value) >= 3;
  }

  hasKong(hand, value, suit) {
    return this.countTiles(hand, suit, value) >= 4;
  }

  hasPair(hand, value, suit) {
    return this.countTiles(hand, suit, value) >= 2;
  }

  // Helper to check for honor tiles
  hasHonor(hand, type, value) {
    return hand.some(tile => 
      tile.isHonor() && 
      (type ? tile.type === type : true) &&
      (value ? tile.value === value : true)
    );
  }

  // Helper to check for terminal tiles
  hasTerminal(hand, suit) {
    return hand.some(tile => 
      tile.isTerminal() && 
      (suit ? tile.type === suit : true)
    );
  }

  // Helper to check for simple tiles
  hasSimple(hand, suit) {
    return hand.some(tile => 
      tile.isSimple() && 
      (suit ? tile.type === suit : true)
    );
  }
}
