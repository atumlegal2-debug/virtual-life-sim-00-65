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
    console.log('🍎 Iniciando processo de diminuição de fome (10 minutos)...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the function to decrease hunger for all users (with 10-minute timing control)
    const { data, error } = await supabase.rpc('decrease_hunger');
    
    if (error) {
      console.error('❌ Erro ao diminuir fome:', error);
      throw error;
    }

    if (data.decreased) {
      console.log(`✅ Fome diminuída com sucesso para ${data.users_updated} usuários`);
      console.log(`⏰ Última diminuição: ${data.timestamp}`);
      console.log(`📊 Segundos desde última: ${data.seconds_since_last}`);
    } else {
      console.log(`⏭️ Diminuição pulada: ${data.message}`);
      console.log(`⏰ Próxima diminuição em ${Math.round(data.next_decrease_in_seconds || 0)} segundos`);
      console.log(`📊 Segundos desde última: ${data.seconds_since_last || 0}`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processo de diminuição de fome executado',
        data: data
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('💥 Erro na função:', error);
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