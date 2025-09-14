import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    console.log('🔍 Verificando status dos pedidos...')

    // Verificar pedidos de delivery pendentes
    const { data: pendingDeliveryOrders, error: deliveryError } = await supabaseClient
      .from('orders')
      .select('*, users(username, nickname)')
      .eq('status', 'pending')
      .eq('delivery_type', 'delivery')
      .lt('created_at', new Date(Date.now() - 60000).toISOString())

    console.log('📦 Pedidos de delivery pendentes há mais de 1 minuto:', pendingDeliveryOrders?.length || 0)
    if (pendingDeliveryOrders && pendingDeliveryOrders.length > 0) {
      console.log('Detalhes dos pedidos pendentes:', pendingDeliveryOrders)
    }

    // Verificar pedidos já aprovados
    const { data: approvedOrders, error: approvedError } = await supabaseClient
      .from('orders')
      .select('*, users(username, nickname)')
      .eq('status', 'approved')
      .eq('delivery_type', 'delivery')

    console.log('✅ Pedidos de delivery já aprovados:', approvedOrders?.length || 0)

    // Verificar pedidos motoboy existentes
    const { data: motoboyOrders, error: motoboyError } = await supabaseClient
      .from('motoboy_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('🏍️ Pedidos motoboy recentes:', motoboyOrders?.length || 0)
    if (motoboyOrders && motoboyOrders.length > 0) {
      console.log('Últimos pedidos motoboy:', motoboyOrders.map(order => ({
        id: order.id,
        customer: order.customer_name,
        status: order.manager_status,
        motoboy_status: order.motoboy_status,
        created: order.created_at
      })))
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Status verificado',
        pendingDeliveryOrders: pendingDeliveryOrders?.length || 0,
        approvedOrders: approvedOrders?.length || 0,
        motoboyOrders: motoboyOrders?.length || 0,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Erro na verificação:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})