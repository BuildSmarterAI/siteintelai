import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// EDM Type mappings for metadata
const EDM_TYPES: Record<string, string> = {
  uuid: "Edm.Guid",
  text: "Edm.String",
  varchar: "Edm.String",
  integer: "Edm.Int32",
  bigint: "Edm.Int64",
  numeric: "Edm.Decimal",
  "double precision": "Edm.Double",
  boolean: "Edm.Boolean",
  timestamp: "Edm.DateTimeOffset",
  timestamptz: "Edm.DateTimeOffset",
  jsonb: "Edm.Untyped",
  json: "Edm.Untyped",
  "ARRAY": "Collection(Edm.String)",
};

// Application entity fields for EDM
const APPLICATION_FIELDS = [
  { name: "id", type: "Edm.Guid", nullable: false },
  { name: "created_at", type: "Edm.DateTimeOffset", nullable: false },
  { name: "updated_at", type: "Edm.DateTimeOffset", nullable: false },
  { name: "user_id", type: "Edm.Guid", nullable: false },
  { name: "status", type: "Edm.String", nullable: true },
  { name: "enrichment_status", type: "Edm.String", nullable: true },
  { name: "full_name", type: "Edm.String", nullable: false },
  { name: "email", type: "Edm.String", nullable: false },
  { name: "phone", type: "Edm.String", nullable: false },
  { name: "company", type: "Edm.String", nullable: false },
  { name: "formatted_address", type: "Edm.String", nullable: true },
  { name: "city", type: "Edm.String", nullable: true },
  { name: "county", type: "Edm.String", nullable: true },
  { name: "geo_lat", type: "Edm.Double", nullable: true },
  { name: "geo_lng", type: "Edm.Double", nullable: true },
  { name: "parcel_id", type: "Edm.String", nullable: true },
  { name: "parcel_owner", type: "Edm.String", nullable: true },
  { name: "acreage_cad", type: "Edm.Double", nullable: true },
  { name: "zoning_code", type: "Edm.String", nullable: true },
  { name: "floodplain_zone", type: "Edm.String", nullable: true },
  { name: "tot_market_val", type: "Edm.Double", nullable: true },
  { name: "traffic_aadt", type: "Edm.Int32", nullable: true },
  { name: "wetlands_type", type: "Edm.String", nullable: true },
  { name: "epa_facilities_count", type: "Edm.Int32", nullable: true },
];

const REPORT_FIELDS = [
  { name: "id", type: "Edm.Guid", nullable: false },
  { name: "created_at", type: "Edm.DateTimeOffset", nullable: false },
  { name: "updated_at", type: "Edm.DateTimeOffset", nullable: false },
  { name: "application_id", type: "Edm.Guid", nullable: false },
  { name: "user_id", type: "Edm.Guid", nullable: false },
  { name: "report_type", type: "Edm.String", nullable: false },
  { name: "status", type: "Edm.String", nullable: false },
  { name: "feasibility_score", type: "Edm.Int32", nullable: true },
  { name: "score_band", type: "Edm.String", nullable: true },
  { name: "pdf_url", type: "Edm.String", nullable: true },
  { name: "error_message", type: "Edm.String", nullable: true },
];

// Generate EDM Metadata XML
function generateMetadata(baseUrl: string): string {
  const applicationProperties = APPLICATION_FIELDS.map(
    (f) => `        <Property Name="${f.name}" Type="${f.type}" Nullable="${f.nullable}"/>`
  ).join("\n");

  const reportProperties = REPORT_FIELDS.map(
    (f) => `        <Property Name="${f.name}" Type="${f.type}" Nullable="${f.nullable}"/>`
  ).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="SiteIntel" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Application">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
${applicationProperties}
        <NavigationProperty Name="reports" Type="Collection(SiteIntel.Report)"/>
      </EntityType>
      <EntityType Name="Report">
        <Key>
          <PropertyRef Name="id"/>
        </Key>
${reportProperties}
        <NavigationProperty Name="application" Type="SiteIntel.Application"/>
      </EntityType>
      <EntityContainer Name="Default">
        <EntitySet Name="Applications" EntityType="SiteIntel.Application">
          <NavigationPropertyBinding Path="reports" Target="Reports"/>
        </EntitySet>
        <EntitySet Name="Reports" EntityType="SiteIntel.Report">
          <NavigationPropertyBinding Path="application" Target="Applications"/>
        </EntitySet>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;
}

// Parse OData filter expression to Supabase filters
function parseODataFilter(filter: string): Array<{ field: string; op: string; value: unknown }> {
  const filters: Array<{ field: string; op: string; value: unknown }> = [];
  
  // Split by 'and' (case insensitive)
  const conditions = filter.split(/\s+and\s+/i);
  
  for (const condition of conditions) {
    // Handle contains(field, 'value')
    const containsMatch = condition.match(/contains\((\w+),\s*'([^']+)'\)/i);
    if (containsMatch) {
      filters.push({ field: containsMatch[1], op: "ilike", value: `%${containsMatch[2]}%` });
      continue;
    }

    // Handle startswith(field, 'value')
    const startsWithMatch = condition.match(/startswith\((\w+),\s*'([^']+)'\)/i);
    if (startsWithMatch) {
      filters.push({ field: startsWithMatch[1], op: "ilike", value: `${startsWithMatch[2]}%` });
      continue;
    }

    // Handle endswith(field, 'value')
    const endsWithMatch = condition.match(/endswith\((\w+),\s*'([^']+)'\)/i);
    if (endsWithMatch) {
      filters.push({ field: endsWithMatch[1], op: "ilike", value: `%${endsWithMatch[2]}` });
      continue;
    }

    // Handle comparison operators: eq, ne, gt, ge, lt, le
    const compMatch = condition.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(?:'([^']*)'|(\d+(?:\.\d+)?)|null)/i);
    if (compMatch) {
      const field = compMatch[1];
      const op = compMatch[2].toLowerCase();
      let value: unknown = compMatch[3] ?? compMatch[4];
      
      // Convert to number if numeric
      if (compMatch[4]) {
        value = parseFloat(compMatch[4]);
      }
      
      // Map OData operators to Supabase operators
      const opMap: Record<string, string> = {
        eq: "eq",
        ne: "neq",
        gt: "gt",
        ge: "gte",
        lt: "lt",
        le: "lte",
      };
      
      filters.push({ field, op: opMap[op], value });
    }
  }
  
  return filters;
}

// Parse $select parameter
function parseSelect(select: string | null): string[] | null {
  if (!select || select === "*") return null;
  return select.split(",").map((f) => f.trim());
}

// Parse $orderby parameter
function parseOrderBy(orderby: string | null): { field: string; ascending: boolean } | null {
  if (!orderby) return null;
  const parts = orderby.trim().split(/\s+/);
  return {
    field: parts[0],
    ascending: parts[1]?.toLowerCase() !== "desc",
  };
}

// Authenticate request - supports JWT and API key
async function authenticate(
  req: Request
): Promise<{ userId: string | null; isApiKey: boolean; error?: string }> {
  const authHeader = req.headers.get("authorization");
  const apiKey = req.headers.get("x-api-key");

  // Try API key first
  if (apiKey) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Hash the API key for lookup (in production, use proper hashing)
    const keyHash = btoa(apiKey);
    
    const { data: keyData, error } = await supabase
      .from("api_keys")
      .select("user_id, scopes, expires_at, rate_limit_per_hour")
      .eq("key_hash", keyHash)
      .single();

    if (error || !keyData) {
      return { userId: null, isApiKey: true, error: "Invalid API key" };
    }

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { userId: null, isApiKey: true, error: "API key expired" };
    }

    // Check scopes (must have 'read' for OData)
    if (!keyData.scopes?.includes("read")) {
      return { userId: null, isApiKey: true, error: "API key lacks read scope" };
    }

    // Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("key_hash", keyHash);

    return { userId: keyData.user_id, isApiKey: true };
  }

  // Try JWT token
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { userId: null, isApiKey: false, error: "Invalid token" };
    }

    return { userId: user.id, isApiKey: false };
  }

  return { userId: null, isApiKey: false, error: "No authentication provided" };
}

// Build OData response
function buildODataResponse(
  context: string,
  data: unknown[],
  count?: number,
  nextLink?: string
): Record<string, unknown> {
  const response: Record<string, unknown> = {
    "@odata.context": context,
    value: data,
  };

  if (count !== undefined) {
    response["@odata.count"] = count;
  }

  if (nextLink) {
    response["@odata.nextLink"] = nextLink;
  }

  return response;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Remove 'odata' prefix from path
  const odataIndex = pathParts.findIndex((p) => p === "odata");
  const resourcePath = pathParts.slice(odataIndex + 1);

  console.log("[OData] Request:", req.method, url.pathname, "Path parts:", resourcePath);

  try {
    // Handle $metadata request
    if (resourcePath[0] === "$metadata" || resourcePath[0] === "%24metadata") {
      const baseUrl = `${SUPABASE_URL}/functions/v1/odata`;
      const metadata = generateMetadata(baseUrl);
      
      return new Response(metadata, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml",
        },
      });
    }

    // Handle service document (root)
    if (resourcePath.length === 0 || resourcePath[0] === "") {
      const baseUrl = `${SUPABASE_URL}/functions/v1/odata`;
      const serviceDoc = {
        "@odata.context": `${baseUrl}/$metadata`,
        value: [
          { name: "Applications", kind: "EntitySet", url: "Applications" },
          { name: "Reports", kind: "EntitySet", url: "Reports" },
        ],
      };

      return new Response(JSON.stringify(serviceDoc, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json;odata.metadata=minimal",
        },
      });
    }

    // Authenticate for entity requests
    const auth = await authenticate(req);
    if (auth.error) {
      return new Response(
        JSON.stringify({ error: { code: "Unauthorized", message: auth.error } }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const baseUrl = `${SUPABASE_URL}/functions/v1/odata`;

    // Parse query parameters
    const $filter = url.searchParams.get("$filter");
    const $select = url.searchParams.get("$select");
    const $orderby = url.searchParams.get("$orderby");
    const $top = url.searchParams.get("$top");
    const $skip = url.searchParams.get("$skip");
    const $count = url.searchParams.get("$count") === "true";
    const $expand = url.searchParams.get("$expand");

    // Determine entity set
    const entitySet = resourcePath[0];
    let tableName: string;
    let entityIdMatch: RegExpMatchArray | null = null;

    // Check for single entity request: Applications(uuid)
    if (entitySet.includes("(")) {
      entityIdMatch = entitySet.match(/(\w+)\(([^)]+)\)/);
    }

    const baseEntitySet = entityIdMatch ? entityIdMatch[1] : entitySet;

    switch (baseEntitySet) {
      case "Applications":
        tableName = "applications";
        break;
      case "Reports":
        tableName = "reports";
        break;
      default:
        return new Response(
          JSON.stringify({ error: { code: "NotFound", message: `Entity set '${baseEntitySet}' not found` } }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Build query
    let query = supabase.from(tableName).select(
      parseSelect($select)?.join(",") || "*",
      { count: $count ? "exact" : undefined }
    );

    // Filter by user_id for non-API key requests
    if (auth.userId && !auth.isApiKey) {
      query = query.eq("user_id", auth.userId);
    }

    // Handle single entity request
    if (entityIdMatch) {
      const entityId = entityIdMatch[2].replace(/'/g, "");
      query = query.eq("id", entityId);
    }

    // Apply $filter
    if ($filter) {
      const filters = parseODataFilter($filter);
      for (const f of filters) {
        switch (f.op) {
          case "eq":
            query = query.eq(f.field, f.value);
            break;
          case "neq":
            query = query.neq(f.field, f.value);
            break;
          case "gt":
            query = query.gt(f.field, f.value);
            break;
          case "gte":
            query = query.gte(f.field, f.value);
            break;
          case "lt":
            query = query.lt(f.field, f.value);
            break;
          case "lte":
            query = query.lte(f.field, f.value);
            break;
          case "ilike":
            query = query.ilike(f.field, f.value as string);
            break;
        }
      }
    }

    // Apply $orderby
    const orderBy = parseOrderBy($orderby);
    if (orderBy) {
      query = query.order(orderBy.field, { ascending: orderBy.ascending });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply $top and $skip for pagination
    const top = $top ? parseInt($top, 10) : 100;
    const skip = $skip ? parseInt($skip, 10) : 0;
    query = query.range(skip, skip + top - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("[OData] Query error:", error);
      return new Response(
        JSON.stringify({ error: { code: "QueryError", message: error.message } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle single entity response
    if (entityIdMatch) {
      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ error: { code: "NotFound", message: "Entity not found" } }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const entity = {
        "@odata.context": `${baseUrl}/$metadata#${baseEntitySet}/$entity`,
        ...data[0],
      };

      return new Response(JSON.stringify(entity, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json;odata.metadata=minimal",
        },
      });
    }

    // Build next link if there might be more results
    let nextLink: string | undefined;
    if (data && data.length === top && (!$count || (count && skip + top < count))) {
      const nextSkip = skip + top;
      const nextParams = new URLSearchParams(url.searchParams);
      nextParams.set("$skip", nextSkip.toString());
      nextLink = `${baseUrl}/${baseEntitySet}?${nextParams.toString()}`;
    }

    // Build response
    const response = buildODataResponse(
      `${baseUrl}/$metadata#${baseEntitySet}`,
      data || [],
      $count ? count ?? undefined : undefined,
      nextLink
    );

    console.log("[OData] Returning", data?.length || 0, "records", $count ? `(total: ${count})` : "");

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json;odata.metadata=minimal",
      },
    });

  } catch (err) {
    console.error("[OData] Error:", err);
    return new Response(
      JSON.stringify({ error: { code: "InternalError", message: String(err) } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
