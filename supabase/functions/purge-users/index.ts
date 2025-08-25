import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteResponse {
  success: boolean;
  details?: Record<string, number>;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { mode, userId, adminPassword } = await req.json();

    if (!adminPassword || adminPassword !== '88620787') {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized' } satisfies DeleteResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deleteForUser = async (targetUserId: string) => {
      // Capture auth_user_id before deleting user
      const { data: userRow } = await supabaseAdmin
        .from('users')
        .select('id, auth_user_id')
        .eq('id', targetUserId)
        .maybeSingle();

      // 1) Delete manager_sales for user's orders
      const { data: orderIds } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', targetUserId);
      const orderIdList = (orderIds ?? []).map((o: any) => o.id);
      if (orderIdList.length > 0) {
        await supabaseAdmin
          .from('manager_sales')
          .delete()
          .in('order_id', orderIdList);
      }

      // 2) Delete dependent records
      await supabaseAdmin.from('transactions').delete().or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`);
      await supabaseAdmin.from('matches').delete().or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);
      await supabaseAdmin.from('relationships').delete().or(`user1_id.eq.${targetUserId},user2_id.eq.${targetUserId}`);
      await supabaseAdmin.from('friend_requests').delete().or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);
      await supabaseAdmin.from('user_interactions').delete().or(`user_id.eq.${targetUserId},target_user_id.eq.${targetUserId}`);
      await supabaseAdmin.from('proposal_requests').delete().or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`);
      await supabaseAdmin.from('inventory').delete().eq('user_id', targetUserId);
      await supabaseAdmin.from('user_pregnancy').delete().eq('user_id', targetUserId);
      await supabaseAdmin.from('hospital_birth_requests').delete().eq('user_id', targetUserId);
      await supabaseAdmin.from('hospital_treatment_requests').delete().eq('user_id', targetUserId);

      // 3) Delete orders (after manager_sales)
      await supabaseAdmin.from('orders').delete().eq('user_id', targetUserId);

      // 4) Delete user row
      await supabaseAdmin.from('users').delete().eq('id', targetUserId);

      // 5) Delete auth user
      const authId = userRow?.auth_user_id as string | null | undefined;
      if (authId) {
        await supabaseAdmin.auth.admin.deleteUser(authId);
      }
    };

    if (mode === 'single') {
      if (!userId) {
        return new Response(
          JSON.stringify({ success: false, message: 'userId is required for single mode' } satisfies DeleteResponse),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      await deleteForUser(userId);
      return new Response(JSON.stringify({ success: true } satisfies DeleteResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (mode === 'all') {
      // Delete child tables first (global)
      await supabaseAdmin.from('manager_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('relationships').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('friend_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('user_interactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('proposal_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('user_pregnancy').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('hospital_birth_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('hospital_treatment_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Orders last among children
      await supabaseAdmin.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Delete public users (capture auth ids first)
      const { data: allUsers } = await supabaseAdmin.from('users').select('id, auth_user_id');
      await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Delete auth users
      const authIds = (allUsers ?? []).map((u: any) => u.auth_user_id).filter(Boolean);
      for (const aid of authIds) {
        try { await supabaseAdmin.auth.admin.deleteUser(aid); } catch (_) { /* ignore */ }
      }

      return new Response(JSON.stringify({ success: true } satisfies DeleteResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid mode' } satisfies DeleteResponse),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: String(error?.message ?? error) } satisfies DeleteResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
