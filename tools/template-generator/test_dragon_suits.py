"""Test dragon tile generation with different suits."""
import sys
from pathlib import Path

# Add the parent directory to the path so we can import mtg
sys.path.insert(0, str(Path(__file__).parent))

from mtg.core import single, pair, pung, kong, HandTemplate

def test_dragon_suits():
    """Test that dragon tiles are generated with the correct suits."""
    print("\n=== Testing Dragon Tile Suits ===\n")
    
    # Test single dragon tiles with different suits
    for suit in ['b', 'c', 'd']:
        # Test single dragon
        dragon = single('D', suit)
        tile = dragon.build(0).tiles[0]
        expected_code = f"D{suit}"
        actual_code = tile.get_tile_code()
        print(f"single('D', '{suit}') -> {actual_code} (expected: {expected_code})")
        assert actual_code == expected_code, f"Expected {expected_code}, got {actual_code}"
        
        # Test pair
        dragon_pair = pair('D', suit)
        tiles = dragon_pair.build(0).tiles
        print(f"pair('D', '{suit}') -> {[t.get_tile_code() for t in tiles]}")
        assert len(tiles) == 2, "Pair should have 2 tiles"
        assert all(t.get_tile_code() == expected_code for t in tiles), "All tiles in pair should have the same code"
        
        # Test pung
        dragon_pung = pung('D', suit)
        tiles = dragon_pung.build(0).tiles
        print(f"pung('D', '{suit}') -> {[t.get_tile_code() for t in tiles]}")
        assert len(tiles) == 3, "Pung should have 3 tiles"
        assert all(t.get_tile_code() == expected_code for t in tiles), "All tiles in pung should have the same code"
        
        # Test kong
        dragon_kong = kong('D', suit)
        tiles = dragon_kong.build(0).tiles
        print(f"kong('D', '{suit}') -> {[t.get_tile_code() for t in tiles]}")
        assert len(tiles) == 4, "Kong should have 4 tiles"
        assert all(t.get_tile_code() == expected_code for t in tiles), "All tiles in kong should have the same code"
        
        print()  # Add a blank line between different suits
    
    print("✓ All dragon tile suit tests passed!")

def test_dragon_in_hand_template():
    """Test dragon tiles in a hand template."""
    print("\n=== Testing Dragon Tiles in Hand Template ===\n")
    
    # Create a template with different dragon tiles
    template = HandTemplate(
        id="test_dragon_suits",
        name="Test Dragon Suits",
        description="Test dragon tiles with different suits",
        category="test",
        catid="test",
        image="test.png"
    )
    
    # Add a variation with different dragon tiles
    template.add_variation([
        single('D', 'b'),  # Single bam dragon
        pair('D', 'c'),    # Pair of crack dragons
        pung('D', 'd'),    # Pung of dot dragons
        kong('D', 'b')     # Kong of bam dragons
    ])
    
    # Convert to dictionary to see the output
    result = template.to_dict()
    
    # Print the result for inspection
    print("Generated template:")
    for i, var in enumerate(result["variations"], 1):
        print(f"Variation {i}: {var}")
    
    print("\n✓ Hand template with dragon tiles generated successfully!")

if __name__ == "__main__":
    test_dragon_suits()
    test_dragon_in_hand_template()
