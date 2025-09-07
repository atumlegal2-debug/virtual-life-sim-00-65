import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface MotoboyOrder {
  id: string;
  customer_username: string;
  items: CartItem[];
  total_amount: number;
  motoboy_status: string;
  delivered_at: string | null;
  order_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚚 Iniciando processamento de entregas pendentes...');

    // Buscar pedidos que foram entregues mas podem não ter os itens no inventário
    const { data: deliveredOrders, error: ordersError } = await supabaseClient
      .from('motoboy_orders')
      .select('*')
      .eq('motoboy_status', 'delivered')
      .not('delivered_at', 'is', null);

    if (ordersError) {
      console.error('❌ Erro ao buscar pedidos entregues:', ordersError);
      throw ordersError;
    }

    console.log(`📦 Encontrados ${deliveredOrders?.length || 0} pedidos entregues para processar`);

    let processedCount = 0;
    let itemsAddedCount = 0;
    let errorsCount = 0;
    const processingSummary: string[] = [];

    for (const order of deliveredOrders || []) {
      try {
        console.log(`\n🔄 Processando pedido ${order.id} para usuário ${order.customer_username}`);
        
        // Buscar dados do usuário
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('id, username, nickname')
          .eq('username', order.customer_username)
          .single();

        if (userError || !userData) {
          console.error(`❌ Usuário ${order.customer_username} não encontrado:`, userError);
          errorsCount++;
          processingSummary.push(`❌ ${order.customer_username}: usuário não encontrado`);
          continue;
        }

        // Processar cada item do pedido
        let orderItemsAdded = 0;
        let orderItemsSkipped = 0;
        const orderErrors: string[] = [];

        for (const item of order.items) {
          try {
            console.log(`📦 Processando item: ${item.name} (quantidade: ${item.quantity})`);
            
            // Verificar se o usuário já tem este item
            const { data: existingItems, error: checkError } = await supabaseClient
              .from('inventory')
              .select('quantity')
              .eq('user_id', userData.id)
              .eq('item_id', item.id || item.name);

            if (checkError) {
              console.error(`❌ Erro ao verificar inventário de ${item.name}:`, checkError);
              orderErrors.push(`Erro ao verificar ${item.name}`);
              continue;
            }

            const currentQuantity = existingItems?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
            const maxQuantityToAdd = Math.max(0, 10 - currentQuantity);
            const finalQuantity = Math.min(item.quantity, maxQuantityToAdd);
            
            console.log(`📊 ${item.name}: atual=${currentQuantity}, máximo a adicionar=${maxQuantityToAdd}, final=${finalQuantity}`);
            
            if (finalQuantity === 0) {
              console.log(`⚠️ Pulando ${item.name} - usuário já possui o máximo (10 itens)`);
              orderItemsSkipped++;
              continue;
            }

            // Adicionar item ao inventário
            const { error: inventoryError } = await supabaseClient
              .from('inventory')
              .insert({
                user_id: userData.id,
                item_id: item.id || item.name,
                quantity: finalQuantity,
                sent_by_username: 'motoboy',
                received_at: new Date().toISOString()
              });

            if (inventoryError) {
              console.error(`❌ Erro ao adicionar ${item.name} ao inventário:`, inventoryError);
              orderErrors.push(`Erro ao adicionar ${item.name}: ${inventoryError.message}`);
            } else {
              console.log(`✅ ${item.name} (${finalQuantity}x) adicionado ao inventário de ${userData.username}`);
              orderItemsAdded++;
              itemsAddedCount++;
            }
          } catch (itemError) {
            console.error(`❌ Erro ao processar item ${item.name}:`, itemError);
            orderErrors.push(`Erro ao processar ${item.name}`);
          }
        }

        // Resumo do pedido
        const displayName = userData.nickname || userData.username;
        if (orderItemsAdded > 0) {
          processingSummary.push(`✅ ${displayName}: ${orderItemsAdded} itens adicionados${orderItemsSkipped > 0 ? ` (${orderItemsSkipped} pulados)` : ''}`);
        } else if (orderItemsSkipped > 0) {
          processingSummary.push(`⚠️ ${displayName}: todos os ${orderItemsSkipped} itens já estavam no limite`);
        }

        if (orderErrors.length > 0) {
          processingSummary.push(`❌ ${displayName}: ${orderErrors.length} erro(s)`);
          errorsCount++;
        }

        processedCount++;
        
      } catch (orderError) {
        console.error(`❌ Erro ao processar pedido ${order.id}:`, orderError);
        errorsCount++;
        processingSummary.push(`❌ Pedido ${order.id}: erro de processamento`);
      }
    }

    console.log(`\n📋 RESUMO FINAL:`);
    console.log(`- Pedidos processados: ${processedCount}`);
    console.log(`- Itens adicionados: ${itemsAddedCount}`);
    console.log(`- Erros: ${errorsCount}`);
    console.log(`\n📝 Detalhes:`);
    processingSummary.forEach(summary => console.log(summary));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Processamento de entregas concluído',
        summary: {
          ordersProcessed: processedCount,
          itemsAdded: itemsAddedCount,
          errors: errorsCount,
          details: processingSummary
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erro geral no processamento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});