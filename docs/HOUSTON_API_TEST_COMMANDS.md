# Houston Utility API Direct Test Commands

This document provides `curl` commands to test Houston GIS utility endpoints directly, bypassing the BuildSmarter application. Use these to diagnose API connectivity and response issues.

## Test Location
**Address:** 4703 Merwin St, Houston, TX 77027  
**Coordinates:** 29.7307159, -95.4560118

---

## Phase 3: Direct API Testing

### 1. Water Distribution Mains (Layer 3)

**Endpoint:** `houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/3/query`

```bash
curl -v "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/3/query?geometry=%7B%22x%22%3A-95.4560118%2C%22y%22%3A29.7307159%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=1000&units=esriSRUnit_Foot&outFields=*&returnGeometry=true&f=json" \
  -H "User-Agent: BuildSmarter-Feasibility/1.0" \
  -H "Referer: https://buildsmarter.app"
```

**Expected Response:**
- Status: 200 OK
- Content-Type: application/json
- Body: `{ "features": [...], "geometryType": "esriGeometryPolyline" }`

**Common Errors:**
- 400: Invalid geometry or parameters
- 403: Authentication or CORS issue
- 500: Server error

---

### 2. Sewer Gravity Mains (Layer 3)

**Endpoint:** `houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3/query`

```bash
curl -v "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3/query?geometry=%7B%22x%22%3A-95.4560118%2C%22y%22%3A29.7307159%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=1000&units=esriSRUnit_Foot&outFields=DIAMETER,MATERIAL,OWNER,STATUS&returnGeometry=true&f=json" \
  -H "User-Agent: BuildSmarter-Feasibility/1.0" \
  -H "Referer: https://buildsmarter.app"
```

**Expected Response:**
- Status: 200 OK
- Features with `DIAMETER`, `MATERIAL`, `OWNER`, `STATUS` fields

---

### 3. Storm Drain Lines (Layer 0)

**Endpoint:** `houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainLineIPS/MapServer/0/query`

```bash
curl -v "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainLineIPS/MapServer/0/query?geometry=%7B%22x%22%3A-95.4560118%2C%22y%22%3A29.7307159%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=300&units=esriSRUnit_Foot&outFields=FACILITYID,PIPEID,DIAMETER,MATERIAL,INSTALL_YEAR,INSTALLDATE,OWNER,STATUS,CONDITION,ENABLED&returnGeometry=true&f=json" \
  -H "User-Agent: BuildSmarter-Feasibility/1.0" \
  -H "Referer: https://buildsmarter.app"
```

**Expected Response:**
- Status: 200 OK
- Features with `FACILITYID`, `DIAMETER`, `MATERIAL`, `INSTALL_YEAR`, `CONDITION` fields

---

## Troubleshooting Guide

### Issue: All APIs Return 400 "Invalid or missing input parameters"

**Cause:** Geometry parameter encoding or coordinate system mismatch

**Solution:**
1. Check if geometry JSON is properly URL-encoded
2. Verify `inSR` matches the coordinate system (4326 for WGS84, 2278 for Texas State Plane)
3. Ensure `spatialReference.wkid` in geometry matches `inSR`

---

### Issue: All APIs Return 403 Forbidden

**Cause:** Server blocking requests due to missing headers or CORS

**Solution:**
1. Add `User-Agent` header (some ArcGIS servers require this)
2. Add `Referer` header pointing to a valid domain
3. Check if server requires API key or authentication token

---

### Issue: APIs Return 200 but 0 Features

**Cause:** Search radius too small, or coordinates outside service area

**Solution:**
1. Increase `distance` parameter (e.g., 500 → 1000 ft)
2. Verify coordinates are in Houston area (lat ~29.7, lng ~-95.4)
3. Check if layer ID is correct (Water=3, Sewer=3, Storm=0)

---

### Issue: DNS Resolution Fails

**Cause:** `houstonwatergis.org` domain not accessible

**Solution:**
1. Check if domain is reachable: `ping houstonwatergis.org`
2. Try alternative DNS: `nslookup houstonwatergis.org 8.8.8.8`
3. If DNS fails, check if Houston Water GIS portal is down or moved

---

## Quick Validation Script

Run all three queries and check for 200 status:

```bash
#!/bin/bash

COORD_LAT="29.7307159"
COORD_LNG="-95.4560118"

echo "Testing Water API..."
curl -s -o /dev/null -w "%{http_code}" "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWaterLineIPS/MapServer/3/query?geometry=%7B%22x%22%3A${COORD_LNG}%2C%22y%22%3A${COORD_LAT}%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=1000&units=esriSRUnit_Foot&outFields=*&f=json"

echo "\nTesting Sewer API..."
curl -s -o /dev/null -w "%{http_code}" "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HWWastewaterLineIPS/MapServer/3/query?geometry=%7B%22x%22%3A${COORD_LNG}%2C%22y%22%3A${COORD_LAT}%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=1000&units=esriSRUnit_Foot&outFields=DIAMETER,MATERIAL,OWNER,STATUS&f=json"

echo "\nTesting Storm API..."
curl -s -o /dev/null -w "%{http_code}" "https://houstonwatergis.org/arcgis/rest/services/INFORHW/HPWStormdrainLineIPS/MapServer/0/query?geometry=%7B%22x%22%3A${COORD_LNG}%2C%22y%22%3A${COORD_LAT}%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=300&units=esriSRUnit_Foot&outFields=FACILITYID,DIAMETER,MATERIAL&f=json"
```

**Expected Output:**
```
Testing Water API...
200
Testing Sewer API...
200
Testing Storm API...
200
```

---

## Next Steps After Testing

1. **If all APIs return 200 with features:** The endpoints work! Issue is in BuildSmarter enrichment logic or credentials.
2. **If all APIs return 400:** Geometry encoding problem. Check `queryArcGIS` function's geometry JSON construction.
3. **If all APIs return 403/500:** Houston Water GIS portal may require authentication or be down. Contact Houston Water IT.
4. **If APIs work in curl but not in app:** CORS or DNS issue in Supabase Edge Functions environment.

---

## Contact Information

**Houston Water GIS Support:**  
- Portal: https://houstonwatergis.org  
- Email: (contact through Houston Water website)  
- Alternative: Use Houston Open Data Portal (data.houstontx.gov) for downloadable datasets

**BuildSmarter Support:**  
Check Supabase Edge Function logs for full error messages and request/response details.
