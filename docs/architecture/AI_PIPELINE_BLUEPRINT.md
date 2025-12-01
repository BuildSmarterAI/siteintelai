# AI Pipeline & LLM Response Blueprint — BuildSmarter™ Feasibility

## 1. AI Pipeline Overview

**Goal**: Deterministically transform normalized parcel/overlay data into a lender-ready report JSON (strict schema) and PDF narrative, with auditable citations and resilient recovery.

### End-to-End Sequence

1. **Intake** (validated) → `applications` row created; job state = `queued`
2. **Enrichment** (GIS/Open data retrieval) → `applications` scalars + `enrichment_raw` JSONB; job = `enriching`
3. **Context packing** → build inputs (normalized scalars), sources[] (datasets + as-of), features[] (compact snippets)
4. **LLM pass #1** → emit schema-conformant report JSON; job = `ai`
5. **Validation** (JSON Schema 2020-12)
   - **Pass** → PDF compose → Storage → signed URLs; job = `rendering` → `complete`
   - **Fail** → guardrail loop (self-correction) then minimal viable JSON fallback; job = `error` only if fallback also fails
6. **Exposed via OData** (read-only): FeasibilityScore, ScoreBand, AsOf, etc.

### Job States (Idempotent)

`queued` → `enriching` → `ai` → `rendering` → `complete` | `error`

**Idempotency**: Each transition writes a monotonic `status_rev` and hash of prior artifacts; re-invocations short-circuit when the same hash is observed.

## 2. Prompt Stack & Context Packing

### 2.1 System Prompt (Verbatim Template)

```
You are a reliability-focused Feasibility AI. Output MUST be valid JSON matching the provided JSON Schema.

- US customary units (ft, mi, $/SF); include a unit label where ambiguous.
- No fabricated sources, endpoints, or figures. Cite ONLY items provided in sources[].
- If a section lacks evidence, set status:"unknown", add a constraints note, and include empty citations:[]
- Keep prose concise, lender-friendly, and free of marketing claims.
- Never output anything outside of JSON.
```

### 2.2 Instruction Prompt (Verbatim Template)

```
TASK: Produce the feasibility report JSON for the parcel context below.

REQUIREMENTS:

1. Conform EXACTLY to the supplied JSON Schema.
2. Compute feasibility_score using the weights block. Derive score_band by thresholds.
3. Each section (zoning, flood, utilities, environmental, cost_schedule) must contain:
   - status, key_findings[], constraints[], risk_mitigation[], citations[]
4. Citations: use only datasets in sources[]. Include dataset, endpoint, query (plain), as_of timestamp.
5. If a datum is unknown, write "unknown" (not null). Populate data_flags accordingly.
6. Keep executive_summary ≤ 120 words.
7. Include a compact figures[] array with rendering hints.
```

### 2.3 Context JSON (Example)

```json
{
  "parcel": {
    "address": "123 Main St, Houston, TX",
    "apn": "123-456-7890",
    "acreage": 1.23
  },
  "zoning": {
    "code": "R-3",
    "overlay": "Historic District"
  },
  "flood": {
    "zone": "AE",
    "base_flood_elevation": 12.3
  },
  "utilities": {
    "water": "Available",
    "sewer": "Available"
  },
  "environmental": {
    "sites": []
  },
  "traffic": {
    "aadt": 12345
  },
  "demographics": {
    "population": 1234
  },
  "sources": [
    {
      "dataset": "HCAD",
      "endpoint": "https://...",
      "query": "...",
      "as_of": "2024-11-01"
    },
    {
      "dataset": "FEMA",
      "endpoint": "https://...",
      "query": "...",
      "as_of": "2024-10-26"
    }
  ],
  "features": [
    "High traffic volume",
    "Located in flood zone AE"
  ]
}
```

### 2.4 JSON Schema Definition (Example)

```json
{
  "type": "object",
  "properties": {
    "feasibility_score": {
      "type": "integer",
      "description": "Overall feasibility score (0-100)"
    },
    "score_band": {
      "type": "string",
      "enum": ["High", "Medium", "Low"]
    },
    "executive_summary": {
      "type": "string",
      "description": "Executive summary (≤ 120 words)"
    },
    "zoning": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "unknown", "constrained"]
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "risk_mitigation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dataset": {
                "type": "string"
              },
              "endpoint": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "as_of": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["dataset", "endpoint", "query", "as_of"]
          }
        }
      },
      "required": [
        "status",
        "key_findings",
        "constraints",
        "risk_mitigation",
        "citations"
      ]
    },
    "flood": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "unknown", "constrained"]
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "risk_mitigation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dataset": {
                "type": "string"
              },
              "endpoint": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "as_of": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["dataset", "endpoint", "query", "as_of"]
          }
        }
      },
      "required": [
        "status",
        "key_findings",
        "constraints",
        "risk_mitigation",
        "citations"
      ]
    },
    "utilities": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "unknown", "constrained"]
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "risk_mitigation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dataset": {
                "type": "string"
              },
              "endpoint": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "as_of": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["dataset", "endpoint", "query", "as_of"]
          }
        }
      },
      "required": [
        "status",
        "key_findings",
        "constraints",
        "risk_mitigation",
        "citations"
      ]
    },
    "environmental": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "unknown", "constrained"]
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "risk_mitigation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dataset": {
                "type": "string"
              },
              "endpoint": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "as_of": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["dataset", "endpoint", "query", "as_of"]
          }
        }
      },
      "required": [
        "status",
        "key_findings",
        "constraints",
        "risk_mitigation",
        "citations"
      ]
    },
    "cost_schedule": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": ["ok", "unknown", "constrained"]
        },
        "key_findings": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "risk_mitigation": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "citations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "dataset": {
                "type": "string"
              },
              "endpoint": {
                "type": "string"
              },
              "query": {
                "type": "string"
              },
              "as_of": {
                "type": "string",
                "format": "date"
              }
            },
            "required": ["dataset", "endpoint", "query", "as_of"]
          }
        }
      },
      "required": [
        "status",
        "key_findings",
        "constraints",
        "risk_mitigation",
        "citations"
      ]
    },
    "figures": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["map", "table", "chart"]
          },
          "url": {
            "type": "string"
          },
          "caption": {
            "type": "string"
          }
        },
        "required": ["type", "url", "caption"]
      }
    }
  },
  "required": [
    "feasibility_score",
    "score_band",
    "executive_summary",
    "zoning",
    "flood",
    "utilities",
    "environmental",
    "cost_schedule",
    "figures"
  ]
}
```

## 3. Feasibility Scoring Function

### 3.1 Scoring Weights (Example)

```json
{
  "weights": {
    "zoning": 0.25,
    "flood": 0.25,
    "utilities": 0.20,
    "environmental": 0.15,
    "traffic": 0.15
  },
  "thresholds": {
    "High": 75,
    "Medium": 50,
    "Low": 0
  }
}
```

### 3.2 Scoring Logic (Conceptual)

```typescript
function calculateFeasibilityScore(data: any, weights: any): number {
  let score = 0;

  score += data.zoning.status === "ok" ? weights.zoning : 0;
  score += data.flood.status === "ok" ? weights.flood : 0;
  score += data.utilities.status === "ok" ? weights.utilities : 0;
  score += data.environmental.status === "ok" ? weights.environmental : 0;
  score += data.traffic.status === "ok" ? weights.traffic : 0;

  return score * 100;
}

function getScoreBand(score: number, thresholds: any): string {
  if (score >= thresholds.High) {
    return "High";
  } else if (score >= thresholds.Medium) {
    return "Medium";
  } else {
    return "Low";
  }
}
```

## 4. Section Templates

### 4.1 Zoning Template

```json
{
  "status": "ok",
  "key_findings": [
    "Property is zoned R-3, allowing for multi-family development"
  ],
  "constraints": [],
  "risk_mitigation": [],
  "citations": [
    {
      "dataset": "HCAD",
      "endpoint": "https://...",
      "query": "...",
      "as_of": "2024-11-01"
    }
  ]
}
```

### 4.2 Flood Template

```json
{
  "status": "constrained",
  "key_findings": ["Property is located in flood zone AE"],
  "constraints": ["Development may require flood insurance"],
  "risk_mitigation": ["Elevate building above base flood elevation"],
  "citations": [
    {
      "dataset": "FEMA",
      "endpoint": "https://...",
      "query": "...",
      "as_of": "2024-10-26"
    }
  ]
}
```

## 5. Citation Policy

### 5.1 Dataset Prioritization

1.  Authoritative local (e.g., HCAD, city GIS)
2.  Authoritative federal (e.g., FEMA, EPA)
3.  Reputable open data (e.g., OpenStreetMap)

### 5.2 Endpoint Conventions

-   ArcGIS FeatureServer/MapServer: include layer ID
-   Open APIs: include full URL + query parameters

### 5.3 As-of Timestamps

-   Use dataset-specific refresh dates where available (e.g., FEMA lastDataSetRefresh)
-   Otherwise, use API query timestamp

## 6. Retry/Fallback

### 6.1 Guardrail Loop

-   If JSON schema validation fails:
    1.  Re-prompt with error message + constraints
    2.  Limit retry attempts (e.g., 3)

### 6.2 Minimal Viable JSON

-   If guardrail fails:
    1.  Return JSON with `status: "unknown"` for all sections
    2.  Include error message in `constraints`

## 7. Controls

### 7.1 Temperature

-   Set low (e.g., 0.1-0.3) for deterministic output

### 7.2 Token Limit

-   Allocate sufficient tokens for context + response
-   Implement truncation if necessary

### 7.3 Data Flags

-   Populate `data_flags` array to track missing/invalid data

[Content continues with full implementation details as in original file]
