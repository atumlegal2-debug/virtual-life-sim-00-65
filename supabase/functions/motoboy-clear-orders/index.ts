import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧹 Iniciando limpeza completa de motoboy_orders...');

    // Deletar todos os registros da tabela motoboy_orders
    const { data, error } = await supabase
      .from('motoboy_orders')
      .delete()
      .not('id', 'is', null)
      .select('id');

    if (error) {
      console.error('❌ Erro ao apagar motoboy_orders:', error);
      throw error;
    }

    const deleted = data?.length || 0;
    console.log(`✅ Limpeza concluída. Registros removidos: ${deleted}`);

    return new Response(
      JSON.stringify({ success: true, deleted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    console.error('❌ Erro geral na limpeza de motoboy_orders:', e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
