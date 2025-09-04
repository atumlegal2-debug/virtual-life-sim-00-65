import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find orders that are pending for more than 1 minute (60 seconds)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    
    const { data: expiredOrders, error: fetchError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        user_id,
        store_id,
        items,
        total_amount,
        created_at,
        users!orders_user_id_fkey(username, avatar)
      `)
      .eq('status', 'pending')
      .lt('created_at', oneMinuteAgo)

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError)
      throw fetchError
    }

    console.log(`Found ${expiredOrders?.length || 0} expired orders to auto-approve`)

    for (const order of expiredOrders || []) {
      console.log(`Auto-approving order ${order.id}`)

      // Update order status to approved
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({
          status: 'approved',
          manager_approved: true,
          manager_notes: 'Aprovado automaticamente após 1 minuto'
        })
        .eq('id', order.id)

      if (updateError) {
        console.error(`Error updating order ${order.id}:`, updateError)
        continue
      }

      // Create motoboy order with user photo
      const motoboyOrderData = {
        order_id: order.id,
        customer_username: order.users?.username || 'Unknown',
        customer_name: order.users?.username || 'Unknown',
        customer_avatar: order.users?.avatar || null,
        store_id: order.store_id,
        items: order.items,
        total_amount: order.total_amount,
        delivery_address: 'Endereço não informado',
        manager_status: 'approved',
        manager_notes: 'Aprovado automaticamente após 1 minuto',
        manager_processed_at: new Date().toISOString()
      }

      const { error: motoboyError } = await supabaseClient
        .from('motoboy_orders')
        .insert([motoboyOrderData])

      if (motoboyError) {
        console.error(`Error creating motoboy order for ${order.id}:`, motoboyError)
        continue
      }

      console.log(`Successfully auto-approved and created motoboy order for ${order.id}`)
    }

    return new Response(
      JSON.stringify({
        message: `Auto-approved ${expiredOrders?.length || 0} orders`,
        processedOrders: expiredOrders?.length || 0
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in auto-approve-orders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    )
  }
})