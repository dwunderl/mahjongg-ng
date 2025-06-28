"""Test JSON output format for dragon tiles."""
import json
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import mtg
sys.path.insert(0, str(Path(__file__).parent))

from mtg.core import HandTemplate, single, pair, pung, kong

def test_single_dragon_json():
    """Test that single('D', 'd') generates the correct JSON output."""
    print("\n=== Testing single dragon JSON output ===")
    
    # Create a simple template with a single dragon tile
    template = HandTemplate(
        id="test_dragon",
        name="Test Dragon",
        description="Test dragon tile output",
        category="test",
        catid="test",
        image="test.png"
    )
    
    # Add a variation with a valid Mahjong hand (14 tiles)
    # Including our dragon tile and some other tiles to make 14
    template.add_variation([
        single('D', 'd'),  # 1 tile - Our test dragon tile
        pair(1, 'b'),     # 2 tiles - A pair of bamboo 1
        pung(2, 'c'),     # 3 tiles - A pung of character 2
        kong(3, 'd'),     # 4 tiles - A kong of dots 3
        pair(4, 'b'),     # 2 tiles - A pair of bamboo 4
        pair(5, 'c')      # 2 tiles - A pair of character 5 (total: 14 tiles)
    ])
    
    # Convert to dictionary
    result = template.to_dict()
    
    # Print the result for debugging
    print("Generated JSON:")
    print(json.dumps(result, indent=2))
    
    # Check that the variation has the expected format
    assert len(result["variations"]) == 1, "Expected exactly one variation"
    variation = result["variations"][0]
    assert len(variation) == 14, "Expected 14 tiles in the variation"
    
    # The first tile should be our dragon tile
    dragon_tile = variation[0]
    print(f"Dragon tile: {dragon_tile}")
    assert dragon_tile == "Dd,1", f"Expected 'Dd,1', got '{dragon_tile}'"
    
    print("✓ Test passed - single dragon tile has correct JSON format")

if __name__ == "__main__":
    test_single_dragon_json()
