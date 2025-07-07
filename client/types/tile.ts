export type Suit = 'c' | 'b' | 'd';  // c=crack, b=bam, d=dot

export interface Tile {
  id: string;        // Unique identifier for React keys
  code: string;      // Tile code (e.g., '1c', 'E', 'F', 'J')
  suit?: Suit;       // Only present for numbered tiles (crack, bam, dot)
  value: number;     // Numeric value (1-9 for numbered suits, 0 for honors)
  display: string;   // Display text
  isHonor: boolean;  // Whether it's an honor tile (winds/dragons)
  isFlower: boolean; // Whether it's a flower
  isJoker: boolean;  // Whether it's a joker
  isMatched?: boolean; // Whether the tile is part of a matched set
  isJokerMatch?: boolean; // Whether the tile is matched using a joker
}

export interface TileGroup {
  tiles: Tile[];
  type: 'pair' | 'pung' | 'kong' | 'chow' | 'single';
}
