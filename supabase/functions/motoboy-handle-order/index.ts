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

    const body = await req.json().catch(() => ({}))
    const { orderId, action } = body as { orderId?: string; action?: 'accept'|'reject'|'deliver'|'complete' }

    if (!orderId || !action) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    let update: any = {}
    if (action === 'accept') {
      update = { motoboy_status: 'accepted', motoboy_accepted_at: new Date().toISOString() }
    } else if (action === 'reject') {
      update = { motoboy_status: 'rejected', motoboy_accepted_at: new Date().toISOString() }
    } else if (action === 'deliver' || action === 'complete') {
      update = { motoboy_status: 'delivered', delivered_at: new Date().toISOString() }
    }

    const { data, error } = await supabase
      .from('motoboy_orders')
      .update(update)
      .eq('id', orderId)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('motoboy-handle-order error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})