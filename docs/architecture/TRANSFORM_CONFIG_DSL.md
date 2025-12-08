# SiteIntel™ transform_config DSL Reference

The `transform_config` is a declarative Domain-Specific Language (DSL) that defines how to convert **ANY** external GIS dataset into SiteIntel's canonical schema. This DSL is the engine behind SiteIntel's ability to onboard new cities, counties, and data sources in hours—not weeks.

Every dataset transformation—parcels, zoning, flood zones, utilities, traffic, stormwater, plats—is defined by a `transform_config` block. These configurations are version-controlled, human-readable, and self-documenting.

---

## Table of Contents

1. [Why This DSL Exists](#why-this-dsl-exists)
2. [DSL Structure Overview](#dsl-structure-overview)
3. [Source Configuration](#source-configuration)
4. [Target Configuration](#target-configuration)
5. [Field Mappings](#field-mappings)
6. [Transform Functions Reference](#transform-functions-reference)
7. [Geometry Configuration](#geometry-configuration)
8. [Filters Configuration](#filters-configuration)
9. [Deduplication Configuration](#deduplication-configuration)
10. [Validation Configuration](#validation-configuration)
11. [Scheduling Configuration](#scheduling-configuration)
12. [Error Handling](#error-handling)
13. [Complete Examples](#complete-examples)
14. [Best Practices](#best-practices)
15. [Cross-References](#cross-references)

---

## Why This DSL Exists

### The Problem

City and county GIS data is wildly inconsistent:

| Challenge | Reality |
|-----------|---------|
| **Field naming** | Houston uses `DIAMETER`, Fort Bend uses `PIPE_SIZE`, Dallas uses `SIZE_INCHES` |
| **Data types** | Same field may be string in one city, integer in another |
| **CRS projections** | Harris County uses EPSG:2278, Travis uses EPSG:2277 |
| **Schema changes** | Cities rename fields without warning, breaking integrations |
| **Missing fields** | Some datasets lack fields others have |
| **Code values** | Material codes vary: `PVC`, `POLYVINYL`, `1`, `PLASTIC` all mean the same thing |

Without a standardized transformation layer:
- Every new city requires custom data engineering
- Schema changes break pipelines silently
- No way to validate transformations before production
- Knowledge lives in code, not documentation

### The Solution

The `transform_config` DSL provides:

| Benefit | Description |
|---------|-------------|
| **Single format** | One JSON/YAML structure for ALL transformations |
| **Self-documenting** | Field mappings are human-readable |
| **Reusable patterns** | Lookup tables and functions work across cities |
| **Version-controlled** | Every config tracked in git |
| **Testable** | Dry-run mode validates before production |
| **Scalable** | Houston → Texas → National with same DSL |

---

## DSL Structure Overview

Every `transform_config` follows this high-level structure:

```json
{
  "transform_id": "hou_wastewater_gravity_mains",
  "version": "1.0.0",
  "description": "Transform Houston wastewater gravity mains to canonical schema",
  "enabled": true,
  
  "source": {
    "service_url": "https://cohgis.houstontx.gov/arcgis/rest/services/...",
    "layer_id": 0,
    "layer_name": "Gravity Mains"
  },
  
  "target": {
    "table": "utilities_sewer",
    "schema": "canonical_schema.utilities"
  },
  
  "field_mappings": [
    { "source": "DIAMETER", "target": "pipe_diameter", "type": "integer" }
  ],
  
  "geometry": {
    "source_crs": 2278,
    "target_crs": 3857,
    "operations": []
  },
  
  "filters": [],
  "deduplication": {},
  "validation": {},
  "scheduling": {},
  "error_handling": {}
}
```

### Top-Level Keys

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `transform_id` | string | ✓ | Unique identifier (snake_case) |
| `version` | string | ✓ | Semantic version (MAJOR.MINOR.PATCH) |
| `description` | string | ✓ | Human-readable description |
| `enabled` | boolean | | Enable/disable transform (default: true) |
| `source` | object | ✓ | Data source configuration |
| `target` | object | ✓ | Destination configuration |
| `field_mappings` | array | ✓ | Field transformation rules |
| `geometry` | object | | Geometry transformation rules |
| `filters` | array | | Pre-transform record filters |
| `deduplication` | object | | Duplicate handling strategy |
| `validation` | object | | Quality validation gates |
| `scheduling` | object | | ETL timing configuration |
| `error_handling` | object | | Error behavior configuration |

---

## Source Configuration

The `source` block defines where data comes from.

### Full Source Schema

```json
{
  "source": {
    "service_url": "https://cohgis.houstontx.gov/arcgis/rest/services/Utilities/Wastewater/MapServer",
    "layer_id": 0,
    "layer_name": "Gravity Mains",
    "service_type": "arcgis_rest",
    
    "pagination": {
      "max_record_count": 2000,
      "use_result_offset": true
    },
    
    "authentication": {
      "type": "token",
      "token_url": "https://example.com/generateToken",
      "username_env": "ARCGIS_USERNAME",
      "password_env": "ARCGIS_PASSWORD"
    },
    
    "request_headers": {
      "User-Agent": "SiteIntel-ETL/1.0"
    },
    
    "query_params": {
      "where": "LIFECYCLE != 'PROPOSED'",
      "outSR": 4326,
      "returnGeometry": true
    },
    
    "timeout_ms": 30000,
    "retry_count": 3,
    "retry_delay_ms": 5000
  }
}
```

### Source Field Reference

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `service_url` | string | ✓ | Base URL of the GIS service |
| `layer_id` | integer | ✓ | Layer index within service |
| `layer_name` | string | | Human-readable layer name |
| `service_type` | string | | Service type: `arcgis_rest`, `wfs`, `geojson`, `csv` |
| `pagination.max_record_count` | integer | | Records per request (default: 1000) |
| `pagination.use_result_offset` | boolean | | Use offset pagination (default: true) |
| `authentication.type` | string | | Auth type: `none`, `token`, `basic`, `api_key` |
| `authentication.token_url` | string | | Token generation endpoint |
| `authentication.username_env` | string | | Environment variable for username |
| `authentication.password_env` | string | | Environment variable for password |
| `request_headers` | object | | Custom HTTP headers |
| `query_params` | object | | Additional query parameters |
| `timeout_ms` | integer | | Request timeout (default: 30000) |
| `retry_count` | integer | | Retry attempts on failure (default: 3) |
| `retry_delay_ms` | integer | | Delay between retries (default: 5000) |

### Service Types

| Type | Description | Example |
|------|-------------|---------|
| `arcgis_rest` | Esri ArcGIS REST API | City GIS MapServers |
| `arcgis_feature` | Esri Feature Service | Editable layers |
| `wfs` | OGC Web Feature Service | State GIS portals |
| `geojson` | Static GeoJSON file | Pre-processed exports |
| `csv` | CSV with lat/lon columns | Tabular datasets |
| `shapefile` | Zipped shapefile | Legacy data |

---

## Target Configuration

The `target` block defines where transformed data goes.

### Full Target Schema

```json
{
  "target": {
    "table": "utilities_sewer",
    "schema": "canonical_schema.utilities",
    "database": "supabase",
    
    "upsert_key": ["pipe_id", "source_layer"],
    "partition_by": "county",
    
    "pre_load": [
      "DELETE FROM utilities_sewer WHERE source_layer = 'hou_gravity_mains'"
    ],
    
    "post_load": [
      "REFRESH MATERIALIZED VIEW mv_sewer_summary",
      "ANALYZE utilities_sewer"
    ],
    
    "indexes": [
      { "columns": ["pipe_id"], "unique": true },
      { "columns": ["geometry"], "type": "gist" }
    ]
  }
}
```

### Target Field Reference

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `table` | string | ✓ | PostGIS table name |
| `schema` | string | ✓ | Reference to canonical_schema domain |
| `database` | string | | Database target (default: supabase) |
| `upsert_key` | array | | Fields for upsert conflict resolution |
| `partition_by` | string | | Partitioning column |
| `pre_load` | array | | SQL to run before loading |
| `post_load` | array | | SQL to run after loading |
| `indexes` | array | | Index definitions |

---

## Field Mappings

The `field_mappings` array is the **core** of the DSL. Each mapping defines how a source field transforms to a target field.

### Basic Field Mapping

Direct field copy with type coercion:

```json
{
  "source": "DIAMETER",
  "target": "pipe_diameter",
  "type": "integer",
  "required": true,
  "description": "Pipe diameter in inches"
}
```

### Mapping with Transform Function

Apply a built-in transform function:

```json
{
  "source": "INSTALLDATE",
  "target": "install_year",
  "type": "integer",
  "transform": "extract_year_from_date",
  "description": "Year pipe was installed"
}
```

### Mapping with Lookup Table

Normalize code values using a lookup:

```json
{
  "source": "MATERIAL",
  "target": "material",
  "type": "string",
  "lookup": {
    "PVC": "PVC",
    "POLYVINYL": "PVC",
    "VCP": "VITRIFIED_CLAY",
    "VITRIFIED": "VITRIFIED_CLAY",
    "DIP": "DUCTILE_IRON",
    "DUCTILE": "DUCTILE_IRON",
    "CONC": "CONCRETE",
    "RCP": "REINFORCED_CONCRETE",
    "HDPE": "HIGH_DENSITY_PE",
    "UNKNOWN": "UNKNOWN",
    "_default": "UNKNOWN"
  },
  "description": "Pipe material normalized to standard codes"
}
```

The `_default` key handles unmatched values.

### Constant Value (No Source)

Insert a constant value with no source field:

```json
{
  "source": null,
  "target": "source_layer",
  "type": "string",
  "constant": "hou_gravity_mains",
  "description": "Source layer identifier"
}
```

### Computed Field (Multiple Sources)

Combine multiple source fields:

```json
{
  "source": ["RIM_ELEV", "INVERT_ELEV"],
  "target": "depth_ft",
  "type": "float",
  "transform": "calculate_depth",
  "description": "Calculated depth from rim to invert"
}
```

### Coalesce (First Non-Null)

Use first available value from multiple fields:

```json
{
  "source": ["PRIMARY_ADDRESS", "SECONDARY_ADDRESS", "SITUS"],
  "target": "address",
  "type": "string",
  "transform": "coalesce",
  "description": "Best available address"
}
```

### Concatenation

Join multiple fields:

```json
{
  "source": ["STREET_NUM", "STREET_NAME", "STREET_SUFFIX"],
  "target": "full_address",
  "type": "string",
  "transform": "concat",
  "separator": " ",
  "description": "Full street address"
}
```

### Field Mapping Schema

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `source` | string/array/null | ✓ | Source field(s) or null for constants |
| `target` | string | ✓ | Target field in canonical schema |
| `type` | string | ✓ | Target data type |
| `required` | boolean | | Fail if source is null (default: false) |
| `transform` | string | | Transform function name |
| `lookup` | object | | Code value lookup table |
| `constant` | any | | Constant value (when source is null) |
| `separator` | string | | Separator for concat (default: " ") |
| `default` | any | | Default if source is null |
| `description` | string | | Human-readable description |

### Supported Data Types

| Type | PostgreSQL | Description |
|------|------------|-------------|
| `string` | TEXT | Text/varchar |
| `integer` | INTEGER | Whole numbers |
| `float` | DOUBLE PRECISION | Decimal numbers |
| `boolean` | BOOLEAN | True/false |
| `date` | DATE | Date only |
| `timestamp` | TIMESTAMPTZ | Date with time |
| `json` | JSONB | JSON object |
| `geometry` | GEOMETRY | PostGIS geometry |
| `array_string` | TEXT[] | String array |
| `array_integer` | INTEGER[] | Integer array |

---

## Transform Functions Reference

Built-in transform functions available in field mappings.

### String Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `uppercase` | string | string | Convert to uppercase |
| `lowercase` | string | string | Convert to lowercase |
| `trim` | string | string | Remove leading/trailing whitespace |
| `trim_all` | string | string | Remove all excess whitespace |
| `left(n)` | string | string | First n characters |
| `right(n)` | string | string | Last n characters |
| `substring(start, len)` | string | string | Extract substring |
| `replace(old, new)` | string | string | Replace occurrences |
| `regex_extract(pattern)` | string | string | Extract regex match |
| `split(delimiter, index)` | string | string | Split and get index |

### Numeric Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `parse_int` | string/number | integer | Parse to integer |
| `parse_float` | string/number | float | Parse to float |
| `round(decimals)` | number | number | Round to decimals |
| `floor` | number | integer | Round down |
| `ceil` | number | integer | Round up |
| `abs` | number | number | Absolute value |
| `multiply(factor)` | number | number | Multiply by factor |
| `divide(divisor)` | number | number | Divide by divisor |
| `add(value)` | number | number | Add value |
| `subtract(value)` | number | number | Subtract value |

### Unit Conversion Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `sqft_to_acres` | number | number | Divide by 43,560 |
| `acres_to_sqft` | number | number | Multiply by 43,560 |
| `meters_to_feet` | number | number | Multiply by 3.28084 |
| `feet_to_meters` | number | number | Divide by 3.28084 |
| `inches_to_feet` | number | number | Divide by 12 |
| `sqm_to_sqft` | number | number | Multiply by 10.7639 |

### Date/Time Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `extract_year` | date/timestamp | integer | Extract year |
| `extract_month` | date/timestamp | integer | Extract month |
| `extract_day` | date/timestamp | integer | Extract day |
| `extract_year_from_date` | string | integer | Parse date string, extract year |
| `parse_date(format)` | string | date | Parse with format |
| `format_date(format)` | date | string | Format date |
| `current_timestamp` | - | timestamp | Current UTC time |
| `current_date` | - | date | Current UTC date |

### Boolean Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `parse_bool` | string/number | boolean | Parse to boolean |
| `is_null` | any | boolean | Check if null |
| `is_not_null` | any | boolean | Check if not null |
| `equals(value)` | any | boolean | Equality check |
| `not_equals(value)` | any | boolean | Inequality check |

### Special Functions

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `coalesce` | array | any | First non-null value |
| `concat` | array | string | Concatenate values |
| `calculate_depth` | [rim, invert] | number | rim_elev - invert_elev |
| `calculate_slope` | [up, down, len] | number | (up - down) / len * 100 |
| `generate_uuid` | - | string | Generate UUID v4 |
| `hash_md5` | string | string | MD5 hash |
| `json_extract(path)` | json | any | Extract from JSON path |

---

## Geometry Configuration

The `geometry` block defines how geometries are transformed.

### Full Geometry Schema

```json
{
  "geometry": {
    "source_field": "geometry",
    "source_crs": 2278,
    "target_crs": 3857,
    "target_type": "LineString",
    
    "operations": [
      {
        "type": "reproject",
        "from": 2278,
        "to": 3857
      },
      {
        "type": "repair",
        "method": "ST_MakeValid"
      },
      {
        "type": "simplify",
        "tolerance": 0.5,
        "preserve_topology": true
      },
      {
        "type": "force_2d"
      }
    ],
    
    "validation": {
      "require_valid": true,
      "require_non_empty": true,
      "min_area_sqft": 1,
      "max_vertices": 10000
    }
  }
}
```

### Geometry Configuration Fields

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `source_field` | string | | Source geometry field (default: geometry) |
| `source_crs` | integer | ✓ | Source EPSG code |
| `target_crs` | integer | ✓ | Target EPSG code (usually 3857) |
| `target_type` | string | | Expected geometry type |
| `operations` | array | | Ordered geometry operations |
| `validation` | object | | Geometry validation rules |

### Geometry Operations

| Operation | Parameters | Description |
|-----------|------------|-------------|
| `reproject` | `from`, `to` (EPSG codes) | CRS transformation |
| `repair` | `method` (ST_MakeValid) | Fix invalid geometries |
| `simplify` | `tolerance`, `preserve_topology` | Reduce vertex count |
| `densify` | `max_segment_length` | Add vertices to long segments |
| `clip` | `bbox` [minX, minY, maxX, maxY] | Clip to bounding box |
| `buffer` | `distance`, `units` | Buffer geometry |
| `centroid` | - | Convert to centroid point |
| `force_2d` | - | Drop Z/M dimensions |
| `force_polygon` | - | Convert to polygon |
| `reverse` | - | Reverse vertex order |
| `close_rings` | - | Ensure polygon rings are closed |

### CRS Reference (Texas)

| EPSG | Description | Counties |
|------|-------------|----------|
| 2278 | NAD83 / Texas South Central (ft) | Harris, Fort Bend, Montgomery |
| 2277 | NAD83 / Texas Central (ft) | Travis, Williamson |
| 2276 | NAD83 / Texas North Central (ft) | Dallas, Tarrant |
| 3857 | Web Mercator | **Target for all** |
| 4326 | WGS84 | Lat/lon reference |

---

## Filters Configuration

Pre-transform filters exclude records before processing.

### Filter Examples

```json
{
  "filters": [
    {
      "field": "LIFECYCLE",
      "operator": "not_in",
      "value": ["PROPOSED", "ABANDONED", "REMOVED"]
    },
    {
      "field": "DIAMETER",
      "operator": ">",
      "value": 0
    },
    {
      "field": "STATUS",
      "operator": "in",
      "value": ["ACTIVE", "IN_SERVICE", "UNKNOWN"]
    },
    {
      "field": "INSTALL_DATE",
      "operator": "is_not_null"
    },
    {
      "field": "OWNER",
      "operator": "contains",
      "value": "HOUSTON"
    }
  ],
  "filter_logic": "AND"
}
```

### Filter Operators

| Operator | Value Type | Description |
|----------|------------|-------------|
| `=` | any | Equals |
| `!=` | any | Not equals |
| `>` | number/date | Greater than |
| `>=` | number/date | Greater than or equal |
| `<` | number/date | Less than |
| `<=` | number/date | Less than or equal |
| `in` | array | Value in array |
| `not_in` | array | Value not in array |
| `is_null` | - | Field is null |
| `is_not_null` | - | Field is not null |
| `contains` | string | String contains (case-insensitive) |
| `not_contains` | string | String does not contain |
| `starts_with` | string | String starts with |
| `ends_with` | string | String ends with |
| `regex` | string | Matches regex pattern |
| `between` | [min, max] | Value between min and max |

### Filter Logic

| Value | Description |
|-------|-------------|
| `AND` | All filters must pass (default) |
| `OR` | Any filter must pass |

---

## Deduplication Configuration

Handle duplicate records in source data.

### Deduplication Schema

```json
{
  "deduplication": {
    "enabled": true,
    "key_fields": ["pipe_id"],
    "strategy": "keep_latest",
    "timestamp_field": "last_modified",
    "tie_breaker": "largest_geometry"
  }
}
```

### Deduplication Fields

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `enabled` | boolean | | Enable deduplication (default: true) |
| `key_fields` | array | ✓ | Fields defining uniqueness |
| `strategy` | string | ✓ | Deduplication strategy |
| `timestamp_field` | string | | Field for latest/earliest |
| `tie_breaker` | string | | Secondary sort for ties |

### Strategies

| Strategy | Description |
|----------|-------------|
| `keep_latest` | Keep record with latest timestamp |
| `keep_earliest` | Keep record with earliest timestamp |
| `keep_first` | Keep first occurrence (source order) |
| `keep_last` | Keep last occurrence (source order) |
| `keep_largest` | Keep record with largest geometry area |
| `keep_smallest` | Keep record with smallest geometry area |
| `merge` | Merge properties from all duplicates |

---

## Validation Configuration

Quality gates that records must pass.

### Validation Schema

```json
{
  "validation": {
    "geometry_type": ["LineString", "MultiLineString"],
    "require_geometry": true,
    "require_valid_geometry": true,
    
    "min_length_meters": 1,
    "max_length_meters": 10000,
    "min_area_sqft": null,
    "max_area_sqft": null,
    
    "require_fields": ["pipe_id", "diameter"],
    "reject_null_fields": ["pipe_id"],
    
    "value_ranges": {
      "diameter": { "min": 1, "max": 144 },
      "depth_ft": { "min": 0, "max": 100 },
      "slope_percent": { "min": -50, "max": 50 }
    },
    
    "allowed_values": {
      "material": ["PVC", "DUCTILE_IRON", "CONCRETE", "VITRIFIED_CLAY", "UNKNOWN"]
    },
    
    "regex_patterns": {
      "pipe_id": "^[A-Z0-9-]+$"
    },
    
    "on_failure": "skip_record",
    "log_failures": true,
    "max_failure_rate": 0.05
  }
}
```

### Validation Fields

| Key | Type | Description |
|-----|------|-------------|
| `geometry_type` | string/array | Allowed geometry types |
| `require_geometry` | boolean | Reject if geometry is null |
| `require_valid_geometry` | boolean | Reject invalid geometries |
| `min_length_meters` | number | Minimum line length |
| `max_length_meters` | number | Maximum line length |
| `min_area_sqft` | number | Minimum polygon area |
| `max_area_sqft` | number | Maximum polygon area |
| `require_fields` | array | Fields that must exist |
| `reject_null_fields` | array | Fields that cannot be null |
| `value_ranges` | object | Min/max for numeric fields |
| `allowed_values` | object | Enum constraints |
| `regex_patterns` | object | Regex patterns for strings |
| `on_failure` | string | Action on failure |
| `log_failures` | boolean | Log failed records |
| `max_failure_rate` | number | Fail job if rate exceeded |

### Failure Actions

| Action | Description |
|--------|-------------|
| `skip_record` | Skip record, continue processing |
| `null_field` | Set field to null, keep record |
| `default_value` | Use default value |
| `fail_job` | Stop entire job |
| `quarantine` | Move to quarantine table |

---

## Scheduling Configuration

ETL timing and frequency.

### Scheduling Schema

```json
{
  "scheduling": {
    "enabled": true,
    "frequency": "daily",
    "time": "03:00",
    "timezone": "America/Chicago",
    "day_of_week": null,
    "day_of_month": null,
    
    "retry_on_failure": true,
    "max_retries": 3,
    "retry_delay_minutes": 15,
    
    "priority": 1,
    "depends_on": ["hou_parcels"],
    
    "notifications": {
      "on_success": false,
      "on_failure": true,
      "channels": ["slack", "email"]
    }
  }
}
```

### Scheduling Fields

| Key | Type | Description |
|-----|------|-------------|
| `enabled` | boolean | Enable scheduled runs |
| `frequency` | string | Run frequency |
| `time` | string | Time of day (HH:MM) |
| `timezone` | string | IANA timezone |
| `day_of_week` | integer | 0-6 for weekly (0=Sunday) |
| `day_of_month` | integer | 1-31 for monthly |
| `retry_on_failure` | boolean | Retry failed jobs |
| `max_retries` | integer | Maximum retry attempts |
| `retry_delay_minutes` | integer | Delay between retries |
| `priority` | integer | Job priority (1=highest) |
| `depends_on` | array | Jobs that must complete first |

### Frequencies

| Frequency | Description |
|-----------|-------------|
| `hourly` | Every hour |
| `daily` | Once per day |
| `weekly` | Once per week |
| `monthly` | Once per month |
| `quarterly` | Once per quarter |
| `manual` | Manual trigger only |

---

## Error Handling

Configure behavior when errors occur.

### Error Handling Schema

```json
{
  "error_handling": {
    "on_source_unavailable": "use_cached",
    "on_source_timeout": "retry",
    "on_parse_error": "skip_record",
    "on_transform_error": "skip_record",
    "on_validation_failure": "log_and_skip",
    "on_load_error": "fail_job",
    
    "max_error_rate": 0.05,
    "max_consecutive_errors": 10,
    
    "alert_threshold": 100,
    "alert_channels": ["slack"],
    
    "fallback": {
      "enabled": true,
      "source_url": "https://backup.example.com/..."
    }
  }
}
```

### Error Actions

| Action | Description |
|--------|-------------|
| `retry` | Retry the operation |
| `skip_record` | Skip record, continue |
| `log_and_skip` | Log error, skip record |
| `use_cached` | Use cached data |
| `use_fallback` | Use fallback source |
| `fail_job` | Stop entire job |
| `alert` | Send alert, continue |

---

## Complete Examples

### Example 1: Houston Wastewater Gravity Mains

Complete transform config for wastewater lines:

```json
{
  "transform_id": "hou_wastewater_gravity_mains",
  "version": "2.1.0",
  "description": "Houston Water wastewater gravity mains to canonical utilities schema",
  "enabled": true,
  
  "source": {
    "service_url": "https://cogis.houstontx.gov/arcgis/rest/services/PW/Wastewater_Sewer/MapServer",
    "layer_id": 1,
    "layer_name": "Gravity Mains",
    "service_type": "arcgis_rest",
    "pagination": {
      "max_record_count": 2000
    },
    "timeout_ms": 60000
  },
  
  "target": {
    "table": "utilities_sewer",
    "schema": "canonical_schema.utilities",
    "upsert_key": ["pipe_id", "source_layer"]
  },
  
  "field_mappings": [
    {
      "source": "FACILITYID",
      "target": "pipe_id",
      "type": "string",
      "required": true
    },
    {
      "source": "DIAMETER",
      "target": "diameter_inches",
      "type": "integer",
      "default": 0
    },
    {
      "source": "MATERIAL",
      "target": "material",
      "type": "string",
      "lookup": {
        "PVC": "PVC",
        "VCP": "VITRIFIED_CLAY",
        "DIP": "DUCTILE_IRON",
        "CONC": "CONCRETE",
        "RCP": "REINFORCED_CONCRETE",
        "HDPE": "HIGH_DENSITY_PE",
        "_default": "UNKNOWN"
      }
    },
    {
      "source": "INSTALLDATE",
      "target": "install_year",
      "type": "integer",
      "transform": "extract_year_from_date"
    },
    {
      "source": ["UPELEV", "DOWNELEV"],
      "target": "avg_depth_ft",
      "type": "float",
      "transform": "calculate_depth"
    },
    {
      "source": "LIFECYCLESTATUS",
      "target": "status",
      "type": "string",
      "lookup": {
        "ACTIVE": "ACTIVE",
        "INACTIVE": "INACTIVE",
        "ABANDONED": "ABANDONED",
        "_default": "UNKNOWN"
      }
    },
    {
      "source": null,
      "target": "source_layer",
      "type": "string",
      "constant": "hou_gravity_mains"
    },
    {
      "source": null,
      "target": "ingested_at",
      "type": "timestamp",
      "transform": "current_timestamp"
    }
  ],
  
  "geometry": {
    "source_crs": 2278,
    "target_crs": 3857,
    "target_type": "LineString",
    "operations": [
      { "type": "reproject", "from": 2278, "to": 3857 },
      { "type": "repair", "method": "ST_MakeValid" },
      { "type": "force_2d" }
    ]
  },
  
  "filters": [
    {
      "field": "LIFECYCLESTATUS",
      "operator": "not_in",
      "value": ["PROPOSED", "REMOVED"]
    },
    {
      "field": "DIAMETER",
      "operator": ">",
      "value": 0
    }
  ],
  
  "deduplication": {
    "key_fields": ["FACILITYID"],
    "strategy": "keep_latest",
    "timestamp_field": "LASTUPDATE"
  },
  
  "validation": {
    "geometry_type": ["LineString", "MultiLineString"],
    "require_geometry": true,
    "min_length_meters": 0.5,
    "require_fields": ["pipe_id"],
    "value_ranges": {
      "diameter_inches": { "min": 1, "max": 144 }
    },
    "on_failure": "skip_record"
  },
  
  "scheduling": {
    "frequency": "daily",
    "time": "03:00",
    "timezone": "America/Chicago",
    "priority": 2
  },
  
  "error_handling": {
    "on_source_unavailable": "use_cached",
    "on_parse_error": "skip_record",
    "max_error_rate": 0.05
  }
}
```

### Example 2: HCAD Parcels

Complete transform config for Harris County parcels:

```json
{
  "transform_id": "hcad_parcels",
  "version": "3.0.0",
  "description": "Harris County Appraisal District parcels to canonical parcel schema",
  "enabled": true,
  
  "source": {
    "service_url": "https://www.gis.hctx.net/arcgis/rest/services/HCAD/Parcels/MapServer",
    "layer_id": 0,
    "layer_name": "Parcels",
    "pagination": {
      "max_record_count": 1000
    }
  },
  
  "target": {
    "table": "parcels",
    "schema": "canonical_schema.parcel",
    "upsert_key": ["parcel_id", "county"]
  },
  
  "field_mappings": [
    {
      "source": "ACCOUNT",
      "target": "parcel_id",
      "type": "string",
      "required": true
    },
    {
      "source": "ACCOUNT",
      "target": "apn",
      "type": "string"
    },
    {
      "source": null,
      "target": "county",
      "type": "string",
      "constant": "HARRIS"
    },
    {
      "source": "SITUS_CITY",
      "target": "city",
      "type": "string",
      "transform": "uppercase"
    },
    {
      "source": null,
      "target": "state",
      "type": "string",
      "constant": "TX"
    },
    {
      "source": ["SITUS_NUM", "SITUS_STREET", "SITUS_STREET_SUFFIX"],
      "target": "situs_address",
      "type": "string",
      "transform": "concat",
      "separator": " "
    },
    {
      "source": "OWNER_NAME",
      "target": "owner_name",
      "type": "string"
    },
    {
      "source": "LEGAL_ACREAGE",
      "target": "acreage",
      "type": "float"
    },
    {
      "source": "LAND_SQFT",
      "target": "area_sqft",
      "type": "float"
    },
    {
      "source": "TOTAL_MARKET_VALUE",
      "target": "market_value",
      "type": "float"
    },
    {
      "source": "LAND_VALUE",
      "target": "land_value",
      "type": "float"
    },
    {
      "source": "IMPROVEMENT_VALUE",
      "target": "improvement_value",
      "type": "float"
    },
    {
      "source": "STATE_CLASS_CODE",
      "target": "land_use_code",
      "type": "string"
    },
    {
      "source": "YEAR_BUILT",
      "target": "year_built",
      "type": "integer"
    },
    {
      "source": "BUILDING_SQFT",
      "target": "building_sqft",
      "type": "float"
    },
    {
      "source": null,
      "target": "source_layer",
      "type": "string",
      "constant": "hcad_parcels"
    }
  ],
  
  "geometry": {
    "source_crs": 2278,
    "target_crs": 3857,
    "target_type": "Polygon",
    "operations": [
      { "type": "reproject", "from": 2278, "to": 3857 },
      { "type": "repair", "method": "ST_MakeValid" },
      { "type": "force_2d" }
    ]
  },
  
  "filters": [
    {
      "field": "ACCOUNT",
      "operator": "is_not_null"
    }
  ],
  
  "deduplication": {
    "key_fields": ["ACCOUNT"],
    "strategy": "keep_latest"
  },
  
  "validation": {
    "geometry_type": ["Polygon", "MultiPolygon"],
    "require_geometry": true,
    "min_area_sqft": 100,
    "require_fields": ["parcel_id"],
    "on_failure": "skip_record"
  },
  
  "scheduling": {
    "frequency": "weekly",
    "day_of_week": 0,
    "time": "02:00",
    "timezone": "America/Chicago",
    "priority": 1
  }
}
```

### Example 3: Fire Hydrants (Point Layer)

```json
{
  "transform_id": "hou_fire_hydrants",
  "version": "1.0.0",
  "description": "Houston fire hydrants to canonical utilities schema",
  "enabled": true,
  
  "source": {
    "service_url": "https://cogis.houstontx.gov/arcgis/rest/services/PW/Water/MapServer",
    "layer_id": 5,
    "layer_name": "Fire Hydrants"
  },
  
  "target": {
    "table": "utilities_water_points",
    "schema": "canonical_schema.utilities",
    "upsert_key": ["hydrant_id", "source_layer"]
  },
  
  "field_mappings": [
    {
      "source": "FACILITYID",
      "target": "hydrant_id",
      "type": "string",
      "required": true
    },
    {
      "source": "HYDRANTTYPE",
      "target": "hydrant_type",
      "type": "string",
      "lookup": {
        "WET": "WET_BARREL",
        "DRY": "DRY_BARREL",
        "FLUSH": "FLUSH",
        "_default": "UNKNOWN"
      }
    },
    {
      "source": "MANUFACTURER",
      "target": "manufacturer",
      "type": "string"
    },
    {
      "source": "INSTALLDATE",
      "target": "install_year",
      "type": "integer",
      "transform": "extract_year_from_date"
    },
    {
      "source": "FLOWRATE",
      "target": "flow_rate_gpm",
      "type": "float"
    },
    {
      "source": null,
      "target": "source_layer",
      "type": "string",
      "constant": "hou_fire_hydrants"
    }
  ],
  
  "geometry": {
    "source_crs": 2278,
    "target_crs": 3857,
    "target_type": "Point",
    "operations": [
      { "type": "reproject", "from": 2278, "to": 3857 }
    ]
  },
  
  "validation": {
    "geometry_type": "Point",
    "require_geometry": true,
    "require_fields": ["hydrant_id"]
  },
  
  "scheduling": {
    "frequency": "monthly",
    "day_of_month": 1,
    "time": "04:00",
    "timezone": "America/Chicago"
  }
}
```

---

## Best Practices

### 1. Always Include Source Metadata

```json
{
  "source": null,
  "target": "source_layer",
  "type": "string",
  "constant": "hou_gravity_mains"
},
{
  "source": null,
  "target": "ingested_at",
  "type": "timestamp",
  "transform": "current_timestamp"
}
```

### 2. Use Lookup Tables for Code Normalization

Never trust source codes directly. Always normalize:

```json
{
  "lookup": {
    "PVC": "PVC",
    "POLYVINYL": "PVC",
    "P.V.C.": "PVC",
    "_default": "UNKNOWN"
  }
}
```

### 3. Set Reasonable Validation Bounds

Catch data quality issues early:

```json
{
  "value_ranges": {
    "diameter_inches": { "min": 1, "max": 144 },
    "year_built": { "min": 1800, "max": 2030 }
  }
}
```

### 4. Version Control All Configs

- Store configs in git
- Use semantic versioning
- Document changes in commit messages
- Review config changes like code

### 5. Test with Dry Run

Before production:

```json
{
  "scheduling": {
    "dry_run": true
  }
}
```

### 6. Set Dependencies Correctly

Ensure data loads in correct order:

```json
{
  "scheduling": {
    "depends_on": ["hou_parcels", "hou_zoning"]
  }
}
```

### 7. Handle Nulls Explicitly

```json
{
  "source": "DIAMETER",
  "target": "diameter_inches",
  "type": "integer",
  "default": 0,
  "required": false
}
```

### 8. Document Field Mappings

```json
{
  "source": "UPELEV",
  "target": "upstream_elevation_ft",
  "type": "float",
  "description": "Upstream invert elevation in feet NAVD88"
}
```

---

## Cross-References

| Document | Description |
|----------|-------------|
| [CANONICAL_SCHEMA.md](./CANONICAL_SCHEMA.md) | Target schema definitions |
| [HOUSTON_REPLICATION_MOAT.md](./HOUSTON_REPLICATION_MOAT.md) | Houston-specific implementations |
| [GIS_SPATIAL_LOGIC.md](./GIS_SPATIAL_LOGIC.md) | Spatial query patterns |
| [gis-fetch-with-versioning](../../supabase/functions/gis-fetch-with-versioning/index.ts) | ETL execution engine |
| [map_server_layers table](../database-schema.md) | Layer configuration storage |

---

## Appendix: Quick Reference Card

### Minimal Config Template

```json
{
  "transform_id": "{{jurisdiction}}_{{layer_type}}",
  "version": "1.0.0",
  "description": "{{Description}}",
  "enabled": true,
  
  "source": {
    "service_url": "{{URL}}",
    "layer_id": 0
  },
  
  "target": {
    "table": "{{table}}",
    "schema": "canonical_schema.{{domain}}",
    "upsert_key": ["{{primary_key}}", "source_layer"]
  },
  
  "field_mappings": [
    { "source": "{{ID_FIELD}}", "target": "{{id}}", "type": "string", "required": true },
    { "source": null, "target": "source_layer", "type": "string", "constant": "{{transform_id}}" },
    { "source": null, "target": "ingested_at", "type": "timestamp", "transform": "current_timestamp" }
  ],
  
  "geometry": {
    "source_crs": 2278,
    "target_crs": 3857
  },
  
  "validation": {
    "require_geometry": true,
    "on_failure": "skip_record"
  },
  
  "scheduling": {
    "frequency": "daily",
    "time": "03:00",
    "timezone": "America/Chicago"
  }
}
```

### Common Transform Functions

| Function | Use Case |
|----------|----------|
| `extract_year_from_date` | Date → Year |
| `uppercase` | Normalize strings |
| `coalesce` | First non-null |
| `concat` | Join fields |
| `sqft_to_acres` | Area conversion |
| `meters_to_feet` | Length conversion |
| `current_timestamp` | Ingestion time |

### Common CRS Codes

| EPSG | Region |
|------|--------|
| 2278 | Houston/Harris |
| 2277 | Austin/Travis |
| 2276 | Dallas/Tarrant |
| 3857 | Web Mercator (target) |

---

*This DSL is the foundation of SiteIntel's ability to scale from Houston → Texas → National. Every new jurisdiction, every new dataset type, every schema change is handled by writing a `transform_config`—not custom code.*
