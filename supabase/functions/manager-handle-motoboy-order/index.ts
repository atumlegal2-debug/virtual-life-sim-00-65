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

    // Fetch the motoboy order to get the underlying orders.id
    const { data: motoboyOrder, error: moErr } = await supabase
      .from('motoboy_orders')
      .select('order_id, store_id')
      .eq('id', orderId)
      .maybeSingle()

    if (moErr) throw moErr

    // Update the selected motoboy order first
    const { data, error } = await supabase
      .from('motoboy_orders')
      .update(update)
      .eq('id', orderId)
      .select()

    if (error) throw error

    // If rejected, prevent the order from being recreated and close duplicates
    if (action === 'reject' && motoboyOrder?.order_id) {
      console.log(`[manager-handle-motoboy-order] Rejecting order ${orderId} (orders.id=${motoboyOrder.order_id}) - updating source order to pickup and closing duplicates`)

      // 1) Make sure the original order no longer targets motoboy delivery and block future motoboy creation
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({
          delivery_type: 'pickup',
          manager_approved: null,
          manager_notes: (notes || '') + ' [Motoboy rejeitado pelo gerente] [motoboy_blocked]',
          updated_at: new Date().toISOString()
        })
        .eq('id', motoboyOrder.order_id)
      if (orderUpdateErr) console.warn('Failed to update source order to pickup:', orderUpdateErr)

      // 2) Mark all motoboy orders for this same order_id as rejected to avoid resurfacing
      const { error: dupErr } = await supabase
        .from('motoboy_orders')
        .update({
          manager_status: 'rejected',
          motoboy_status: 'rejected',
          manager_processed_at: new Date().toISOString(),
          manager_notes: (notes || '') + ' [duplicate closed]'
        })
        .eq('order_id', motoboyOrder.order_id)
      if (dupErr) console.warn('Failed to close duplicate motoboy orders:', dupErr)
    }

    return new Response(JSON.stringify({ success: true, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error: any) {
    console.error('manager-handle-motoboy-order error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})