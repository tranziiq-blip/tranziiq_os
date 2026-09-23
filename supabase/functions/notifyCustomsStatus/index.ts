// supabase/functions/notifyCustomsStatus/index.ts
//
// Called from the clearing agent's portal whenever they:
//   - request an outstanding document
//   - mark the load as cleared
//   - flag the load for inspection
//   - post any general update
//
// Effects:
//   1. Logs the update in clearance_message (the visible thread)
//   2. Updates load.customs_status if a new status was given
//   3. Creates a notifications row for the driver AND every
//      controller (any profile with role = 'admin'), so it shows
//      up instantly in their portal via Supabase Realtime.
//
// NOTE: your Load entity has no dedicated "controller_id" field —
// this treats every admin-role user as a controller and notifies
// all of them. If you want a single controller assigned per load
// instead, add a controller_id column to load and swap the query
// below for a direct lookup.
//
// Deploy:  supabase functions deploy notifyCustomsStatus
// Call from the app:
//   base44.functions.invoke('notifyCustomsStatus', {
//     load_id, message, message_type, new_status, document_type
//   })

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;

    // Client bound to the caller's own JWT — used to check who they are
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerProfile || !['clearing_agent', 'admin'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Only clearing agents can send customs updates' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { load_id, message, message_type = 'info', new_status, document_type } = await req.json();

    if (!load_id || !message) {
      return new Response(JSON.stringify({ error: 'load_id and message are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client — bypasses RLS so we can write notifications
    // for OTHER users (the driver/controllers), not just the caller.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Log the message in the visible thread
    await adminClient.from('clearance_message').insert({
      load_id,
      sender_id: user.id,
      sender_role: callerProfile.role,
      message,
      message_type,
    });

    // 2. Optionally mark the document that prompted this update
    if (document_type) {
      await adminClient
        .from('clearance_document')
        .update({
          status: message_type === 'document_request' ? 'outstanding' : 'submitted',
          reviewed_by: user.id,
        })
        .eq('load_id', load_id)
        .eq('document_type', document_type);
    }

    // 3. Update the load's overall customs_status if provided
    let load;
    if (new_status) {
      const { data } = await adminClient
        .from('load')
        .update({ customs_status: new_status })
        .eq('id', load_id)
        .select('id, driver_id, load_number')
        .single();
      load = data;
    } else {
      const { data } = await adminClient
        .from('load')
        .select('id, driver_id, load_number')
        .eq('id', load_id)
        .single();
      load = data;
    }

    // 4. Notify the driver + every controller (admin-role users)
    const titleByType: Record<string, string> = {
      document_request: `Document needed — Load ${load?.load_number ?? load_id}`,
      cleared: `Load ${load?.load_number ?? load_id} cleared by customs`,
      inspection_required: `Load ${load?.load_number ?? load_id} flagged for inspection`,
      info: `Customs update — Load ${load?.load_number ?? load_id}`,
    };

    const { data: controllers } = await adminClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    const recipients = [
      load?.driver_id,
      ...(controllers ?? []).map((c) => c.id),
    ].filter(Boolean);

    if (recipients.length) {
      await adminClient.from('notifications').insert(
        recipients.map((recipient_id) => ({
          recipient_id,
          load_id,
          type: `customs_${message_type}`,
          title: titleByType[message_type] ?? titleByType.info,
          body: message,
        }))
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
