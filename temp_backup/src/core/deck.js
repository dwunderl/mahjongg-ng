import { Tile, TILE_TYPES, WIND_VALUES, DRAGON_VALUES } from './tile';

export class Deck {
  constructor() {
    this.tiles = [];
    this.discards = [];
    this.initializeDeck();
    this.shuffle();
  }

  initializeDeck() {
    // Add number tiles (1-9 for each of the 3 suits)
    const suits = [
      TILE_TYPES.CHARACTERS,
      TILE_TYPES.BAMBOO,
      TILE_TYPES.DOTS
    ];

    // Add number tiles (4 of each)
    suits.forEach(suit => {
      for (let value = 1; value <= 9; value++) {
        for (let i = 0; i < 4; i++) {
          this.tiles.push(new Tile(suit, value));
        }
      }
    });

    // Add wind tiles (4 of each)
    WIND_VALUES.forEach(wind => {
      for (let i = 0; i < 4; i++) {
        this.tiles.push(new Tile(TILE_TYPES.WINDS, wind));
      }
    });

    // Add dragon tiles (4 of each)
    DRAGON_VALUES.forEach(dragon => {
      for (let i = 0; i < 4; i++) {
        this.tiles.push(new Tile(TILE_TYPES.DRAGONS, dragon));
      }
    });

    // Add flower and season tiles (1 of each)
    for (let i = 1; i <= 4; i++) {
      this.tiles.push(new Tile(TILE_TYPES.FLOWERS, i));
      this.tiles.push(new Tile(TILE_TYPES.SEASONS, i));
    }
  }

  shuffle() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  deal(count = 1) {
    if (this.tiles.length < count) {
      // Reshuffle discards if we run out of tiles
      this.tiles = [...this.tiles, ...this.discards];
      this.discards = [];
      this.shuffle();
    }
    
    const dealt = this.tiles.splice(0, count);
    return dealt;
  }

  discard(tile) {
    this.discards.push(tile);
  }

  remainingTiles() {
    return this.tiles.length;
  }

  reset() {
    this.tiles = [];
    this.discards = [];
    this.initializeDeck();
    this.shuffle();
  }
}
