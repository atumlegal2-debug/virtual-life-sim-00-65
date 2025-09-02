import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting happiness decrease process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the function to decrease happiness for all users (with 20-minute timing control)
    const { data, error } = await supabase.rpc('decrease_happiness');
    
    if (error) {
      console.error('Error decreasing happiness:', error);
      throw error;
    }

    if (data.decreased) {
      console.log(`Happiness decreased successfully for ${data.users_updated} users`);
    } else {
      console.log(`Skipped happiness decrease: ${data.message}. Next decrease in ${Math.round(data.next_decrease_in_seconds)} seconds`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Happiness decreased successfully' }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});