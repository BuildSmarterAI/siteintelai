/**
 * SiteIntel™ Design Mode - Bootstrap Endpoint
 * 
 * Single endpoint that returns all needed data for design mode initialization.
 * Replaces the waterfall of: auth → application → envelope → session → variants
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BootstrapResponse {
  success: boolean;
  auth: {
    authenticated: boolean;
    userId: string | null;
  };
  application: {
    id: string;
    address: string | null;
    parcelId: string | null;
    parcelGeometry: unknown | null;
    status: string;
  } | null;
  envelope: {
    status: 'ready' | 'pending' | 'not_found' | 'error';
    id: string | null;
    data: {
      parcelGeometry: unknown;
      buildableFootprint2d: unknown;
      farCap: number;
      heightCapFt: number;
      coverageCapPct: number;
      setbacks: unknown;
    } | null;
    error: string | null;
  };
  session: {
    id: string;
    name: string;
    designIntent: unknown | null;
    wizardStep: number | null;
    isNew: boolean;
  } | null;
  variants: Array<{
    id: string;
    name: string;
    footprint: unknown;
    heightFt: number;
    floors: number;
    complianceStatus: string;
    sortOrder: number;
  }>;
  activeVariantId: string | null;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const url = new URL(req.url);
    const applicationId = url.searchParams.get('applicationId');

    if (!applicationId) {
      return new Response(
        JSON.stringify({ error: 'Missing applicationId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let authenticated = false;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} }
    });

    // Verify auth if header present
    if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (!authError && user) {
        userId = user.id;
        authenticated = true;
      }
    }

    console.log('[design-mode-bootstrap] Starting bootstrap for application:', applicationId, 'User:', userId);

    // Fetch application data
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, formatted_address, parcel_id, status, geo_lat, geo_lng')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      console.error('[design-mode-bootstrap] Application not found:', appError);
      return new Response(
        JSON.stringify({
          success: false,
          auth: { authenticated, userId },
          application: null,
          envelope: { status: 'error', id: null, data: null, error: 'Application not found' },
          session: null,
          variants: [],
          activeVariantId: null,
          error: 'Application not found',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch envelope for this application
    const { data: envelope, error: envelopeError } = await supabase
      .from('regulatory_envelopes')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let envelopeStatus: 'ready' | 'pending' | 'not_found' | 'error' = 'not_found';
    let envelopeData = null;
    let envelopeId = null;
    let envelopeErrorMsg = null;

    if (envelopeError) {
      console.error('[design-mode-bootstrap] Envelope query error:', envelopeError);
      envelopeStatus = 'error';
      envelopeErrorMsg = envelopeError.message;
    } else if (envelope) {
      envelopeId = envelope.id;
      envelopeStatus = 'ready';
      envelopeData = {
        parcelGeometry: envelope.parcel_geometry,
        buildableFootprint2d: envelope.buildable_footprint_2d,
        farCap: envelope.far_cap || 0.75,
        heightCapFt: envelope.height_cap_ft || 55,
        coverageCapPct: envelope.coverage_cap_pct || 85,
        setbacks: envelope.setbacks || { front: 25, rear: 15, left: 10, right: 10 },
      };
    }

    // Fetch or create session if authenticated and envelope exists
    let session = null;
    let variants: BootstrapResponse['variants'] = [];
    let activeVariantId = null;

    if (authenticated && userId && envelopeId) {
      // Try to find existing active session
      const { data: existingSession, error: sessionError } = await supabase
        .from('design_sessions')
        .select('*')
        .eq('envelope_id', envelopeId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('[design-mode-bootstrap] Session query error:', sessionError);
      } else if (existingSession) {
        // Use existing session
        session = {
          id: existingSession.id,
          name: existingSession.name,
          designIntent: existingSession.design_intent,
          wizardStep: existingSession.design_intent?.wizard?.currentStep || null,
          isNew: false,
        };

        // Fetch variants for this session
        const { data: sessionVariants, error: variantsError } = await supabase
          .from('design_variants')
          .select('id, name, footprint, height_ft, floors, compliance_status, sort_order')
          .eq('session_id', existingSession.id)
          .order('sort_order', { ascending: true });

        if (variantsError) {
          console.error('[design-mode-bootstrap] Variants query error:', variantsError);
        } else if (sessionVariants) {
          variants = sessionVariants.map(v => ({
            id: v.id,
            name: v.name,
            footprint: v.footprint,
            heightFt: v.height_ft,
            floors: v.floors,
            complianceStatus: v.compliance_status,
            sortOrder: v.sort_order,
          }));

          // Set active variant (prefer starred, else first)
          const starredVariant = variants.find(v => v.name.startsWith('★'));
          activeVariantId = starredVariant?.id || variants[0]?.id || null;
        }
      } else {
        // Create new session idempotently
        const { data: newSession, error: createError } = await supabase
          .from('design_sessions')
          .insert({
            envelope_id: envelopeId,
            user_id: userId,
            name: 'Design Session',
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('[design-mode-bootstrap] Session create error:', createError);
        } else {
          session = {
            id: newSession.id,
            name: newSession.name,
            designIntent: null,
            wizardStep: null,
            isNew: true,
          };
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log('[design-mode-bootstrap] Complete in', duration, 'ms. Session:', session?.id, 'Variants:', variants.length);

    const response: BootstrapResponse = {
      success: true,
      auth: {
        authenticated,
        userId,
      },
      application: {
        id: application.id,
        address: application.formatted_address,
        parcelId: application.parcel_id,
        parcelGeometry: null, // Would need to fetch from parcels table if needed
        status: application.status,
      },
      envelope: {
        status: envelopeStatus,
        id: envelopeId,
        data: envelopeData,
        error: envelopeErrorMsg,
      },
      session,
      variants,
      activeVariantId,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[design-mode-bootstrap] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error', 
        details: String(error) 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
