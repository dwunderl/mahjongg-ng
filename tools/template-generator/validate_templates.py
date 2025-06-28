#!/usr/bin/env python3
"""
Validate Mahjong template definitions.

This script checks that all template variations have exactly 14 tiles.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple

def count_tiles(tile_spec: str) -> Tuple[int, str]:
    """Count tiles from a tile specification."""
    try:
        tile_code, count = tile_spec.split(',')
        return int(count), tile_code
    except (ValueError, AttributeError) as e:
        return 0, f"Invalid format: {tile_spec} ({e})"

def validate_template(template: Dict[str, Any]) -> bool:
    """Validate a single template."""
    template_id = template.get('id', 'unknown')
    template_name = template.get('name', 'Unnamed')
    variations = template.get('variations', [])
    
    print(f"\n🔍 Validating template: {template_name} ({template_id})")
    print(f"   Description: {template.get('description', 'No description')}")
    print(f"   Category: {template.get('category', 'Uncategorized')}")
    print(f"   Variations: {len(variations)}")
    
    if not variations:
        print("❌ Error: No variations found")
        return False
    
    all_valid = True
    for i, variation in enumerate(variations, 1):
        print(f"\n   Variation {i}:")
        total_tiles = 0
        tile_details = []
        
        for tile_spec in variation:
            count, tile_code = count_tiles(tile_spec)
            total_tiles += count
            tile_details.append(f"     - {tile_code}: {count} tiles")
        
        # Print all tile details for this variation
        print("\n".join(tile_details))
        print(f"     Total tiles: {total_tiles}")
        
        if total_tiles != 14:
            print(f"❌ Error: Expected 14 tiles, found {total_tiles}")
            all_valid = False
        elif not all(tile_details):
            print("❌ Error: Invalid tile specifications found")
            all_valid = False
    
    if all_valid:
        print(f"\n✅ All {len(variations)} variations are valid")
    else:
        print(f"\n❌ Some variations are invalid")
    
    return all_valid

def main():
    """Main function."""
    input_file = Path(__file__).parent / 'test_output.json'
    
    if not input_file.exists():
        print(f"Error: {input_file} not found. Please run generate_templates.py first.")
        return 1
    
    print(f"🔎 Validating templates in {input_file}")
    print("=" * 80)
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Failed to parse JSON: {e}")
        return 1
    
    templates = data.get('templates', [])
    if not templates:
        print("❌ Error: No templates found in input file")
        return 1
    
    print(f"\nFound {len(templates)} templates to validate")
    print("-" * 80)
    
    all_valid = True
    for template in templates:
        if not validate_template(template):
            all_valid = False
        print("\n" + "-" * 80)
    
    if all_valid:
        print("\n🎉 All templates are valid!")
        return 0
    else:
        print("\n❌ Some templates have issues. See above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
