import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  
  // Expected path: /api-v1/applications or /api-v1/applications/{id}
  // pathParts will be like ["api-v1", "applications"] or ["api-v1", "applications", "{id}"]
  const resource = pathParts[1]; // "applications"
  const resourceId = pathParts[2]; // optional ID

  console.log(`[api-v1] ${req.method} ${url.pathname} - Resource: ${resource}, ID: ${resourceId}`);

  // Only support /applications resource for now
  if (resource !== "applications") {
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "NOT_FOUND", message: `Resource '${resource}' not found. Supported: /applications` }
    }, 404);
  }

  try {
    // Check auth - get user from JWT
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    switch (req.method) {
      case "GET":
        return resourceId 
          ? await getApplication(supabase, resourceId, userId)
          : await listApplications(supabase, url, userId);
      
      case "POST":
        if (!userId) {
          return jsonResponse<null>({
            success: false,
            data: null,
            error: { code: "UNAUTHORIZED", message: "Authentication required" }
          }, 401);
        }
        return await createApplication(supabase, req, userId);
      
      case "PATCH":
        if (!resourceId) {
          return jsonResponse<null>({
            success: false,
            data: null,
            error: { code: "BAD_REQUEST", message: "Application ID required for PATCH" }
          }, 400);
        }
        if (!userId) {
          return jsonResponse<null>({
            success: false,
            data: null,
            error: { code: "UNAUTHORIZED", message: "Authentication required" }
          }, 401);
        }
        return await updateApplication(supabase, resourceId, req, userId);
      
      case "DELETE":
        if (!resourceId) {
          return jsonResponse<null>({
            success: false,
            data: null,
            error: { code: "BAD_REQUEST", message: "Application ID required for DELETE" }
          }, 400);
        }
        if (!userId) {
          return jsonResponse<null>({
            success: false,
            data: null,
            error: { code: "UNAUTHORIZED", message: "Authentication required" }
          }, 401);
        }
        return await deleteApplication(supabase, resourceId, userId);
      
      default:
        return jsonResponse<null>({
          success: false,
          data: null,
          error: { code: "METHOD_NOT_ALLOWED", message: `Method ${req.method} not allowed` }
        }, 405);
    }
  } catch (error) {
    console.error("[api-v1] Unhandled error:", error);
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: error.message || "Internal server error" }
    }, 500);
  }
});

// Helper to create JSON responses
function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// GET /applications - List with pagination and filtering
async function listApplications(supabase: any, url: URL, userId: string | null) {
  const params = url.searchParams;
  
  // Pagination
  const limit = Math.min(parseInt(params.get("limit") || "20"), 100);
  const offset = parseInt(params.get("offset") || "0");
  
  // Field selection
  const selectFields = params.get("select") || "*";
  
  // Start query
  let query = supabase
    .from("applications")
    .select(selectFields, { count: "exact" });

  // Filter by user if authenticated (RLS will enforce this anyway)
  if (userId) {
    query = query.eq("user_id", userId);
  }

  // Filtering - support common fields
  const filterableFields = [
    "status", "enrichment_status", "city", "county", "zoning_code", 
    "floodplain_zone", "intent_type", "quality_level"
  ];
  
  for (const field of filterableFields) {
    const value = params.get(field);
    if (value) {
      query = query.eq(field, value);
    }
  }

  // Date range filtering
  const createdAfter = params.get("created_after");
  const createdBefore = params.get("created_before");
  if (createdAfter) query = query.gte("created_at", createdAfter);
  if (createdBefore) query = query.lte("created_at", createdBefore);

  // Sorting
  const sortBy = params.get("sort_by") || "created_at";
  const sortOrder = params.get("sort_order") || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[api-v1] List error:", error);
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "QUERY_ERROR", message: error.message }
    }, 400);
  }

  const total = count || 0;
  return jsonResponse({
    success: true,
    data: data || [],
    meta: {
      total,
      limit,
      offset,
      has_more: offset + limit < total
    }
  });
}

// GET /applications/{id} - Get single application
async function getApplication(supabase: any, id: string, userId: string | null) {
  let query = supabase
    .from("applications")
    .select("*")
    .eq("id", id);

  // Filter by user if authenticated
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return jsonResponse<null>({
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: `Application ${id} not found` }
      }, 404);
    }
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "QUERY_ERROR", message: error.message }
    }, 400);
  }

  return jsonResponse({ success: true, data });
}

// POST /applications - Create new application
async function createApplication(supabase: any, req: Request, userId: string) {
  const body = await req.json();
  
  // Required fields validation
  const requiredFields = ["full_name", "email", "phone", "company", "ownership_status", "existing_improvements", "stories_height", "project_type", "quality_level", "heard_about"];
  const missingFields = requiredFields.filter(f => !body[f]);
  
  if (missingFields.length > 0) {
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: `Missing required fields: ${missingFields.join(", ")}` }
    }, 400);
  }

  // Add user_id and defaults
  const applicationData = {
    ...body,
    user_id: userId,
    status: body.status || "draft",
    enrichment_status: "pending",
    consent_contact: body.consent_contact ?? false,
    consent_terms_privacy: body.consent_terms_privacy ?? false,
    marketing_opt_in: body.marketing_opt_in ?? false,
    nda_confidentiality: body.nda_confidentiality ?? false,
  };

  const { data, error } = await supabase
    .from("applications")
    .insert(applicationData)
    .select()
    .single();

  if (error) {
    console.error("[api-v1] Create error:", error);
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "INSERT_ERROR", message: error.message }
    }, 400);
  }

  console.log(`[api-v1] Created application ${data.id} for user ${userId}`);
  return jsonResponse({ success: true, data }, 201);
}

// PATCH /applications/{id} - Update application
async function updateApplication(supabase: any, id: string, req: Request, userId: string) {
  const body = await req.json();
  
  // Remove fields that shouldn't be updated directly
  delete body.id;
  delete body.user_id;
  delete body.created_at;
  
  // Add updated_at
  body.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("applications")
    .update(body)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return jsonResponse<null>({
        success: false,
        data: null,
        error: { code: "NOT_FOUND", message: `Application ${id} not found or not owned by user` }
      }, 404);
    }
    console.error("[api-v1] Update error:", error);
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "UPDATE_ERROR", message: error.message }
    }, 400);
  }

  console.log(`[api-v1] Updated application ${id}`);
  return jsonResponse({ success: true, data });
}

// DELETE /applications/{id} - Delete application
async function deleteApplication(supabase: any, id: string, userId: string) {
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("[api-v1] Delete error:", error);
    return jsonResponse<null>({
      success: false,
      data: null,
      error: { code: "DELETE_ERROR", message: error.message }
    }, 400);
  }

  console.log(`[api-v1] Deleted application ${id}`);
  return jsonResponse({ success: true, data: { id, deleted: true } });
}
