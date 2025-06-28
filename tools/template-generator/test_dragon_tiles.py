"""Test script to verify dragon tile formatting."""
from mtg.core import single, pair, kong, pung

def test_single_dragon():
    """Test single dragon tile formatting."""
    print("\n=== Testing single dragon tiles ===")
    
    # Test single dragon with suit
    for suit in ['c', 'b', 'd']:
        tile = single('D', suit)
        code = tile.tiles[0].get_tile_code()
        # The position_in_group is now set to 1 directly
        pos = tile.tiles[0].position_in_group
        print(f"single('D', '{suit}') -> {code},{pos} (expected: D{suit},1)")
        assert code == f"D{suit}", f"Expected D{suit}, got {code}"
        assert pos == 1, f"Expected position 1, got {pos}"
    
    # Test single dragon with code
    for code in ['Dc', 'Db', 'Dd']:
        tile = single(code)
        actual_code = tile.tiles[0].get_tile_code()
        # The position_in_group is now set to 1 directly
        pos = tile.tiles[0].position_in_group
        print(f"single('{code}') -> {actual_code},{pos} (expected: {code},1)")
        assert actual_code == code, f"Expected {code}, got {actual_code}"
        assert pos == 1, f"Expected position 1, got {pos}"

def test_pair_dragon():
    """Test pair of dragon tiles formatting."""
    print("\n=== Testing pair of dragon tiles ===")
    
    # Test pair of dragons with suit
    for suit in ['c', 'b', 'd']:
        group = pair('D', suit)
        code1 = group.tiles[0].get_tile_code()
        code2 = group.tiles[1].get_tile_code()
        # The position_in_group is now set to 1 for all tiles in the group
        pos1 = group.tiles[0].position_in_group
        pos2 = group.tiles[1].position_in_group
        
        print(f"pair('D', '{suit}') -> {code1},{pos1} and {code2},{pos2} (expected: D{suit},1 for both)")
        assert code1 == f"D{suit}", f"Expected D{suit}, got {code1}"
        assert code2 == f"D{suit}", f"Expected D{suit}, got {code2}"
        assert pos1 == 1, f"Expected position 1, got {pos1}"
        assert pos2 == 1, f"Expected position 1, got {pos2}"
    
    # Test pair of dragons with code
    for code in ['Dc', 'Db', 'Dd']:
        group = pair(code)
        code1 = group.tiles[0].get_tile_code()
        code2 = group.tiles[1].get_tile_code()
        # The position_in_group is now set to 1 for all tiles in the group
        pos1 = group.tiles[0].position_in_group
        pos2 = group.tiles[1].position_in_group
        
        print(f"pair('{code}') -> {code1},{pos1} and {code2},{pos2} (expected: {code},1 for both)")
        assert code1 == code, f"Expected {code}, got {code1}"
        assert code2 == code, f"Expected {code}, got {code2}"
        assert pos1 == 1, f"Expected position 1, got {pos1}"
        assert pos2 == 1, f"Expected position 1, got {pos2}"

def test_flower():
    """Test flower tile formatting."""
    print("\n=== Testing flower tiles ===")
    
    # Test single flower
    tile = single('F')
    code = tile.tiles[0].get_tile_code()
    # The position_in_group is now set to 1 for all tiles
    pos = tile.tiles[0].position_in_group
    print(f"single('F') -> {code},{pos} (expected: F,1)")
    assert code == "F", f"Expected F, got {code}"
    assert pos == 1, f"Expected position 1, got {pos}"
    
    # Test pair of flowers
    group = pair('F')
    code1 = group.tiles[0].get_tile_code()
    code2 = group.tiles[1].get_tile_code()
    # The position_in_group is now set to 1 for all tiles in the group
    pos1 = group.tiles[0].position_in_group
    pos2 = group.tiles[1].position_in_group
    print(f"pair('F') -> {code1},{pos1} and {code2},{pos2} (expected: F,1 for both)")
    assert code1 == "F", f"Expected F, got {code1}"
    assert code2 == "F", f"Expected F, got {code2}"
    assert pos1 == 1, f"Expected position 1, got {pos1}"
    assert pos2 == 1, f"Expected position 1, got {pos2}"

if __name__ == "__main__":
    test_single_dragon()
    test_pair_dragon()
    test_flower()
    print("\nAll tests passed successfully!")
