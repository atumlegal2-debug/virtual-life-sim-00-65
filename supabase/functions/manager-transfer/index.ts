import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  managerId: string;
  storeId: string;
  receiverUserId: string;
  amount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { managerId, storeId, receiverUserId, amount }: TransferRequest = await req.json()

    console.log('Manager Transfer Request:', { managerId, storeId, receiverUserId, amount })

    // Validate input
    if (!managerId || !storeId || !receiverUserId || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados inválidos. Verifique todos os campos.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Start transaction by getting current balances
    const [managerResult, receiverResult] = await Promise.all([
      supabase
        .from('store_managers')
        .select('id, username, store_id, balance')
        .eq('id', managerId)
        .eq('store_id', storeId)
        .single(),
      supabase
        .from('users')
        .select('id, username, wallet_balance')
        .eq('id', receiverUserId)
        .single()
    ])

    if (managerResult.error) {
      console.error('Error fetching manager:', managerResult.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Gerente não encontrado ou acesso negado.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (receiverResult.error) {
      console.error('Error fetching receiver:', receiverResult.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário destinatário não encontrado.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const manager = managerResult.data
    const receiver = receiverResult.data

    // Check if store has sufficient balance
    const currentManagerBalance = manager.balance || 0
    if (currentManagerBalance < amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Saldo insuficiente no estabelecimento.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate new balances
    const newManagerBalance = currentManagerBalance - amount
    const newReceiverBalance = (receiver.wallet_balance || 0) + amount

    console.log('Balance calculations:', {
      currentManagerBalance,
      newManagerBalance,
      currentReceiverBalance: receiver.wallet_balance,
      newReceiverBalance,
      amount
    })

    // Perform the transfer operations
    const [updateManagerResult, updateReceiverResult] = await Promise.all([
      supabase
        .from('store_managers')
        .update({ balance: newManagerBalance })
        .eq('id', managerId),
      supabase
        .from('users')
        .update({ wallet_balance: newReceiverBalance })
        .eq('id', receiverUserId)
    ])

    if (updateManagerResult.error) {
      console.error('Error updating manager balance:', updateManagerResult.error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao atualizar saldo do estabelecimento.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (updateReceiverResult.error) {
      console.error('Error updating receiver balance:', updateReceiverResult.error)
      
      // Rollback manager balance if receiver update failed
      await supabase
        .from('store_managers')
        .update({ balance: currentManagerBalance })
        .eq('id', managerId)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao atualizar saldo do usuário. Operação cancelada.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: managerId,
        to_user_id: receiverUserId,
        from_username: `${storeId} (Loja)`,
        to_username: receiver.username,
        amount: amount,
        transaction_type: 'store_transfer',
        description: `Transferência da loja ${storeId} para ${receiver.username}`
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Note: We don't rollback here as the money transfer was successful
      // The transaction record is for history purposes
    }

    console.log('Transfer completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: `Transferência de ${amount} CM realizada com sucesso!`,
        data: {
          newManagerBalance,
          newReceiverBalance,
          receiverUsername: receiver.username
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in manager-transfer:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor. Tente novamente.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})