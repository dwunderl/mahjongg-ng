#!/usr/bin/env python3
"""
Generate Mahjong hand templates in JSON format.
"""
import json
import sys
import logging
import os
from pathlib import Path

# Add the current directory to Python path to find local modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import from mtg.templates.codelib
from mtg.templates.codelib import (
    sequence_and_kongs,
    p3_k6_p6_k9,
    like_kong_kong_pair,
    even_pungs_2468,
)

# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('template_generator.log')
    ]
)
logger = logging.getLogger(__name__)

from mtg.templates.codelib import (
    sequence_and_kongs,
    p3_k6_p6_k9,
    like_kong_kong_pair,
    even_pungs_2468,
)

def generate_all_templates() -> dict:
    """Generate all hand templates."""
    templates = [
        sequence_and_kongs(),
        p3_k6_p6_k9(),
        like_kong_kong_pair(),
        even_pungs_2468(),
        # Add more templates here as they're created
    ]
    
    return {
        "version": "1.0.0",
        "templates": [t.to_dict() for t in templates]
    }

def save_templates(output_path: str = None) -> str:
    """Generate and save all templates to a JSON file.
    
    Args:
        output_path: Path to save the JSON file. If None, returns the JSON string.
        
    Returns:
        str: The output path where the file was saved, or the JSON string if no path provided.
    """
    try:
        logger.info("Starting template generation...")
        output = generate_all_templates()
        logger.info(f"Generated {len(output['templates'])} templates")
        
        if not output_path:
            logger.info("No output path provided, returning JSON string")
            return json.dumps(output, indent=2)
            
        # Convert output path to absolute path
        output_path = os.path.abspath(output_path)
        output_dir = os.path.dirname(output_path)
        
        logger.info(f"Output directory: {output_dir}")
        logger.info(f"Output file: {output_path}")
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Verify directory is writable
        if not os.access(output_dir, os.W_OK):
            raise PermissionError(f"No write permission for directory: {output_dir}")
        
        # Write to a temporary file first
        temp_path = f"{output_path}.tmp"
        logger.info(f"Writing to temporary file: {temp_path}")
        
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)
        
        # Verify the file was written
        if not os.path.exists(temp_path):
            raise IOError(f"Failed to write to temporary file: {temp_path}")
            
        file_size = os.path.getsize(temp_path)
        logger.info(f"Successfully wrote {file_size} bytes to {temp_path}")
        
        # Rename the temporary file to the target file
        if os.path.exists(output_path):
            os.remove(output_path)
        os.rename(temp_path, output_path)
        
        logger.info(f"Successfully moved {temp_path} to {output_path}")
        logger.info(f"Successfully generated {len(output['templates'])} templates to {output_path}")
        
        # Copy to client's public data directory
        try:
            # Get the project root directory (two levels up from tools/template-generator)
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            client_public_path = os.path.join(project_root, 'client', 'public', 'data', 'hand_templates.json')
            
            # Ensure the target directory exists
            os.makedirs(os.path.dirname(client_public_path), exist_ok=True)
            
            # Copy the file
            import shutil
            shutil.copy2(output_path, client_public_path)
            logger.info(f"Successfully copied templates to {client_public_path}")
        except Exception as copy_error:
            logger.warning(f"Warning: Could not copy templates to client public directory: {str(copy_error)}")
            logger.debug("Debug info:", exc_info=True)
        
        return output_path
        
    except Exception as e:
        logger.error(f"Error in save_templates: {str(e)}", exc_info=True)
        logger.error(f"Output path: {output_path}")
        logger.error(f"Current working directory: {os.getcwd()}")
        logger.error(f"Directory listing: {os.listdir(os.path.dirname(output_path) if output_path else '.')}")
        raise

def main():
    """Main entry point for the script."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate Mahjong hand templates.')
    parser.add_argument(
        '-o', '--output',
        type=str,
        default='hand_templates.json',
        help='Output JSON file path (default: hand_templates.json)'
    )
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Enable verbose output')
    
    args = parser.parse_args()
    
    # Set log level based on verbosity
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)
    
    save_templates(args.output)

if __name__ == "__main__":
    main()
