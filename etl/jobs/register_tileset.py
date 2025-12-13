#!/usr/bin/env python3
"""
Register generated tilesets in Supabase catalog.

Updates the `tilesets` and `tile_jobs` tables with metadata about
newly generated vector tiles, including S3 URLs and statistics.

Usage:
    python register_tileset.py --layer parcels --version 2025_01_15
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import uuid4

import requests

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://mcmfwlgovubpdcfiqfvk.supabase.co")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Tile URL templates
TILE_CDN_BASE = os.environ.get("TILE_CDN_BASE", "https://tiles.siteintel.ai")


def get_headers() -> Dict[str, str]:
    """Get headers for Supabase API requests."""
    if not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
    
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def read_tile_stats(layer: str, output_dir: Path) -> Optional[Dict[str, Any]]:
    """Read Tippecanoe statistics file if available."""
    stats_path = output_dir / f"{layer}_stats.json"
    if stats_path.exists():
        with open(stats_path) as f:
            return json.load(f)
    return None


def count_tiles(tiles_dir: Path) -> int:
    """Count the number of .pbf files in the tiles directory."""
    if not tiles_dir.exists():
        return 0
    return sum(1 for _ in tiles_dir.rglob("*.pbf"))


def get_tiles_size(tiles_dir: Path) -> int:
    """Calculate total size of tiles in bytes."""
    if not tiles_dir.exists():
        return 0
    return sum(f.stat().st_size for f in tiles_dir.rglob("*.pbf"))


def register_tileset(
    layer: str,
    version: str,
    jurisdiction: str = "tx",
    record_count: Optional[int] = None,
    tiles_dir: Optional[Path] = None,
    job_duration_ms: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Register a tileset in the Supabase catalog.
    
    Args:
        layer: Layer name (e.g., 'parcels', 'zoning')
        version: Version string (e.g., '2025_01_15')
        jurisdiction: State/jurisdiction code
        record_count: Number of features in the tileset
        tiles_dir: Path to generated tiles directory
        job_duration_ms: Time taken to generate tiles in milliseconds
        
    Returns:
        Registered tileset record
    """
    tileset_key = f"us_{jurisdiction}_{layer}_{version}"
    tile_url_template = f"{TILE_CDN_BASE}/us/{jurisdiction}/{layer}/{version}/{{z}}/{{x}}/{{y}}.pbf"
    
    # Get tile statistics if available
    tile_count = count_tiles(tiles_dir) if tiles_dir else None
    size_bytes = get_tiles_size(tiles_dir) if tiles_dir else None
    
    # Determine zoom range based on layer
    zoom_ranges = {
        "parcels": (10, 18),
        "zoning": (8, 16),
        "utilities": (12, 18),
        "transportation": (8, 18),
        "flood": (8, 16),
        "wetlands": (10, 16),
        "environmental": (8, 16),
    }
    min_zoom, max_zoom = zoom_ranges.get(layer, (8, 18))
    
    # Calculate expiration (7 days from now for non-immutable, 30 days for versioned)
    expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
    
    # Build tileset record
    tileset = {
        "tileset_key": tileset_key,
        "name": f"{layer.title()} ({jurisdiction.upper()}) v{version}",
        "category": layer,
        "jurisdiction": jurisdiction,
        "tile_url_template": tile_url_template,
        "min_zoom": min_zoom,
        "max_zoom": max_zoom,
        "record_count": record_count,
        "size_bytes": size_bytes,
        "generated_at": datetime.utcnow().isoformat(),
        "expires_at": expires_at,
        "refresh_frequency_hours": 24,
        "is_active": True,
        "vector_layers": json.dumps([{
            "id": layer,
            "description": f"SiteIntel {layer} layer",
            "minzoom": min_zoom,
            "maxzoom": max_zoom,
        }]),
    }
    
    print(f"Registering tileset: {tileset_key}")
    
    # Check if tileset already exists
    check_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tilesets",
        headers=get_headers(),
        params={"tileset_key": f"eq.{tileset_key}", "select": "id"}
    )
    
    existing = check_response.json() if check_response.status_code == 200 else []
    
    if existing and len(existing) > 0:
        # UPDATE existing record
        existing_id = existing[0]['id']
        print(f"  ↻ Updating existing tileset (id: {existing_id})")
        
        # Add updated_at timestamp
        tileset["updated_at"] = datetime.utcnow().isoformat()
        
        patch_headers = get_headers()
        patch_headers["Prefer"] = "return=representation"
        
        response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/tilesets?id=eq.{existing_id}",
            headers=patch_headers,
            json=tileset
        )
        
        if response.status_code not in (200, 204):
            print(f"  ✗ Failed to update tileset: {response.text}")
            raise Exception(f"Failed to update tileset: {response.text}")
        
        # Handle empty response for 204
        if response.status_code == 204 or not response.text:
            tileset_record = {"id": existing_id, **tileset}
        else:
            result = response.json()
            tileset_record = result[0] if isinstance(result, list) else result
    else:
        # INSERT new record
        print(f"  + Inserting new tileset")
        
        insert_headers = get_headers()
        insert_headers["Prefer"] = "return=representation"
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/tilesets",
            headers=insert_headers,
            json=tileset
        )
        
        if response.status_code not in (200, 201):
            print(f"  ✗ Failed to insert tileset: {response.text}")
            raise Exception(f"Failed to insert tileset: {response.text}")
        
        result = response.json()
        tileset_record = result[0] if isinstance(result, list) else result
    print(f"  ✓ Tileset registered: {tileset_record.get('id', 'unknown')}")
    
    # Create tile_jobs entry for audit trail
    job = {
        "id": str(uuid4()),
        "tileset_key": tileset_key,
        "job_type": "full",
        "status": "complete",
        "started_at": datetime.utcnow().isoformat(),
        "finished_at": datetime.utcnow().isoformat(),
        "input_records": record_count,
        "output_tiles": tile_count,
        "duration_ms": job_duration_ms,
        "triggered_by": "github_actions",
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/tile_jobs",
        headers=get_headers(),
        json=job,
    )
    
    if response.status_code in (200, 201):
        print(f"  ✓ Job recorded: {job['id']}")
    else:
        print(f"  ⚠ Failed to record job: {response.text}")
    
    return tileset_record


def deactivate_old_versions(layer: str, jurisdiction: str, current_version: str):
    """Deactivate older versions of the same layer."""
    current_key = f"us_{jurisdiction}_{layer}_{current_version}"
    
    # Get all active tilesets for this layer
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/tilesets",
        headers=get_headers(),
        params={
            "category": f"eq.{layer}",
            "jurisdiction": f"eq.{jurisdiction}",
            "is_active": "eq.true",
            "tileset_key": f"neq.{current_key}",
        },
    )
    
    if response.status_code != 200:
        print(f"  ⚠ Failed to query old versions: {response.text}")
        return
    
    old_tilesets = response.json()
    
    for tileset in old_tilesets:
        # Deactivate old version
        patch_response = requests.patch(
            f"{SUPABASE_URL}/rest/v1/tilesets",
            headers=get_headers(),
            params={"id": f"eq.{tileset['id']}"},
            json={"is_active": False},
        )
        
        if patch_response.status_code in (200, 204):
            print(f"  ✓ Deactivated old version: {tileset['tileset_key']}")
        else:
            print(f"  ⚠ Failed to deactivate: {tileset['tileset_key']}")


def main():
    parser = argparse.ArgumentParser(
        description="Register generated tilesets in Supabase catalog"
    )
    parser.add_argument(
        "--layer",
        required=True,
        help="Layer name (e.g., 'parcels', 'zoning')",
    )
    parser.add_argument(
        "--version",
        required=True,
        help="Version string (e.g., '2025_01_15')",
    )
    parser.add_argument(
        "--jurisdiction",
        default="tx",
        help="State/jurisdiction code (default: 'tx')",
    )
    parser.add_argument(
        "--record-count",
        type=int,
        help="Number of features in the tileset",
    )
    parser.add_argument(
        "--tiles-dir",
        type=Path,
        help="Path to generated tiles directory for statistics",
    )
    parser.add_argument(
        "--duration-ms",
        type=int,
        help="Time taken to generate tiles in milliseconds",
    )
    parser.add_argument(
        "--deactivate-old",
        action="store_true",
        help="Deactivate older versions of the same layer",
    )
    
    args = parser.parse_args()
    
    print(f"=== SiteIntel Tileset Registration ===")
    print(f"Layer: {args.layer}")
    print(f"Version: {args.version}")
    print(f"Jurisdiction: {args.jurisdiction}")
    print()
    
    try:
        tileset = register_tileset(
            layer=args.layer,
            version=args.version,
            jurisdiction=args.jurisdiction,
            record_count=args.record_count,
            tiles_dir=args.tiles_dir,
            job_duration_ms=args.duration_ms,
        )
        
        if args.deactivate_old:
            print()
            print("Deactivating old versions...")
            deactivate_old_versions(args.layer, args.jurisdiction, args.version)
        
        print()
        print("=== Registration Complete ===")
        print(f"Tileset Key: {tileset.get('tileset_key')}")
        print(f"Tile URL: {tileset.get('tile_url_template')}")
        
        return 0
    
    except Exception as e:
        print(f"Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
