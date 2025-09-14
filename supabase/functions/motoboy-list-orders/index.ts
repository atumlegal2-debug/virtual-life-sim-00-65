import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // List waiting and accepted orders for motoboys
    const [waitingRes, acceptedRes] = await Promise.all([
      supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'waiting')
        .order('created_at', { ascending: false }),
      supabase
        .from('motoboy_orders')
        .select('*')
        .eq('manager_status', 'approved')
        .eq('motoboy_status', 'accepted')
        .order('created_at', { ascending: false })
    ])

    if (waitingRes.error) throw waitingRes.error
    if (acceptedRes.error) throw acceptedRes.error

    return new Response(JSON.stringify({ success: true, waiting: waitingRes.data, accepted: acceptedRes.data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('motoboy-list-orders error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})