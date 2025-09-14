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
    const { username, password, storeId } = body as { username?: string; password?: string; storeId?: string }

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Missing credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
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

    const sid = storeId || manager.store_id

    const { data: orders, error } = await supabase
      .from('motoboy_orders')
      .select('*')
      .eq('store_id', sid)
      .order('created_at', { ascending: false })

    if (error) throw error

    return new Response(JSON.stringify({ success: true, orders }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('manager-motoboy-orders error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})