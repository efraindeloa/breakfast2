// Edge Function: API REST para solicitudes de asistencia
// POST = crear, GET = listar por restaurante, PATCH = actualizar estado

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (req.method) {
      case 'POST': {
        const body = await req.json();
        const { restaurant_id, user_id, order_id, type, request_type, message, table_number } = body;
        if (!restaurant_id || !user_id) {
          return new Response(
            JSON.stringify({ error: 'restaurant_id y user_id son requeridos (schema: user_id NOT NULL)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const reqType = type ?? request_type ?? 'custom';
        const { data, error } = await supabase.rpc('create_assistance_request', {
          p_restaurant_id: restaurant_id,
          p_user_id: user_id,
          p_request_type: reqType,
          p_message: message ?? null,
          p_table_number: table_number ?? null,
          p_order_id: order_id ?? null,
        });
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'GET': {
        const restaurant_id = url.searchParams.get('restaurant_id');
        if (!restaurant_id) {
          return new Response(
            JSON.stringify({ error: 'restaurant_id es requerido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const status = url.searchParams.get('status') ?? undefined;
        const limit = url.searchParams.get('limit');
        let query = supabase
          .from('assistance_requests')
          .select('*')
          .eq('restaurant_id', restaurant_id)
          .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        if (limit) query = query.limit(parseInt(limit, 10));
        const { data, error } = await query;
        if (error) throw error;
        return new Response(JSON.stringify(data ?? []), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'PATCH': {
        const body = await req.json();
        const { id, status } = body;
        if (!id || !status) {
          return new Response(
            JSON.stringify({ error: 'id y status son requeridos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const allowed = ['pending', 'attended', 'cancelled'];
        if (!allowed.includes(status)) {
          return new Response(
            JSON.stringify({ error: 'status debe ser pending, attended o cancelled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { data, error } = await supabase
          .from('assistance_requests')
          .update({ status })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Método no permitido' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Error interno';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
