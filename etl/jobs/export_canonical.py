#!/usr/bin/env python3
"""
Export canonical tables from Supabase PostGIS to GeoJSON files.

This script connects to the Supabase PostgreSQL database and exports
canonical geospatial tables as versioned GeoJSON files for Tippecanoe processing.

Usage:
    python export_canonical.py --layer parcels
    python export_canonical.py --layer all --jurisdiction harris
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

# Layer configuration mapping canonical tables to export parameters
LAYER_CONFIG = {
    "parcels": {
        "table": "canonical_parcels",
        "geometry_column": "geom",
        "properties": [
            "source_parcel_id",
            "apn",
            "situs_address",
            "owner_name",
            "acreage",
            "land_use_code",
            "land_use_desc",
            "jurisdiction",
            "city",
            "state",
            "zip",
        ],
        "jurisdiction_column": "jurisdiction",
    },
    "zoning": {
        "table": "zoning_canonical",
        "geometry_column": "geom",
        "properties": [
            "district_code",
            "district_name",
            "jurisdiction",
            "base_district",
            "overlay_code",
            "max_height_ft",
            "max_far",
            "lot_coverage_pct",
        ],
        "jurisdiction_column": "jurisdiction",
    },
    "utilities": {
        "table": "utilities_canonical",
        "geometry_column": "geom",
        "properties": [
            "utility_type",
            "utility_subtype",
            "provider_name",
            "pipe_diameter_in",
            "pipe_material",
            "install_year",
            "status",
        ],
        "jurisdiction_column": "jurisdiction",
    },
    "transportation": {
        "table": "transportation_canonical",
        "geometry_column": "geom",
        "properties": [
            "road_name",
            "road_class",
            "aadt",
            "aadt_year",
            "lanes",
            "speed_limit",
            "truck_pct",
        ],
        "jurisdiction_column": "county",
    },
    "flood": {
        "table": "flood_canonical",
        "geometry_column": "geom",
        "properties": [
            "fld_zone",
            "zone_subty",
            "static_bfe",
            "sfha_tf",
            "firm_pan",
        ],
        "jurisdiction_column": "jurisdiction",
    },
    "wetlands": {
        "table": "wetlands_canonical",
        "geometry_column": "geom",
        "properties": [
            "attribute_code",
            "wetland_type",
            "acres",
        ],
        "jurisdiction_column": "jurisdiction",
    },
}


def get_db_connection() -> psycopg2.extensions.connection:
    """Create a connection to Supabase PostgreSQL database."""
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        raise ValueError("SUPABASE_DB_URL environment variable is required")
    
    return psycopg2.connect(db_url)


def export_layer_to_geojson(
    conn: psycopg2.extensions.connection,
    layer_name: str,
    jurisdiction: Optional[str] = None,
    output_dir: Path = Path("export"),
) -> Dict[str, Any]:
    """
    Export a canonical table to GeoJSON format.
    
    Args:
        conn: Database connection
        layer_name: Name of the layer to export
        jurisdiction: Optional jurisdiction filter (e.g., 'harris', 'travis')
        output_dir: Directory to write output files
        
    Returns:
        Dictionary with export statistics
    """
    if layer_name not in LAYER_CONFIG:
        raise ValueError(f"Unknown layer: {layer_name}. Valid options: {list(LAYER_CONFIG.keys())}")
    
    config = LAYER_CONFIG[layer_name]
    table = config["table"]
    geom_col = config["geometry_column"]
    properties = config["properties"]
    jurisdiction_col = config["jurisdiction_column"]
    
    # Build property selection
    prop_select = ", ".join([f'"{p}"' for p in properties])
    
    # Build query with optional jurisdiction filter
    where_clause = ""
    params: List[Any] = []
    if jurisdiction:
        where_clause = f'WHERE LOWER("{jurisdiction_col}") = LOWER(%s)'
        params.append(jurisdiction)
    
    query = f"""
        SELECT 
            ST_AsGeoJSON(ST_Transform({geom_col}, 4326))::json AS geometry,
            {prop_select}
        FROM {table}
        {where_clause}
        WHERE {geom_col} IS NOT NULL
    """
    
    # If we have a jurisdiction filter, add AND to the where clause
    if jurisdiction:
        query = f"""
            SELECT 
                ST_AsGeoJSON(ST_Transform({geom_col}, 4326))::json AS geometry,
                {prop_select}
            FROM {table}
            WHERE LOWER("{jurisdiction_col}") = LOWER(%s)
            AND {geom_col} IS NOT NULL
        """
    else:
        query = f"""
            SELECT 
                ST_AsGeoJSON(ST_Transform({geom_col}, 4326))::json AS geometry,
                {prop_select}
            FROM {table}
            WHERE {geom_col} IS NOT NULL
        """
    
    print(f"Exporting {layer_name} from {table}...")
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, params if jurisdiction else None)
        rows = cur.fetchall()
    
    # Build GeoJSON FeatureCollection
    features = []
    for row in rows:
        feature = {
            "type": "Feature",
            "geometry": row["geometry"],
            "properties": {k: row[k] for k in properties if k in row},
        }
        features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "name": layer_name,
        "features": features,
        "metadata": {
            "exported_at": datetime.utcnow().isoformat(),
            "jurisdiction": jurisdiction or "all",
            "record_count": len(features),
            "source_table": table,
        },
    }
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate versioned filename
    version = datetime.utcnow().strftime("%Y_%m_%d")
    jurisdiction_suffix = f"_{jurisdiction}" if jurisdiction else ""
    filename = f"{layer_name}{jurisdiction_suffix}_{version}.geojson"
    output_path = output_dir / filename
    
    # Write GeoJSON file
    with open(output_path, "w") as f:
        json.dump(geojson, f)
    
    file_size = output_path.stat().st_size
    print(f"  ✓ Exported {len(features)} features to {output_path} ({file_size:,} bytes)")
    
    return {
        "layer": layer_name,
        "jurisdiction": jurisdiction,
        "record_count": len(features),
        "file_path": str(output_path),
        "file_size": file_size,
        "version": version,
    }


def export_all_layers(
    jurisdiction: Optional[str] = None,
    output_dir: Path = Path("export"),
) -> List[Dict[str, Any]]:
    """Export all configured layers."""
    conn = get_db_connection()
    results = []
    
    try:
        for layer_name in LAYER_CONFIG.keys():
            try:
                result = export_layer_to_geojson(conn, layer_name, jurisdiction, output_dir)
                results.append(result)
            except Exception as e:
                print(f"  ✗ Failed to export {layer_name}: {e}")
                results.append({
                    "layer": layer_name,
                    "error": str(e),
                })
    finally:
        conn.close()
    
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Export canonical tables to GeoJSON for tile generation"
    )
    parser.add_argument(
        "--layer",
        choices=list(LAYER_CONFIG.keys()) + ["all"],
        required=True,
        help="Layer to export (or 'all' for all layers)",
    )
    parser.add_argument(
        "--jurisdiction",
        help="Filter by jurisdiction (e.g., 'harris', 'travis')",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("export"),
        help="Output directory for GeoJSON files",
    )
    
    args = parser.parse_args()
    
    print(f"=== SiteIntel GeoJSON Export ===")
    print(f"Layer: {args.layer}")
    print(f"Jurisdiction: {args.jurisdiction or 'all'}")
    print(f"Output: {args.output_dir}")
    print()
    
    if args.layer == "all":
        results = export_all_layers(args.jurisdiction, args.output_dir)
    else:
        conn = get_db_connection()
        try:
            result = export_layer_to_geojson(conn, args.layer, args.jurisdiction, args.output_dir)
            results = [result]
        finally:
            conn.close()
    
    # Print summary
    print()
    print("=== Export Summary ===")
    total_records = 0
    total_size = 0
    for r in results:
        if "error" in r:
            print(f"  ✗ {r['layer']}: {r['error']}")
        else:
            total_records += r["record_count"]
            total_size += r["file_size"]
            print(f"  ✓ {r['layer']}: {r['record_count']:,} records ({r['file_size']:,} bytes)")
    
    print()
    print(f"Total: {total_records:,} records, {total_size:,} bytes")
    
    # Write manifest for downstream processing
    manifest_path = args.output_dir / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump({
            "exported_at": datetime.utcnow().isoformat(),
            "layers": results,
        }, f, indent=2)
    
    print(f"Manifest written to {manifest_path}")
    
    return 0 if all("error" not in r for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
