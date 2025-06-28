# Mahjong Template Generator

This tool generates Mahjong hand templates in JSON format for use with the Mahjongg Tools application.

## Features

- Define Mahjong hand templates using Python classes
- Generate multiple variations of each template
- Export to JSON format compatible with the Mahjongg Tools frontend
- Easy to extend with new template patterns

## Installation

1. Make sure you have Python 3.8+ installed
2. Clone the repository
3. Navigate to the template generator directory:
   ```bash
   cd tools/template-generator
   ```

## Usage

### Generate Templates

To generate templates and save them to a JSON file:

```bash
python generate_templates.py -o path/to/output.json
```

If no output path is specified, templates will be saved to `hand_templates.json` in the current directory.

### Using in Code

```python
from generate_templates import generate_all_templates

# Get templates as a Python dictionary
templates = generate_all_templates()

# Print the number of templates
print(f"Generated {len(templates['templates'])} templates")
```

## Template Structure

Each template has the following structure:

```json
{
  "id": "unique_identifier",
  "name": "Human-readable name",
  "description": "Description of the template",
  "category": "Template category",
  "catid": "Category ID",
  "image": "Visual representation",
  "variations": [
    [
      {
        "tiles": ["tile1,count1", "tile2,count2", ...],
        "type": "group_type",
        "description": "Group description"
      },
      ...
    ],
    ...
  ]
}
```

## Adding New Templates

1. Create a new function in `mtg/templates/codelib.py` that returns a `HandTemplate`
2. Add your template to the `generate_all_templates()` function in `generate_templates.py`
3. Run the generator to test your template

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
