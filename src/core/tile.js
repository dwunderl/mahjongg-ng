// Tile types and utilities

export const TILE_TYPES = {
  CHARACTERS: 'characters',
  BAMBOO: 'bamboo',
  DOTS: 'dots',
  WINDS: 'winds',
  DRAGONS: 'dragons',  
  FLOWERS: 'flowers',
  SEASONS: 'seasons'
};

export const WIND_VALUES = ['east', 'south', 'west', 'north'];
export const DRAGON_VALUES = ['red', 'green', 'white'];

export class Tile {
  constructor(type, value, id = null) {
    this.type = type;
    this.value = value;
    this.id = id || this.generateId();
  }

  generateId() {
    return `${this.type}-${this.value}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toString() {
    if (this.type === TILE_TYPES.WINDS || this.type === TILE_TYPES.DRAGONS) {
      return `${this.value[0].toUpperCase()}${this.value[1]}`; // e.g., 'Ea', 'Rd'
    }
    return `${this.value}${this.type[0].toUpperCase()}`; // e.g., '1C', '5B'
  }


  getSortValue() {
    // Define sort order for different tile types
    const typeOrder = {
      [TILE_TYPES.CHARACTERS]: 1,
      [TILE_TYPES.BAMBOO]: 2,
      [TILE_TYPES.DOTS]: 3,
      [TILE_TYPES.WINDS]: 4,
      [TILE_TYPES.DRAGONS]: 5,
      [TILE_TYPES.FLOWERS]: 6,
      [TILE_TYPES.SEASONS]: 7
    };

    // For wind and dragon tiles, use their specific order
    let valueOrder = this.value;
    if (this.type === TILE_TYPES.WINDS) {
      valueOrder = WIND_VALUES.indexOf(this.value);
    } else if (this.type === TILE_TYPES.DRAGONS) {
      valueOrder = DRAGON_VALUES.indexOf(this.value);
    }

    return {
      typeOrder: typeOrder[this.type] || 99,
      value: valueOrder
    };
  }

  isHonor() {
    return [
      TILE_TYPES.WINDS,
      TILE_TYPES.DRAGONS,
      TILE_TYPES.FLOWERS,
      TILE_TYPES.SEASONS
    ].includes(this.type);
  }

  isTerminal() {
    if (this.isHonor()) return false;
    return this.value === 1 || this.value === 9;
  }

  isSimple() {
    return !this.isHonor() && !this.isTerminal();
  }
}
