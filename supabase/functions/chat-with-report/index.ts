import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, reportContext } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build system prompt with report context
    const systemPrompt = `You are SiteIntel™ AI, an expert feasibility analysis assistant. Help users understand their property feasibility report.

**Report Summary:**
- Address: ${reportContext.address}
- Feasibility Score: ${reportContext.score}/100 (Grade ${reportContext.scoreBand})
- Zoning: ${reportContext.zoning || 'Not specified'}
- Flood Zone: ${reportContext.floodZone || 'Not specified'}
- Project Intent: ${reportContext.intentType || 'Not specified'}

**Project Details:**
${reportContext.projectDetails ? `- Project Type: ${reportContext.projectDetails.projectType?.join(', ') || 'N/A'}
- Building Size: ${reportContext.projectDetails.buildingSize || 'N/A'}
- Budget: $${reportContext.projectDetails.budget?.toLocaleString() || 'N/A'}` : '- No project details provided'}

**Key Findings:**
- Traffic: ${reportContext.keyFindings?.traffic ? `${reportContext.keyFindings.traffic.toLocaleString()} AADT` : 'No data'}
- Utilities: ${reportContext.keyFindings?.utilities ? 'Available' : 'Limited data'}
- Environmental Sites: ${reportContext.keyFindings?.environmental?.length || 0} identified

**Instructions:**
- Answer questions clearly and concisely (2-4 sentences max)
- Reference specific data from the report
- Highlight risks and opportunities
- Be professional but conversational
- If asked about data not in the report, acknowledge the limitation
- Always encourage users to verify critical details with the full report`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'OpenAI rate limit exceeded. Please wait a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid OpenAI API key.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('chat-with-report error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
