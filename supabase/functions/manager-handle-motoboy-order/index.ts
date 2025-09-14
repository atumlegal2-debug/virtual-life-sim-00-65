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
    const { username, password, orderId, action, notes } = body as { username?: string; password?: string; orderId?: string; action?: 'accept'|'reject'; notes?: string }

    if (!username || !password || !orderId || !action) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Validate manager credentials
    const { data: manager, error: mgrErr } = await supabase
      .from('store_managers')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle()

    if (mgrErr || !manager) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 })
    }

    let update: any = { manager_notes: notes }
    if (action === 'accept') {
      update = { ...update, manager_status: 'approved', motoboy_status: 'waiting', manager_processed_at: new Date().toISOString() }
    } else if (action === 'reject') {
      update = { ...update, manager_status: 'rejected', motoboy_status: 'rejected', manager_processed_at: new Date().toISOString() }
    }

    const { data, error } = await supabase
      .from('motoboy_orders')
      .update(update)
      .eq('id', orderId)
      .select()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('manager-handle-motoboy-order error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})