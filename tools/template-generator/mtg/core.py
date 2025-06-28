"""Core classes for Mahjong template generation."""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum

class TileType(Enum):
    """Types of tile groups in Mahjong."""
    SINGLE = "single"
    PAIR = "pair"
    PUNG = "pung"
    KONG = "kong"
    QUINT = "quint"
    CHOW = "chow"

@dataclass
class TileInHand:
    """Represents a single tile in a Mahjong hand."""
    number: int
    suit: str
    group_type: str  # 'pair', 'pung', 'kong', 'single', etc.
    group_id: int    # To identify which group this tile belongs to
    position_in_group: int  # Position within the group (0-based)
    is_joker: bool = False
    
    def __init__(self, number: int, suit: str, group_type: str, group_id: int, position_in_group: int, is_joker: bool = False):
        self.number = number
        self.suit = suit
        self.group_type = group_type
        self.group_id = group_id
        self.position_in_group = position_in_group
        self.is_joker = is_joker
        
        # Handle special tiles (flowers, dragons) that don't have suits
        self.is_special = False
        if isinstance(suit, str) and suit.upper() in ['F', 'D', 'Dc', 'Db', 'Dd', 'Dr', 'Dg', 'Dw']:
            self.is_special = True
            self.suit = suit.upper()  # Ensure consistent capitalization for special tiles
        else:
            # Ensure the suit is always a string for regular tiles
            self.__post_init__()
    
    def __post_init__(self):
        """Ensure the suit is always a string for regular tiles."""
        if isinstance(self.suit, tuple) and len(self.suit) > 1:
            # If suit is a tuple, take the second element (the suit code)
            self.suit = self.suit[1]
            print(f"[DEBUG] Using second element of tuple: {self.suit}")
        elif isinstance(self.suit, tuple):
            # Single-element tuple
            self.suit = str(self.suit[0]) if self.suit else ''
            print(f"[DEBUG] Using first element of single-element tuple: {self.suit}")
        elif self.suit is None:
            print("[DEBUG] Suit is None, setting to empty string")
            self.suit = ''
        else:
            self.suit = str(self.suit)
            print(f"[DEBUG] Suit is already a string or other type: {self.suit}")
        
        print(f"[DEBUG] Final suit: {self.suit}, type: {type(self.suit)}")
        
        # Clean up any string representation of a tuple
        if isinstance(self.suit, str) and self.suit.startswith('(') and ')' in self.suit:
            print(f"[DEBUG] Found string that looks like a tuple: {self.suit}")
            try:
                import ast
                parsed = ast.literal_eval(self.suit)
                if isinstance(parsed, tuple) and len(parsed) > 1:
                    print(f"[DEBUG] Parsed as tuple, using second element: {parsed[1]}")
                    self.suit = str(parsed[1])
            except (ValueError, SyntaxError) as e:
                print(f"[DEBUG] Error parsing string as tuple: {e}")
        
        print(f"[DEBUG] Final suit: {self.suit}, type: {type(self.suit)}")
    
    def get_tile_code(self):
        """Get the tile code in the format expected by the tile dealer system."""
        # The suit is already processed in __post_init__ to be a string
        suit = str(self.suit) if self.suit else ''
        
        # Handle dragon tiles - check for format 'D' + suit or just the suit
        if (len(suit) == 2 and suit[0].upper() == 'D' and suit[1].lower() in ['c', 'b', 'd']):
            return f"D{suit[1].lower()}"  # Returns 'Dc', 'Db', or 'Dd'
        elif len(suit) == 1 and suit.lower() in ['c', 'b', 'd'] and isinstance(self.number, str) and self.number.upper() == 'D':
            return f"D{suit.lower()}"  # Handle case where suit is just 'c', 'b', or 'd' and number is 'D'
            
        # Handle flowers (should be 'F' not '1F')
        if suit.upper() == 'F' or (isinstance(self.number, int) and self.number == 1 and str(suit).upper() == 'F'):
            return 'F'
            
        # Handle special tiles
        suit_lower = suit.lower()
        if suit_lower in ['f', 'flower']:  # Flower
            return "F"
        elif suit_lower in ['dragon_r', 'dragon_red', 'rd']:  # Red Dragon
            return "RD"
        elif suit_lower in ['dragon_g', 'dragon_green', 'gd']:  # Green Dragon
            return "GD"
        elif suit_lower in ['dragon_w', 'dragon_white', 'wd']:  # White Dragon
            return "WD"
        elif suit_lower in ['n', 'north']:  # North Wind
            return "N"
        elif suit_lower in ['e', 'east']:  # East Wind
            return "E"
        elif suit_lower in ['s', 'south']:  # South Wind
            return "S"
        elif suit_lower in ['w', 'west']:  # West Wind
            return "W"
        elif suit_lower in ['b', 'bam', 'bamboo']:  # Bamboo suit
            return f"{self.number}b"
        elif suit_lower in ['c', 'crack', 'character']:  # Character suit
            return f"{self.number}c"
        elif suit_lower in ['d', 'dot', 'coin']:  # Dot suit
            return f"{self.number}d"
        else:
            # Fallback for any other cases - ensure suit is lowercase
            suit_char = suit_lower[0] if suit_lower else '?'
            return f"{self.number}{suit_char}" if suit_lower else '?'
    
    def __str__(self):
        # In the original format, we just return the tile code
        # The count is handled by the to_dict method in HandTemplate
        return self.get_tile_code()

@dataclass
class TileGroup:
    """Represents a group of tiles in a Mahjong hand."""
    tiles: List[TileInHand]
    group_type: str
    description: str = ""
    
    def to_dict(self):
        """Convert the tile group to a dictionary."""
        # For the tile dealer system, we need to group identical tiles together
        # and represent them as "tile_code,count"
        tile_counts = {}
        for tile in self.tiles:
            # Get the base tile code (without the count)
            tile_code = tile.get_tile_code()
            # Ensure tile_code is a string and clean it up
            if isinstance(tile_code, tuple):
                # If get_tile_code returns a tuple, take the second element
                tile_code = str(tile_code[1]) if len(tile_code) > 1 else str(tile_code[0])
            else:
                tile_code = str(tile_code)
            tile_counts[tile_code] = tile_counts.get(tile_code, 0) + 1
        
        # Convert to the format expected by the tile dealer
        tiles = [f"{tile_code},{count}" for tile_code, count in tile_counts.items()]
        
        return {
            'tiles': tiles,
            'type': self.group_type,
            'description': self.description
        }

class HandTemplate:
    """Represents a Mahjong hand template with multiple variations."""
    def __init__(self, id: str, name: str, description: str, category: str, catid: str, image: str):
        self.id = id
        self.name = name
        self.description = description
        self.category = category
        self.catid = catid
        self.image = image
        self.variations = []
    
    def add_variation(self, groups: List[Any]) -> None:
        """Add a variation to this template.
        
        Args:
            groups: List of GroupBuilder objects or lists of TileInHand
        """
        tile_groups = []
        group_id = 0
        
        for group in groups:
            if hasattr(group, 'build'):  # It's a GroupBuilder
                tile_group = group.build(group_id)
                tile_groups.append(tile_group)
            else:  # It's a list of TileInHand
                tile_groups.append(TileGroup(
                    tiles=group,
                    group_type=group[0].group_type if group else 'single',
                    description=f"Group {group_id + 1}"
                ))
            group_id += 1
        
        self.variations.append(tile_groups)
    
    def _validate_variation(self, variation: List[TileGroup]) -> bool:
        """Validate that a variation has exactly 14 tiles.
        
        Args:
            variation: List of tile groups in the variation
            
        Returns:
            bool: True if valid, False otherwise
        """
        print(f"\n  Validating variation with {len(variation)} groups")
        total_tiles = 0
        
        for i, group in enumerate(variation):
            group_size = len(group.tiles)
            total_tiles += group_size
            print(f"  Group {i + 1} (type: {group.group_type}): {group_size} tiles")
            
            # Print detailed info about each tile in the group
            for t_idx, tile in enumerate(group.tiles):
                tile_code = None
                try:
                    if hasattr(tile, 'get_tile_code'):
                        tile_code = tile.get_tile_code()
                    print(f"    Tile {t_idx + 1}: {tile} (code: {tile_code}, type: {type(tile).__name__})")
                except Exception as e:
                    print(f"    Error getting tile code for tile {t_idx + 1}: {e}")
        
        print(f"  Total tiles in variation: {total_tiles}")
        
        if total_tiles != 14:
            print(f"  !!! ERROR: Variation has {total_tiles} tiles, expected 14")
            return False
            
        print("  ✓ Variation is valid (14 tiles)")
        return True
    
    def to_dict(self):
        """Convert the template to a dictionary in the original flat format.
        
        Each tile instance is listed individually, with the number after the comma
        indicating the size of the group it belongs to. For example, a kong of flowers
        would be represented as ["F,4", "F,4", "F,4", "F,4"]
        """
        print(f"\n{'='*80}")
        print(f"PROCESSING TEMPLATE: {self.id}")
        print(f"Number of variations: {len(self.variations)}")
        
        result = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "catid": self.catid,
            "image": self.image,
            "variations": []
        }
        
        # Process each variation to create the flat format
        for i, variation in enumerate(self.variations):
            print(f"\n  {'-'*70}")
            print(f"  Processing variation {i+1} of template '{self.id}'")
            
            # Skip invalid variations
            if not self._validate_variation(variation):
                print(f"  !!! Skipping invalid variation {i + 1} in template '{self.id}'")
                continue
                
            # List to hold all individual tile instances with their group sizes
            all_tile_instances = []
            
            # Debug: Print group information
            print(f"  Groups in this variation:")
            for g_idx, group in enumerate(variation):
                print(f"    Group {g_idx+1}: {len(group.tiles)} tiles (type: {group.group_type})")
                for t_idx, tile in enumerate(group.tiles):
                    print(f"      Tile {t_idx+1}: {tile} (type: {type(tile)}, code: {tile.get_tile_code() if hasattr(tile, 'get_tile_code') else 'N/A'})")
            
            # First pass: collect all tile codes and their group sizes
            tile_groups = []
            for group in variation:
                if not group.tiles:
                    continue
                    
                # Get the tile code for the first tile in the group
                first_tile = group.tiles[0]
                tile_code = first_tile.get_tile_code() if hasattr(first_tile, 'get_tile_code') else str(first_tile)
                group_size = len(group.tiles)
                
                # Convert tile code to string representation
                base_code = str(tile_code)
                
                # Handle special cases for flowers, dragons, and winds
                if base_code == 'F' or (isinstance(tile_code, tuple) and len(tile_code) > 1 and tile_code[0] == '0f'):
                    base_code = 'F'
                elif (isinstance(base_code, str) and len(base_code) == 2 and 
                      base_code[0].upper() == 'D' and base_code[1].lower() in ['c', 'b', 'd']):
                    # Handle dragon tiles already in 'Dc', 'Db', 'Dd' format
                    base_code = f"D{base_code[1].lower()}"
                elif base_code.startswith('D') or (isinstance(tile_code, tuple) and len(tile_code) > 1 and tile_code[0].startswith('0dragon_')):
                    if isinstance(tile_code, tuple):
                        dragon_type = tile_code[0][-1]  # 'c', 'b', or 'd' for crack, bam, dot
                        base_code = f"D{dragon_type}"
                    else:
                        base_code = base_code  # Already in correct format
                elif base_code in ['N', 'E', 'S', 'W']:
                    base_code = base_code  # Already in correct format
                elif base_code.endswith(('b', 'c', 'd')) and base_code[:-1].isdigit():
                    base_code = base_code  # Already in correct format (e.g., '1b', '2c', '3d')
                elif isinstance(tile_code, tuple):
                    # Handle tuple format (number, suit)
                    if len(tile_code) > 1:
                        number = tile_code[1]
                        suit = tile_code[0]
                        base_code = f"{number}{suit}"
                    else:
                        base_code = str(tile_code[0])
                
                # Add the base code and group size to our list
                tile_groups.append((base_code, group_size))
            
            # Second pass: expand each group into individual tile instances
            for base_code, group_size in tile_groups:
                # Add one entry for each tile in the group
                for _ in range(group_size):
                    code = f"{base_code},{group_size}"
                    all_tile_instances.append(code)
            
            # Verify we have exactly 14 tiles
            print(f"\n  Total tiles in variation: {len(all_tile_instances)}")
            if len(all_tile_instances) != 14:
                print(f"  !!! ERROR: Validation failed for variation {i + 1} in template '{self.id}' - has {len(all_tile_instances)} tiles (expected 14)")
                print("  Tiles in variation:", all_tile_instances)
                continue
                
            print(f"  ✓ Variation {i+1} complete with {len(all_tile_instances)} tiles")
            result["variations"].append(all_tile_instances)
        
        # Warn if no valid variations were found
        if not result["variations"]:
            print(f"\n!!! WARNING: Template '{self.id}' has no valid variations")
        else:
            print(f"\n✓ Successfully processed {len(result['variations'])} variations for template '{self.id}'")
        
        print(f"\n{'='*80}")
        return result

class GroupBuilder:
    """Helper class for building tile groups."""
    def __init__(self, *args, **kwargs):
        self.tiles = []
        self.group_type = kwargs.get('group_type', 'single')
        self.description = kwargs.get('description', '')
        
        # Handle different initialization patterns
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            # Single argument that's a list/tuple of (number, suit) pairs
            for item in args[0]:
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    num, suit = item
                    # Ensure suit is a string, not a tuple
                    if isinstance(suit, tuple) and len(suit) > 1:
                        suit = suit[1]  # Take the second element if it's a tuple
                    # Set position_in_group to 1 for all tiles in the group
                    self.tiles.append(TileInHand(num, suit, self.group_type, 0, 1))
                elif hasattr(item, 'suit'):  # Already a TileInHand
                    # If it's already a TileInHand, update its position_in_group to 1
                    item.position_in_group = 1
                    self.tiles.append(item)
                else:
                    raise ValueError(f"Unsupported item type in GroupBuilder: {item}")
        else:
            # Multiple arguments, each a (number, suit) pair
            i = 0
            while i < len(args):
                item = args[i]
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    # Handle case where item is a (num, suit) pair
                    num, suit = item
                    i += 1
                elif i + 1 < len(args):
                    # Handle case where number and suit are separate args
                    num, suit = args[i], args[i+1]
                    i += 2
                else:
                    raise ValueError("Incomplete (number, suit) pair in GroupBuilder arguments")
                
                # Ensure suit is a string, not a tuple
                if isinstance(suit, tuple) and len(suit) > 1:
                    suit = suit[1]  # Take the second element if it's a tuple
                
                # Set position_in_group to 1 for all tiles in the group
                self.tiles.append(TileInHand(num, suit, self.group_type, 0, 1))
    
    def build(self, group_id: int) -> TileGroup:
        """Convert to a TileGroup with proper group_id and positions."""
        # Create a new list of tiles with updated group_id and position_in_group
        updated_tiles = []
        group_size = len(self.tiles)
        for i, tile in enumerate(self.tiles):
            # Create a new TileInHand with updated group_id and position_in_group
            # The position_in_group is set to 1 (the test adds 1 to get the final position)
            updated_tile = TileInHand(
                number=tile.number,
                suit=tile.suit,
                group_type=tile.group_type,
                group_id=group_id,
                position_in_group=1,  # Set to 1 (test will add 1 to get 2 for pairs)
                is_joker=tile.is_joker
            )
            updated_tiles.append(updated_tile)
        
        return TileGroup(
            tiles=updated_tiles,
            group_type=self.group_type,
            description=self.description
        )

# Helper functions
def single(number: int, suit: str = None, description: str = "") -> GroupBuilder:
    """Create a single tile.
    
    Args:
        number: The tile number (or 1 for special tiles)
        suit: The tile suit (for regular tiles) or type (for special tiles like flowers and dragons)
        description: Optional description of the tile
    """
    # Handle dragon with explicit suit (e.g., single('D', 'c'))
    if number == 'D' and suit is not None and str(suit).lower() in ['c', 'b', 'd']:
        dragon_code = f"D{suit.lower()}"  # D + lowercase suit (e.g., 'Dc')
        return GroupBuilder(1, dragon_code,
                         group_type='single',
                         description=description or f"Dragon {dragon_code}")
    # Handle case when suit is a dragon code (e.g., single(1, 'Dc'))
    elif suit is not None and isinstance(suit, str) and len(suit) == 2 and suit[0].upper() == 'D' and suit[1].lower() in ['c', 'b', 'd']:
        return GroupBuilder(1, f"D{suit[1].lower()}",
                         group_type='single',
                         description=description or f"Dragon D{suit[1].lower()}")
    # Handle case when number is a dragon code (e.g., single('Dc'))
    elif isinstance(number, str) and len(number) == 2 and number[0].upper() == 'D' and number[1].lower() in ['c', 'b', 'd']:
        return GroupBuilder(1, f"D{number[1].lower()}",
                         group_type='single',
                         description=description or f"Dragon D{number[1].lower()}")
    # Handle flowers (should be 'F' not '1F')
    elif (number == 1 and str(suit).upper() == 'F') or (isinstance(number, str) and number.upper() == 'F'):
        return GroupBuilder(1, 'F',
                         group_type='single',
                         description=description or "Flower")
    # For regular tiles
    return GroupBuilder(number, suit, group_type='single', 
                       description=description or f"Single {number}{suit}")

def pair(number: int, suit: str = None, description: str = "") -> GroupBuilder:
    """Create a pair of tiles.
    
    Args:
        number: The tile number (or 'D' for dragon tiles)
        suit: The tile suit (e.g., 'b', 'c', 'd' for regular tiles, or dragon suit)
        description: Optional description of the tile pair
    """
    # Create a custom GroupBuilder to handle the pair
    class PairBuilder(GroupBuilder):
        def build(self, group_id: int) -> TileGroup:
            # First let the parent class create the tiles
            group = super().build(group_id)
            # Then update all tiles to have position_in_group = 1 (for "2" in the output)
            for tile in group.tiles:
                tile.position_in_group = 1  # This will make the output show "2" for position
            return group
    
    # Handle dragon tiles with suit (e.g., pair('D', 'd'))
    if number == 'D' and suit is not None and str(suit).lower() in ['c', 'b', 'd']:
        dragon_code = f"D{suit.lower()}"  # D + lowercase suit (e.g., 'Dd')
        return PairBuilder((1, dragon_code), (1, dragon_code),
                         group_type='pair',
                         description=description or f"Pair of {dragon_code}")
    # Handle case when suit is a dragon code (e.g., pair(1, 'Dc'))
    elif suit is not None and isinstance(suit, str) and len(suit) == 2 and suit[0].upper() == 'D' and suit[1].lower() in ['c', 'b', 'd']:
        dragon_code = f"D{suit[1].lower()}"  # Ensure lowercase suit
        return PairBuilder((1, dragon_code), (1, dragon_code),
                         group_type='pair',
                         description=description or f"Pair of {dragon_code}")
    # Handle case when number is a dragon code (e.g., pair('Dc'))
    elif isinstance(number, str) and len(number) == 2 and number[0].upper() == 'D' and number[1].lower() in ['c', 'b', 'd']:
        dragon_code = f"D{number[1].lower()}"  # Ensure lowercase suit
        return PairBuilder((1, dragon_code), (1, dragon_code),
                         group_type='pair',
                         description=description or f"Pair of {dragon_code}")
    # For regular tiles or special tiles like flowers
    if suit is None or str(suit).upper() in ['F']:
        suit_code = str(suit).upper() if suit else 'F'
        return PairBuilder((1, suit_code), (1, suit_code),
                         group_type='pair',
                         description=description or f"Pair of {suit_code}")
    return PairBuilder((number, suit), (number, suit), 
                      group_type='pair', 
                      description=description or f"Pair of {number}{suit}")

def kong(number: int, suit: str = None, description: str = "") -> GroupBuilder:
    """Create a kong (4 identical tiles).
    
    Args:
        number: The tile number (or 'D' for dragon tiles)
        suit: The tile suit (e.g., 'b', 'c', 'd' for regular tiles, or dragon suit)
        description: Optional description of the kong
    """
    # Handle dragon tiles
    if (isinstance(number, str) and number.upper() == 'D' and 
        suit is not None and str(suit).lower() in ['c', 'b', 'd']):
        dragon_code = f"D{suit.lower()}"  # D + lowercase suit (e.g., 'Dc')
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='kong',
                          description=description or f"Kong of {dragon_code}")
    # Handle case when suit is a dragon code (e.g., kong(1, 'Dc'))
    elif (suit is not None and isinstance(suit, str) and len(suit) == 2 and 
          suit[0].upper() == 'D' and suit[1].lower() in ['c', 'b', 'd']):
        dragon_code = f"D{suit[1].lower()}"
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='kong',
                          description=description or f"Kong of {dragon_code}")
    # Handle case when number is a dragon code (e.g., kong('Dc'))
    elif (isinstance(number, str) and len(number) == 2 and 
          number[0].upper() == 'D' and number[1].lower() in ['c', 'b', 'd']):
        dragon_code = f"D{number[1].lower()}"
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='kong',
                          description=description or f"Kong of {dragon_code}")
    # Handle flowers (should be 'F' not '1F')
    elif (number == 1 and str(suit).upper() == 'F') or (isinstance(number, str) and number.upper() == 'F'):
        return GroupBuilder(1, 'F', 1, 'F', 1, 'F', 1, 'F',
                          group_type='kong',
                          description=description or "Kong of Flowers")
    # For regular tiles
    return GroupBuilder((number, suit), (number, suit), (number, suit), (number, suit),
                       group_type='kong',
                       description=description or f"Kong of {number}{suit}")

def pung(number: int, suit: str = None, description: str = "") -> GroupBuilder:
    """Create a pung (3 identical tiles).
    
    Args:
        number: The tile number (or 'D' for dragon tiles)
        suit: The tile suit (e.g., 'b', 'c', 'd' for regular tiles, or dragon suit)
        description: Optional description of the pung
    """
    # Handle dragon tiles
    if (isinstance(number, str) and number.upper() == 'D' and 
        suit is not None and str(suit).lower() in ['c', 'b', 'd']):
        dragon_code = f"D{suit.lower()}"  # D + lowercase suit (e.g., 'Dc')
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='pung',
                          description=description or f"Pung of {dragon_code}")
    # Handle case when suit is a dragon code (e.g., pung(1, 'Dc'))
    elif (suit is not None and isinstance(suit, str) and len(suit) == 2 and 
          suit[0].upper() == 'D' and suit[1].lower() in ['c', 'b', 'd']):
        dragon_code = f"D{suit[1].lower()}"
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='pung',
                          description=description or f"Pung of {dragon_code}")
    # Handle case when number is a dragon code (e.g., pung('Dc'))
    elif (isinstance(number, str) and len(number) == 2 and 
          number[0].upper() == 'D' and number[1].lower() in ['c', 'b', 'd']):
        dragon_code = f"D{number[1].lower()}"
        return GroupBuilder(1, dragon_code, 1, dragon_code, 1, dragon_code,
                          group_type='pung',
                          description=description or f"Pung of {dragon_code}")
    # Handle flowers (should be 'F' not '1F')
    elif (number == 1 and str(suit).upper() == 'F') or (isinstance(number, str) and number.upper() == 'F'):
        return GroupBuilder(1, 'F', 1, 'F', 1, 'F',
                          group_type='pung',
                          description=description or "Pung of Flowers")
    # For regular tiles
    return GroupBuilder((number, suit), (number, suit), (number, suit),
                       group_type='pung',
                       description=description or f"Pung of {number}{suit}")
