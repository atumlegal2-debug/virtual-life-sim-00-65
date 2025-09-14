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

    console.log('🔄 Auto-processamento de pedidos iniciado...')

    // Processar regras de entrega (aprovação automática de delivery após 1 minuto)
    const { data: processData, error: processError } = await supabaseClient.rpc('process_order_delivery_rules')
    
    if (processError) {
      console.error('❌ Erro ao processar regras de entrega:', processError)
    } else {
      console.log('✅ Regras de entrega processadas')
    }

    // Expirar pedidos de motoboy que não foram aceitos em 1 minuto
    const { data: expireData, error: expireError } = await supabaseClient.rpc('expire_motoboy_orders')
    
    if (expireError) {
      console.error('❌ Erro ao expirar pedidos de motoboy:', expireError)
    } else {
      console.log('✅ Pedidos de motoboy expirados:', expireData)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Auto-processamento concluído',
        timestamp: new Date().toISOString(),
        processData,
        expireData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('💥 Erro no auto-processamento:', error)
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