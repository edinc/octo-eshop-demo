#!/usr/bin/env python3
"""
Sanitize Excalidraw diagrams after adding icon library elements.

Icon libraries from excalidraw.com (circa 2021-2022) use deprecated properties
that cause "Error: invalid file" in current Excalidraw versions. This script
strips those deprecated properties and optionally removes icon library text labels.

Usage:
    python sanitize-diagram.py <diagram_path> [OPTIONS]

Options:
    --remove-icon-text         Remove text elements added by icon libraries
    --original-ids-file PATH   JSON file listing original diagram element IDs
                               (used to identify which text elements are from icons)
    --no-use-edit-suffix       Write directly to the file instead of using .edit suffix

Examples:
    # Basic sanitization (strip deprecated properties)
    python sanitize-diagram.py diagram.excalidraw

    # Also remove icon library text labels
    python sanitize-diagram.py diagram.excalidraw --remove-icon-text --original-ids-file ids.json
"""

import json
import sys
from pathlib import Path


DEPRECATED_PROPERTIES = ["strokeSharpness", "baseline"]
LINE_ONLY_ARROWHEAD_PROPS = ["startArrowhead", "endArrowhead"]


def sanitize_elements(elements, original_ids=None, remove_icon_text=False):
    """
    Sanitize elements by removing deprecated properties.

    Args:
        elements: List of Excalidraw elements
        original_ids: Set of original diagram element IDs (optional)
        remove_icon_text: Whether to remove text elements from icon libraries

    Returns:
        Tuple of (sanitized elements list, stats dict)
    """
    stats = {"deprecated_removed": 0, "text_removed": 0, "empty_bound_fixed": 0}

    # Remove icon library text labels if requested
    if remove_icon_text and original_ids:
        before = len(elements)
        elements = [
            e for e in elements
            if not (e["type"] == "text" and e["id"] not in original_ids)
        ]
        stats["text_removed"] = before - len(elements)

    for el in elements:
        # Remove deprecated properties
        for prop in DEPRECATED_PROPERTIES:
            if prop in el:
                del el[prop]
                stats["deprecated_removed"] += 1

        # Remove arrowhead properties from 'line' elements (only valid on 'arrow')
        if el["type"] == "line":
            for prop in LINE_ONLY_ARROWHEAD_PROPS:
                if prop in el:
                    del el[prop]
                    stats["deprecated_removed"] += 1

        # Fix empty boundElements array → null
        if "boundElements" in el and el["boundElements"] == []:
            el["boundElements"] = None
            stats["empty_bound_fixed"] += 1

    return elements, stats


def main():
    if len(sys.argv) < 2:
        print("Usage: python sanitize-diagram.py <diagram_path> [OPTIONS]")
        print("\nOptions:")
        print("  --remove-icon-text         Remove icon library text labels")
        print("  --original-ids-file PATH   JSON file with original element IDs")
        print("  --no-use-edit-suffix       Write directly to file")
        sys.exit(1)

    diagram_path = Path(sys.argv[1])
    remove_icon_text = False
    original_ids = None
    use_edit_suffix = True

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--remove-icon-text":
            remove_icon_text = True
            i += 1
        elif sys.argv[i] == "--original-ids-file":
            with open(sys.argv[i + 1]) as f:
                original_ids = set(json.load(f))
            i += 2
        elif sys.argv[i] == "--no-use-edit-suffix":
            use_edit_suffix = False
            i += 1
        else:
            print(f"Unknown option: {sys.argv[i]}")
            sys.exit(1)

    if not diagram_path.exists():
        print(f"Error: {diagram_path} not found")
        sys.exit(1)

    with open(diagram_path) as f:
        doc = json.load(f)

    doc["elements"], stats = sanitize_elements(
        doc["elements"], original_ids, remove_icon_text
    )

    with open(diagram_path, "w") as f:
        json.dump(doc, f, indent=2)

    print(f"✓ Sanitized {diagram_path}")
    print(f"  Deprecated properties removed: {stats['deprecated_removed']}")
    print(f"  Icon text labels removed: {stats['text_removed']}")
    print(f"  Empty boundElements fixed: {stats['empty_bound_fixed']}")
    print(f"  Final element count: {len(doc['elements'])}")


if __name__ == "__main__":
    main()
